const EventEmitter = require('events').EventEmitter;
const SteamID = require('steamid');
const request = require('request-promise-native');
const rotate = require('./lib/rotate.js');
const CEconItem = require('./classes/CEconItem.js');

/**
 * Our InventoryAPI, extends EventEmitter to have an in-built EventEmitter for logging under 'log'.
 * @class
 * @extends EventEmitter
 */
class InventoryAPI extends EventEmitter {
	/**
	 * An Inventory API instance
	 * @constructor
	 * @param {Object} [options] - Contains optional settings for the inventory API
	 * @param {String[]|String} [options.proxy] - An array holding a list of proxies, each will be cycled based on proxyRepeat
	 * @param {number} [options.proxyRepeat=1] - Sets how many times a proxy will be repeated for a request before being cycled. A proxy will be used proxyRepeat times + 1 (default: 1)
	 * @param {number} [options.retryDelay=0] - Time in ms for how long we should wait before retrying a request if retries are available (default: 0)
	 * @param {Object} [options.requestOptions] - Options that can override the default settings for any inventory HTTP request. Useful if you are using another endpoint to fetch inventories (such as steamapis). See doc for the request module on what options can be parsed in
	 * @param {Function} [options.requestOptions.uri] - A function with parameters (steamid, appid, contextid) which should return the correct format for the uri. e.g. (steamid, appid, contextid) => `https://api.steamapis.com/steam/inventory/${steamid}/${appid}/${contextid}`
	 * @param {Function} [options.requestOptions.url] - Same as requestOptions.uri
	 * @param {number} [options.requestTimeout] - Time in ms for the timeout of any request (default: 9000)
	 * 
	 */
	constructor(options) {
		super();
		if (!options)
			options = {};
		
		this.useProxy = !!options.proxy;
		if (Array.isArray(options.proxy))
			this.proxys = options.proxy;
		else if (options.proxy)
			this.proxys = [options.proxy];

		this.proxyRepeat = options.proxyRepeat || 1;
		this.proxy = rotate(this.proxys, this.proxyRepeat);

		this.retryDelay = options.retryDelay || 0;

		this.requestOptions = options.requestOptions || {};
		this.requestTimeout = options.requestTimeout || 9000;
	}

	/**
	 * Get the contents of a users inventory. Designed to be the same as DoctorMcKay's getUserInventoryContents from node-steamcommunity (with retries)
	 * @param {SteamID|string} steamid - SteamID object from node-steamid or a string which can be parsed into a SteamID object 
	 * @param {int} appid - The Steam application ID of the app 
	 * @param {int} contextid - The ID of the context within the app you wish to retrieve 
	 * @param {boolean} [tradableOnly] - true to get only tradeable items and currencies 
	 * @param {number} [retries=1] - How many calls to make to an inventory before rejecting. If an inventory is private or not found this value is ignored and an error is thrown after the first request.
	 * @param {string} [language='english'] - The language of item descriptions to return (default: 'english')
	 * @returns {Promise} Promise object containing an object with keys: inventory, currency and total_inventory_count - with inventory and currency being an array of CEconItem objects.
	 */
	get(steamid, appid, contextid, tradableOnly, retries = 1, language = 'english') {
		return new Promise((resolve, reject) => {

			if (!steamid)
				return reject(new Error("The user's SteamID is invalid or missing."));

			if (typeof steamid === 'string')
				steamid = new SteamID(steamid);

			if (!steamid.isValid())
				return reject(new Error("The user's SteamID is invalid."));
			
			let pos = 1; // Counter to hold the items position in the inventory starting from 1. Taken from CEconItem standard.

			// Recursively called to fetch the inventory when retrying or on pagnation
			const _get = (inventory, currency, start) => {
				const defaults = {
					"uri": `https://steamcommunity.com/inventory/${steamid.getSteamID64()}/${appid}/${contextid}`,
					"headers": {
						"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36",
						"Referer": `https://steamcommunity.com/profiles/${steamid.getSteamID64()}/inventory`
					},
					"qs": {
						"l": language, // Default language
						"count": 5000, // Max items per 'page'
						"start_assetid": start
					},
					"proxy": this.useProxy ? this.proxy() : undefined,
					"timeout": this.requestTimeout,
					"json": true
				}

				let options = Object.assign({}, defaults, this.requestOptions);
				if (this.requestOptions.uri) {
					options.uri = this.requestOptions.uri(steamid.getSteamID64(), appid, contextid)
				} else if (this.requestOptions.url) {
					options.url = this.requestOptions.url(steamid.getSteamID64(), appid, contextid)
					options.uri = null;
				}
				
				if (this.requestOptions.qs) // Make sure that if we are overriding query strings we put the defaults back in
					options.qs = Object.assign({}, this.requestOptions.qs, defaults.qs);

				this.emit('log', 'debug', `Requesting. Start ${start ? start : 0}, Retries ${retries}, Items ${inventory.length}`, steamid);

				request.get(options)
				.then(res => {
					if (res && res.success && res.total_inventory_count === 0) {
						// Empty inventory
						return resolve([], [], 0);
					}

					if (!res || !res.success || !res.assets || !res.descriptions) {
						if (res)
							return reject(new Error(res.error || res.Error || "Malformed response"));
						else
							return reject(new Error("Malformed response"));
					}

					for (let item in res.assets) {
						let description = getDescription(res.descriptions, res.assets[item].classid, res.assets[item].instanceid);
		
						if (!tradableOnly || (description && description.tradable)) {
							res.assets[item].pos = pos++;
							(res.assets[item].currencyid ? currency : inventory).push(new CEconItem(res.assets[item], description, contextid));
						}
					}

					if (res.more_items) {
						_get(inventory, currency, res.last_assetid);
					} else {
						return resolve({inventory: inventory, currency: currency, total_inventory_count: res.total_inventory_count});
					}
				}).catch(err => {
					// Check whether the profile is private or found before retrying
					let error = new Error();
					this.emit('log', 'stack', err, steamid);
					if (err.message == "HTTP error 403" || err.statusCode && err.statusCode === 403) {
						// 403 with a body of "null" means the inventory/profile is private.
						error.message = "Profile or inventory is private.";
						error.statusCode = 403;
						error.code = 403;
						return reject(error);
					}

					if (err.statusCode && err.statusCode === 404) {
						error.message = "Profile could not be found.";
						error.statusCode = 404;
						error.code = 404;
						return reject(error);
					}

					this.emit('log', 'error', `Request failed${this.useProxy ? " on proxy: " + options.proxy : ""}`, steamid);

					if (retries > 1) {
						retries -= 1;
						setTimeout(() => {_get(inventory, currency, start)}, this.retryDelay);
					} else {
						return reject(err);
					}
				});
			}
			_get([], []);

			// Below is taken from node-steamcommunity - a faster way of searching for descriptions for items.
			let quickDescriptionLookup = {};

			function getDescription(descriptions, classID, instanceID) {
				let key = classID + '_' + (instanceID || '0'); // instanceID can be undefined, in which case it's 0.
		
				if (quickDescriptionLookup[key]) {
					return quickDescriptionLookup[key];
				}
		
				for (let i = 0; i < descriptions.length; i++) {
					quickDescriptionLookup[descriptions[i].classid + '_' + (descriptions[i].instanceid || '0')] = descriptions[i];
				}
		
				return quickDescriptionLookup[key];
			}
		});
	}
}

module.exports = InventoryAPI;
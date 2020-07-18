const InventoryAPI = require('../lib/index.js');

const inventoryApi = new InventoryAPI({
	/*proxy: [
		"123.123.123.123",
		"255.255.255.255"
	],*/
	//proxy: "255.255.255.255",
	//proxyRepeat: 1,
	//retryDelay: 0,
	/*requestOptions: {
		uri: (steamid, appid, contextid) => `https://api.steamapis.com/steam/inventory/${steamid}/${appid}/${contextid}`,
		headers: {
		},
		qs: {
			"api_key": ""
		}
	}*/
	//requestTimeout: 9000
});

const steamid = '76561197993496553';
const appid = 753;
const contextid = 6;

inventoryApi.on('log', (type, message, steamid) => {
	console.log(`${type} - ${steamid} - ${message}`);
});

inventoryApi.get(
	steamid,
	appid,
	contextid,
	true,
	10
)
.then(res => {
	//console.log(res);
	console.log(res.inventory.find(item => item.type.includes("Booster Pack")));
})
.catch(err => {
	console.log(err);
});
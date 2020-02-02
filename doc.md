<a name="InventoryAPI"></a>

## InventoryAPI ⇐ <code>EventEmitter</code>
Our InventoryAPI, extends EventEmitter to have an in-built EventEmitter for logging under 'log'.

**Kind**: global class  
**Extends**: <code>EventEmitter</code>  

* [InventoryAPI](#InventoryAPI) ⇐ <code>EventEmitter</code>
    * [new InventoryAPI([options])](#new_InventoryAPI_new)
    * [.get(steamid, appid, contextid, tradableOnly, [retries], [language])](#InventoryAPI+get) ⇒ <code>Promise</code>

<a name="new_InventoryAPI_new"></a>

### new InventoryAPI([options])
An Inventory API instance


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  | Contains optional settings for the inventory API |
| [options.proxy] | <code>Array.&lt;String&gt;</code> \| <code>String</code> |  | An array holding a list of proxies, each will be cycled based on proxyRepeat |
| [options.proxyRepeat] | <code>number</code> | <code>1</code> | Sets how many times a proxy will be repeated for a request before being cycled. A proxy will be used proxyRepeat times + 1 (default: 1) |
| [options.retryDelay] | <code>number</code> | <code>0</code> | Time in ms for how long we should wait before retrying a request if retries are available (default: 0) |
| [options.requestOptions] | <code>Object</code> |  | Options that can override the default settings for any inventory HTTP request. Useful if you are using another endpoint to fetch inventories (such as steamapis). See doc for the request module on what options can be parsed in |
| [options.requestOptions.uri] | <code>function</code> |  | A function with parameters (steamid, appid, contextid) which should return the correct format for the uri. e.g. (steamid, appid, contextid) => `https://api.steamapis.com/steam/inventory/${steamid}/${appid}/${contextid}` |
| [options.requestOptions.url] | <code>function</code> |  | Same as requestOptions.uri |
| [options.requestTimeout] | <code>number</code> |  | Time in ms for the timeout of any request (default: 9000) |

<a name="InventoryAPI+get"></a>

### inventoryAPI.get(steamid, appid, contextid, tradableOnly, [retries], [language]) ⇒ <code>Promise</code>
Get the contents of a users inventory. Designed to be the same as DoctorMcKay's getUserInventoryContents from node-steamcommunity (with retries)

**Kind**: instance method of [<code>InventoryAPI</code>](#InventoryAPI)  
**Returns**: <code>Promise</code> - Promise object containing an object with keys: inventory, currency and total_inventory_count - with inventory and currency being an array of CEconItem objects.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| steamid | <code>SteamID</code> \| <code>string</code> |  | SteamID object from node-steamid or a string which can be parsed into a SteamID object |
| appid | <code>int</code> |  | The Steam application ID of the app |
| contextid | <code>int</code> |  | The ID of the context within the app you wish to retrieve |
| tradableOnly | <code>boolean</code> |  | true to get only tradeable items and currencies |
| [retries] | <code>number</code> | <code>1</code> | How many calls to make to an inventory before rejecting. If an inventory is private or not found this value is ignored and an error is thrown after the first request. |
| [language] | <code>string</code> | <code>&quot;&#x27;english&#x27;&quot;</code> | The language of item descriptions to return (default: 'english') |


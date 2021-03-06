# node-steam-inventory-api-ng
[![npm version](https://img.shields.io/npm/v/steam-inventory-api-ng.svg)](https://npmjs.com/package/steam-inventory-api-ng) 

A Steam Inventory API wrapper with advanced features such as retries and proxy support.

```
npm install steam-inventory-api-ng
```

## This project

My former forked version (`steam-inventory-api-fork`) of the original `steam-inventory-api` is no longer going to be maintained, however it will stay up for any old projects. This will be the new place for any new development. It didn't seem right to keep developing inside a fork so therefore `ng` (next generation) was appropriate.

This module is developed with the goal of adding new features to existing inventory fetchers, mostly DoctorMcKay's `node-steamcommunity` `getUserInventoryContents` call. The newer features added are:

- Retries on failed requests
- Proxies. The module can handle an array of proxies and automatically cycles through them
- Improved error handling for private and profiles which are not found

As this module is designed to add on functionality, any former project using `node-steamcommunity`'s `getUserInventoryContents` can easily be ported over to this project. Some of the code base is recycled, such as items will be returned as `CEconItem` objects.

It's worth noting that if an inventory is private or not found more requests will not be done.

For documentation see [doc.md](https://github.com/itsjfx/node-steam-inventory-api-ng/blob/master/doc.md).

## Examples

Please see any examples in the `examples` folder.

## Logging

To get any logging events just use something like below:
```
inventoryApi.on('log', (type, message, steamid) => {
	console.log(`${type} - ${steamid} - ${message}`);
});
```

## Docs
See [doc.md](https://github.com/itsjfx/node-steam-inventory-api-ng/blob/master/doc.md) for jsdoc

## Changes from the fork (steam-inventory-api-fork) [SOME BREAKING CHANGES]

- Constructor has new options that can be parsed in and some options were removed
- count removed
- get() does not take in an object anymore but instead takes in parameters
- Handles private or not found inventory errors now and does not waste requests by retrying on these errors
- Code refactor
- Documentation

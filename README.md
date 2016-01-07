# flower-power-api

[![NPM](https://nodei.co/npm/flower-power-api.png)](https://nodei.co/npm/flower-power-api/)

A node.js module to interface with the [cloud service](https://github.com/parrot-flower-power/parrot-flower-power-api-example)
for the Parrot [Flower Power](http://www.parrot.com/flowerpower/).


## Get your access API
* `username` `password`
	* Make sure you have an account created by your smartphone. You should be see your garden: [myflowerpower.parrot.com](https://myflowerpower.parrot.com).
* `client_id` `client_secret`
	* [Sign up to API here](https://apiflowerpower.parrot.com/api_access/signup), and got by **email** your *Access ID* (`client_id`) and your *Access secret* (`client_secret`).

## API

### Install
```bash
$ npm install flower-power-api
```

### Load
```js
var FlowerPowerApi = require('flower-power-api');
var api = new FlowerPowerApi();
```

### Login to cloud
```js
var credential = {
	'username'		: "...",
	'password'		: "...",
	'client_id'		: "...",
	'client_secret'	: "...",
	'auto-refresh'	: false
};

api.login(credential, function(err, res) {
	if (err) console.log(err);
	else {
		// Head in the clouds :)
	}
});
```

### Get garden configuration (and specials methods)
```js
api.getGarden(function(error, garden));
```

### Communicate with Cloud
Every method have the sema pattern:
```js
// For example:
'methodName': {method: 'GET/json', path: '/im/a/flower/', auth: true}
// Call like this:
api.methodName([data,] callback);

// 'data' is optional, 'callback' is required
data = {
	url: {}
	param1,
	param2,
	...
}
callback = function(error, results);
```
```js
// Find all methods in ./FlowerPowerCloud.js
var api = {
	// Profile
	'login': {method: 'POST/urlencoded', path: '/user/v2/authenticate', auth: false},
	'refresh': {method: 'POST/urlencoded', path: '/user/v2/authenticate', auth: false},
	'getProfile': {method: 'GET/json', path: '/user/v4/profile', auth: true},
	'getUserVersions': {method: 'GET/json', path: '/user/v1/versions', auth: true},

	// Garden
	'getSyncGarden': {method: 'GET/json', path: '/sensor_data/v4/garden_locations_status', auth: true},
	'sendSamples': {method: 'PUT/json', path: '/sensor_data/v5/sample', auth: true},
	'getSyncData': {method: 'GET/json', path: '/sensor_data/v3/sync', auth: true},
	'getFirmwareUpdate': {method: 'GET/json', path: '/sensor_data/v1/firmware_update', auth: true},
	'getLocationSamples': {method: 'GET/json', path: '/sensor_data/v2/sample/location/:location_identifier', auth: true},
	'getStatistics': {method: 'GET/json', path: '/sensor_data/v1/statistics/:location_identifier', auth: true},

	// Images
	'getImageLocation': {method: 'GET/json', path: '/image/v3/location/user_images/:location_identifier', auth: true},
};

```
#### Param in url
```js
// Api which need parameters into url
'anExample': {method: 'GET/json', path: '/:this/is/an/:example'}

api.anExample({
	url: {
		this: 'flower',
		example: 'organ'
	},
	param1: '...',
	param2: '...'
}, callback);

// Become
'/flower/is/an/organ'
```

## Finally
Enjoy!

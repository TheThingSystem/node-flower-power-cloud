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

### Get garden configuration
```js
api.getGarden(function(error, garden));
```

### Communicate with Cloud
Every method have the sema pattern:
```js
api.methodName([data,] callback);

typeof data == object // json
callback == function(error, results);

// Call them
api.getGarden(callback);
api.getSyncGarden(callback);
api.getSyncData(callback);
api.sendSamples(data, callback);

// More details into ./FlowerPowerCloud.js
var api = {
	'getSyncGarden': {method: 'GET/json', path: '/sensor_data/v4/garden_locations_status', auth: true},
	'getProfile': {method: 'GET/json', path: '/user/v4/profile', auth: true},
	'sendSamples': {method: 'PUT/json', path: '/sensor_data/v5/sample', auth: true},
	'getSyncData': {method: 'GET/json', path: '/sensor_data/v3/sync', auth: true}
};
```

## Finally
Enjoy!

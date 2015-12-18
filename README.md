flower-power-api
=======================

A node.js module to interface with the [cloud service](https://github.com/parrot-flower-power/parrot-flower-power-api-example)
for the Parrot [Flower Power](http://www.parrot.com/flowerpower/).


Before Starting
---------------
You will need OAuth tokens and a Flower Power account:

- To get the OAuth tokens, use this [form](https://apiflowerpower.parrot.com/api_access/signup)

- To get a Flower power account,
launch the [iOS](https://itunes.apple.com/us/app/apple-store/id712479884), and follow the directions to create an account.
(Apparently there isn't an Android app yet).

API
---

### Load
```js
var FlowerPowerCloud = require('./FlowerPowerCloud');
var api = new FlowerPowerCloud();
```

### Login to cloud
```js
var credential = {
	'username'		: "...",
	'password'		: "...",
	'client_id'		: "...",
	'client_secret'	: "...",
};

api.login(credential, function(err, res) {
	if (err) console.log(err);
	else {
		// Head in the clouds :)
	}
});
```

### Get garden information
```js
api.getGarden(function(err, garden) {
	if (err) console.log(err);
	else {
		// Beautiful flowers!
	}
});
```

Finally
-------

Enjoy!

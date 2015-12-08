var FlowerPowerCloud = require('./FlowerPowerCloud');
var async = require('async');

var api = new FlowerPowerCloud();

var credential = {
	'username'		: "...",
	'password'		: "...",
	'client_id'		: "...",
	'client_secret'	: "...",
};

api.login(credential, function(err, res) {
	if (err) console.log(err);
	else {
		api.getGarden(function(err, res) {
			console.log(res);
		});
	}
});

var FlowerPowerCloud = require('./FlowerPowerCloud');
var async = require('async');

var api = new FlowerPowerCloud();

var credentials = {
	'username'		: "...",
	'password'		: "...",
	'client_id'		: "...",
	'client_secret'	: "...",
	'auto-refresh'	: true
};

api.login(credentials, function(err, res) {
	if (err) console.log(err.toString());
	else {
		api.getGarden(function(err, res) {
			console.log(res);
		});
	}
});

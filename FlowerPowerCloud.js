var ApiError = require('./ApiError');
var async = require('async');
var request = require('request');
var qs = require('querystring');
var schedule = require('node-schedule');

var DEBUG = true;

function FlowerPowerCloud() {
	this._token = {};
	this._isLogged = false;
	this.credentials = {};
	this.autoRefresh = false;

	var self = this;
	var api = {
		'getSyncGarden': {method: 'GET/json', path: '/sensor_data/v4/garden_locations_status', auth: true},
		'getProfile': {method: 'GET/json', path: '/user/v4/profile', auth: true},
		'sendSamples': {method: 'PUT/json', path: '/sensor_data/v5/sample', auth: true},
		'getSyncData': {method: 'GET/json', path: '/sensor_data/v3/sync', auth: true}
	};

	for (var item in api) {
		self.makeReqFunction(item, api[item]);
	}
	return this;
};

FlowerPowerCloud.url = 'https://apiflowerpower.parrot.com';

FlowerPowerCloud.prototype.makeReqFunction = function(name, req) {
	var self = this;

	FlowerPowerCloud.prototype[name] = function(data, callback) {
		self.invoke(req, data, callback);
	};
};

FlowerPowerCloud.prototype.makeHeader = function(req, data) {
	var options = {headers: {}};
	var verb = req.method.split('/')[0];
	var type = req.method.split('/')[1];

	switch (type) {
		case 'urlencoded':
			options.body = qs.stringify(data);
			options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
			break;
		case 'json':
			options.body = JSON.stringify(data);
			options.headers['Content-Type'] = 'application/json';
			break;
		default:
			options.body = data;
			options.headers['Content-Type'] = 'text/plain';
			break;
	}

	options.url = FlowerPowerCloud.url + req.path;
	options.method = verb;
	options.headers['Authorization'] = (req.auth) ? "Bearer " + this._token.access_token : "";

	return options;
};

FlowerPowerCloud.prototype.makeUrl = function(req, data) {
	var self = this;

	if (data) {
		for (var item in data.url) {
			req.path = req.path.replace(':' + item, data.url[item]);
		}
		delete data.url;
	}
	if (DEBUG) self.loggerReq(req, data);
	return req;
};

FlowerPowerCloud.prototype.loggerReq = function(req, data) {
	console.log(req.method, req.path);
	for (var key in data) {
		console.log(key + ":", data[key]));
	}
};

FlowerPowerCloud.prototype.invoke = function(req, data, callback) {
	var options = {};
	var self = this;

	if (typeof data == 'function') {
		callback = data;
		data = null;
	}
	req = self.makeUrl(req, data);
	options = self.makeHeader(req, data);

	if (DEBUG) console.log(options);
	request(options, function(err, res, body) {
		if (typeof body == 'string') body = JSON.parse(body);
		if (err) callback(err, null);
		else if (res.statusCode != 200 || (body.errors && body.errors.length > 0)) {
			return callback(new ApiError(res.statusCode, body), null);
		}
		else if (callback) {
			var results = body;

			if (typeof results.sensors != 'undefined') {
				var sensors = {};
				for (var i = 0; i < results.sensors.length; i++) {
					if (typeof results.sensors[i].sensor_serial != 'undefined' && results.sensors[i].sensor_serial) {
						sensors[results.sensors[i].sensor_serial] = results.sensors[i];
					}
				}
				results.sensors = sensors;
			}
			if (typeof results.locations != 'undefined') {
				var locations = {};
				for (var i = 0; i < results.locations.length; i++) {
					if (typeof results.locations[i].sensor_serial != 'undefined' && results.locations[i].sensor_serial) {
						locations[results.locations[i].sensor_serial] = results.locations[i];
					}
				}
				results.locations = locations;
			}
			results.sensors = self.concatJson(results.sensors, results.locations);
			delete results.locations;
			return callback(null, results);
		}
		else throw "Give me a callback";
	});
};

FlowerPowerCloud.prototype.login = function(data, callback) {
	var req = {method: 'POST/urlencoded', path: '/user/v2/authenticate'};
	var self = this;

	if (data['auto-refresh']) {
		self.autoRefresh = data['auto-refresh'];
		delete data['auto-refresh'];
	}
	self.credentials = data;
	data['grant_type'] = 'password';
	self.invoke(req, data, function(err, res) {
		if (err) callback(err);
		else self.setToken(res, callback);
	});
};

FlowerPowerCloud.prototype.setToken = function(token, callback) {
	var self = this;

	self._token = token;
	self._isLogged = true;
	if (self.autoRefresh) {
		var job = new schedule.Job(function() {
			self.refresh(token);
		});
		job.schedule(new Date(Date.now() + (token['expires_in'] - 1440) * 1000));
	}
	if (typeof callback != 'undefined') callback(null, token);
}

FlowerPowerCloud.prototype.refresh = function(token) {
	var req = {method: 'POST/urlencoded', path: '/user/v2/authenticate'};
	var self = this;

	var data = {
		'client_id':	self.credentials['client_id'],
		'client_secret': self.credentials['client_secret'],
		'refresh_token': token.refresh_token,
		'grant_type': 'refresh_token'
	};

	self.invoke(req, data, function(err, res) {
		if (err) callback(err);
		else self.setToken(res);
	});
};

FlowerPowerCloud.prototype.getGarden = function(callback) {
	var self = this;

	async.parallel({
		syncGarden: function(callback) {
			self.getSyncGarden(callback);
		},
		syncData: function(callback) {
			self.getSyncData(callback);
		}
	}, function(err, res) {
		if (err) callback(err);
		else callback(null, self.concatJson(res.syncData, res.syncGarden));
	});
};

FlowerPowerCloud.prototype.concatJson = function(json1, json2) {
	var dest = json1;
	var self = this;

	for (var key in json2) {
		if (typeof json1[key] == 'object' && typeof json2[key] == 'object') {
			dest[key] = self.concatJson(json1[key], json2[key]);
		}
		else {
			dest[key] = json2[key];
		}
	}
	return dest;
}


module.exports = FlowerPowerCloud;

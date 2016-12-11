var ApiError = require('./ApiError');
var async = require('async');
var request = require('request');
var qs = require('querystring');
var schedule = require('node-schedule');

const DEBUG = false;

function FlowerPowerCloud() {
	this._token = {};
	this._isLogged = false;
	this.credentials = {};
	this.autoRefresh = false;

	var self = this;
	var api = {
		// Profile
		'getProfile': {method: 'GET/json', path: '/user/v4/profile', auth: true},
		'getUserVersions': {method: 'GET/json', path: '/user/v1/versions', auth: true},
		'verify': {method: 'GET/json', path: '/user/v1/verify', auth: true},

		// Garden
		'getSyncGarden': {method: 'GET/json', path: '/sensor_data/v4/garden_locations_status', auth: true},
		'getConfiguration': {method: 'GET/json', path: '/garden/v2/configuration', auth: true},
		'getGarden': {method: 'GET/json', path: '/garden/v1/status', auth: true},
		'sendSamples': {method: 'PUT/json', path: '/sensor_data/v8/sample', auth: true},
		'getSyncData': {method: 'GET/json', path: '/sensor_data/v3/sync', auth: true},
		'getFirmwareUpdate': {method: 'GET/json', path: '/sensor_data/v1/firmware_update', auth: true},
		'getLocationSamples': {method: 'GET/json', path: '/sensor_data/v2/sample/location/:location_identifier', auth: true},
		'getStatistics': {method: 'GET/json', path: '/sensor_data/v1/statistics/:location_identifier', auth: true},

		// Images
		'getImageLocation': {method: 'GET/json', path: '/image/v3/location/user_images/:location_identifier', auth: true},
	};

	for (var item in api) {
		self.makeReqFunction(item, api[item]);
	}
	return this;
};

FlowerPowerCloud.url = 'https://api-flower-power-pot.parrot.com';

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
		console.log(key + ":", data[key]);
	}
};

FlowerPowerCloud.prototype.invoke = function(req, data, callback) {
	var options = {};
	var self = this;

	if (typeof data == 'function') {
		callback = data;
		data = null;
	}
	if (data && typeof data !== 'object') {
		return callback(new Error('Data is not a json'));
	}
	req = self.makeUrl(req, data);
	options = self.makeHeader(req, data);

	if (DEBUG) console.log(options);
	request(options, function(err, res, body) {
		if (typeof body == 'string') {
			try {
				body = JSON.parse(body);
			} catch (e) {};
		}
		if (err) callback(err, null);
		else if (res.statusCode != 200 || (body.errors && body.errors.length > 0)) {
			return callback(new ApiError(res.statusCode, body), null);
		}
		else if (callback) {
			var results = body;

			return callback(null, results);
		}
		else throw "Give me a callback";
	});
};

FlowerPowerCloud.prototype.login = function(data, callback) {
	var req = {method: 'POST/urlencoded', path: '/user/v2/authenticate'};
	var self = this;

	if (typeof data['auto-refresh'] != 'undefined') {
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
	if (typeof callback == 'function') callback(null, token);
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

// FlowerPowerCloud.prototype.getGarden = function(callback) {
// 	var self = this;
//
// 	async.parallel({
// 		syncGarden: self.getSyncGarden,
// 		syncData: self.getSyncData,
// 	}, function(err, res) {
// 		if (err) callback(err);
// 		else callback(null, self.concatJson(res.syncData, res.syncGarden));
// 	});
// };

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

// 'url1': {
// 	'getProfile',
// 	'getUserVersions',
// 	'getSyncGarden',
// 	'sendSamples',
// 	'getSyncData',
// 	'getFirmwareUpdate',
// 	'getLocationSamples',
// 	'getStatistics',
// },
// 'url2': {
// 	'searchName',
// 	'suggest',
// 	'suggestLocation'
// },
// 'url3': {
// 	'infoPlant',
// 	'plantdataVersion',
// 	'listPopularityPlant',
// }

module.exports = FlowerPowerCloud;

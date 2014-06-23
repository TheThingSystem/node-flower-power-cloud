// flower-power-cloud.js
//   cf., https://github.com/parrot-flower-power/parrot-flower-power-api-example


var https       = require('https')
  , events      = require('events')
  , querystring = require('querystring')
  , url         = require('url')
  , util        = require('util')
  ;


var DEFAULT_LOGGER = { error   : function(msg, props) { console.log(msg); if (!!props) console.log(props);             }
                     , warning : function(msg, props) { console.log(msg); if (!!props) console.log(props);             }
                     , notice  : function(msg, props) { console.log(msg); if (!!props) console.log(props);             }
                     , info    : function(msg, props) { console.log(msg); if (!!props) console.log(props);             }
                     , debug   : function(msg, props) { console.log(msg); if (!!props) console.log(props);             }
                     };


var CloudAPI = function(options) {
  var k;

  var self = this;

  if (!(self instanceof CloudAPI)) return new CloudAPI(options);

  self.options = options;

  self.logger = self.options.logger  || {};
  for (k in DEFAULT_LOGGER) {
    if ((DEFAULT_LOGGER.hasOwnProperty(k)) && (typeof self.logger[k] === 'undefined'))  self.logger[k] = DEFAULT_LOGGER[k];
  }

  self.oauth = {};
};
util.inherits(CloudAPI, events.EventEmitter);


CloudAPI.prototype.login = function(username, passphrase, callback) {
  var json;

  var self = this;

  if (typeof callback !== 'function') throw new Error('callback is mandatory for login');

  json = { username      : username
         , client_secret : self.options.clientSecret
         , password      : passphrase
         , client_id     : self.options.clientID
         , grant_type    : 'password'
         };
  self.invoke('POST', '/user/v1/authenticate', json, function(err, code, results) {
    if (!!err) callback(err);

    if (code !== 200) return callback(new Error('invalid credentials: code=' + code + ' results=' + JSON.stringify(results)));

    self.oauth = results;

/*
    if (!!self.timer) {
      clearTimeout(self.timer);
      delete(self.timer);
    }
    if (!!results.expires_in) self.timer = setTimeout(function() { self._refresh(self); }, (results.expires_in - 120) * 1000);
 */

    callback(null);
  });

  return self;
};

CloudAPI.prototype._refresh = function(self, callback) {
  var json;

  delete(self.timer);

  if (!callback) {
    callback = function(err) {
      if (!!err) return self.logger.error('refresh', { exception: err });

      self.logger.info('refresh', { status: 'success' });
    };
  }

  json = { client_id     : self.options.clientID
         , client_secret : self.options.clientSecret
         , refresh_token : self.oauth.refresh_token
         , grant_type    : 'refresh_token'
         };
  self.invoke('POST', '/user/v1/authenticate', json, function(err, code, results) {
    if (!!err) callback(err);

    if (code !== 200) return callback(new Error('invalid credentials: code=' + code + 'results=' + JSON.stringify(results)));

    self.oauth = results;

    if (!!results.expires_in) self.timer = setTimeout(function() { self._refresh(self); }, (results.expires_in - 120) * 1000);

    callback(null);
  });

  return self;
};


CloudAPI.prototype.getGarden = function(callback) {
  var self = this;

  return self.invoke('GET', '/sensor_data/v2/sync?include_s3_urls=1', function(err, code, results) {
    var count, i, location, locations, sensor, sensors;

    if (!!err) return callback(err);

    var f = function(id) {
      return function(err, results) {
          if (!!err) self.logger.error('invoke', { event: 'sync', diagnostic: err.message });
        else locations[id].samples = results.samples;

        if (--count === 0) callback(null, locations, sensors);
      };
    };

    count = 0;


    sensors = {};
    for (i = 0; i < results.sensors.length; i++) {
      sensor = results.sensors[i];
      sensors[sensor.sensor_serial] = sensor;
    }

    locations = {};
    for (i = 0; i < results.locations.length; i++) {
      location = results.locations[i];
      locations[location.location_identifier] = location;

      count++;
      self.roundtrip('GET', '/sensor_data/v2/sample/location/' + location.location_identifier
                     + '?from_datetime_utc=' + location.last_sample_utc, f(location.location_identifier));
    }

    count++;
    self.roundtrip('GET', '/sensor_data/v1/garden_locations_status', function(err, results) {
      var i, id;

      if (!!err) self.logger.error('invoke', { event: 'garden_locations_status', diagnostic: err.message });
      else {
        for (i = 0; i < results.locations.length; i++) {
          location = results.locations[i];
          id = location.location_identifier;
          delete(location.location_identifier);

          locations[id].status = location;
        }          
      }

      if (--count === 0) callback(null, locations, sensors);
    });
  });
};


CloudAPI.prototype.roundtrip = function(method, path, json, callback) {
  var self = this;

  if ((!callback) && (typeof json === 'function')) {
    callback = json;
    json = null;
  }

  return self.invoke(method, path, json, function(err, code, results) {
    var errors;

    if (!!err) return callback(err);

    errors = (!!results.errors) && util.isArray(results.errors) && (results.errors.length > 0) && results.errors;
    if (!!errors) {
      return callback(new Error('invalid response: ' + JSON.stringify(!!errors ? errors : results)));
    }

    callback(null, results);
  });
};

CloudAPI.prototype.invoke = function(method, path, json, callback) {
  var options;

  var self = this;

  if ((!callback) && (typeof json === 'function')) {
    callback = json;
    json = null;
  }
  if (!callback) {
    callback = function(err, results) {
      if (!!err) self.logger.error('invoke', { exception: err }); else self.logger.info(path, { results: results });
    };
  }

  options = url.parse('https://apiflowerpower.parrot.com' + path);
  options.agent = false;
  options.method = method;
  options.rejectUnauthorized = false;    // self-signed certificate?
  options.headers = {};
  if ((!!self.oauth.access_token) && ((!json) || (!json.grant_type))) {
    options.headers.Authorization = 'Bearer ' + self.oauth.access_token;
  }
  if (!!json) {
    options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    json = querystring.stringify(json);
    options.headers['Content-Length'] = Buffer.byteLength(json);
  }

  https.request(options, function(response) {
    var body = '';

    response.on('data', function(chunk) {
      body += chunk.toString();
    }).on('end', function() {
      var expected = { GET    : [ 200 ]
                     , PUT    : [ 200 ]
                     , POST   : [ 200, 201, 202 ]
                     , DELETE : [ 200 ]
                     }[method];

      var results = {};

      try { results = JSON.parse(body); } catch(ex) {
        self.logger.error(path, { event: 'json', diagnostic: ex.message, body: body });
        return callback(ex, response.statusCode);
      }

      if (expected.indexOf(response.statusCode) === -1) {
         self.logger.error(path, { event: 'https', code: response.statusCode, body: body });
         return callback(new Error('HTTP response ' + response.statusCode), response.statusCode, results);
      }

      callback(null, response.statusCode, results);
    }).on('close', function() {
      callback(new Error('premature end-of-file'));
    }).setEncoding('utf8');
  }).on('error', function(err) {
    callback(err);
  }).end(json);

  return self;
};


exports.CloudAPI = CloudAPI;

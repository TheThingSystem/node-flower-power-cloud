// flower-power-cloud.js
//   cf., https://github.com/parrot-flower-power/parrot-flower-power-api-example


var https       = require('https')
  , events      = require('events')
  , querystring = require('querystring')
  , url         = require('url')
  , util        = require('util')
  ;


var DEFAULT_CONFIG = { clientID     : ''
                     , clientSecret : ''
                     };

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

  self.config = self.options.config || {};
  for (k in DEFAULT_CONFIG) {
    if ((DEFAULT_CONFIG.hasOwnProperty(k)) && (typeof self.config[k] === 'undefined'))  self.config[k] = DEFAULT_CONFIG[k];
  }

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

    if (code !== 200) return callback(new Error('invalid credentials: code=' + code + 'results=' + JSON.stringify(results)));

    self.oauth = results;
    callback(null);
  });

  return self;
};

CloudAPI.prototype._refresh = function(callback) {
  var json;

  var self = this;

  if (typeof callback !== 'function') throw new Error('callback is mandatory for refresh');

  json = { client_id     : self.options.clientID
         , client_secret : self.options.clientSecret
         , refresh_token : self.oauth.refresh_token
         , grant_type    : 'refresh_token'
         };
  delete(self.oauth.access_token);
  self.invoke('POST', '/oauth2/token', json, function(err, code, results) {
    if (!!err) callback(err);

    if (code !== 201) {
      return callback(new Error('invalid credentials: '
                        + (((!!results) && (!!results.data) && (!!results.data.error) ? results.data.error
                                                                                      : JSON.stringify(results)))));
    }

    if (!results.data) return callback(new Error('invalid response: ' + JSON.stringify(results)));
    self.oauth = results.data;
    callback(null);
  });

  return self;
};


CloudAPI.prototype.getGarden = function(callback) {
  var self = this;

  return self.invoke('GET', '/users/me/wink_devices', function(err, code, results) {
    if (!!err) return callback(err);

    callback(null, code, results);
  });
};


CloudAPI.prototype.invoke = function(method, path, json, callback) {
  var options;

  var self = this;

  if (typeof json === 'function') {
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
  options.headers = {};
  if (!!json) {
    options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    json = querystring.stringify(json);
    options.headers['Content-Length'] = Buffer.byteLength(json);
  }
  if (!!self.oauth.access_token) options.headers.Authorization = 'Bearer ' + self.oauth_access.token;

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

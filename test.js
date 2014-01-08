var CloudAPI = require('./flower-power-cloud');

var clientID     = 'mrose17@icloud.com'
  , clientSecret = 'K567BeT6wnd56vhMs39eaBXi4pWd8Y84ixAXinCRTPAfvjyq'
  , userName     = 'mrose17@icloud.com'
  , passPhrase   = 'HYHuKrpXJPwyCHpsB2btvDpA7jkTop'
  , api
  ;

api = new CloudAPI.CloudAPI({ clientID: clientID, clientSecret: clientSecret }).login(userName, passPhrase, function(err) {
  if (!!err) return console.log('login error: ' + err.message);

/*
  api.getDevices(function(err, results) {
    if (!!err) return console.log('getDevices: ' + err.message);

    console.log('devices:'); console.log(results);
  });
 */
}).on('error', function(err) {
  console.log('background error: ' + err.message);
});

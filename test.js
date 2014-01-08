var CloudAPI = require('./flower-power-cloud');

var clientID     = '...'
  , clientSecret = '...'
  , userName     = '...'
  , passPhrase   = '...'
  , api
  ;

api = new CloudAPI.CloudAPI({ clientID: clientID, clientSecret: clientSecret }).login(userName, passPhrase, function(err) {
  if (!!err) return console.log('login error: ' + err.message);

  api.getGarden(function(err, plants, sensors) {
    if (!!err) return console.log('getGarden: ' + err.message);

    console.log('plants:'); console.log(plants);
    console.log('sensors:'); console.log(sensors);
  });
}).on('error', function(err) {
  console.log('background error: ' + err.message);
});

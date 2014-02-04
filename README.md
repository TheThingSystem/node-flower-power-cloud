node-flower-power-cloud
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


Install
-------

    npm install flower-power-cloud

API
---

### Load

    var CloudAPI = require('flower-power-cloud');

### Login to cloud

    var clientID     = '...'
      , clientSecret = '...'
      , userName     = '...'
      , passPhrase   = '...'
      , api
      ;

    api = new CloudAPI.CloudAPI({ clientID     : clientID
                                , clientSecret : clientSecret }).login(userName, passPhrase, function(err) {
      if (!!err) return console.log('login error: ' + err.message);

      // otherwise, good to go!
    }).on('error', function(err) {
      console.log('background error: ' + err.message);
    });

### Get garden information

    flower-power-cloud.getGarden(function(err, plants, sensors) {
      if (!!err) return console.log('getGarden: ' + err.message);

      // inspect plants{} and sensors{}
    }

Finally
-------

Enjoy!

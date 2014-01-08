node-flower-power-cloud
=======================

**NB: this module is not completed yet. soon, very soon!**

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

    var CloudAPI = require('node-flower-power-cloud');

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

### Get user information

    flower-power-cloud.getUser(function(err, code, user) {
      if (!!err) return console.log('getUser: ' + err.message);

      // inspect user
    }

### Get device information

    flower-power-cloud.getDevices(function(err, code, devices) {
      if (!!err) return console.log('getDevices: ' + err.message);

      // inspect devices
    }

Finally
-------

Enjoy!

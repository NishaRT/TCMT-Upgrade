var request = require('request');

var getClientToken = function(config,callback){
	var options = {
		method: 'POST',
		url: config.uaaURL + '/oauth/token',
		form: {
			'grant_type': 'client_credentials',
			'client_id': config.clientId,
            'client_secret': 'giW1CNAFKpCFMHDn'
		},
		headers: {
            'Content-Type' : 'application/x-www-form-urlencoded',
			'Authorization': 'Basic ' + config.base64ClientCredential
		}

	};

	request(options, function(err, response, body) {
		if (!err && response.statusCode == 200) {
			console.log('response from getClientToken: ' + body);
			var clientTokenResponse = JSON.parse(body);
			callback(clientTokenResponse);
		} else {
			console.log('ERROR fetching client token: ' + body);
		}
	}).auth(config.clientId,'giW1CNAFKpCFMHDn',false);
};



module.exports =  {
   getClientToken : function(config) {
	   return function(req,res,next){
            getClientToken(config, function(clientTokenResponse) {
                req.clientTokenForApp = clientTokenResponse;
                next();
            });
	    }
   }
};
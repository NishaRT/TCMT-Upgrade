/*******************************************************
The predix-seed Express web application includes these features:
  * routes to mock data files to demonstrate the UI
  * passport-predix-oauth for authentication, and a sample secure route
  * a proxy module for calling Predix services such as asset and time series
*******************************************************/

var express = require('express');
var jsonServer = require('json-server'); // used for mock api responses
var path = require('path');
var cookieParser = require('cookie-parser'); // used for session cookie
var bodyParser = require('body-parser');
var passport; // only used if you have configured properties for UAA
// simple in-memory session is used here. use connect-redis for production!!
var session = require('express-session');
var proxy = require('./proxy'); // used when requesting data from real services.
// get config settings from local file or VCAPS env var in the cloud
var config = require('./predix-config');
// configure passport for authentication with UAA
var passportConfig = require('./passport-config');

const proxy_routes = require('./proxy_routes');
var userInfo = require('./user-info');
var randomstring = require("randomstring");
var oauthRelated = require('./oauthCalls');

// if running locally, we need to set up the proxy from local config file:
var node_env = process.env.node_env || 'development';
if (node_env === 'development') {
    var devConfig = require('./localConfig.json')[node_env];
    proxy.setServiceConfig(config.buildVcapObjectFromLocalConfig(devConfig));
    proxy.setUaaConfig(devConfig);
}

//var windServiceURL = process.env.windServiceURL || devConfig.windServiceURL;

console.log('************' + node_env + '******************');

var uaaIsConfigured = config.clientId &&
    config.uaaURL &&
    config.uaaURL.indexOf('https') === 0 &&
    config.base64ClientCredential;
if (uaaIsConfigured) {
    passport = passportConfig.configurePassportStrategy(config);
}

/**********************************************************************
       SETTING UP EXRESS SERVER
***********************************************************************/
var app = express();
// general config
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

proxy_routes.setPathProxies(app); //Added
var secret = randomstring.generate({
    length: 8,
    charset: 'alphabetic'
});
var cookie = randomstring.generate({
    length: 10,
    charset: 'alphabetic'
});
app.set('trust proxy', 1);


app.use(cookieParser(secret));
// Initializing default session store
// *** Use this in-memory session store for development only. Use redis for prod. **
app.use(session({
    secret: secret,
    name: cookie,
    proxy: true,
    resave: true,
    cookie: { maxAge: 7199000 },
    saveUninitialized: true
}));

if (uaaIsConfigured) {
    app.use(passport.initialize());
    // Also use passport.session() middleware, to support persistent login sessions (recommended).
    app.use(passport.session());

}

//Initializing application modules
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var server = app.listen(process.env.VCAP_APP_PORT || 5000, function() {
    console.log('Server started on port: ' + server.address().port);
});

/*******************************************************
SET UP MOCK API ROUTES
*******************************************************/
// Import route modules
var viewServiceRoutes = require('./view-service-routes.js')();
var assetRoutes = require('./predix-asset-routes.js')();
var timeSeriesRoutes = require('./time-series-routes.js')();

// add mock API routes.  (Remove these before deploying to production.)
app.use('/api/view-service', jsonServer.router(viewServiceRoutes));
app.use('/api/predix-asset', jsonServer.router(assetRoutes));
app.use('/api/time-series', jsonServer.router(timeSeriesRoutes));

/****************************************************************************
	SET UP EXPRESS ROUTES
*****************************************************************************/

if (!uaaIsConfigured) { // no restrictions
    app.use(express.static(path.join(__dirname, process.env['base-dir'] ? process.env['base-dir'] : '../dist')));
} else {
    //login route redirect to predix uaa login page
    app.get('/login', passport.authenticate('predix', { 'scope': '' }), function(req, res) {
        // The request will be redirected to Predix for authentication, so this
        // function will not be called.
    });

    app.get('/userinfo', userInfo(config.uaaURL), function(req, res) {
        console.log("I am done");
        res.send(JSON.stringify(req.user.details));
    });

    // access real Predix services using this route.
    // the proxy will add UAA token and Predix Zone ID.
    app.use('/predix-api',
        passport.authenticate('main', {
            noredirect: true
        }),
        proxy.router);

    //callback route redirects to secure route after login
    app.get('/callback', passport.authenticate('predix', {
        failureRedirect: '/'
    }), function(req, res) {
        console.log('Redirecting to secure route...');
        res.redirect('/');
    });




    // example of calling a custom microservice.
    // if (windServiceURL && windServiceURL.indexOf('https') === 0) {
    //     app.get('/windy/*', passport.authenticate('main', { noredirect: true }),
    //         // if calling a secure microservice, you can use this middleware to add a client token.
    //         // proxy.addClientTokenMiddleware,
    //         proxy.customProxyMiddleware('/windy', windServiceURL)
    //     );
    // }

    //Use this route to make the entire app secure.  This forces login for any path in the entire app.
    app.use('/', passport.authenticate('main', {
            noredirect: false //Don't redirect a user to the authentication page, just show an error
        }),
        express.static(path.join(__dirname, process.env['base-dir'] ? process.env['base-dir'] : '../dist'))
    );


    //Or you can follow this pattern to create secure routes,
    // if only some portions of the app are secure.
    app.get('/secure', passport.authenticate('main', {
        noredirect: true //Don't redirect a user to the authentication page, just show an error
    }), function(req, res) {
        console.log('Accessing the secure route');
        // modify this to send a secure.html file if desired.
        res.send('<h2>This is a sample secure route.</h2>');
    });

}

app.get('/nodeCall', function(req, res) {
     res.send({ "cmdId": "202", "appName": "AXISCloudGateway", "url": "SendCommandToEdge", "type": "POST", "cmdParams": { "callMethod": 0, "cmdId": "16", "cmdParams": { "parkName": "PrarieWind", "pathToNewTCWLocation": "D:\\Share\\Senthil's TCW\\GEWindSite Brady I\\GEWindSiteBackUP\\GEWindSiteBackUP.tcw", "pathToOriginalTCWLocation": "C:\\Users\\Administrator\\Desktop\\All Tcws\\GEWindSite\\GEWindSite\\GEWindSite.tcw", }, "cmdResponse": null, "cmdSender": "ASHA", "cmdStatus": 0, "cmdStatusDescr": null, "url": "GetResponse", "parkId": "8547", "mode": 1 } });
});

app.get('/getToken', oauthRelated.getClientToken(config), function(req, res) {
    console.log("Got client token");
    res.send(JSON.stringify(req.clientTokenForApp));
    //     console.log("In Get Token");
    //     var tobeReturned = {};
    // 	if(req.user!=null && req.user.ticket!=null && req.user.ticket.access_token!=null)
    //     {
    //         console.log(req.user.ticket.access_token);
    //         tobeReturned.token = req.user.ticket.access_token;

    //     }
    //     else
    //     {
    // tobeReturned.token = "";
    //     }
    //     console.log(tobeReturned);

    //     res.send(tobeReturned);



});

//logout route
app.get('/logout', function(req, res) {
    req.session.destroy();
    req.logout();
    passportConfig.reset(); //reset auth tokens
    var logoutUrl = 'https://affiliateservices.stage.gecompany.com/logoff/logoff.jsp';
    res.redirect(config.uaaURL + '/logout?redirect=' + encodeURIComponent(logoutUrl));
});

app.get('/favicon.ico', function(req, res) {
    res.send('favicon.ico');
});

// Sample route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
//currently not being used as we are using passport-oauth2-middleware to check if
//token has expired
/*
function ensureAuthenticated(req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}
*/

////// error handlers //////
// catch 404 and forward to error handler
// app.use(function(err, req, res, next) {
//     console.error(err.stack);
//     var err = new Error('Not Found');
//     err.status = 404;
//     next(err);
// });

// development error handler - prints stacktrace
if (node_env === 'development') {
    app.use(function(err, req, res, next) {
        if (!res.headersSent) {
            res.status(err.status || 500);
            res.send({
                message: err.message,
                error: err
            });
        }
    });
}

// production error handler
// // no stacktraces leaked to user
// app.use(function(err, req, res, next) {
//     if (!res.headersSent) {
//         res.status(err.status || 500);
//         res.send({
//             message: err.message,
//             error: {}
//         });
//     }
// });

app.use(function(req, res, next) {
      res.status(404);

    // respond with html page
    if (req.accepts('html')) {
        res.render('404', { url: req.url, "status": "404.", "message": "That’s an error." });
        return;
    }

    // respond with json
    if (req.accepts('json')) {
        res.send({ error: 'Not found' });
        return;
    }

    // default to plain-text. send()
    res.type('txt').send('Not found');
});

// error-handling middleware, take the same form
// as regular middleware, however they require an
// arity of 4, aka the signature (err, req, res, next).
// when connect has an error, it will invoke ONLY error-handling
// middleware.

// If we were to next() here any remaining non-error-handling
// middleware would then be executed, or if we next(err) to
// continue passing the error, only error-handling middleware
// would remain being executed, however here
// we simply respond with an error page.

app.use(function(err, req, res, next) {
    // we may use properties of the error object
    // here and next(err) appropriately, or if
    // we possibly recovered from the error, simply next().
    res.status(err.status || 500);
    res.render('500', { error: err });
});

// Routes

app.get('/', function(req, res) {
    res.render('index.jade');
});

app.get('/404', function(req, res, next) {
    // trigger a 404 since no other middleware
    // will match /404 after this one, and we're not
    // responding here
    next();
});

app.get('/403', function(req, res, next) {
    // trigger a 403 error
    var err = new Error('not allowed!');
    err.status = 403;
    next(err);
});

app.get('/500', function(req, res, next) {
    // trigger a generic (500) error
    next(new Error('keyboard cat!'));
});

module.exports = app;

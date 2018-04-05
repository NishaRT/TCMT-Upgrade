var proxyMiddleware = require('http-proxy-middleware');
var proxy_router_config = require('./proxy_route_config');
var agent = require('https-proxy-agent');
var _ = require('lodash');
var setPathProxies = function(app){
	var proxyConfig = proxy_router_config.proxyConfig;
	_.forEach(Object.keys(proxyConfig), function(toPath){
		if(proxyConfig[toPath]) {
	   var corporateProxyServer = process.env.http_proxy || process.env.HTTP_PROXY    || process.env.HTTPS_PROXY ||  process.env.https_proxy;
		 var apiProxyContext = toPath;
		 var newContext = '^'+toPath;
		 var pathRewrite = {};
		 pathRewrite[newContext]= '';
		 var apiProxyOptions = {
			 target:proxyConfig[toPath],
			 changeOrigin:true,
			 logLevel: 'debug',
			 pathRewrite: pathRewrite,
			 onProxyReq: function onProxyReq(proxyReq, req, res) {
				
			 },
			 onProxyReqWs: function onProxyReqWs(proxyReq, req, socket, options, head) {
				
			}
		 };
	 
		  if (corporateProxyServer) {  //Uncommented
			 apiProxyOptions.agent = new agent(corporateProxyServer); //Uncommented
		 } //Uncommented
		 app.use(proxyMiddleware(apiProxyContext,apiProxyOptions));
	 }
	});
}
 module.exports = {
	setPathProxies: setPathProxies
};

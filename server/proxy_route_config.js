var proxyConfig = {
	    "/backend": "https://ren-digital-tcmt-uaa-svc.run.aws-usw02-pr.ice.predix.io",
	    "/asset-catalog": process.env.ASSET_CATALOG_URL,
	}
	module.exports = {
	    proxyConfig: proxyConfig
	};

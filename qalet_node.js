var 
express = require('./package/express/node_modules/express'),   
bodyParser = require('./package/body-parser/node_modules/body-parser'),
compression = require('./package/compression/node_modules/compression'),
tls = require('tls'),  
app			= express(),
expireTime	= 604800000,
port 		= 80;

var LOG = require(__dirname + '/package/log/log.js');
var log = new LOG();		
var env = {
	root_path:__dirname,
	config_path:'/var/qalet_config',
	sites_path:__dirname + '/sites',
	site_contents_path : '/var/site_contents'
};
var _dns = {m:{tm:new Date().getTime(), list:[]}, 
	    dns : {tm:new Date().getTime(), DNS:{}},
	    n:{tm:new Date().getTime(), list:[]}, 
	    c:{tm:new Date().getTime(), list:[]}};
var pkg = {
	crowdProcess:require('./package/crowdProcess/crowdProcess'),
	request		:require('./package/request/node_modules/request'),
	syntaxError	:require('./package/syntax-error/node_modules/syntax-error'),
	fs		:require('fs'),
	exec		:require('child_process').exec,
	io		:require('./modules/io/node_modules/io')			
};

app.use(bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

app.use(compression({level:9}));

app.all('*', function(req, res, next) {
       res.header("Access-Control-Allow-Origin", "*");
       res.header("Access-Control-Allow-Headers", "X-Requested-With");
       res.header('Access-Control-Allow-Headers', 'Content-Type');
       next();
});

app.use(function(req, res, next){
    res.setTimeout(300000, function(){
		res.writeHead(505, {'Content-Type': 'text/html'});
		var v = {
			url:req.protocol + '://' + req.get('host') + req.originalUrl,
			code: 505,
			reason:'timeout'
		}
		res.write(req.protocol + '://' + req.get('host') + req.originalUrl + ' request was timeout!');
		res.end();			
	});
    next();
});

app.get(/(.+)$/i, function (req, res) {
	delete require.cache[__dirname + '/modules/qaletRouter/qaletRouter.js'];
	var router  = require(__dirname + '/modules/qaletRouter/qaletRouter.js');
	var R = new router(pkg, env, req, res);
	R.load();
});

app.post(/(.+)$/i, function (req, res) {
	delete require.cache[__dirname + '/modules/qaletRouter/qaletRouter.js'];
	var router  = require(__dirname + '/modules/qaletRouter/qaletRouter.js');
	var R = new router(pkg, env, req, res);
	R.load();
});


var server = require('http').createServer(app);
server.listen(port, function() {
	log.write("/var/log/shusiou_master_reboot.log", 'shusiou master boot up', 'Started server on port ' + port + '!'); 
	let io =  new pkg.io(env, pkg, server);
});

var cert_folder = '/var/cert/sites/';
pkg.fs.exists(cert_folder, function(exists) {
    if (exists) {
	pkg.fs.readdir(cert_folder, function(err, cert_files) {
		var certs = {};
		if (!cert_files.length) return false;
		for (var i = 0; i < cert_files.length; i++) {
			if (pkg.fs.existsSync(cert_folder + cert_files[i] + '/key.pem') &&
			   	pkg.fs.existsSync(cert_folder + cert_files[i] + '/crt.pem')
			   ) {
				certs[cert_files[i]] = {
					key: pkg.fs.readFileSync(cert_folder + cert_files[i] + '/key.pem'),
					cert: pkg.fs.readFileSync(cert_folder + cert_files[i] + '/crt.pem') 			
				};
			}

		}	
		var httpsOptions = {

			SNICallback: function(hostname, cb) {
			  //if (certs[hostname]) {
			//	var ctx = tls.createSecureContext(certs[hostname]);
			  //} else {
				var ctx = tls.createSecureContext(certs['star.shusiou.win'])
			 // }
			  cb(null, ctx)
			}
		};
		var https_server =  require('https').createServer(httpsOptions, app);
		https_server.listen(443, function() {
			console.log('Started server on port 443 at' + new Date() + '');
			let io =  new pkg.io(env, pkg, https_server);
		});		
	});
    }
});
/* ---- DNS Server */
let ddns_path = env.sites_path + '/root';
pkg.fs.exists(ddns_path, function(exists) {
    if (exists) {
	function getServerIP() {
	    var ifaces = require('os').networkInterfaces(), address=[];
	    for (var dev in ifaces) {
		var v =  ifaces[dev].filter((details) => details.family === 'IPv4' && details.internal === false);
		for (var i=0; i < v.length; i++) address[address.length] = v[i].address;
	    }
	    return address;
	};	    
	let dnsd = require('./package/dnsd/node_modules/dnsd'),
	    ips = getServerIP(),
	    dnsport = 53;
	for (var i = 0; i < ips.length; i++) {
		try {
			dnsd.createServer((function(i) {return function(req, res) {
				delete require.cache[ddns_path];
				let DDNS  = require(ddns_path + '/api/inc/ddns/ddns.js'), 
				    ddns = new DDNS(env, _dns, ips[i]);
				ddns.sendRecord(req, res);

			}})(i)).listen(dnsport, ips[i])
			console.log('DNS Server running at ' + ips[i] + ':' + dnsport);
		} catch (e) {
			console.log('Error ' + e.message);
		}
	}
    }
});
/* ---- DNS Server */

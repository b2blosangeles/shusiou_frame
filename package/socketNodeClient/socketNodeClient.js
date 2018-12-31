(function () { 
	var obj =  function (cfg, env) {
		let me = this;
		me.io = require(env.root_path + '/package/socket.io-client/node_modules/socket.io-client');

		me.connect = function () {
			let me = this;
			
			let patt_https = /^https\:\/\//i,  patt_http = /^http\:\/\//i;
			
			if (patt_https.test(cfg.link)) {
				me.socket = me.io.connect(cfg.link, {secure: true, reconnect: true, rejectUnauthorized : false});
			}
			if (patt_http.test(cfg.link)) {
				me.socket = me.io.connect(cfg.link);
			}
		}
		me.sendToRoom = function (room, data, callback) {
			let me = this;
			if (!me.socket || !me.socket.connected) {
				me.connect();
				setTimeout(function() {   
					if (me.socket) me.socket.close();
					callback()
				},(cfg.timeout) ? cfg.timeout :3000);					
			}
			me.requestID = room + '_' + new Date().getTime();

			me.socket.on('connect', function(){
				me.socket.emit('clientRequest', { cmd : 'sendToRoom', room : room, data:data});
				me.socket.close();
				if (typeof callback === 'function') {
					callback(data);
					return true;
				}
			});
	
		};
		me.sendToSocket = function (socket_id, data, callback) {
			let me = this;
			if (!me.socket || !me.socket.connected) {
				me.connect();
				setTimeout(function() {   
					if (me.socket) me.socket.close();
					callback()
				},(cfg.timeout) ? cfg.timeout :3000);				
			}
			me.requestID = socket_id + '_' + new Date().getTime();

			me.socket.on('connect', function(){
				me.socket.emit('clientRequest', { cmd : 'sendToSocket', toSocket : socket_id, data:data});
				me.socket.close();
				if (typeof callback === 'function') {
					callback(data);
					return true;
				}
			});		
		};		
		me.sendToRoomArray = function (arr, data, callback) {
		
		};		
	}	
	module.exports = obj;
})();

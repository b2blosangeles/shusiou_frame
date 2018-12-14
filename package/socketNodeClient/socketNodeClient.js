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
			}
			me.requestID = room + '_' + new Date().getTime();

			me.socket.on('connect', function(){
				me.socket.emit('createRoom', room);
				me.socket.emit('clientData', {_room: room, 
						_link: cfg.link, _proxy: ((cfg.proxy) ? cfg.proxy : null),
						_requestID:me.requestID, data: data});
			});
			setTimeout(function() {   
				me.socket.close();
			},(cfg.timeout) ? cfg.timeout : 1000);			
			me.socket.on('serverData', function(data) {
				if ((data._room) && data._requestID === me.requestID) {
					me.socket.close();
					callback(data);
					return true;
				}
			});		
		};
		me.sendToSocket = function (socket_id, data, callback) {
			let me = this;
			if (!me.socket || !me.socket.connected) {
				me.connect();
			}
			me.requestID = socket_id + '_' + new Date().getTime();

			me.socket.on('connect', function(){
				me.socket.emit('clientData', {_socket: socket_id, 
						_link: cfg.link, _proxy: ((cfg.proxy) ? cfg.proxy : null),
						_requestID:me.requestID, data: data});
			});
			setTimeout(function() {   
				me.socket.close();
			},(cfg.timeout) ? cfg.timeout : 1000);			
			me.socket.on('serverData', function(data) {
				if ((data._socket) && data._requestID === me.requestID) {
					me.socket.close();
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

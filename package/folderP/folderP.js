(function () { 
	var obj =  function () {
		this.build = function(folder, callback) {
			var fs = require('fs');
			function mkfolder (a, callback) {
				if (typeof a == 'string') {
					var b = [], dp = a.split('/');
					for (var i = 0; i < dp.length; i++) {
						var idx = b.length;
						if (!idx) b[idx] = dp[i];
						else {
							b[idx] = b[idx-1] + '/' + dp[i];
						}
					}
					mkfolder (b, callback);
					return true;
				}

				if (!a.length) {
					callback();
					return true;
				} 
				var v = a[0];
				if (!v) {
					a.shift();
					mkfolder (a, callback);    
				} else {
					fs.stat(v, function(err, stats) {
						if (err) {
							fs.mkdir(v, function() {
								a.shift();
								mkfolder (a, callback);
							});
						} else {
							a.shift();
							mkfolder (a, callback);
						}
					}); 
				}

			}

			mkfolder(folder,  callback);
		};	
	};
	module.exports = obj;
})();

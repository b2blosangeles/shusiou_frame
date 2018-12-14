(function () { 
		var obj =  function () {
			this.serial = function(q, cbk, timeout) {
				var me = this;
				var idx = '', tm = new Date().getTime();
				var vtime = (isNaN(timeout) || timeout == 0)?6000:timeout
				me.data = {};	
				var _f = function(o) {
					return function(res) {
						delete q[o];
						idx = '';
						me.data[o] = res;
					}
				}
				var _itv = setInterval(
					function(){
						if (!idx) {
							if (!Object.keys(q).length) {
								clearInterval(_itv);
								cbk({_spent_time:new Date().getTime() - tm, status:'success', results:me.data});
							} else {
								idx = Object.keys(q)[0];
								if ((q[idx]) && typeof q[idx] == 'function') {
									if (!me.exit) {
										q[idx](_f(idx));
									} else {
										delete q[idx];
										idx = '';
									}
								} 
							}
						}
						if (new Date().getTime() - tm > vtime) {
							clearInterval(_itv);
							cbk({_spent_time:new Date().getTime() - tm, status:'timeout', results:me.data});
						}				
						return true;
					}
				, 1); 
			};
			this.parallel = function(q, cbk, timeout) {
				var me = this;
				var tm = new Date().getTime(), vtime = (isNaN(timeout) || timeout == 0)?6000:timeout;
				
				me.data = {};	
				var count_q = 0, count_r = 0;
				for (var o in q) {
					count_q++;	
					var _f = function(o) {
						return function(res) {
							count_r++;
							me.data[o] = res;
						}
					}
					if ((q[o]) && typeof q[o] == 'function') {
						q[o](_f(o));
					} 						
				}
				var _itv = setInterval(
					function(){			
						if (count_q == count_r) {
							clearInterval(_itv);
							cbk({_spent_time:new Date().getTime() - tm, status:'success', results:me.data});
						}
						if (new Date().getTime() - tm > vtime) {
							clearInterval(_itv);
							cbk({_spent_time:new Date().getTime() - tm, status:'timeout', results:me.data});
						}				
						return true;
					}
				, 1); 		
			};
		};

	if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
		module.exports = obj;
	} else {
		window.crowdProcess = function() {
			return obj; 
		}
	}
})();

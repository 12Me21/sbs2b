var SERVER = "https://cors-anywhere.herokuapp.com/http://new.smilebasicsource.com/api/";

function request(endpoint, method, callback, data, auth) {
	var x = new XMLHttpRequest();
	x.open(method, SERVER+endpoint);
	x.onload = function() {
		var code = x.status;
		var type = x.getResponseHeader("Content-Type");
		if (/^application\/json(?!=\w)/.test(type)) {
			try {
				var resp = JSON.parse(x.response);
			} catch(e) {
				resp = null;
			}
		} else {
			resp = x.response;
		}
		callback(resp, code);
	}
	if (auth)
		x.setRequestHeader("Authorization", "Bearer "+auth);
	if (data) {
		x.setRequestHeader("Content-Type","application/json;charset=UTF-8");
		x.send(JSON.stringify(data));
	} else {
		x.send();
	}
}

// event handler system
// maybe make this a nice class later
function callAll(list, args, th) {
	if (list)
		for(var i=0;i<list.length;i++){
			list[i].apply(th, args);
		}
}
function eventify(cls) {
	cls.prototype.on = function(name, callback) {
		console.log(this);
		if (this.events[name]) {
			this.events[name].push(callback);
		} else {
			this.events[name] = [callback];
		}
	}
}
function initEvents(obj) {
	obj.events = {};
}

function Myself() {
	initEvents(this);
}
eventify(Myself);

Myself.prototype.logOut = function() {
	callAll(this.events.logOut, [], this);
	this.auth = null;
}

Myself.prototype.setAuth = function(auth) {
	var old = this.auth;
	this.auth = auth;
	if (!old)
		callAll(this.events.auth, [], this);
}

Myself.prototype.logIn = function(username, password, callback) {
	var $ = this
	/*if (window.localStorage.auth) {
		console.log("using cached auth");
		$.auth = window.localStorage.auth;
		callback.call($);
	} else {*/
		console.log("requesting auth");
		request("User/authenticate", "POST", function(auth, code){
			if (code == 200) {
				console.log("got auth");
				$.auth = window.localStorage.auth = auth;
				callback.call($);
				callAll($.events.auth, [], this);
			} else {
				console.log("auth request failed: "+auth);
				$.auth = null;
				callback.call($, auth); //error
			}
		}, {username:username,password:password});
	//}
}

// make a request with your auth code,
// if response is 401, triggers a logOut
Myself.prototype.request = function(url, method, callback, data) {
	var $=this;
	request(url, method, function(resp, code){
		if (code == 401) {
			$.logOut();
			callback.call($,resp, code);
		} else {
			callback.call($,resp, code);
		}
	}, data, this.auth);
}

// test whether auth code is valid
// causes a logOut event if invalid
Myself.prototype.testAuth = function() {
	this.request("User/me","GET",function(resp, code){console.log(resp,code)});
};

Myself.prototype.register1 = function(username, password, email, callback) {
	var $ = this;
	$.request("User/register", "POST", function(resp, code){
		if (code==200) {
			callback.call($);
		} else {
			callback.call($, resp);
		}
	}, {username:username, password:password, email:email});
}

Myself.prototype.sendEmail = function(email, callback) {
	var $ = this;
	this.request("User/register/sendemail", "POST", function(resp, code){
		if (code == 200) {
			callback.call($); //success
		} else {
			callback.call($, resp);
		}
	}, {email: email});
}

Myself.prototype.confirm = function(key, callback) {
	var $=this;
	$.request("User/register/confirm", "POST", function(resp, code) {
		if (code==200) {
			callback.call($);
		} else {
			callback.call($, resp);
		}
	}, {confirmationKey: key});
}

Myself.prototype.register = function(username, password, email, callback) {
	var $=this;
	$.register1(username, password, email, function(e) {
		if (e) {
			callback.call($, e);
		} else {
			$.sendEmail(email, function(e) {
				if (e) {
					callback.call($, e);
				} else {
					callback.call($);
				}
			})
		}
	});
}

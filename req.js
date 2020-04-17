var SERVER = "http://new.smilebasicsource.com/api/";

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
/*function eventify(cls) {
	cls.prototype.on = function(name, callback) {
		if (this.events.name) {
			this.events.name.push(callback);
		} else {
			this.events.name = [callback];
		}
	}
}
function initEvents(obj) {
	obj.events = {};
}*/

function Myself() {
	this.events = {};
}
//eventify(Myself);

Myself.prototype.logOut = function() {
	callAll(this.events.logOut, [], this);
	this.auth = null;
}

Myself.prototype.logIn = function(username, password, callback) {
	if (window.localStorage.auth) {
		console.log("using cached auth");
		this.auth = window.localStorage.auth;
		callback.call(this);
	} else {
		console.log("requesting auth");
		request("User/authenticate", "POST", function(auth, code){
			if (code == 200) {
				console.log("got auth");
				this.auth = window.localStorage.auth = auth;
				callback.call(this);
			} else {
				console.log("auth request failed: "+auth);
				this.auth = null;
				callback.call(this, auth); //error
			}
		}, {username:username,password:password});
	}
}

Myself.prototype.request = function(url, method, callback, data) {
	request(url, method, callback, data, this.auth);
}

Myself.prototype.register1 = function(username, password, email, callback) {
	this.request("User/register", "POST", function(resp, code){
		if (code==200) {
			callback.call(this);
		} else {
			callback.call(this, resp);
		}
	}, {username:username, password:password, email:email});
}

Myself.prototype.sendEmail = function(email, callback) {
	this.request("User/register/sendemail", "POST", function(resp, code){
		if (code==200) {
			callback.call(this); //success
		} else {
			callback.call(this, resp);
		}
	}, {email: email});
}

Myself.prototype.confirm = function(key, callback) {
	this.request("User/register/confirm", "POST", function(resp, code) {
		if (code==200) {
			callback.call(this);
		} else {
			callback.call(this, resp);
		}
	}, {confirmationKey: key});
}

Myself.prototype.register = function(username, password, email, callback) {
	this.register1(username, password, email, function(e) {
		if (e) {
			callback.call(this, e);
		} else {
			this.sendEmail(email, function(e) {
				if (e) {
					callback.call(this, e);
				} else {
					callback.call(this);
				}
			})
		}
	});
}

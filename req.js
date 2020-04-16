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

function Myself() {
}

Myself.prototype.logIn = function(username, password, callback) {
	request("User/authenticate", "POST", function(auth, code){
		if (code == 200) {
			this.auth = window.localStorage.auth = auth;
			callback.bind(this)();
		} else {
			this.auth = null;
			callback.bind(this)(auth); //error
		}
	}, {username:username,password:password});
}

var myself = new Myself();

function requestAuth(username, password, callback) {
}

function login(username, password, callback) {
	console.log("logging in...");
	if (window.localStorage.auth) {
		console.log("using cached auth");
		callback(window.localStorage.auth)
	} else {
		console.log("requesting auth");
		requestAuth(username, password, function(auth, error) {
			if (auth) {
				callback(auth);
			} else {
				callback(null, error);
			}
		});
	}
}

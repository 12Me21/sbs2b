window.myself = new Myself();
myself.on('auth',function(){
	$login.style.display = "none";
});
myself.on('logOut', function(){
	$login.style.display = "unset";
});
if (window.localStorage.auth) {
	myself.setAuth(window.localStorage.auth);
}
myself.testAuth();

function register() {
	myself.register($username.value, $password.value, $email.value, function(e) {
		if (e) {
			alert("error while registering: "+e);
		} else {
			alert("register success: check email");
		}
	})
}

function emailConfirm() {
	myself.confirm($key.value, function(e) {
		if (e) {
			alert("failed: "+e);
		}else{
			alert("OK!");
		}
	});
}

function login() {
	myself.logIn($username.value, $password.value, function(e) {
		if (e) {
			alert("log in failed!" +e);
		} else {
	//		alert("log in ok!");
		}
	})
}

function showPost() {
	myself.request("Content?ids="+$id.value,"GET",function(resp, code){
		if (code!=200) {
			alert("error:"+e);
		} else {
			console.log(resp);
			$post.innerHTML = parse(resp[0].content, options);
		}
	});
}

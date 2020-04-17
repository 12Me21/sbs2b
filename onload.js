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
			alert("error:"+resp);
		} else {
			console.log(resp);
			$post.innerHTML = parse(resp[0].content, options);
			$textarea.value = resp[0].content;
			$title.value = resp[0].title;
		}
	});
}

var RANDOMS_MAGIC_PARENT_ID = 5;

function makePost() {
	var method = "POST";
	var url = "Content";
	if ($id.value) {
		url += "/"+$id.value;
		method = "PUT";
	}
	myself.request(url, method, function(resp, code) {
		if (code !=200) {
			alert("Error: "+resp);
		}
	}, {
		title: $title.value,
		content: $textarea.value,
		parentId: RANDOMS_MAGIC_PARENT_ID,
	});
}

function onUpdate() {
	$post.innerHTML = "Preview:<br>"+parse($textarea.value,options2);
}

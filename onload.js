window.myself = new Myself();
myself.register("12​","sand1234","12Me21.mc@gmail.com");
/*myself.logIn("ralsei", "cock1234", function(error) {
	if (error)
		alert("error:"+error);
	else
		alert(this.auth);
});*/

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
			myself.logIn();
		}
	});
}

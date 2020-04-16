window.myself = new Myself();

myself.logIn("ralsei", "cock1234", function(error) {
	if (error)
		alert("error:"+error);
	else
		alert(this.auth);
});

/*login("ralsei", "cock1234", function(auth, error){
	if (auth)
		alert(auth);
	else
		alert("error: "+error);
});*/

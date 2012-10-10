$(document).ready( function(){

	$.getJSON('/ssid', function(data) {
  		var items = [];

		$.each(data, function(key, val) {
    		items.push('<li id="' + key + '">' + val + '</li>');
  		});

		$('.ssid').append(items);
	});


	//Request account
	$('a.submit').click( function(e){
			e.preventDefault();
			submit();
	});

});
	
function submit() {
	var message = {};
	message.user = $('.user').val();
	message.email = $('.email').val();
	message.ssid = $('.ssid').val();
	message.pass= $('.pass').val();

	if(message.user == '' || message.email == '' || message.pass == '') {
		$('.error').show();
	} else {

	$.post('/ssid', message, function(data, err) {
		if(err) console.log('err:' + err)
		console.log('Successful:' + data);
		});
	}
}
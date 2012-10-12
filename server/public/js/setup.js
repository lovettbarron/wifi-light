$(document).ready( function(){

	$.getJSON('/ssid', function(data) {
  		var items = [];
		$.each(data, function(key, val) {
			if(val !== '') {
    		items.push('<option>' + val + '</option>');
    		}
  		});
		console.log("data:" + data)
		$('.ssid').html(items.toString());
	});


	//Request account
	$('a.submit').click( function(e){
			e.preventDefault();
			submit();
	});

	$('a.lumOn').click( function(e){
			e.preventDefault();
			$.getJSON('/lum/255', function(data) {

			});
	});

	$('a.tempOn').click( function(e){
			e.preventDefault();
			$.getJSON('/temp/255', function(data) {

			});
	});

});
	
function submit() {
	var message = {};
	message.owner = $('.user').val();
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
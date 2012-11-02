var drawer = false;
var active = false;

var status = {};

$(document).ready( function(){
	$('.dropdown-toggle').dropdown();
	$('.collapse-toggle').collapse();
	$('#settings').tab('show');

	$('#xypad').css('min-height',$(window).innerHeight()-80);

	$.getJSON('/status', function(data) {
		console.log(data);
		status = data;
		$('.alarmClock').find('.active').removeClass('active');
		$('.alarmClock select').val(data.alarm.time);
		$('.alarmTime').html( data.alarm.time + ":00" );


	$('#xypad').css({
			'background-color' : getColor(status.lamp.temp,status.lamp.lum/255)
		});

		var string = (lum * temp / 100) + 'watts/hour';
		if(e.pageY > buffer + 40) {
			$('#lens').css( {
				'left' : e.pageX-50
				, 'top' : e.pageY-buffer*2
				, 'background-image': 'radial-gradient(center center, 60px 70px, rgba(0,0,0,.1), rgba(0,0,0,.6));'
			}).html(string);
		}


		});

	openDrawer(false);

	$('a.setAlarm').click( function(e) {
		e.preventDefault;
		console.log("Saving alarm time");
		var alarmTime = $('.alarmClock select').val();
		$.getJSON('/alarm/' + alarmTime, function(data) {
			console.log(data);
		});
		$('.alarmTime').html( alarmTime + ":00" );
	})


	$('#xypad').mousemove( function(e) {
		var buffer = 80;
		if( e.pageY >= buffer-$(window).innerHeight())
			var lum = 255-Math.floor(255 * ( ( e.pageY)/ $(window).innerHeight()));
		else var lum = 0;
		var temp =  Math.floor(255 * ( e.pageX / $(window).innerWidth()));



		if(lum < 0) {
			lum = 0;
			ative = false
		} else {
			active = true;
		}

		changeColor(temp, lum);



		$(this).css({
			'background-color' : getColor(temp,lum/255)
		});

		var string = (lum * temp / 100) + 'watts/hour';
		if(e.pageY > buffer + 40) {
			$('#lens').css( {
				'left' : e.pageX-50
				, 'top' : e.pageY-buffer*2
				, 'background-image': 'radial-gradient(center center, 60px 70px, rgba(0,0,0,.1), rgba(0,0,0,.6));'
			}).html(string);
		}

	});



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


	$('a.drawer').click( function(e) {
		if(drawer == true) drawer = false;
		else drawer = true;
		openDrawer(drawer);
	})

	//Request account
	$('a.submit').click( function(e){
			e.preventDefault();
			submit();
	});

	$('a.lumOn').click( function(e){
			e.preventDefault();
			$.getJSON('/lum/255', function(data) {
				console.log(data);
			});
	});

	$('a.tempOn').click( function(e){
			e.preventDefault();
			$.getJSON('/temp/255', function(data) {
				console.log(data);
			});
	});

});
	
function openDrawer(open) {
	if( open == true ) {
		$('#drawer').slideDown()
	} else {
		$('#drawer').slideUp();
	}
}


function changeColor(temp, lum) {
		$.getJSON('/temp/' + temp, function(data) {
				console.log(data);
			});


		$.getJSON('/lum/' + lum, function(data) {
					console.log(data);
				});
}


function getColor(temp, lum) {
	var color;
	if( lum <= 0. ) {
		color = 'rgba(0,0,0,1.)';	
	} else
	if(temp < 127) {
		color = 'rgba(50,0,' + Math.floor( 255- (250 * (temp / 255))) + ',' + (1-lum) + ')';
	} else {
		color = 'rgba(' + Math.floor(200 * (temp / 255) ) + ',0,' + Math.floor(250 * (temp / 255)) + ',' + (1-lum) + ')';
	}
	console.log(color)
	return color;
}


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
var drawer = false;
var active = false;
var lum, temp;
var status = {};

$(document).ready( function(){
	init();
	$('#xypad').css( 'height', $(window).height()-50 );
	$('.dropdown-toggle').dropdown();
	$('ul#settings').find('li:first').addClass('active');
	$('.collapse-toggle').collapse();
	$('#settings').tab('show');

	$('#xypad').css('min-height',$(window).innerHeight()-80);

	$.getJSON('/status', function(data) {
		console.log(data);
		if(data)
			status = data;
		$('.alarmClock').find('.active').removeClass('active');
		$('.alarmClock select').val(data.alarm.time);

		$.each(status.preset, function() {
			$('.presets').append('<li>' + this.name + "</li>");
		})

		if(data.alarm.on)
			$('.alarmTime').html( "Wakeup at " + data.alarm.time + ":00" );


		if(status.network.ssid == '') {
			openDrawer(true);
		}

		$('#xypad').css({
			'background-color' : getColor(status.lamp.temp,status.lamp.lum/255)
		});

		var string = Math.round(( (lum/255) + (temp/255) ) * 20);
		if(e.pageY > buffer + 40) {
			$('#lens').css( {
				'left' : e.pageX-50
				, 'top' : e.pageY-buffer*2
				//, 'background-image': 'radial-gradient(center center, 60px 70px, rgba(0,0,0,.1), rgba(0,0,0,.6));'
			});//.html(string);
		$('.energy').html(string + " watts per hour")
		}


	});


		openDrawer(false);
	

	$('a.setAlarm').click( function(e) {
		e.preventDefault;
		console.log("Saving alarm time");
		var alarmTime = $('.alarmClock select').val();
		$.getJSON('/alarm/' + alarmTime, function(data) {
			console.log(data);
			openDrawer(false);
			$('.alarmTime').html( "Wakeup at " + alarmTime + ":00" );
		});
	})


	$('#xypad').mousemove( function(e) {
		var buffer = 40;
		// if( e.pageY <= $(window).innerHeight()-100)
		// 	var lum = 255-Math.floor(255 * ( ( e.pageY)/ ($(window).innerHeight()-100)));
		// else var lum = 0;
		// var temp =  Math.floor(255 * ( e.pageX / $(window).innerWidth()));

		var x = 1 - (e.pageX / $('#xypad').innerWidth());
		var y = 1- (e.pageY / $('#xypad').innerHeight());


		// if(lum < 0) {
		// 	lum = 0;
		// 	ative = false
		// } else {
		// 	active = true;
		// }
		// if(x <= .5) { // Brightness
		// 	changeColor(0, y*255);
		// 	lum = y*255;
		// 	//temp = 0;
		// } else { // Temp
		// 	changeColor(y*255, y*255);
		// 	temp = y*255;
		// 	lum = y*255;
		// }

		lum = y * 255;
		temp = x * 255;



		changeColor(temp, lum);



		// $(this).css({
		// 	'background-color' : getColor(temp,lum/255)
		// });

		var string = ( (y + x) * 20).toFixed(2);
			if(e.pageY > buffer + 40) {
			$('#lens').css( {
				'left' : e.pageX-50
				, 'top' : e.pageY-buffer*2
				//, 'background-image': 'radial-gradient(center center, 60px 70px, rgba(0,0,0,.1), rgba(0,0,0,.6));'
			});
			$('.energy').html(string + " watts per hour")
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


	$('.drawer').click( function(e) {
		
		if(drawer == true) drawer = false;
		else drawer = true;
		openDrawer(drawer);
	})

	//Request account
	$('a.submit').click( function(e){
			e.preventDefault();
			console.log("Submitting account")
			submit();
			openDrawer(close);
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


// Listens for server events
setInterval(function(){
	$.getJSON('/lightState', function(data) {
		console.log(data);
		lum = data.lum;
		temp = data.temp;

		var string = (((lum/255) + (temp/255)) * 20).toFixed(2);
		$('.energy').html(string + " watts per hour")
		
	})
},500)
});
	
function openDrawer(open) {
	if( open == true ) {
		$('#drawer').slideDown()
	} else {
		$('#drawer').slideUp();
	}
}


function changeColor(temp, lum) {


		$.getJSON('/temp/' + Math.round(temp), function(data) {
				console.log(data);
			});

		$.getJSON('/lum/' + Math.round(lum), function(data) {
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
	//console.log(color)
	return color;
}


function submit() {
	var message = {};
	message.owner = $('.user').val();
	message.email = $('.email').val();
	message.ssid = $('.ssid option:selected').val();
	message.pass= $('.pass').val();

	console.log(message.ssid + ' ' + message.pass);

	if(message.pass == '') {
		console.log('no password')
		$('.error').show();
	} else {

	$.post('/config/' + 'wpa' + '/' + message.ssid + '/' + message.pass, message, function(data, err) {
		if(err) console.log('err:' + err)
		console.log('Successful:' + data);
		});
	}
}

function touchHandler(event)
{
 var touches = event.changedTouches,
    first = touches[0],
    type = "";

     switch(event.type)
{
    case "touchstart": type = "mousedown"; break;
    case "touchmove":  type="mousemove"; break;        
    case "touchend":   type="mouseup"; break;
    default: return;
}
var simulatedEvent = document.createEvent("MouseEvent");
simulatedEvent.initMouseEvent(type, true, true, window, 1,
                          first.screenX, first.screenY,
                          first.clientX, first.clientY, false,
                          false, false, false, 0/*left*/, null);

first.target.dispatchEvent(simulatedEvent);
event.preventDefault();
}

function init()
{
   document.addEventListener("touchstart", touchHandler, true);
   document.addEventListener("touchmove", touchHandler, true);
   document.addEventListener("touchend", touchHandler, true);
   document.addEventListener("touchcancel", touchHandler, true);    
}

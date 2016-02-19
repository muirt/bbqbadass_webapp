var socketaddyLocal= "ws://192.168.0.2:9001";


var socketaddyInternet = "ws://beaglebone-todd.ddns.net:9001";
var sock;			
var lastOutputMode = $('#output_control_auto_manual_slider').attr("value");
var debug_list = [];
var autoVisible = true;
var confirmedObjectList = []
var confirmtedMenu;		

function selectorize(name)
{	
	return name.toLowerCase().replace(' ', '_');
}

function showMenu(menuName)
{				
	menuName = '#' + menuName;
	var slideout = $(menuName);
	var slideoutWidth = $(menuName).width();
	slideout.toggleClass("open");			
	if (slideout.hasClass("open")) {
		slideout.animate({
			left: "0px"
		});	
	} else {
		slideout.animate({
			left: -(slideoutWidth + 20)
		}, slideoutWidth);	
	}
}

function fanLED(color)
{
	var colorCode = "#FF0000";
	var canvas = document.getElementById("output_state_graphic");
	var context = canvas.getContext("2d");
	if(color == "green")
	{
		colorCode = "#00FF00"
	}	
	context.fillStyle = colorCode;
	context.arc(50, 50, 50, 0, Math.PI * 2, false);
	context.fill()
}

function setTempUnit(unit)
{
	$('#output_control_set_point_unit').text(unit);	
	$('#current_temperatures_readouts_1_temperature_unit').text(unit);
	$('#current_temperatures_readouts_2_temperature_unit').text(unit);
}

function debug(message)
{
	debug_list.push(message)
	var count = 0;
	var debug_text = "";
	debug_list.forEach(function(line){
		debug_text += count + ':'+ line +  '\n';
		count += 1;   
	});
	
	if(count >7)
	{
		debug_list = debug_list.slice(count-7,count);
	}
	//$("#debug_string").text(debug_text);
}

function sendCommand(command)
{
	sock.send(JSON.stringify(command));
}

function handleMessage(evt)
{
	var messageString = evt.data;			
	if(messageString.indexOf('{') == 0)
	{			
		var noSingleQuotes = messageString.replace(/'/g, '"');				
		var messageObject = JSON.parse(noSingleQuotes);
		var keys = Object.keys(messageObject);
		
		displayConnected();
		
		if(keys.indexOf('secret') != -1 && keys.indexOf('target') != -1 && keys.indexOf('value') !=-1)
		{				
			if(messageObject.secret == 'badass')
			{					
				switch(messageObject.target)
				{			
					case "periodic_update":							
						var updateObject = messageObject.value;
						var updateKeys = Object.keys(updateObject);						
						if(updateKeys.indexOf('input') != -1) 
						{	
							if(updateObject.input.length > 1)
							{
								$("#current_temperatures_readouts_1_temperature_value").text(updateObject.input[0].value);
								$("#current_temperatures_readouts_2_temperature_value").text(updateObject.input[1].value);									
							}
						}
						if(updateKeys.indexOf('set_point') != -1) 
						{															
							$("#output_control_set_point_value").text(updateObject.set_point);								
						}
						if(updateKeys.indexOf('control_style') != -1)
						{
							if(updateObject.control_style == "Manual")
							{
								$("#fan_label").text("Fan (Manual)");
							}
							else
							{
								$("#fan_label").text("Fan (Auto)");
							}							
						}
						if(updateKeys.indexOf('temp_unit') != -1) 
						{
							setTempUnit(updateObject.temp_unit);
						}
						if(updateKeys.indexOf('cook_time') != -1) 
						{
							$("#cook_time_string").text(updateObject.cook_time);
						}
						if(updateKeys.indexOf('output_state') != -1) 
						{
							if(updateObject.output_state=="on")
							{
								fanLED("green");
							}
							else if(updateObject.output_state=="off")
							{
								fanLED("red");
							}								
						}							
						break;
					case "initial_update":						
						var updateObject = messageObject.value;
						var updateKeys = Object.keys(updateObject);							
						if(updateKeys.indexOf('set_point_value') != -1) 
						{
							$("#output_control_set_point_value").text(updateObject.set_point_value);
						}							
						break;	
					case "control_menu":							
						$('#hysteresis_input').val(messageObject.value.hysteresis);
						break;					
				}				
			}
		}
	}
} 

function displayError()
{
	$("#connected_label").text("Not Connected");	
	$("#connected_label").css({ 'color': 'red'});
}

function displayConnected()
{
	$("#connected_label").text("Connected");
	$("#connected_label").css({ 'color': 'lightgreen'});
}


$(document).ready(function(){		
	$('#output_controls_auto').toggleClass("open");
	
	var localSock = new WebSocket(socketaddyLocal);
	var internetSock = new WebSocket(socketaddyInternet);
	
	
	localSock.onopen = function(){ 
		sock = localSock;
		displayConnected();
	};

	localSock.onclose = function(){
		displayError();
	};
	
	internetSock.onclose = function(){
		displayError();
	};
	
	localSock.onerror = function(){
		//displayError();
	};
		
	internetSock.onopen = function(){
		sock = internetSock;
		displayConnected();
	};

	internetSock.onerror = function(){
		//displayError();
	 };
	
	internetSock.onmessage = function(evt){ 
		handleMessage(evt);
	}; 
	 
	localSock.onmessage = function(evt){ 
		handleMessage(evt);
	}; 

	 $("#header_button").touchstart(function(){ 
		event.preventDefault();
		if($('#slideout_menu').hasClass("open") == false)
		{		
			showMenu('slideout_menu');						
		}
	});			

	
	
	$('#slideout_menu .toggle').touchend(function(){
		event.preventDefault();	
		showMenu('slideout_menu');
	});
	
	$('#set_point_decrease').touchstart(function(){
		event.preventDefault();
		var command = new Object();
		command.set_point="down";
		sendCommand(command);
	});
	
	$('#set_point_increase').touchstart(function(){
		event.preventDefault();
		var command = new Object();
		command.set_point="up";
		sendCommand(command);	
	});
	
	$('#fan_control_auto').touchstart(function(){
		event.preventDefault();
		var command = new Object();
		command.output_mode="auto";
		sendCommand(command);
	});
	
	$('#fan_control_on').touchstart(function(){
		event.preventDefault();
		var command = new Object();
		command.output_mode="on";
		sendCommand(command);
	});
	
	$('#fan_control_off').touchstart(function(){
		event.preventDefault();
		var command = new Object();
		command.output_mode="off";
		sendCommand(command);
	});
	
	$("#control-options").touchend(function(){	
		event.preventDefault();				
		var command = new Object();
		command.menu_request="control";
		sendCommand(command);			
		showMenu('slideout_control_options');		
	});					

	$("#slideout_control_options .toggle").touchend(function(){
		event.preventDefault();							
		showMenu('slideout_control_options');			
	});
	
	$('#hysteresis_input').bind('change', function(e) 
	{
		var command = new Object();
		command.hysteresis_set= $(this).val();
		sendCommand(command);	
	}); 
	
});
 
	

 
	


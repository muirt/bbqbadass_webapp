socketaddyLocal = "ws://192.168.1.149:9001";
socketaddyInternet = "ws://beaglebone-todd.ddns.net:9001";
var sock;			
var saved_logs_list = [];
var saved_logs_list_index = 0;
var plot;
var masterDataset;
var graphWindow;
var masterWindow;
var isZooming = false;
var isPanning = false;
var relativeScale = 1.0;
var lastTouchPosition = { x: -1, y: -1 };
var lastTouchDistance = 0;
var relativeOffset = 0;
var lastRelativeOffset = 0;

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

function listSavedLogs(current_index)
{
	$("#saved_recordings_list").empty();
	var index;

	if(saved_logs_list.length == 1)
	{
		if(saved_logs_list[0] == "empty")
		{
			$('#saved_recordings_list').append('<li><a >No Saved Logs</a></li>');
			return;
		}
	}

	for(index = current_index; index < current_index + 3 && index < saved_logs_list.length; index++)
	{
		if(saved_logs_list[index].name.length > 0)
		{
			
			var log_entry_list = saved_logs_list[index].name.split("_");
			var link_selector = selectorize(log_entry_list[0] + log_entry_list[1] + "_" + log_entry_list[2]);
			$('#saved_recordings_list').append('<li><a id="' + link_selector +'">' + log_entry_list[0] + ' ' + log_entry_list[1] + '</a></li>');
			debug(log_entry_list[0] + ' ' + log_entry_list[1]);
			
			$('#' + link_selector).touchend(function(){
				
				var command = new Object();
				command.show_saved_log = $(this).attr('id');
				sendCommand(command);				
				showMenu('slideout_saved_recording');							
			});
		}
	}
	saved_logs_list_index = index;
	if(current_index > 0)
	{
		$('#saved_recordings_list').append('<li><a id="backSavedLogs">Back...</i></a></li>');
		$('#backSavedLogs').touchend(function(){
			listSavedLogs(current_index - 3)
		});
	}
	if(index < saved_logs_list.length)
	{
		$('#saved_recordings_list').append('<li><a id="moreSavedLogs">More...</i></a></li>');
		$('#moreSavedLogs').touchend(function(){
			listSavedLogs(saved_logs_list_index)
		});
	}
	else
	{
		saved_logs_list_index = 0;
	}
}



function debug(message)
{
	/*
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
	*/
}

function sendCommand(command)
{	
	sock.send(JSON.stringify(command));
}

function graph(dataset)
{
	
	var xAxisVals = [];
	var minX = 0;
	var maxX = 0;
	
	var yAxisVals = [];
	var minY = 0;
	var maxY = 0;
	var j;
	var dataSeriesList = [];
	var points = 0;
	
	for(var i=0;i<dataset.graphData.length; i++)
	{		
		var dataToGraph = new Object();
		dataToGraph.data = new Array([]);
		
		for (j = 0; j < dataset.graphData[i].data.length; j++) 
		{
			var x = dataset.graphData[i].data[j][0];
			var y = dataset.graphData[i].data[j][1];	
			if(dataset.graphData[i].data[j][2] == 1)
			{					
				dataToGraph.data[j] = [x,y];
				xAxisVals[points] = x;				
				points++;
			}
			//xAxisVals[j] = x;
			yAxisVals[j] = y;	
		}	
		if(i > 0)
		{
			xAxisVals[points] = minX;
			xAxisVals[points+1] = maxX;
			yAxisVals[j] = minY;
			yAxisVals[j+1] = maxY;
		}
		minX = Math.min.apply(Math, xAxisVals);
		maxX = Math.max.apply(Math, xAxisVals);	
		minY = Math.min.apply(Math, yAxisVals);
		maxY = Math.max.apply(Math, yAxisVals);
			
		dataToGraph.label = dataset.graphData[i].label;	
		dataSeriesList.push(dataToGraph);
	}	

	var range = maxX-minX;
	var xIncrement;
	
	if(range <5) 
	{
		xIncrement = 1;
	}
	else if(range < 9)
	{
		xIncrement = 2;
	}
	else if(range <25)
	{
		xIncrement = 5;
	}
	else if(range <50)  
	{
		xIncrement = 10;
	}
	else if(range <75)  
	{
		xIncrement = 15;
	}
	else if(range <150) 
	{
		xIncrement = 30;
	}
	else
	{
		xIncrement = 60 * Math.floor(range/150);
	}
	
	var round = 25;
	var maxTicks = 5;
	maxY += 10;
	minY -= 5;
   var yRangeRound =50;
	//var yRangeRound = round * Math.ceil(((maxY-minY)/maxTicks) / round);	

	$('#graph_label').text("Graph: " + dataset.title);

	$.plot("#placeholder", dataSeriesList, {
		xaxis: {
					tickSize: xIncrement,
					tickFormatter: function (val, axis) {
						var minutes = (parseInt(val)%60).toFixed(0);
						var hours = (parseInt(val/60)).toFixed(0);
						var tickString = "";
						if(true)
						{
							tickString = hours + "h" + minutes + "m";
						}
						else
						{
							tickString = "";
						}
						return tickString;
					},
					font:{
							  size:30,
							  weight:"normal",
							  family:"arial",
							  variant:"small-caps",
							  color: "#fff"
					}
				},
		yaxis: {		
					tickSize: yRangeRound,
					tickFormatter: function (val, axis) {
						var tickString = val + " F";
						return tickString;
					},
					min: minY,
					max: maxY,
					font:{
					  size:30,					  
					  weight:"normal",
					  family:"arial",
					  variant:"small-caps",
					  color: "#fff"
					}
				},
		legend: { 
					noColumns: 2,       			
       				container: $("#graph_legend")
    			}
	});
}



function windowDataset(dataset, window)
{				
	for(var i=0;i<dataset.graphData.length; i++)
	{		
		var points = 0;
		for (var j = 0; j < dataset.graphData[i].data.length; j++) 
		{			
			var x = dataset.graphData[i].data[j][0];
			var y = dataset.graphData[i].data[j][1];			
			if(x >= window.xMin && x <= window.xMax && y >= window.yMin && y <= window.yMax)
			{				
				dataset.graphData[i].data[j][2] = 1;				
			}
			else
			{
				dataset.graphData[i].data[j][2] = 0;
				points++;
			}
		}
				
	}		
	
	return dataset
}

function panWindow(window, panAmount)
{
	var panSign = 1;
	
	if(panAmount < 0)
	{
		panSign = -1;
	}
	
	if(window.xMax - window.xMin < Math.abs(panAmount))
	{
		panAmount = panSign*(window.xMax - window.xMin);
	}

	if(window.xMin - panAmount >= masterWindow.xMin && window.xMax - panAmount <= masterWindow.xMax)
	{
		
		window.xMin -= panAmount;
		window.xMax -= panAmount;
		
	}
	else if(window.xMin - panAmount < masterWindow.xMin)
	{
		window.xMax = masterWindow.xMin + window.xMax - window.xMin;
		window.xMin = masterWindow.xMin;
		
	}
	else if(window.xMax - panAmount > masterWindow.xMax)
	{
		window.xMin = masterWindow.xMax - (window.xMax - window.xMin);
		window.xMax = masterWindow.xMax;
		
	}
	
	return window;
}

function scaleWindow(window, scale)
{
	var rangeX = window.xMax - window.xMin;
	var midX = window.xMin + rangeX/2;
			
	var scaledRangeX = rangeX / scale;
	
	if(scaledRangeX > 4)
	{	
		window.xMin = parseInt((midX - scaledRangeX/2).toFixed(0));
		window.xMax = parseInt((midX + scaledRangeX/2).toFixed(0));
	}
	
	if(window.xMin < masterWindow.xMin)
	{
		window.xMin = masterWindow.xMin;
	}
	
	if(window.xMax > masterWindow.xMax)
	{
		window.xMax = masterWindow.xMax;
	}
	
	return window;	
}

function findWindow(dataset)
{
	var window = new Object();
	window.xMin = 0;
	window.xMax = 0;
	window.yMin = 0;
	window.yMax = 0;
	var xAxisVals = [];
	var yAxisVals = [];
	var offset = 0;
	
	for(var i=0;i<dataset.graphData.length; i++)
	{		
		for (j = 0; j < dataset.graphData[i].data.length; j++) 
		{
			xAxisVals[j+offset] = dataset.graphData[i].data[j][0];
			yAxisVals[j+offset] = dataset.graphData[i].data[j][1];
		}	
		offset += j		
		
	}
	
	window.xMin = Math.min.apply(Math, xAxisVals);
	window.xMax = Math.max.apply(Math, xAxisVals);	
	window.yMin = Math.min.apply(Math, yAxisVals);
	window.yMax = Math.max.apply(Math, yAxisVals);	

	return window;
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



function handleGraphTouchStart(evt)
{	
	var touches = evt.originalEvent.touches;
	
	if(touches.length == 1)
	{
		isPanning = true;
		lastTouchPosition = touches[0].pageX;
		lastTouchDistance = 0;
	}
	else if (touches.length === 2) {
		isZooming = true;
		lastTouchPosition = {
			x: (touches[0].pageX + touches[1].pageX) / 2,
			y: (touches[0].pageY + touches[1].pageY) / 2
		};
		lastTouchDistance = Math.sqrt(Math.pow(touches[1].pageX - touches[0].pageX, 2) + Math.pow(touches[1].pageY - touches[0].pageY, 2));
	}
}

function handleGraphTouchMove(evt)
{
	var position, distance, delta;
	var touches = evt.originalEvent.touches;
	
	if(isPanning && touches.length == 1)
	{
		position = touches[0].pageX;
		
		delta = lastTouchPosition - position;
				
		panGraph(delta);
		
		lastTouchPosition = position;
		lastTouchDistance = 0;
	}
	else if (isZooming && touches.length === 2) {
		distance = Math.sqrt(Math.pow(touches[1].pageX - touches[0].pageX, 2) + Math.pow(touches[1].pageY - touches[0].pageY, 2));
		position = {
			x: (touches[0].pageX + touches[1].pageX) / 2,
			y: (touches[0].pageY + touches[1].pageY) / 2
		};
		delta = distance - lastTouchDistance;
		
		// Scale via the delta
		scalegraph(delta);
		
		lastTouchPosition = position;
		lastTouchDistance = distance;
	}
}

function panGraph(delta)
{
	relativeOffset -= (delta/relativeScale) * 0.1;
}

function scalegraph(delta)
{
	relativeScale *= 1 + (delta / 750);
	
    $(".flot-base").css('-webkit-transform', 'scaleX(' + relativeScale + ')');
}

function handleGraphTouchEnd(evt)
{
	var windowedDataset;
	if(isZooming)
	{		
		graphWindow = scaleWindow(graphWindow, relativeScale);
		relativeScale = 1;
		masterDataset = windowDataset(masterDataset, graphWindow);					
		graph(masterDataset);
		$(".flot-base").css('-webkit-transform', 'scaleX(1)');
	}
	else if(isPanning)
	{		
		
		graphWindow = panWindow(graphWindow, relativeOffset);
		relativeOffset = 0;	
		masterDataset = windowDataset(masterDataset, graphWindow);					
		graph(masterDataset);			
		$(".flot-base").css('-webkit-transform', 'scaleX(1)');
	}
	isZooming = false;
	isPanning = false;
}

$(document).bind('orientationchange', function(evt) {
	if($('#slideout_graph').hasClass("open"))
	{
		graph(masterDataset);
	}	
});

function handleMessage(evt)
{
	var messageString = evt.data;			
	if(messageString.indexOf('{') == 0)
	{			
		var noSingleQuotes = messageString.replace(/'/g, '"');				
		var messageObject = JSON.parse(noSingleQuotes);
		var keys = Object.keys(messageObject);
				
		
		if(keys.indexOf('secret') != -1 && keys.indexOf('target') != -1 && keys.indexOf('value') !=-1)
		{				
			if(messageObject.secret == 'badass')
			{											
				switch(messageObject.target)
				{			
					case "graph_data":		
						masterDataset = JSON.parse(JSON.stringify(messageObject.value));
						for(var i=0;i<masterDataset.graphData.length; i++)
						{
							masterDataset.graphData[i].data = JSON.parse(masterDataset.graphData[i].data.replace(/\"/g, ''));
						}
						graphWindow = findWindow(masterDataset);
						masterWindow = findWindow(masterDataset);
						graph(masterDataset);
						break;	
					case "saved_logs":	
						saved_logs_list = messageObject.value;
						listSavedLogs(0);
						break;
					case "saved_recording_details":													
						$('#saved_recording_name').text(messageObject.value.name);
						$('#saved_recording_date').text(messageObject.value.start_date);		
						$('#saved_recording_duration').text(messageObject.value.time);							
						break;	
					case "current_recording_details":	
						if(messageObject.value.name == "")
						{
							$("#no_current_recording").css("visibility", "visible");
							$("#current_recording_details").css("visibility", "hidden");
						}
						else
						{ 							
							$("#no_current_recording").css("visibility", "hidden");
							$("#current_recording_details").css("visibility", "visible");					
							$('#current_recording_name').text(messageObject.value.name);
							$('#current_recording_duration').text(messageObject.value.time);
						}
						break;
					case "recording_already_exists":
						alert("error" );
						break;	
				}				
			}
		}
	}
	
} 


$(document).ready(function(){		
	
	var confirmedMessage;
	var localSock = new WebSocket(socketaddyLocal);
	var internetSock = new WebSocket(socketaddyInternet);	
	var previousMenu;
	var scale = 1;
	localSock.onopen = function(){ 
		sock = localSock;
		displayConnected();
	};

	localSock.onerror = function(){
		displayError();
	};	
	 
		
	internetSock.onopen = function(){
		sock = internetSock;
		displayConnected();
	};

	internetSock.onerror = function(){
		displayError();
	 };
	
	internetSock.onmessage = function(evt){ 
		handleMessage(evt);
	}; 
	 
	localSock.onmessage = function(evt){ 
		handleMessage(evt);
	}; 
	
	
	 $("#back_button").touchend(function(){ 
	
		window.location.href="/smokernew/index.html";			
	});			

	$("#current_recording").touchend(function(){
	
		if($('#slideout_current_recording').hasClass("open") == false)
		{	
			var command = new Object();
			command.show_current_log = "please";
			sendCommand(command);	
			showMenu('slideout_current_recording');						
		}
	});
	
	$("#new_recording").touchend(function(){
		
		if($('#slideout_new_recording').hasClass("open") == false)
		{		
			$(new_recording_name_input).val("");
			showMenu('slideout_new_recording');						
		}
	});
	
	$("#saved_recording").touchend(function(){
	
		if($('#slideout_show_saved_recordings').hasClass("open") == false)
		{		
			var command = new Object();
			command.menu_request="list_saved_logs";
			sendCommand(command);
			showMenu('slideout_show_saved_recordings');						
		}
	});

	$("#slideout_current_recording .toggle").touchend(function(){
	
		showMenu('slideout_current_recording');
	});
	
	$("#slideout_new_recording .toggle").touchend(function(){
		document.activeElement.blur();
		showMenu('slideout_new_recording');
	});
	
	$("#slideout_show_saved_recordings .toggle").touchend(function(){
		
		showMenu('slideout_show_saved_recordings');
	});
	
	$("#slideout_saved_recording .toggle").touchend(function(){
		var command = new Object();
		command.menu_request="list_saved_logs";
		sendCommand(command);
		showMenu('slideout_saved_recording');		
	});
	
	
	$("#slideout_confirm .toggle").touchend(function(){
		
		showMenu('slideout_confirm');
	});
	
	
	$("#slideout_graph .toggle").click(function(){
				
		showMenu('slideout_graph');		
	});

	$("#current_recording_delete_button").touchend(function()
	{
		confirmedMessage = new Object();
		confirmedMessage.delete_log="current";
		if($('#slideout_confirm').hasClass("open") == false)
		{		
			previousMenu = "slideout_current_recording";
			showMenu('slideout_confirm');						
		}	
	});

	$("#current_recording_finish_button").touchend(function()
	{		
		confirmedMessage = new Object();
		confirmedMessage.finish_current_log="please";
		if($('#slideout_confirm').hasClass("open") == false)
		{		
			previousMenu = "slideout_current_recording";
			showMenu('slideout_confirm');						
		}		
	});
	
	$("#saved_recording_graph_button").touchend(function(){
		
		var command = new Object();
		command.graph_log=$('#saved_recording_name').text() + $('#saved_recording_date').text();
		sendCommand(command);	
		showMenu('slideout_graph');			

	});

	$("#current_recording_graph_button").touchend(function()
	{
		showMenu('slideout_graph');
		var command = new Object();
		command.graph_log = "current";
		sendCommand(command);				
	});
	
	$("#graph_title").touchstart(function(){
		
		
		var windowedDataset = windowDataset(masterDataset, window);
		
		oldgraph(windowedDataset);
	});
	
	
	
	$("#saved_recording_delete_button").touchstart(function()
	{
		confirmedMessage = new Object();
		confirmedMessage.delete_log=$('#saved_recording_name').text() + $('#saved_recording_date').text();
		if($('#slideout_confirm').hasClass("open") == false)
		{		
			previousMenu = "slideout_saved_recording";
			showMenu('slideout_confirm');						
		}	
	});
	
			
	$("#new_recording_start_button").touchstart(function()
	{
		confirmedMessage = new Object();
		confirmedMessage.create_new_log = $(new_recording_name_input).val();
		if($('#slideout_confirm').hasClass("open") == false)
		{		
			previousMenu = "slideout_new_recording";
			showMenu('slideout_confirm');	
			document.activeElement.blur();					
		}
	});
	
	
	$("#placeholder").bind('touchstart', function(evt) {
		
		handleGraphTouchStart(evt);
	});
	
	$("#placeholder").bind('touchmove', function(evt) {
		
		handleGraphTouchMove(evt);
	});
	
	$("#placeholder").bind('touchend', function(evt) {
		
		handleGraphTouchEnd(evt);
	});
	
	$("#confirm_yes_label").touchstart(function()
	{
		if(confirmedMessage != null)
		{
			sendCommand(confirmedMessage);
			//confirmedMessage = null;
		}
		showMenu('slideout_confirm');
		showMenu(previousMenu);
	});
	
	$("#confirm_no_label").touchstart(function()
	{
		confirmedMessage = null;
		showMenu('slideout_confirm');
	});
	
});

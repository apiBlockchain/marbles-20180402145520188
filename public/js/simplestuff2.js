/* global formatDate */
/* global nDig */
/* global randStr */
/* global bag */
/* global $ */
var ws = {};
var user = {username: 'bob'};

// =================================================================================
// On Load
// =================================================================================
$(document).on('ready', function() {
	connect_to_server();
	
	// =================================================================================
	// jQuery UI Events
	// =================================================================================
	$("#submit").click(function(){
		console.log('creating marble');
		var obj = 	{
						type: "create",
						name: $("input[name='name']").val(),
						color: $("select[name='color']").val(),
						size: $("select[name='size']").val(),
						user: $("select[name='user']").val(),
						v: 2
					};
		ws.send(JSON.stringify(obj));
		showAdminPanel();
		return false;
	});
	
	$(document).on("click", ".ball", function(){
		if($(this).hasClass("selectedball")){
			$(this).removeClass("selectedball");
		}
		else{
			$(".selectedball").removeClass("selectedball");
			$(this).addClass("selectedball");
		}
	});
	
	$("#adminLink").click(function(){
		showAdminPanel();
	});

	$("#createLink").click(function(){
		$("#contentPanel").removeClass("adminview").removeClass("tradeview").addClass("createview");
		$("#createView").fadeIn(300);
		$("#adminView").hide();
		$("#tradeView").hide();
		$("input[name='name']").val('r' + randStr(6));
	});
	
	$("#tradeLink").click(function(){
		$("#contentPanel").removeClass("adminview").removeClass("createview").addClass("tradeview");
		$("#tradeView").fadeIn(300);
		$("#adminView").hide();
		$("#createView").hide();
	});
	
	$("#transferright").click(function(){
		transfer('leroy');
	});
	
	$("#transferleft").click(function(){
		transfer('bob');
	});
	
	$("#removemarble").click(function(){
		var id = $(".selectedball").attr("id");
		if(id){
			console.log('removing', id);
			var obj = 	{
							type: "remove",
							name: id,
							v: 2
						};
			ws.send(JSON.stringify(obj));
			//$(".selectedball").removeClass("selectedball");
			showAdminPanel();
		}
	});
	
	$("#logIn").click(function(){										//drop down for login
		if($("#userSelect").is(":visible")){
			$("#userSelect").fadeOut();
		}
		else{
			$("#userSelect").fadeIn();
		}
	});
	
	$(".username").click(function(){									//log in as someone else
		var name = $(this).html();
		user.username = name.charAt(0).toUpperCase() + name.slice(1);
		$("#loggedInName").html("Hi, " + user.username);
		$("#userSelect").fadeOut(300);
	});
	
	$("#setupTradeButton").click(function(){
		$("#openTrades").fadeOut();
		$("#createTrade").fadeIn();
	});
	
	$("#viewTradeButton").click(function(){
		$("#openTrades").fadeIn();
		$("#createTrade").fadeOut();
	});
	
	
	// =================================================================================
	// Helper Fun
	// ================================================================================
	//show admin panel page
	function showAdminPanel(){
		$("#contentPanel").removeClass("createview").removeClass("tradeview").addClass("adminview");
		$("#adminView").fadeIn(300);
		$("#createView").hide();
		$("#tradeView").hide();
	}
	
	//transfer selected ball to user
	function transfer(user){
		var marbleName = $(".selectedball").attr("id");
		if(marbleName){
			console.log('transfering', marbleName);
			var obj = 	{
							type: "transfer",
							name: marbleName,
							user: user,
							v: 2
						};
			ws.send(JSON.stringify(obj));
			showAdminPanel();
		}
	}
	
	//format datetime
	function formatDate(date) {
		var hours = date.getHours();
		var minutes = date.getMinutes();
		var ampm = hours >= 12 ? 'pm' : 'am';
		hours = hours % 12;
		hours = hours ? hours : 12; // the hour '0' should be '12'
		minutes = minutes < 10 ? '0'+minutes : minutes;
		var strTime = hours + ':' + minutes + ' ' + ampm;
		return date.getMonth()+1 + "/" + date.getDate() + "/" + date.getFullYear() + "  " + strTime;
	}
});


// =================================================================================
// Socket Stuff
// =================================================================================
function connect_to_server(){
	connect();
	function connect(){
		var wsUri = "ws://" + bag.setup.SERVER.EXTURI;
		ws = new WebSocket(wsUri);
		ws.onopen = function(evt) { onOpen(evt); };
		ws.onclose = function(evt) { onClose(evt); };
		ws.onmessage = function(evt) { onMessage(evt); };
		ws.onerror = function(evt) { onError(evt); };
	}
	
	function onOpen(evt){
		console.log("WS CONNECTED");
		ws.send(JSON.stringify({type: "get", v:2}));
		ws.send(JSON.stringify({type: "chainstats", v:2}));
	}

	function onClose(evt){
		console.log("WS DISCONNECTED", evt);
		setTimeout(function(){ connect(); }, 5000);					//try again one more time, server restarts are quick
	}

	function onMessage(msg){
		try{
			var data = JSON.parse(msg.data);
			console.log('rec', data);
			if(data.marble){
				build_ball(data.marble);
			}
			else if(data.msg === 'chainstats'){
				$("#blockcounter").html(nDig((data.chainstats.height - 1), 3));
				var e = formatDate(data.blockstats.transactions[0].timestamp.seconds * 1000, '%M-%d-%Y %I:%m%p');
				$("#blockdate").html(e + ' UTC');
			}
			else if(data.msg === 'reset'){							//clear marble knowledge, prepare of incoming marble states
				$("#leroyswrap").html('');
				$("#bobswrap").html('');
			}
		}
		catch(e){
			console.log('ERROR', e);
			//ws.close();
		}
	}

	function onError(evt){
		console.log('ERROR ', evt.data);
	}

	function sendMessage(message){
		console.log("SENT: " + message);
		ws.send(message);
	}
}


// =================================================================================
//	UI Building
// =================================================================================
function build_ball(data){
	var html = '';
	var style = '';
	var size = 'fa-5x';
	
	if(!$("#" + data.name).length){								//only populate if it doesn't exists
		if(data.size == 16) size = 'fa-3x';
		if(data.color) style = "color:" + data.color.toLowerCase();
		
		html += '<span id="' + data.name +'" class=" fa fa-circle ' + size + ' ball" title="' + data.name +'" style="' + style +'" user="' + data.user + '"></span>';
		if((data.user && data.user.toLowerCase() == 'bob') || (data.owner && data.owner.toLowerCase() == 'bob')){
			$("#bobswrap").append(html);
		}
		else{
			$("#leroyswrap").append(html);
		}
	}
	return html;
}
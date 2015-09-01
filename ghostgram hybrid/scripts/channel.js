function onInitChannel(e) {
	e.preventDefault();
	
	currentChannelModel.messagesDS.data([]);
	currentChannelModel.membersDS.data([]);
	//APP.checkPubnub();
	
	$("#messageSend").kendoTouch({
   
		tap: function(e) {
			messageSend();
		},
		hold: function(e) {
			$("#sendMessageActions").data("kendoMobileActionSheet").open();
		}
	});
	
	var width = window.innerWidth - 68;
	$('#messageTextArea').css("width", width+'px');
	currentChannelModel.topOffset = APP.kendo.scroller().scrollTop;
	 autosize($('#messageTextArea'));
	 $("#messages-listview").kendoMobileListView({
        dataSource: currentChannelModel.messagesDS,
        template: $("#messagesTemplate").html() /*,
        click: function (e) {
            var message = e.dataItem;
		
			APP.models.channel.currentMessage = message;
			if (APP.models.channel.currentModel.isPrivate) {
				$('#'+message.msgID).removeClass('privateMode');
				kendo.fx($("#"+message.msgID)).fade("out").endValue(0.1).duration(6000).play();
 			} else {
				// display message actionsheet for group messages 
				$("#messageActions").data("kendoMobileActionSheet").open();
			}
            
        } */
     }).kendoTouch({
            filter: "li",
         	//enableSwipe: true,
            tap: tapChannel,
           	//swipe: swipeChannel,
		 	hold: holdChannel,
		 	dragstart: function(e){
		 		
		 		var selection = e.touch.currentTarget;
		 		var selectionListItem = $(selection)
		 		
		 		// add moving classes
		 		$(selection).addClass("selectedLI");
		 		$(".selectedLI > div").first().addClass("movingChat");

		 		// remove chat time
		 		$(".movingChat > .chat-time").velocity({opacity: 0, translateY: "5%"}, {duration: 200});

		 		$(".movingChat > .chat-message-user-content").velocity({scale: "1.01"}, {duration: 300});
		 		
		 	},
		 	drag: function(e){
		 		var currentX = e.touch.x.location;
		 		var windowWidth = $(window).width();
		 		var messageWidth = $(".movingChat > .chat-message-user-content").width();
		 		var widthPerc = (messageWidth + currentX)  / (windowWidth + messageWidth);

		 		// drag chat
		 		diffMovingChat(widthPerc);

		 		
		 		var accelWidthPerc = widthPerc * 2;
		 		var percentWindow = currentX / windowWidth
		 		
		 		//
		 		if(percentWindow < 0.75 && percentWindow > 0.35){
		 			
		 			$(".selectedLI > .message-slideOptions").css("opacity", accelWidthPerc);
		 			$(".selectedLI").removeClass("selectedLI-delete").addClass("selectedLI-archive");
		 			// change color to highlighted
			 		$(".movingChat > .chat-message-user-content").css("background-color", "#9E788F");
			 		$(".selectedLI > .message-slideOptions > .archive").css("display", "inline-block");
			 		$(".selectedLI > .message-slideOptions > .delete").css("display", "none");
		 		} else if(percentWindow <= 0.35){
		 			// change color to delete
		 			$(".selectedLI").addClass("selectedLI-delete").removeClass("selectedLI-archive");
			 		$(".movingChat > .chat-message-user-content").css("background-color", "#EA6262");
			 		$(".selectedLI > .message-slideOptions > .delete").css("display", "inline-block");
			 		$(".selectedLI > .message-slideOptions > .archive").css("display", "none");
			 		
		 		} else {
		 			// change color to default
			 		$(".movingChat > .chat-message-user-content").css("background-color", "#2D93FF");
			 		$(".selectedLI > .message-slideOptions > .delete .archive").css("display", "none");
			 		$(".selectedLI").removeClass("selectedLI-delete, selectedLI-archive");
		 		}
		 		

		 		

		 	},
		 	dragend: function(e){
		 		// get current position
		 		var currentX = e.touch.x.location;
		 		var windowWidth = $(window).width();
		 		var widthPerc = currentX  / windowWidth;
		 		
		 		
		 		 //if drag is far enough, set action
		 		if (widthPerc < 0.75) {
					$(".movingChat").velocity({translateX:"-100%", opacity: 0},{duration: "fast"});
		 			$(".selectedLI > .message-slideOptions").velocity({right:"100%"},{duration: "fast"});
		 			
		 			if (widthPerc < 0.35){
		 				// delete message 
		 				deleteMessage();
		 			} else {
		 				// archive message
		 				archiveMessage();
		 			}
		 			
				} else {
		 			$(".movingChat").velocity({right:"1rem"},{duration: 600, easing: "spring"});
		 			$(".selectedLI > .message-slideOptions").css("opacity", "0");
		 			
		 			// show chat time
		 			$(".movingChat > .chat-time").velocity({opacity: 1, translateY: "0"}, {duration: 200});

		 			// reset color and size
		 			$(".movingChat > .chat-message-user-content").css("background", "#2D93FF");
		 			$(".movingChat > .chat-message-user-content").velocity({scale: "1"}, {duration: 300});
		 		}

		 		// remove moving class
		 		$(".selectedLI > div").removeClass("movingChat");
		 		$("#messages-listview > .selectedLI").removeClass("selectedLI");
		 		
		 	}

        });
	
	$("#channelMembers-listview").kendoMobileListView({
	dataSource: currentChannelModel.membersDS,
	template: $("#membersTemplate").html(),
	click: function (e) {
		var member = e.dataItem;
		currentChannelModel.currentMember = member;
		// display message actionsheet    
		$("#memberActions").data("kendoMobileActionSheet").open();
	}
 });
}	

function diffMovingChat(widthPerc){

	if(widthPerc < 1){
		var currentXPer = 100 - ((widthPerc * 100).toFixed());
		$(".movingChat, .selectedLI > .message-slideOptions").css("right", currentXPer+"%");
	}

}

function deleteMessage(e){
	// close out li
	$(".selectedLI").velocity("slideUp", {delay: 150});

	mobileNotify("message deleted");

	// ToDo - wire up delete

}

function archiveMessage(e){
	// close out li
	$(".selectedLI").velocity("slideUp", {delay: 150});

	//mobileNotify("message archived");

	// ToDo - wire up archive

	// ToDo - wire up requests
	$("#modalview-requestContent").data("kendoMobileModalView").open();
}

function closeAskRequest(){
	$("#modalview-requestContent").data("kendoMobileModalView").close();
}

function sendAskRequest(){
	closeAskRequest();
	// Todo - wire sending request
}

function onInitAskRequest() {
	$("#modalview-requestContent").kendoTouch({
		enableSwipe: true,
		swipe: function(e){
			$("#modalview-requestContent").data("kendoMobileModalView").close();
		}
	});
}



function tapChannel(e) {
	e.preventDefault();
	var target = $(e.touch.initialTouch);
	var dataSource = currentChannelModel.messagesDS;
	var messageUID = $(e.touch.currentTarget).data("uid");
	var message = dataSource.getByUid(messageUID);
	//$('.delete').css('display', 'none');
	//$('.archive').css('display', 'none');
	
	// Scale down the other photos in this chat...
	$('.chat-message-photo').removeClass('chat-message-photo').addClass('chat-message-photo-small');
	
	// If the photo is minimized and the user just clicked in the message zoom the photo in place
	$('#'+message.msgID + ' .chat-message-photo-small').removeClass('chat-message-photo-small').addClass('chat-message-photo');
	
	// User actually clicked on the photo so show the open the photo viewer
	if (target[0].className === 'chat-message-photo' || target[0].className === 'chat-message-photo-small') {
		var photoUrl = message.data.photo.photo;
		$('#modalPhotoViewImage').attr('src', photoUrl);
		
		$('#modalPhotoView').kendoMobileModalView("open");
	}
	
	if (currentChannelModel.privacyMode) {
		$('#'+message.msgID).removeClass('privateMode');
		$.when(kendo.fx($("#"+message.msgID)).fade("out").endValue(0.3).duration(3000).play()).then(function () {
			$("#"+message.msgID).css("opacity", "1.0");
			$("#"+message.msgID).addClass('privateMode');
		});
	}
}

function swipeChannel (e) {
	e.preventDefault();
	var dataSource = currentChannelModel.messagesDS;
	var messageUID = $(e.touch.currentTarget).data("uid");
	var message = dataSource.getByUid(messageUID);
	
	if (currentChannelModel.privacyMode) {
		$('#'+message.msgID).removeClass('privateMode');
	}
		var selection = e.sender.events.currentTarget;
		var selectionListItem = $(selection).closest("div");
		var selectionInnerDiv = $(selectionListItem);

		console.log(selectionInnerDiv);

    		if(e.direction === "left"){
    			var otherOpenedLi = $(".message-active");
    			$(otherOpenedLi).velocity({translateX:"0"},{duration: "fast"}).removeClass("message-active");

    			if($(window).width() < 375){
    				$(selectionInnerDiv).velocity({translateX:"-80%"},{duration: "fast"}).addClass("message-active");
    			} else {
    				$(selectionInnerDiv).velocity({translateX:"-70%"},{duration: "fast"}).addClass("message-active");
    			}
    			
    			
		} 
		if (e.direction === 'right' && $(selection).hasClass("message-active") ) {
			/*
			// display the archive button
			var button = kendo.fx($(e.touch.currentTarget).find(".archive"));
	        button.expand().duration(200).play();
	        */
	        
    		$(selection).velocity({translateX:"0"},{duration: "fast"}).removeClass("message-active");
    		

	        console.log("right");
		}
	
}

function holdChannel (e) {
	e.preventDefault();
	var dataSource = currentChannelModel.messagesDS;
	var messageUID = $(e.touch.currentTarget).data("uid");
	var message = dataSource.getByUid(messageUID);
	if (currentChannelModel.privacyMode) {
		$('#'+message.msgID).removeClass('privateMode');
		$.when(kendo.fx($("#"+message.msgID)).fade("out").endValue(0.3).duration(3000).play()).then(function () {
			$("#"+message.msgID).css("opacity", "1.0");
			$("#"+message.msgID).addClass('privateMode');
		});
	}
	$("#messageActions").data("kendoMobileActionSheet").open();
}

function scrollToBottom() {
    // topOffset set when the view loads like the following   
    var scroller = APP.kendo.scroller;

	var scrollerHeight =  APP.kendo.scroller().scrollHeight();
	var viewportHeight =  APP.kendo.scroller().height();

	if ((scrollerHeight + currentChannelModel.topOffset) > viewportHeight) {
		var position = -1 * (scrollerHeight - viewportHeight - currentChannelModel.topOffset);
		 APP.kendo.scroller().animatedScrollTo(0, position);
	}

}

function formatMessage(string) {
	var workingString = string.split("\n").join("<br />");
	
	if (workingString.charAt(0) === '!') {
		workingString = workingString.slice(1);
		workingString = workingString.bold();
	}
	
	if (workingString.charAt(0) === '{') {
		workingString = workingString.slice(1);
		workingString = workingString.italics();
	}
	
	if (workingString.charAt(0) === '+') {
		workingString = workingString.slice(1);
		workingString = workingString.big();
	}
	
	if (workingString.charAt(0) === '-') {
		workingString = workingString.slice(1);
		workingString = workingString.small();
	}
	
	return(workingString);	
}

function onChannelPresence () {
	var users = currentChannelModel.handler.listUsers();
}

function onChannelRead(message) {
	
	if (message.content !== null) {
		message.formattedContent = formatMessage(message.content);
	} else {
		message.formattedContent = '';
	}
	
	// Ensure that new messages get the timer
	if (message.fromHistory === undefined) {
		message.fromHistory = false;
	}

	currentChannelModel.messagesDS.add(message);

	currentChannelModel.updateLastAccess();

	scrollToBottom();
	
	if (currentChannelModel.privacyMode) {
		kendo.fx($("#"+message.msgID)).fade("out").endValue(0.05).duration(9000).play();
	}
}

function showChatImagePreview(displayUrl) {
	$('#chatImage').attr('src', displayUrl);
	$('#chatImagePreview').show();
}

function hideChatImagePreview() {
	$('#chatImagePreview').hide();
	$('#chatImage').attr('src', null);	
}

function messageCamera (e) {
	e.preventDefault();
	deviceCamera(
		1600, // max resolution in pixels
		75,  // quality: 1-99.
		true,  // isChat -- generate thumbnails and autostore in gallery.  photos imported in gallery are treated like chat photos
		showChatImagePreview  // Optional preview callback
	);
}

function messagePhoto (e) {
	if (e !== undefined && e.preventDefault !== undefined)
		e.preventDefault();

	// Call the device gallery function to get a photo and get it scaled to gg resolution
	//todo: need to parameterize these...
	deviceGallery(
		1600, // max resolution in pixels
		75,  // quality: 1-99.
		true,  // isChat -- generate thumbnails and autostore in gallery.  photos imported in gallery are treated like chat photos
		showChatImagePreview  // Optional preview callback
	);
}

function messageGallery (e) {
	if (e !== undefined && e.preventDefault !== undefined)
		e.preventDefault();
	
	APP.kendo.navigate("views/gallery.html#gallery?action=chat");


}

function messageAudio (e) {
	e.preventDefault();
	navigator.device.capture.captureAudio(
		function (mediaFiles) {
			var mediaUrl = mediaFiles[0].fullPath;
		}, 
		function(error) {
			mobileNotify("Audio capture error " + JSON.stringify(error));
		}, 
		{limit:1, duration: 5}
	);
}


function chatPhotoHold (e) {

}

function chatPhotoTap(e) {

}


function messageSend(e) {
	//e.preventDefault();
	var text = $('#messageTextArea').val();
	if (text.length === 0)
		return;
	var messageData = {geo: APP.location.position};
	if (currentChannelModel.currentMessage.photo !== null) {
		messageData.photo = currentChannelModel.currentMessage.photo;
	}
	currentChannelModel.handler.sendMessage(currentChannelModel.currentContactUUID, text, messageData, 86400);
	 hideChatImagePreview();
	_initMessageTextArea();
	currentChannelModel.currentMessage = {};
	
}

function timeSince(date) {
	var seconds = Math.floor(((new Date().getTime()/1000) - date)),
	interval = Math.floor(seconds / 31536000);

	if (interval > 1) return interval + " years";

	interval = Math.floor(seconds / 2592000);
	if (interval > 1) return interval + " months";

	interval = Math.floor(seconds / 86400);
	if (interval >= 1) return interval + " days";

	interval = Math.floor(seconds / 3600);
	if (interval >= 1) return interval + " hours";

	interval = Math.floor(seconds / 60);
	if (interval > 1) return interval + " minutes";

	return Math.floor(seconds) + " seconds";
}

function onHideChannel(e) {
	e.preventDefault();
	if (currentChannelModel.currentChannel !== undefined) {
		currentChannelModel.handler.quit();   // Unsubscribe on current channel.
		mobileNotify("Closing current channel");
	}		
}

function togglePrivacyMode (e) {
	e.preventDefault();
	currentChannelModel.privacyMode = ! currentChannelModel.privacyMode;
	if (currentChannelModel.privacyMode) {
		$('#privacyMode').html('<img src="images/privacy-on.svg" />');
		$( ".chat-message" ).addClass('privateMode').removeClass('publicMode');
        $("#privacyStatus").removeClass("hidden");
        kendo.fx($("#privacyStatus")).expand("vertical").play();
	} else {
		$('#privacyMode').html('<img src="images/privacy-off.svg" />');
		$( ".chat-message" ).removeClass('privateMode').addClass('publicMode');
        $("#privacyStatus").addClass("hidden");
	}
	
}
function onShowChannel(e) {
	e.preventDefault();
	// hide action btn
	$("#channels > div.footerMenu.km-footer > a").css("display","none");


	var channelUUID = e.view.params.channel;
	var thisChannelModel = channelModel.findChannelModel(channelUUID);
	var thisUser = userModel.currentUser;
	var thisChannel = {};
	var contactUUID = null;
	currentChannelModel.currentChannel = thisChannelModel;
	var name = thisChannelModel.name;
	
	// Hide the image preview div
	hideChatImagePreview();
	APP.updateGeoLocation();
	
	if (name.length > 13) {
		name = name.substring(0,13)+"...";
	}
	currentChannelModel.privacyMode = false;
    // Privacy UI
	$('#privacyMode').html('<img src="images/privacy-off.svg" />');
	$("#privacyStatus").addClass("hidden");
    $("#channelNavBar").data('kendoMobileNavBar').title(name);	

	if (thisChannelModel.isPrivate) {
		$('#messagePresenceButton').hide();
		currentChannelModel.privacyMode = true;
        // Privacy UI 
		$('#privacyMode').html('<img src="images/privacy-on.svg" />');
        $("#privacyStatus").removeClass("hidden");
		var userKey = thisUser.publicKey, privateKey = thisUser.privateKey;
		if (thisChannelModel.members[0] === thisUser.userUUID)
			contactUUID = thisChannelModel.members[1];
		else 
			contactUUID = thisChannelModel.members[0];

		currentChannelModel.currentContactUUID = contactUUID;
		var thisContact = contactModel.getContactModel(contactUUID);
		if (thisChannelModel.isPrivate) {
			$('#channelImage').attr('src', thisContact.photo);
		}

		currentChannelModel.currentContactModel = thisContact;
		var contactKey = thisContact.publicKey;
		if (contactKey === undefined) {
			getUserPublicKey(contactUUID, function (result, error) {
				if (result.found) {
					contactKey = result.publicKey;
					thisContact.publicKey = contactKey;
					updateParseObject('contacts', 'contactUUID', contactUUID, 'publicKey', contactKey);
					thisChannel = new secureChannel(channelUUID, thisUser.userUUID, thisUser.alias, userKey, privateKey, contactUUID, contactKey);
					thisChannel.onMessage(onChannelRead);
					thisChannel.onPresence(onChannelPresence);
					mobileNotify("Getting Previous Messages...");
					var sentMessages = channelModel.getChannelArchive(currentChannelModel.currentChannel.channelId);
					thisChannel.getMessageHistory(function (messages) {
						currentChannelModel.messagesDS.data([]);
						
						for (var i=0; i<messages.length; i++){		
							var message = messages[i];
							var formattedContent = '';
							if (message.content !== null) {
								formattedContent = formatMessage(message.content);
							}
							message.formattedContent = formattedContent;
							// this is a private channel to activate the message timer
							message.fromHistory = true;
						}
	
						currentChannelModel.messagesDS.data(messages);
						currentChannelModel.messagesDS.pushCreate(sentMessages);

						scrollToBottom();
					});
				} else {
					mobileNotify('No secure connect for ' + thisContact.alias + ' ' + thisContact.name);
				}
				currentChannelModel.handler = thisChannel;
				
				
			});
		} else {
			currentChannelModel.currentChannel = thisChannelModel;
			thisChannel = new secureChannel(channelUUID, thisUser.userUUID, thisUser.alias, userKey, privateKey, contactUUID, contactKey);
			thisChannel.onMessage(onChannelRead);
			thisChannel.onPresence(onChannelPresence);
			mobileNotify("Getting Previous Messages...");
			var sentMessages = channelModel.getChannelArchive(currentChannelModel.currentChannel.channelId);
			thisChannel.getMessageHistory(function (messages) {
				currentChannelModel.messagesDS.data([]);
				for (var i=0; i<messages.length; i++){
							var message = messages[i];
							var formattedContent = '';
							if (message.content !== null) {
								formattedContent = formatMessage(message.content);
							}
							message.formattedContent = formattedContent;
						    message.fromHistory = true;
						}

				currentChannelModel.messagesDS.data(messages);
				currentChannelModel.messagesDS.pushCreate(sentMessages);
				scrollToBottom();
			});
			currentChannelModel.handler = thisChannel;
		}
		
		
	} else {
		$('#messagePresenceButton').show();
		// Provision a group channel
		thisChannel = new groupChannel(channelUUID, thisUser.userUUID, thisUser.alias, userKey);
		thisChannel.onMessage(onChannelRead);
		thisChannel.onPresence(onChannelPresence);
		mobileNotify("Getting Previous Messages...");
		thisChannel.getMessageHistory(function (messages) {
			APP.models.channel.messagesDS.data([]);
			for (var i=0; i<messages.length; i++){		
						var message = messages[i];
						var formattedContent = '';
						if (message.content !== null) {
							formattedContent = formatMessage(message.content);
						}
						message.formattedContent = formattedContent;
					}

			currentChannelModel.messagesDS.data(messages);
			scrollToBottom();
		});
		currentChannelModel.handler = thisChannel;
	}
}



function _initMessageTextArea() {
	
	$('#messageTextArea').val('');
	autosize.update($('#messageTextArea'));
}

function messageEraser (e) {
	e.preventDefault();
	_initMessageTextArea();	
}

function messageLockButton (e) {
	e.preventDefault();
	currentChannelModel.messageLock = !currentChannelModel.messageLock;
	if (currentChannelModel.messageLock) {
		$('#messageLockButton').html('<i class="fa fa-lock"></i>');
	} else {
		$('#messageLockButton').html('<i class="fa fa-unlock"></i>');
	}
}

function AutoGrowTextArea(textField)
{
  if (textField.clientHeight < textField.scrollHeight)
  {
    textField.style.height = textField.scrollHeight + "px";
    if (textField.clientHeight < textField.scrollHeight)
    {
      textField.style.height = 
        (textField.scrollHeight * 2 - textField.clientHeight) + "px";
    }
  }
}

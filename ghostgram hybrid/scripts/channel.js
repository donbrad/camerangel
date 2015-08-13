function onInitChannel(e) {
	e.preventDefault();
	
	APP.models.channel.messagesDS.data([]);
	APP.models.channel.membersDS.data([]);
	APP.checkPubnub();
	
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
	APP.models.channel.topOffset = APP.kendo.scroller().scrollTop;
	 autosize($('#messageTextArea'));
	 $("#messages-listview").kendoMobileListView({
        dataSource: APP.models.channel.messagesDS,
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
            filter: ">li",
         //   enableSwipe: true,
            tap: tapChannel,
           // swipe: swipeChannel,
		 	hold: holdChannel
        });
	
	$("#channelMembers-listview").kendoMobileListView({
	dataSource: APP.models.channel.membersDS,
	template: $("#membersTemplate").html(),
	click: function (e) {
		var member = e.dataItem;
		APP.models.channel.currentMember = member;
		// display message actionsheet    
		$("#memberActions").data("kendoMobileActionSheet").open();
	}
 });
}	

function tapChannel(e) {
	e.preventDefault();
	var target = $(e.touch.initialTouch);
	var dataSource = APP.models.channel.messagesDS;
	var messageUID = $(e.touch.currentTarget).data("uid");
	var message = dataSource.getByUid(messageUID);
	$('.delete').css('display', 'none');
	$('.archive').css('display', 'none');
	
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
	
	if (APP.models.channel.currentModel.privacyMode) {
		$('#'+message.msgID).removeClass('privateMode');
		$.when(kendo.fx($("#"+message.msgID)).fade("out").endValue(0.3).duration(3000).play()).then(function () {
			$("#"+message.msgID).css("opacity", "1.0");
			$("#"+message.msgID).addClass('privateMode');
		});
	}
}

function swipeChannel (e) {
	e.preventDefault();
	var dataSource = APP.models.channel.messagesDS;
	var messageUID = $(e.touch.currentTarget).data("uid");
	var message = dataSource.getByUid(messageUID);
	
	if (APP.models.channel.currentModel.privacyMode) {
		$('#'+message.msgID).removeClass('privateMode');
	}
	if (e.direction === 'left') {
		// display the delete button
		var button = kendo.fx($(e.touch.currentTarget).find(".delete"));
        $.when(button.expand().duration(200).play()).then(function () {
			$.when(kendo.fx($("#"+message.msgID)).fade("out").endValue(0.3).duration(3000).play()).then(function () {
				
			$("#"+message.msgID).addClass('privateMode');
		});
		});
	} else if (e.direction === 'right') {
		// display the archive button
		var button = kendo.fx($(e.touch.currentTarget).find(".archive"));
        button.expand().duration(200).play();
	}
	
}

function holdChannel (e) {
	e.preventDefault();
	var dataSource = APP.models.channel.messagesDS;
	var messageUID = $(e.touch.currentTarget).data("uid");
	var message = dataSource.getByUid(messageUID);
	if (APP.models.channel.currentModel.privacyMode) {
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

	if ((scrollerHeight + APP.models.channel.topOffset) > viewportHeight) {
		var position = -1 * (scrollerHeight - viewportHeight - APP.models.channel.topOffset);
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
	var users = APP.models.channel.currentChannel.listUsers();
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
	
	APP.models.channel.messagesDS.add(message);	
	
	scrollToBottom();
	
	if (APP.models.channel.currentModel.privacyMode) {
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
	if (APP.models.channel.currentMessage.photo !== null) {
		messageData.photo = APP.models.channel.currentMessage.photo;
	}
	APP.models.channel.currentChannel.sendMessage(APP.models.channel.currentContactUUID, text, messageData, 86400);
	 hideChatImagePreview();
	_initMessageTextArea();
	APP.models.channel.currentMessage = {};
	
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
	if (APP.models.channel.currentChannel !== undefined) {
		APP.models.channel.currentChannel.quit();   // Unsubscribe on current channel.
		mobileNotify("Closing current channel");
	}		
}

function togglePrivacyMode (e) {
	e.preventDefault();
	APP.models.channel.currentModel.privacyMode = ! APP.models.channel.currentModel.privacyMode;
	if (APP.models.channel.currentModel.privacyMode) {
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
	var channelUUID = e.view.params.channel;
	var thisChannelModel = findChannelModel(channelUUID);
	var thisUser = userModel.currentUser;
	var thisChannel = {};
	var contactUUID = null;
	APP.models.channel.currentModel = thisChannelModel;
	var name = thisChannelModel.name;
	
	// Hide the image preview div
	hideChatImagePreview();
	APP.updateGeoLocation();
	
	if (name.length > 13) {
		name = name.substring(0,13)+"...";
	}
	APP.models.channel.currentModel.privacyMode = false;
    // Privacy UI
	$('#privacyMode').html('<img src="images/privacy-off.svg" />');
	$("#privacyStatus").addClass("hidden");
    $("#channelNavBar").data('kendoMobileNavBar').title(name);	

	if (thisChannelModel.isPrivate) {
		$('#messagePresenceButton').hide();
		APP.models.channel.currentModel.privacyMode = true;
        // Privacy UI 
		$('#privacyMode').html('<img src="images/privacy-on.svg" />');
        $("#privacyStatus").removeClass("hidden");
		var userKey = thisUser.publicKey, privateKey = thisUser.privateKey;
		if (thisChannelModel.members[0] === thisUser.userUUID)
			contactUUID = thisChannelModel.members[1];
		else 
			contactUUID = thisChannelModel.members[0];	

		APP.models.channel.currentContactUUID = contactUUID;
		var thisContact = getContactModel(contactUUID);
		if (thisChannelModel.isPrivate) {
			$('#channelImage').attr('src', thisContact.photo);
		}
		
		APP.models.channel.currentContactModel = thisContact;
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
					thisChannel.getMessageHistory(function (messages) {
						APP.models.channel.messagesDS.data([]);
						
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
	
						APP.models.channel.messagesDS.data(messages);	
						scrollToBottom();
					});
				} else {
					mobileNotify('No secure connect for ' + thisContact.alias + ' ' + thisContact.name);
				}
				APP.models.channel.currentChannel = thisChannel;
				
				
			});
		} else {
			APP.models.channel.currentModel = thisChannelModel;
			thisChannel = new secureChannel(channelUUID, thisUser.userUUID, thisUser.alias, userKey, privateKey, contactUUID, contactKey);
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
						    message.fromHistory = true;
						}
	
				APP.models.channel.messagesDS.data(messages);		
				scrollToBottom();
			});
			APP.models.channel.currentChannel = thisChannel;
			
			
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

			APP.models.channel.messagesDS.data(messages);		
			scrollToBottom();
		});
		APP.models.channel.currentChannel = thisChannel;
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
	APP.models.channel.messageLock = !APP.models.channel.messageLock;
	if (APP.models.channel.messageLock) {
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

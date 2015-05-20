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
	
	$("#messageCamera").kendoTouch({
   
		tap: function(e) {
			messageCamera();
		},
		hold: function(e) {
			$("#newMessageActions").data("kendoMobileActionSheet").open();
		}
	});
	
	var width = window.innerWidth - 96;
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
	var dataSource = APP.models.channel.messagesDS;
	var messageUID = $(e.touch.currentTarget).data("uid");
	var message = dataSource.getByUid(messageUID);
	$('.delete').css('display', 'none');
	$('.archive').css('display', 'none');
	if (APP.models.channel.currentModel.isPrivate) {
		$('#'+message.msgID).removeClass('privateMode');
		$.when(kendo.fx($("#"+message.msgID)).fade("out").endValue(0.3).duration(6000).play()).then(function () {
			$("#"+message.msgID).css("opacity", "1.0");
			$("#"+message.msgID).addClass('privateMode');
		});
	}
}

function swipeChannel (e) {
	
	var dataSource = APP.models.channel.messagesDS;
	var messageUID = $(e.touch.currentTarget).data("uid");
	var message = dataSource.getByUid(messageUID);
	
	if (APP.models.channel.currentModel.isPrivate) {
		$('#'+message.msgID).removeClass('privateMode');
	}
	if (e.direction === 'left') {
		// display the delete button
		var button = kendo.fx($(e.touch.currentTarget).find(".delete"));
        $.when(button.expand().duration(200).play()).then(function () {
			$.when(kendo.fx($("#"+message.msgID)).fade("out").endValue(0.3).duration(9000).play()).then(function () {
				
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
	var dataSource = APP.models.channel.messagesDS;
	var messageUID = $(e.touch.currentTarget).data("uid");
	var message = dataSource.getByUid(messageUID);
	if (APP.models.channel.currentModel.isPrivate) {
		$('#'+message.msgID).removeClass('privateMode');
		$.when(kendo.fx($("#"+message.msgID)).fade("out").endValue(0.3).duration(9000).play()).then(function () {
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
	
	if (APP.models.channel.currentModel.isPrivate)
		kendo.fx($("#"+message.msgID)).fade("out").endValue(0.05).duration(12000).play();
}

function showChatImagePreview() {
	$('#chatImagePreview').show();
}

function hideChatImagePreview() {
	$('#chatImagePreview').hide();
	$('#chatImage').attr('src', null);	
}

function messageCamera (e) {
	var pictureSource = navigator.camera.PictureSourceType;   // picture source
    var destinationType = navigator.camera.DestinationType; // sets the format of returned value
	 navigator.camera.getPicture(
		 function (imageData) { 
			 var photouuid = uuid.v4();
			 var imageDataSource = "data:image/jpeg;base64," + imageData;
			  mobileNotify("Image Size = " + imageDataSource.length);
			 window.imageResizer.resizeImage(
			  function(data) { 
					APP.models.gallery.currentPhoto.scaledsrc = "data:image/jpeg;base64," + data.imageData; 
				  mobileNotify("Scaled image Size = " + imageDataSource.length);
			  }, function (error) {
				mobileNotify("Image Resizer :" + error);
			  }, imageData, 140, 0, { imageDataType: ImageResizer.IMAGE_DATA_TYPE_BASE64, quality: 50});
			 APP.models.gallery.currentPhoto.src=imageDataSource;
			 showChatImagePreview();
			 $('#chatImage').attr('src', APP.models.gallery.currentPhoto.src);	
			 
		 }, 
		 function (error) {
			 mobileNotify("Camera error " + error);
		 }, { 
			 quality: 20, 
			 allowEdit: true,
        	destinationType: destinationType.DATA_URL 
		 }
	 );
}

function messageAudio (e) {
	
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
function messagePhoto (e) {
	var pictureSource = navigator.camera.PictureSourceType;   // picture source
    var destinationType = navigator.camera.DestinationType; // sets the format of returned value
	 navigator.camera.getPicture(
		 function (imageData) { 
			 var imageDataSource = "data:image/jpeg;base64," + imageData;
			 mobileNotify("Image Size = " + imageDataSource.length);
			 APP.models.gallery.currentPhoto.src=imageDataSource;
			  showChatImagePreview();
			 $('#chatImage').attr('src', APP.models.gallery.currentPhoto.src);	
			 
		 }, 
		 function (error) {
			 mobileNotify("Camera error " + error);
		 }, { 
			sourceType: pictureSource.SAVEDPHOTOALBUM,
        	destinationType: destinationType.DATA_URL 
		 }
	 );
}


function messageSend(e) {
	//e.preventDefault();
	var text = $('#messageTextArea').val();
	if (text.length === 0)
		return;
	APP.models.channel.currentChannel.sendMessage(APP.models.channel.currentContactUUID, text, 86400);
	 hideChatImagePreview();
	_initMessageTextArea();
	
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

function onShowChannel(e) {
	e.preventDefault();
	var channelUUID = e.view.params.channel;
	var thisChannelModel = findChannelModel(channelUUID);
	var thisUser = APP.models.profile.currentUser;
	var thisChannel = {};
	var contactUUID = null;
	APP.models.channel.currentModel = thisChannelModel;
	var name = thisChannelModel.name;
	
	// Hide the image preview div
	hideChatImagePreview();
	
	if (thisChannelModel.isPrivate) {
		name = '{' + name + '}';
		if (name.length > 16)
		 name = name.substring(0,15)+ '...}';
		$('#messagePresenceButton').hide();
	} else {
		if (name.length > 17)
		name = name.substring(0,17)+"...";
		$('#messagePresenceButton').show();
	}
    $("#channelNavBar").data('kendoMobileNavBar').title(name);	

	if (thisChannelModel.isPrivate) {
		
		var userKey = thisUser.publicKey, privateKey = thisUser.privateKey;
		if (thisChannelModel.members[0] === thisUser.userUUID)
			contactUUID = thisChannelModel.members[1];
		else 
			contactUUID = thisChannelModel.members[0];	

		APP.models.channel.currentContactUUID = contactUUID;
		var thisContact = getContactModel(contactUUID);
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
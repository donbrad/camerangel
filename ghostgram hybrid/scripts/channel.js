

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






function onHideChannel(e) {
	e.preventDefault();
	if (currentChannelModel.currentChannel !== undefined) {
		currentChannelModel.handler.close();   // Unsubscribe on current channel.
		mobileNotify("Closing current channel");
	}		
}







function messageEraser (e) {
	e.preventDefault();
	channelView._initMessageTextArea();
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



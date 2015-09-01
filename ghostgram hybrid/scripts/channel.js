

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



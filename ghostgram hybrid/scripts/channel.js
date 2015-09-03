

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






function chatPhotoHold (e) {

}

function chatPhotoTap(e) {

}












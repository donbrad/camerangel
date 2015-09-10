function togglePrivate (e) {
    _preventDefault(e);

    var privateMode = !currentChannelModel.privacyMode;
    currentChannelModel.privacyModee = privateMode;
    if (privateMode) {
        $('.privateModeButton').text('Private');
        $('.user-content').removeClass('publicMode');
        $('.user-content').addClass('privateMode');

    } else {
        $('.privateModeButton').text('Public');
        $('.user-content').addClass('publicMode');
        $('.user-content').removeClass('privateMode');
    }
}

function beforeShowFilter() {

    if (APP.models.home.privateMode) {
        $('.privateModeButton').text('Private');
        $('.user-content').removeClass('publicMode');
        $('.user-content').addClass('privateMode');

    } else {
        $('.privateModeButton').text('Public');
        $('.user-content').addClass('publicMode');
        $('.user-content').removeClass('privateMode');
    }   

    $(".user-content").kendoTouch({
        touchstart: function(e) {
            e.preventDefault();
            if (!APP.models.home.privateMode)
                return;
             $('.user-content').addClass('publicMode');
             $('.user-content').removeClass('privateMode');
        },
        dragend: function(e) {
            e.preventDefault();
             if (!APP.models.home.privateMode)
                return;
             $('.user-content').removeClass('publicMode');
             $('.user-content').addClass('privateMode');
        },
    }); 
}

function onInitMap() {
	
}

function closeModalPhotoView(e) {
	e.preventDefault();
     $('#modalPhotoView').kendoMobileModalView("close");
}


function closeModalViewSupport() {
     $('#modalview-support').kendoMobileModalView("close");
}

function closeModalViewPhotoTag() {
     $('#modalview-photoTag').kendoMobileModalView("close");
}
function closeModalViewLogin() {
    $("#modalview-login").kendoMobileModalView("close");
}

function closeModalGhostChat() {
    $("#modalview-ghostChat").kendoMobileModalView("close");
}

function closeModalViewSignup() {
    $("#modalview-signup").kendoMobileModalView("close");
}

function closeModalViewGalleryPicker() {
    $("#modalview-galleryPicker").kendoMobileModalView("close");
}

function closeModalViewRecoverPassword() {
    $("#modalview-recoverPassword").kendoMobileModalView("close");
}

function closeModalViewProfilePhotoEdit() {
    $("#modalview-profilePhotoEdit").kendoMobileModalView("close");
}

function closeModalViewAddChannel() {
    $("#modalview-channels-addChannel").kendoMobileModalView("close");
}

function closeModalViewAddPhoto() {
    $("#modalview-gallery-addPhoto").kendoMobileModalView("close");
}
    
function closeModalViewAddPlace() {
    $("#modalview-addPlace").kendoMobileModalView("close");
}

function closeModalViewEditChannel() {
    $("#modalview-channels-editChannel").kendoMobileModalView("close");
}
    
function notificationVerifyPhone (e) {
	e.preventDefault();
	$("#modalview-verifyPhone").data("kendoMobileModalView").open();
}

function closeModalViewProfileStatus() {
	$("#modalview-profileStatus").data("kendoMobileModalView").close();
	$(".userLocationUpdate").css("display", "none");
	var updatedStatus = $("#profileStatusUpdate").val();
	if(updatedStatus !== ""){
		// Save new status
		userModel.currentUser.set("statusMessage", updatedStatus);
	}
	// clear status box
	$("#profileStatusUpdate").val("");
}

function closeStartModal() {
	$("#modalview-start").data("kendoMobileModalView").close();
}

function closeTestingBox(){
	$("#testing").data("kendoMobileModalView").close();
}


// Check empty state for views
// Todo: Jordan - better to check status of datasource in view than to check for presense of li...
// checkEmptyUIState(ds, view) ( var selectionList = ds.total()
function checkEmptyUIState(selection, view){
	
	var selectionList = $(selection + " > li").length;
	
    if(selectionList <= 0){
    	$(view + " .emptyState").removeClass("hidden");
    
    } else {
    	$(view + ".emptyState").addClass("hidden");
    
    }
}

function formatNameAlias(name, alias, view){

	var primaryName, secondName;

	if (alias !== "" && alias !== undefined && name !== "" && name !== undefined){
		primaryName = alias;
		secondName = name;

	} else if(name !== "" && name !== undefined) {
		primaryName = name;
		secondName = "";
	}
	else {
		primaryName = alias;
	}

	$(view + " .primaryName").text(primaryName);
	$(view + " .secondName").text(secondName);

}


function returnUXPrimaryName(name, alias){
	var primaryName;

	if (alias !== "" && alias !== undefined && name !== "" && name !== undefined){
		primaryName = alias;
		
	} else if(name !== "" && name !== undefined) {
		primaryName = name;
	}
	else {
		primaryName = alias;
	}

	return primaryName;
}

function showFormatedPhone(){
	if($(".phone").is("input")){
		var inputVal = $(".phone").val();
    	var formattedVal = inputVal.replace(/\d(\d\d\d)(\d\d\d)(\d\d\d\d)/, '($1) $2-$3');
		
		$(".phone").val(formattedVal);
	
	} else {
		$('.phone').text(function(i, text) {
    	return text.replace(/\d(\d\d\d)(\d\d\d)(\d\d\d\d)/, '($1) $2-$3');
		});
	}
}

function showCleanEmail(email){
	// Simple check to just display email. Could replace w/ better regex
	if(email.indexOf(':') > -1){
		var splitEmail = email.split(": ");
		return splitEmail[1];
	} else {
		return email;
	}

}

function showCleanPhone(phone){
	return phone.replace(/\d(\d\d\d)(\d\d\d)(\d\d\d\d)/, '($1) $2-$3');
}


function showActionBtnText(path){ 
	$(path).velocity({opacity: 1, right: "3rem"}, {easing: "spring", delay: 500});
}

function hideActionBtnText(path){
	$(path).velocity({opacity: 0, right: "0"});
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


function createInitialsIcon(name, selector) {
    var colors = ["#1abc9c", "#2ecc71", "#3498db", "#9b59b6", "#34495e", "#16a085", "#27ae60", "#2980b9", "#8e44ad", "#2c3e50", "#f1c40f", "#e67e22", "#e74c3c", "#95a5a6", "#f39c12", "#d35400", "#c0392b", "#bdc3c7", "#7f8c8d"];

    var
        nameSplit = name.split(" "),
        initials = nameSplit[0].charAt(0).toUpperCase() + nameSplit[1].charAt(0).toUpperCase();

    var charIndex = initials.charCodeAt(0) - 65,
        colorIndex = charIndex % 19;

    var canvas = document.getElementById(selector);
    var context = canvas.getContext("2d");

    var canvasWidth = $(canvas).attr("width"),
        canvasHeight = $(canvas).attr("height"),
        canvasCssWidth = canvasWidth,
        canvasCssHeight = canvasHeight;

    if (window.devicePixelRatio) {
        $(canvas).attr("width", canvasWidth * window.devicePixelRatio);
        $(canvas).attr("height", canvasHeight * window.devicePixelRatio);
        $(canvas).css("width", canvasCssWidth);
        $(canvas).css("height", canvasCssHeight);
        context.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    context.fillStyle = colors[colorIndex];
    context.fillRect (0, 0, canvas.width, canvas.height);
    context.font = "128px Arial";
    context.textAlign = "center";
    context.fillStyle = "#FFF";
    context.fillText(initials, canvasCssWidth / 2, canvasCssHeight / 1.5);
}
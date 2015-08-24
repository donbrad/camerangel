function togglePrivate (e) {
    e.preventDefault();
    var privateMode = !APP.models.home.privateMode;
    APP.models.home.privateMode = privateMode;
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
}

function closeStartModal() {
	$("#modalview-start").data("kendoMobileModalView").close();
}

function closeTestingBox(){
	$("#testing").data("kendoMobileModalView").close();
}


// Check empty state for views
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




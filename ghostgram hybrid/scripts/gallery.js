/* global archiveView */

'use strict';

var getSentinelHeight = function () {
	var gallerySelectIndex = $('#galleryMenuSelect').data('kendoMobileButtonGroup').current().index();

	var combinedHeight = 0;
	var currentHeight;
	$('#search-archives').children().each( function () {
		currentHeight = $(this).css('height');
		$(this).css('height', 'auto');

		combinedHeight += $(this).height();

		$(this).css('height', currentHeight);
	});

	if (gallerySelectIndex === 0) {
		// Dunno what's up with needing these calculations
		combinedHeight *= 2;
		combinedHeight += 70;
	}

	return combinedHeight/16+'rem';
};

function onInitGallery(e){
	archiveView.init();

	var setSentinelHeight = function () {
		$('#search-archives').height(getSentinelHeight());
	};
/*
	archiveView.sentinel.addListener('add', setSentinelHeight);
	archiveView.sentinel.addListener('remove', setSentinelHeight);
	setSentinelHeight();
*/

   if (e !== undefined && e.preventDefault !== undefined){
		e.preventDefault();
	}
    // ToDo: Initialize list view
    var itemWidth = $(window).width()/4;
	photoModel.rotationAngle = 0;
	photoModel.optionsHidden = true;
	photoModel.previewSize = "33%";
	photoModel.optionsShown = true;


	$("#gallerySearch").keyup(function() {
  		var query = $("#gallerySearch").val();
		if (query.length > 0) {
			
		}
		
	});

	// Kendo web bug is firing infinitely
	if (window.navigator.simulator === false) {
		$("#gallerySearch").on("focus", function(){
			$(".gallerySearchOptions").velocity("slideDown", {duration: 300});
			//$("#gallerySearch").unbind("focus");
			console.log("focus");
		});

		$("#gallerySearch").on("blur", function(){
			$(".gallerySearchOptions").velocity("slideUp", {duration: 300});
			//$("#gallerySearch").unbind("blur");
			console.log("blur");
		});
	} else {
		$(".gallerySearchOptions").velocity("slideDown", {duration: 300});
	}
	// hide archive options
	$(".gallerySearchOptions, #galleryPhotoDisplayOpts").css("display", "none");
	

	var scroller = e.view.scroller;
	//scroller.scrollTo(0,-44);
	/*
	var currentPos = 0;
	scroller.bind("scrollingDown");
	scroller.bind("scrollingUp");
	scroller.bind("scroll", function(){
		console.log("currentPos: " + currentPos + " scrollTop: " + scroller.scrollTop);
		if(currentPos > scroller.scrollTop && scroller.scrollTop > 0){
			console.log("plus");
			currentPos = scroller.scrollTop;
			scroller.trigger("scrollingDown", resetNavUI());
			//scroller.unbind("scrollingDown");
		} else if (scroller.scrollTop > currentPos){
			console.log("minus");
			currentPos = scroller.scrollTop;
			scroller.trigger("scrollingUp", shrinkNavUI());
			//scroller.unbind("scrollingUp");
		} else {
			console.log("none");
		}
		console.log(currentPos);
	});    
	
*/
}

function resetNavUI(e){
	$(".km-navbar").removeClass("home-smallHeader");	
	//$(".user-status, .user-settings").velocity("fadeIn", {duration: 150});
	console.log("resetNavUI");
}

function shrinkNavUI() {
	$(".km-navbar").addClass("home-smallHeader");	
	$(".user-status, .user-settings").velocity("fadeOut", {duration: 150});
	console.log("shrinkNavUI");
}

function galleryOptionsToggle (e) {
	if (e !== undefined && e.preventDefault !== undefined){
		e.preventDefault();
	}
	

	if (photoModel.optionsShown) {
		$("#galleryToggle").velocity("fadeOut",{duration: 150});
		$('.gallerySearchOptions').velocity("slideDown",{duration: 300});
		$("#galleryZoomSelect > li:first-child").velocity("fadeIn", {duration: 300});
		photoModel.optionsShown = false;
		$("#gallerySearch").focus();
	} else {
		$('.gallerySearchOptions').velocity("slideUp",{duration: 300});
		$("#galleryToggle").velocity("fadeIn",{delay: 150, duration: 150});
		$("#galleryZoomSelect > li:first-child").velocity("fadeOut", {duration: 300});
		//$('#gallerySearchOptions').removeClass('hidden');
		photoModel.optionsShown = true;
		
	}
	
}


function selectGallerySearchTool(e) {
	if (e !== undefined && e.preventDefault !== undefined)
		e.preventDefault();
	var index = this.current().index();
	
	switch (index) {
			
		case 0: // Search
			$("#gallerySearch").attr("placeholder", "Search all");
			break;
			
		case 1: // Contacts
			$("#gallerySearch").attr("placeholder", "Search contacts");
			break;
			
		case 2: // Chats
			$("#gallerySearch").attr("placeholder", "Search chats");
			break;
			
		case 3: // Calendar
			$("#gallerySearch").attr("placeholder", "Search dates");
			break;
			
		case 4: // Places
			$("#gallerySearch").attr("placeholder", "Search places");
			break;
	}
	
}

function selectGalleryZoom(e) {
		if (e !== undefined && e.preventDefault !== undefined)
		e.preventDefault();

	var index = this.current().index();
	switch (index) {
		case 0:
			photoModel.previewSize = "33%";
			$("#gallery-listview li").css("width","33%");
			$("#gallery-listview li").css("padding-bottom","33%");
			break;
		case 1:
			photoModel.previewSize = "50%";
			$("#gallery-listview li").css("width","50%");
			$("#gallery-listview li").css("padding-bottom","50%");
			break;
		case 2:
			photoModel.previewSize = "100%";
			$("#gallery-listview li").css("width","100%");
			$("#gallery-listview li").css("padding-bottom","100%");
			break;
			
	}
	
	
}

function photoEditCrop(e) {
	if (e !== undefined && e.preventDefault !== undefined)
		e.preventDefault();
	var $image = $('#photoEditImage');
	var cropCanvas = $image.cropper('getCroppedCanvas');
	var cropUrl = cropCanvas.toDataURL("image/jpeg");
	
	$image.cropper('replace', cropUrl);
	$('#photoEditImage').attr('src', cropUrl);
	$('#photoEditSaveDiv').removeClass('hidden');
}

// this got more complex trying to reuse across 3 flows: chat, gallery and profile...
function photoEditSave(e) {
	if (e !== undefined && e.preventDefault !== undefined)
		e.preventDefault();
	var urlToSave = $('#photoEditImage').attr('src');
	if (photoModel.currentPhoto.source === 'chat') {
		// Save image to chat image preview
	} else if (photoModel.currentPhoto.source === 'gallery') {
		// Save image to gallery
	} else if (photoModel.currentPhoto.source === 'profile') {
		// Save image to user profile
		saveUserProfilePhoto(urlToSave);
	}
	// Save photoEditImage source...
}

function photoEditRotateLeft(e) {
	if (e !== undefined && e.preventDefault !== undefined)
		e.preventDefault();
	//$('#photoEditImage').css('transform','rotate(' + -90 + 'deg)');'
	photoModel.rotationAngle -= 90;
	$('#photoEditImage').cropper('rotate', photoModel.rotationAngle);


}

function photoEditRotateRight(e) {
	if (e !== undefined && e.preventDefault !== undefined)
		e.preventDefault();
	//$('#photoEditImage').css('transform','rotate(' + 90 + 'deg)');
	photoModel.rotationAngle += 90;
	$('#photoEditImage').cropper('rotate', photoModel.rotationAngle);

}

function onHidePhotoEditor(e) {
	if (e !== undefined && e.preventDefault !== undefined)
		e.preventDefault();
	
	$('#photoEditImage').cropper('destroy');
}

function onShowPhotoEditor (e) {
	if (e.preventDefault !== undefined)
		e.preventDefault();

	var source = e.view.params.source; // source can be: chat, gallery or profile.  determines parameters and return path

	if (source === undefined || source === null) {
		mobileNotify("PhotoEditor: source parameter is missing!");
		return;
	}

	photoModel.currentPhoto.source = source;


	if (source === "gallery" || source === "chat") {
		$('#photoEditImage').cropper();
	} else {
		// must be a profile image
		$('#photoEditImage').cropper({aspectRatio: 1});
	}
	/*
	var canvas = new fabric.Canvas('photoEditCanvas');
	var imgElement = document.getElementById('photoEditImage');
	var imgInstance = new fabric.Image(imgElement);
	canvas.add(imgInstance);
	*/


}

function onHidePhotoView(e) {
	e.preventDefault();
	
	$('#photoViewImage').attr('src', "");
	$('#photoEditSaveDiv').addClass('hidden');
}


function onShowGallery(e) {
	e.preventDefault();
	
	photoModel.chatPhoto = false;
	if (e.view.params.action !== undefined && e.view.params.action === 'chat') {
		photoModel.chatPhoto = true;
		mobileNotify("Please select an image to send...")
	}
	photoModel.rotationAngle = 0;
	

	$("#gallery-listview li").css("width",photoModel.previewSize);
	$("#gallery-listview li").css("padding-bottom",photoModel.previewSize);


	switch(photoModel.previewSize) {
		case "33%" :
			//setButtonGroupIndex("#gallerySearchToolSelect", 0);
			break;

		case "50%" :
			//setButtonGroupIndex("#gallerySearchToolSelect", 1);
			break;

		case "100%" :
			//setButtonGroupIndex("#gallerySearchToolSelect", 2);
			break;
	}

	// Added until gallery/archive are fully merged
	checkEmptyUIState("#archive-listview", "#archiveBox");
}


function gallerySelectCategory(e){
	var index = this.current().index();
	switch (index) {
		case 0:
			$(".gallerySearchOptions").velocity("slideDown");
			$("#galleryPhotoDisplayOpts").velocity("slideUp");

			$('#archive-listview').removeClass('hidden');
			$("#gallery-listview").addClass('hidden');

			break;

		case 1:
			$(".gallerySearchOptions").velocity("slideUp");
			$("#galleryPhotoDisplayOpts").velocity("slideDown");

			$('#archive-listview').addClass('hidden');
			$("#gallery-listview").removeClass("hidden");
			break;
	}
	$("#gallerySearch").attr("placeholder", "Search All");


} 

function galleryClick(e) {
	if (e !== undefined && e.preventDefault !== undefined) {
		e.preventDefault();
	}

	var photoId = e.dataItem.id, photoUrl = e.dataItem.imageUrl;
	photoModel.currentPhotoModel = getPhotoModel(photoId);
	$('#photoViewImage').attr('src', photoUrl);
	$('#photoTagImage').attr('src', photoUrl);
	$('#photoEditImage').attr('src', photoUrl);

	if (photoModel.chatPhoto) {
		showChatImagePreview(photoUrl);
		APP.kendo.navigate('#:back');

	} else {
		APP.kendo.navigate('#photoView');
	}

}


function getPhotoModel(photoId) {
	 var dataSource = photoModel.photosDS;
    dataSource.filter( { field: "photoId", operator: "eq", value: photoId });
    var view = dataSource.view();
    var photo = view[0];
	dataSource.filter([]);
	
	return(photo);
}

function photoExport (e) {
	e.preventDefault();
	var photo = photoModel.currentPhotoModel;
	
}

function photoDelete (e) {
	e.preventDefault();
	var photo = photoModel.currentPhotoModel;
	// Todo:  Add confirmation prior to photo delete
	
	// Delete from local datasource
	photoModel.photosDS.remove(photoModel.currentPhotoModel);
	// Remove from isotope and then rerender the layout
	//$('#gallery-grid').isotope( 'remove', photoModel.currentIsoModel ).isotope('layout');
	// Delete from remote parse collection
	deleteParseObject('photos', 'photoId', photo.photoId);
	
	mobileNotify("Deleted current photo");
	
	// Navigate to previous page as the photo is gone...
	APP.kendo.navigate('#:back');
}

function galleryZoomIn (e)  {
	if (e !== undefined && e.preventDefault !== undefined) {
		e.preventDefault();	
	}

	photoModel.smallPreview = false;
	$("#gallery-listview li").css("width","50%");
	$("#gallery-listview li").css("padding-bottom","50%");
	//$("#galleryPicker-listview").data("kendoMobileListView").refresh();

}

function galleryZoomOut (e)  {
	if (e !== undefined && e.preventDefault !== undefined) {
		e.preventDefault();
	}
	
	photoModel.smallPreview = true;
	$("#gallery-listview li").css("width","33%");
	$("#gallery-listview li").css("padding-bottom","33%");
	//$("#galleryPicker-listview").data("kendoMobileListView").refresh();

}
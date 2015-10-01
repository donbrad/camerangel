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
	
	$("#gallery > div.footerMenu.km-footer > a > span > img").attr("src", "images/gallery-list.svg");
	
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

}
// Set action button for gallery
function galleryActionView(e){
	e.preventDefault();
	if(photoModel.previewSize === "33%") {
		$("#gallery > div.footerMenu.km-footer > a > span > img").attr("src", "images/gallery-grid.svg");
		//$("#gallery actionBtn-text")  Todo: Jordan- what is this fragment supposed to do?
		photoModel.previewSize = "100%";
	} else {
		$("#gallery > div.footerMenu.km-footer > a > span > img").attr("src", "images/gallery-list.svg");
		photoModel.previewSize = "33%";
	}
}

function gallerySelectCategory(e){
	var index = this.current().index();
	switch (index) {
		case 0:
			$('#archive-listview').removeClass('hidden');
			$("#gallery-listview").addClass('hidden');
			// Hide photo view options
			$("#photoViewOpts").addClass('hidden');

			$("#gallery > div.footerMenu.km-footer > a").css("display", "none");
			break;

		case 1:
			$('#archive-listview').addClass('hidden');
			$("#gallery-listview").removeClass("hidden");

			$("#photoViewOpts").removeClass("hidden");

			$("#gallery > div.footerMenu.km-footer > a").removeAttr("href").css("display", "inline-block").on("click", function(e){
				galleryActionView(e);
			});
			break;
	}

} 

function galleryClick(e) {
	if (e !== undefined && e.preventDefault !== undefined) {
		e.preventDefault();
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

	photoModel.deletePhoto(photo.photoId);

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
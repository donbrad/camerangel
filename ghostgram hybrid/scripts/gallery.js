function onInitGallery(e){
    e.preventDefault();
    // ToDo: Initialize list view
    var itemWidth = $(window).width()/4;
	APP.models.gallery.rotationAngle = 0;
	APP.models.gallery.optionsHidden = true;
	$( "#gallerySearch" ).keyup(function() {
  		var query = ("#gallerySearch").val();
		if (query.length > 0) {
			
		}
		
	});
}

function galleryOptionsToggle (e) {
	
	APP.models.gallery.optionsShown = !APP.models.gallery.optionsShown;
	
	if (APP.models.gallery.optionsHidden) {
		$('#gallerySearchOptions').addClass('hidden');
	} else {
		$('#gallerySearchOptions').removeClass('hidden');
	}
}

function selectGalleryZoom() {
	var index = this.current().index();
	if (index === 0) {
		APP.models.gallery.smallPreview = true;
		$("#gallery-listview li").css("width","25%");
		$("#gallery-listview li").css("padding-bottom","25%");
	} else {
		APP.models.gallery.smallPreview = false;
		$("#gallery-listview li").css("width","50%");
		$("#gallery-listview li").css("padding-bottom","50%");
	}
	
}

function photoEditCrop(e) {
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
	e.preventDefault();
	var urlToSave = $('#photoEditImage').attr('src');
	if (APP.models.gallery.currentPhoto.source === 'chat') {
		// Save image to chat image preview
	} else if (APP.models.gallery.currentPhoto.source === 'gallery') {
		// Save image to gallery
	} else if (APP.models.gallery.currentPhoto.source === 'profile') {
		// Save image to user profile
		saveUserProfilePhoto(urlToSave);
	}
	// Save photoEditImage source...
}

function photoEditRotateLeft(e) {
	e.preventDefault();
	//$('#photoEditImage').css('transform','rotate(' + -90 + 'deg)');'
	APP.models.gallery.rotationAngle -= 90;
	$('#photoEditImage').cropper('rotate', APP.models.gallery.rotationAngle);


}

function photoEditRotateRight(e) {
	e.preventDefault();
	//$('#photoEditImage').css('transform','rotate(' + 90 + 'deg)');
	APP.models.gallery.rotationAngle += 90;
	$('#photoEditImage').cropper('rotate', APP.models.gallery.rotationAngle);

}

function onHidePhotoEditor(e) {
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

	APP.models.gallery.currentPhoto.source = source;


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
	
	APP.models.gallery.chatPhoto = false;
	if (e.view.params.action !== undefined && e.view.params.action === 'chat') {
		APP.models.gallery.chatPhoto = true;
		mobileNotify("Please select an image to send...")
	}
	APP.models.gallery.rotationAngle = 0;
	
	if (APP.models.gallery.smallPreview) {
		$("#gallery-listview li").css("width","25%");
		$("#gallery-listview li").css("padding-bottom","25%");
	} else {
		$("#gallery-listview li").css("width","50%");
		$("#gallery-listview li").css("padding-bottom","50%");
	}

}

function galleryClick(e) {
	if (e !== undefined && e.preventDefault !== undefined) {
		e.preventDefault();
	}

	var photoId = e.dataItem.id, photoUrl = e.dataItem.imageUrl;
	APP.models.gallery.currentPhotoModel = getPhotoModel(photoId);
	$('#photoViewImage').attr('src', photoUrl);
	$('#photoTagImage').attr('src', photoUrl);
	$('#photoEditImage').attr('src', photoUrl);

	if (APP.models.gallery.chatPhoto) {
		showChatImagePreview(photoUrl);
		APP.kendo.navigate('#:back');

	} else {
		APP.kendo.navigate('#photoView');
	}

}


function getPhotoModel(photoId) {
	 var dataSource = APP.models.gallery.photosDS;
    dataSource.filter( { field: "photoId", operator: "eq", value: photoId });
    var view = dataSource.view();
    var photo = view[0];
	dataSource.filter([]);
	
	return(photo);
}

function photoExport (e) {
	e.preventDefault();
	var photo = APP.models.gallery.currentPhotoModel;
	
}

function photoDelete (e) {
	e.preventDefault();
	var photo = APP.models.gallery.currentPhotoModel;
	// Todo:  Add confirmation prior to photo delete
	
	// Delete from local datasource
	APP.models.gallery.photosDS.remove(APP.models.gallery.currentPhotoModel);
	// Remove from isotope and then rerender the layout
	//$('#gallery-grid').isotope( 'remove', APP.models.gallery.currentIsoModel ).isotope('layout');
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

	APP.models.gallery.smallPreview = false;
	$("#gallery-listview li").css("width","50%");
	$("#gallery-listview li").css("padding-bottom","50%");
	//$("#galleryPicker-listview").data("kendoMobileListView").refresh();

}

function galleryZoomOut (e)  {
	if (e !== undefined && e.preventDefault !== undefined) {
		e.preventDefault();
	}
	
	APP.models.gallery.smallPreview = true;
	$("#gallery-listview li").css("width","25%");
	$("#gallery-listview li").css("padding-bottom","25%");
	//$("#galleryPicker-listview").data("kendoMobileListView").refresh();

}
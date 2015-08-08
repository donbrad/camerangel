function onInitGallery(e){
   if (e !== undefined && e.preventDefault !== undefined){
		e.preventDefault();
	}
    // ToDo: Initialize list view
    var itemWidth = $(window).width()/4;
	APP.models.gallery.rotationAngle = 0;
	APP.models.gallery.optionsHidden = true;
	APP.models.gallery.previewSize = "33%";
	APP.models.gallery.optionsShown = true;


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
	$("#gallery-listview").addClass("hidden");

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
	

	if (APP.models.gallery.optionsShown) {
		$("#galleryToggle").velocity("fadeOut",{duration: 150});
		$('.gallerySearchOptions').velocity("slideDown",{duration: 300});
		$("#galleryZoomSelect > li:first-child").velocity("fadeIn", {duration: 300});
		APP.models.gallery.optionsShown = false;
		$("#gallerySearch").focus();
	} else {
		$('.gallerySearchOptions').velocity("slideUp",{duration: 300});
		$("#galleryToggle").velocity("fadeIn",{delay: 150, duration: 150});
		$("#galleryZoomSelect > li:first-child").velocity("fadeOut", {duration: 300});
		//$('#gallerySearchOptions').removeClass('hidden');
		APP.models.gallery.optionsShown = true;
		
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
			APP.models.gallery.previewSize = "33%";
			$("#gallery-listview li").css("width","33%");
			$("#gallery-listview li").css("padding-bottom","33%");
			break;
		case 1:
			APP.models.gallery.previewSize = "50%";
			$("#gallery-listview li").css("width","50%");
			$("#gallery-listview li").css("padding-bottom","50%");
			break;
		case 2:
			APP.models.gallery.previewSize = "100%";
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
	if (e !== undefined && e.preventDefault !== undefined)
		e.preventDefault();
	//$('#photoEditImage').css('transform','rotate(' + -90 + 'deg)');'
	APP.models.gallery.rotationAngle -= 90;
	$('#photoEditImage').cropper('rotate', APP.models.gallery.rotationAngle);


}

function photoEditRotateRight(e) {
	if (e !== undefined && e.preventDefault !== undefined)
		e.preventDefault();
	//$('#photoEditImage').css('transform','rotate(' + 90 + 'deg)');
	APP.models.gallery.rotationAngle += 90;
	$('#photoEditImage').cropper('rotate', APP.models.gallery.rotationAngle);

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
	

	$("#gallery-listview li").css("width",APP.models.gallery.previewSize);
	$("#gallery-listview li").css("padding-bottom",APP.models.gallery.previewSize);


	switch(APP.models.gallery.previewSize) {
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


function gallerySelectCategory(e){
	 var index = this.current().index();
	 switch(index) {
	 case 0:
	 	$(".gallerySearchOptions").velocity("slideDown");
	 	$("#galleryPhotoDisplayOpts").velocity("slideUp");
	 	$("#gallery-listview").addClass("hidden");
	 	break;

	 case 1:
	 	$(".gallerySearchOptions").velocity("slideUp");
	 	//$("#gallerySearchToolSelect").addClass("hidden");
	 	$("#galleryPhotoDisplayOpts").velocity("slideDown");
	 	$("#gallerySearch").attr("placeholder", "Seach");
	 	$("#gallery-listview").removeClass("hidden");
	 	break;
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
	$("#gallery-listview li").css("width","33%");
	$("#gallery-listview li").css("padding-bottom","33%");
	//$("#galleryPicker-listview").data("kendoMobileListView").refresh();

}
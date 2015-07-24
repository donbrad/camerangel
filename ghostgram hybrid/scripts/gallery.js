function onInitGallery(e){
    e.preventDefault();
    // ToDo: Initialize list view
    var itemWidth = $(window).width()/4;
	APP.models.gallery.rotationAngle = 0;

	 $('#gallery-grid').attr('width', $(window).width());
     $('#gallery-grid').isotope({
		itemSelector: '.gallery-item',
		 isInitLayout: false,
	   percentPosition: true,
		getSortData: {
    		timestamp: '[data-timestamp]'
   
  		},
		 sortDescending: {
    		timestamp: true
		 },
		  masonry: {
        	columnWidth: '.gallery-sizer'
      		}
		});
	
	$( "#galleryDateSelect" ).change(function () {
		var grid =  $('#gallery-grid'), isotope = grid.data('isotope');
		var dateStr = $( "#galleryDateSelect option:selected" ).val();
		if (dateStr === 'newest') {
			$('#gallery-grid').isotope({
			  sortBy: 'timestamp',
			  sortAscending: false
			});

		} else {
			$('#gallery-grid').isotope({
			  sortBy: 'timestamp',
			  sortAscending: true
			});
		}
	});

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
	//$('#photoEditImage').css('transform','rotate(' + -90 + 'deg)');
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

	var grid = $('#gallery-grid'), isotope = grid.data('isotope');
	var itemWidth = $(window).width()/4;
	itemWidth -= 2;  // account for the borders

	//Clear out previous content
	$('.gallery-item').off();
	grid.empty();
		
	var photoArray = APP.models.gallery.photosDS.data();
	
	for (var i=0; i< photoArray.length; i++) {
		var element = '<div class="gallery-item" id="' + photoArray[i].photoId  + '" data-timestamp="' + photoArray[i].timestamp + '" data-imageurl="' + photoArray[i].imageUrl + '" style="height: auto; width='+ itemWidth +
				'px;" >  <img src="' + photoArray[i].thumbnailUrl + '"/> </div>';
		grid.append(element);
		isotope.insert([$('#'+photoArray[i].photoId)]);
		
	}
	//isotope.insert(photoArray);
	//isotope.arrange();

	$('.gallery-item').click(function () {
		var photoUrl = this.attributes['data-imageurl'].value;
		var photoId = this.id;
		
		APP.models.gallery.currentPhotoModel = getPhotoModel(photoId);
		APP.models.gallery.currentIsoModel = this;
		
		$('#photoViewImage').attr('src', photoUrl);
		$('#photoTagImage').attr('src', photoUrl);
		$('#photoEditImage').attr('src', photoUrl);
		if (APP.models.gallery.chatPhoto) {
			showChatImagePreview(photoUrl);
			APP.kendo.navigate('#:back');
			
		} else {
			APP.kendo.navigate('#photoView');
		}
		//$('#photoEditor').kendoMobileModalView("open");
	});

	$('#gallery-grid').imagesLoaded( function() {
		// images have loaded
		$('#gallery-grid').isotope('layout');
	});
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
	$('#gallery-grid').isotope( 'remove', APP.models.gallery.currentIsoModel ).isotope('layout');
	// Delete from remote parse collection
	deleteParseObject('photos', 'photoId', photo.photoId);
	
	mobileNotify("Deleted current photo");
	
	// Navigate to previous page as the photo is gone...
	APP.kendo.navigate('#:back');
}


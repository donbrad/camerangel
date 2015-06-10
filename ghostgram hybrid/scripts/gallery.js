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
	
	$('#photoEditImage').attr('src', cropUrl);
	
	
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
	e.preventDefault();

	/*
	var canvas = new fabric.Canvas('photoEditCanvas');
	var imgElement = document.getElementById('photoEditImage');
	var imgInstance = new fabric.Image(imgElement);
	canvas.add(imgInstance);
	*/
	$('#photoEditImage').cropper('destroy');
	
	$('#photoEditImage').cropper();
}

function onShowGallery(e) {
	e.preventDefault();
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

		$('#photoViewImage').attr('src', photoUrl);
		$('#photoTagImage').attr('src', photoUrl);
		$('#photoEditImage').attr('src', photoUrl);
		APP.kendo.navigate('#photoView');
		//$('#modalview-photoView').kendoMobileModalView("open");
	});

	$('#gallery-grid').imagesLoaded( function() {
		// images have loaded
		$('#gallery-grid').isotope('layout');
	});
}


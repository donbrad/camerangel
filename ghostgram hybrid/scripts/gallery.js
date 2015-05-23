function onInitGallery(e){
    e.preventDefault();
    // ToDo: Initialize list view
    
     $('#gallery-grid').isotope({
	  // options
		  itemSelector: '.gallery-item',
		  layoutMode: 'packery'
	});
	}


function onShowGallery(e) {
	e.preventDefault();
	var grid = $('#gallery-grid');
	//Clear out previous content
	grid.empty();
	
	var photoArray = APP.models.gallery.photosDS.data();
	
	for (var i=0; i< photoArray.length; i++) {
		grid.append('<div class="gallery-item"> <img id=" + photoArray[i].photoId + '" src="' + photoArray[i].thumb + '"/> </div>');
	}
	
}


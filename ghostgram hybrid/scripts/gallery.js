function onInitGallery(e){
    e.preventDefault();
    // ToDo: Initialize list view
    var itemWidth = $(window).width()/3;
	
	 //$('#gallery-grid').attr('width', $(window).width());
     $('#gallery-grid').isotope({
		itemSelector: '.gallery-item',
		layoutMode: 'packery',
		  masonry: {
        	columnWidth: itemWidth
      		}
		});
	
	}


function onShowGallery(e) {
	e.preventDefault();
	var grid = $('#gallery-grid'), isotope = grid.data('isotope');
	var itemWidth = $(window).width()/3;
	itemWidth -= 2;  // account for the borders
	
	//Clear out previous content
	grid.empty();
	
	var photoArray = APP.models.gallery.photosDS.data();
	
	for (var i=0; i< photoArray.length; i++) {
		grid.append('<div class="gallery-item" style="height: auto; width='+ itemWidth +  'px;" > <img  id="' 
					+ photoArray[i].photoId + '" src="' + photoArray[i].thumbnailUrl + '"/> </div>');
	}
	
	isotope.layout();
}


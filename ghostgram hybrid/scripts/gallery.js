function onInitGallery(e){
    e.preventDefault();
    // ToDo: Initialize list view
    var itemWidth = $(window).width()/4;


	 $('#gallery-grid').attr('width', $(window).width());
     $('#gallery-grid').isotope({
		itemSelector: '.gallery-item',
		 isInitLayout: false,
		layoutMode: 'packery',
		getSortData: {
    		timestamp: '[data-timestamp]'
   
  		},
		 sortDescending: {
    		timestamp: true
		 },
		  masonry: {
        	columnWidth: itemWidth
      		}
		});
	
	$( "#galleryDateSelect" ).change(function () {
		var grid =  $('#gallery-grid'), isotope= grid.data('isotope');
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

	$('.gallery-item').click(function () {
		var photoUrl = this.

		$('#photoViewImage').attr('src', photoUrl);
		$('#photoImage').attr('src', photoUrl);
		$('#modalview-photoView').kendoMobileModalView("open");
	});
}


function onShowGallery(e) {
	e.preventDefault();
	var grid = $('#gallery-grid'), isotope = grid.data('isotope');
	var itemWidth = $(window).width()/4;
	itemWidth -= 2;  // account for the borders
	
	//Clear out previous content
	grid.empty();
	
	var photoArray = APP.models.gallery.photosDS.data();
	
	for (var i=0; i< photoArray.length; i++) {
		var element = '<div class="gallery-item" id="' + photoArray[i].photoId  + '" data-timestamp="' + photoArray[i].timestamp + '" style="height: auto; width='+ itemWidth +  
				'px;" >  <img src="' + photoArray[i].thumbnailUrl + '"/> </div>';
		grid.append(element);
		isotope.insert([$('#'+photoArray[i].photoId)]);
		
	}
	//isotope.insert(photoArray);
	isotope.arrange();
}


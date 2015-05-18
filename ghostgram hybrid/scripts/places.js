function onInitPlaces(e) {
     $("#places-listview").kendoMobileListView({
        dataSource: APP.models.places.placesDS,
        template: $("#placesTemplate").html(),
        click: function (e) {
            var place = e.dataItem;
           APP.models.places.currentPlace = place;
			
         
        }
     });	
}

function onShowPlaces(e) {
	
}

function onInitFindPlace(e) {

	 APP.models.places.googlePlaces = new google.maps.places.PlacesService(APP.map.googleMap);
	APP.models.places.autocomplete = new google.maps.places.Autocomplete(document.getElementById('placeSearchQuery'));
   

  	google.maps.event.addListener(APP.models.places.autocomplete, 'place_changed', onPlaceChanged);
	
     $("#findplace-listview").kendoMobileListView({
        dataSource: APP.models.places.geoPlacesDS,
        template: $("#geoPlacesTemplate").html(),
        click: function (e) {
            var place = e.dataItem;
			place.lat = APP.location.position.coords.latitude;
			place.lng = APP.location.position.coords.longitude;
			// Todo: add lat/lng for this location
           APP.models.places.currentGeoPlace = place;
			$('#addPlaceAddress').val(place.formatted_address);
			  $("#modalview-addPlace").kendoMobileModalView("open");
           
        }
     });
}

function onPlaceChanged() {
	var place = APP.models.places.autocomplete.getPlace();
 	APP.models.places.currentGeoPlace = place;
	
	APP.map.geocoder.geocode( { 'address': place.formatted_address}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        
		  APP.models.places.currentGeoPlace.lat = results[0].geometry.location[0];
		  APP.models.places.currentGeoPlace.lng = results[0].geometry.location[1];
		  $('#addPlaceAddress').val(place.formatted_address);
		   $("#modalview-addPlace").kendoMobileModalView("open");
      
      } else {
        mobileNotify("Geocode was not successful for the following reason: " + status);
      }
    });
	

}


function onShowFindPlace(e) {
	
	
}
function onInitAddPlace(e) {
	
}

function onShowAddPlace(e) {
	e.preventDefault();
	
	var place = APP.models.places.currentGeoPlace;
	
	$('#addPlaceAddress').val(place.formatted_address);
	
}

function addPlaceAdd(e) {
	 var Places = Parse.Object.extend("places");
    var place = new Places();
	var guid = uuid.v4();
	
	place.set('uuid', guid);
	place.set('googleId', APP.models.places.currentGeoPlace.place_id);
	place.set('name', $('#addPlaceName').val());
	place.set('address', $('#addPlaceAddress').val());
	place.set('privacy', $('#addPlacePrivacy').val());
	place.set('visible', $('#addPlaceVisible').val());
	place.set('lat',  APP.models.places.currentGeoPlace.lat);
	place.set('lng', APP.models.places.currentGeoPlace.lng);
	
	place.save(null, {
	  success: function(place) {
		// Execute any logic that should take place after the object is saved.
		 $("#modalview-addPlace").kendoMobileModalView("close");
		mobileNotify('Added place : ' + place.get('name'));
		APP.models.places.placesDS.add(place.attributes); 
		APP.kendo.navigate('#places');
	  },
	  error: function(contact, error) {
		// Execute any logic that should take place if the save fails.
		// error is a Parse.Error with an error code and message.
		  handleParseError(error);
	  }
	});
 

}
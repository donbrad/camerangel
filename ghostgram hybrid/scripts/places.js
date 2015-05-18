function onInitPlaces(e) {
     $("#places-listview").kendoMobileListView({
        dataSource: APP.models.places.placesDS,
        template: $("#placesTemplate").html(),
        click: function (e) {
            var place = e.dataItem;
           APP.models.places.currentPlace = place;
			
           $("#modalview-addPlace").kendoMobileModalView("open");
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
			// Todo: add lat/lng for this location
           APP.models.places.currentGeoPlace = place;
			
           
        }
     });
}

function onPlaceChanged() {
	var place = autocomplete.getPlace();
 	APP.models.places.currentGeoPlace = place;

}


function onShowFindPlace(e) {
	
	
}
function onInitAddPlace(e) {
	
}

function onShowAddPlace(e) {
	var place = APP.models.places.geoPlacesDS;
	
	$('#addPlaceAddress').val(place.formatted_address);
	
}

function addPlaceAdd(e) {
	 var Places = Parse.Object.extend("places");
    var place = new Places();
	var uuid = guid.v4();
	
	place.set('uuid', uuid);
	place.set('name', $('#addPlaceName').val());
	place.set('address', $('#addPlaceAddress').val());
	place.set('privacy', $('#addPlacePrivacy').val());
	place.set('visible', $('#addPlaceVisible').val());
	place.set('lat', APP.location.position.coord.latitude);
	place.set('lng', APP.location.position.coord.longitude);
	
	place.save(null, {
	  success: function(place) {
		// Execute any logic that should take place after the object is saved.
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
function onInitPlaces(e) {
	
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
	
	
}
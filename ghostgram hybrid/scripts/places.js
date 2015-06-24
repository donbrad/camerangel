
function onInitPlaces(e) {
	e.preventDefault();


	var dataSource = APP.models.places.placeListDS;

	// Activate clearsearch and zero the filter when it's called
	$('#placeSearchQuery').clearSearch({
		callback: function() {
			dataSource.data([]);
			dataSource.data(APP.models.places.placesDS.data());
			dataSource.filter([]);
			APP.models.places.geoPlacesDS.data([]);

		}
	});

	// Filter current places and query google places on keyup
	$('#placeSearchQuery').keyup(function() {
		var query = this.value;
		if (query.length > 0) {
			dataSource.filter(  {"logic":"or",
				"filters":[
					{
						"field":"address",
						"operator":"contains",
						"value":query},
					{
						"field":"name",
						"operator":"contains",
						"value":query}
				]});

		} else {
			dataSource.data([]);
			APP.models.places.geoPlacesDS.data([]);
			dataSource.data(APP.models.places.placesDS.data());
			dataSource.filter([]);
		}
	});



     $("#places-listview").kendoMobileListView({
        dataSource: APP.models.places.placeListDS,
		 headerTemplate: "${value}",
		 fixedHeaders: true,
        template: $("#placesTemplate").html(),
        click: function (e) {
            var place = e.dataItem;
           	APP.models.places.currentPlace = place;
			$("#placesActions").data("kendoMobileActionSheet").open();
			
         
        }
     });	
}

function doEditPlace (e) {
	if (e.preventDefault !== undefined)
		e.preventDefault();

	APP.kendo.navigate('#editPlace');
}

function doDeletePlace (e) {
	if (e.preventDefault !== undefined)
		e.preventDefault();

	deleteParseObject("places", 'uuid', APP.models.places.currentPlace.uuid);
	APP.models.places.placesDS.remove(APP.models.places.currentPlace);
}

function doCheckInPlace (e) {
	if (e.preventDefault !== undefined)
		e.preventDefault();
}

function onShowPlaces(e) {
	if (e.preventDefault !== undefined)
		e.preventDefault();
}

function onShowEditPlace(e) {
	if (e.preventDefault !== undefined)
		e.preventDefault();
}

function parseAddress(address) {
	var addrArray = address.split(',');
	var addrObject = new Object();
	
	if (addrArray.length === 4) {
		addrObject.address = addrArray[0];
		addrObject.city= addrArray[1];
		addrObject.state= addrArray[2];
		addrObject.zipcode= addrArray[3];
	} else {
		addrObject.name = addrArray[0];
		addrObject.address = addrArray[1];
		addrObject.city= addrArray[2];
		addrObject.state= addrArray[3];
		addrObject.zipcode= addrArray[4];
	}
	
	
	return(addrObject);
	
}

function goPlaceSearchQuery (e) {
	if (e.preventDefault !== undefined)
		e.preventDefault();
}

function onLocateMe(e) {
	if (e.preventDefault !== undefined)
		e.preventDefault();

	placesGPSSearch(function (results, status) {
		if (status === null && results !== null) {

		} else {
			mobileNotify("Places lookup error: " + status);
		}
	});

}

function placesGPSSearch (callback) {
	var request = {
		location: new google.maps.LatLng(APP.location.position.coords.latitude, APP.location.position.coords.longitude),
		radius: 500
	};

	APP.models.places.googlePlaces.nearbySearch(request,function (results, status) {
		if (status == google.maps.places.PlacesServiceStatus.OK) {
			callback(results, null);
		} else {
			callback(null, status)
		}
	});
}

function onInitFindPlace(e) {
	if (e.preventDefault !== undefined)
		e.preventDefault();
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
			var addressObj = parseAddress(place.formatted_address);
			$('#addPlaceName').val(place.name);
			$('#addPlaceAddress').val(addressObj.address + ", " + addressObj.city + ", " + addressObj.state);
			 $("#modalview-addPlace").kendoMobileModalView("open");
           
        }
     });
}

function onPlaceChanged() {
	var place = APP.models.places.autocomplete.getPlace();
 	APP.models.places.currentGeoPlace = place;

	APP.models.places.currentGeoPlace.lat = place.geometry.location.A;
	APP.models.places.currentGeoPlace.lng = place.geometry.location.F;
	var addressObj = parseAddress(place.formatted_address);
	$('#addPlaceAddress').val(addressObj.address + ", " + addressObj.city + ", " + addressObj.state);
	$('#addPlaceName').val(place.name);
	$("#modalview-addPlace").kendoMobileModalView("open");

}

function onLocateMe(e) {
	if (e.preventDefault !== undefined)
		e.preventDefault();

}

function onShowFindPlace(e) {
	if (e.preventDefault !== undefined)
		e.preventDefault();
	
}

function onInitAddPlace(e) {
	if (e.preventDefault !== undefined)
		e.preventDefault();
}

function onShowAddPlace(e) {
	if (e.preventDefault !== undefined)
		e.preventDefault();
	var place = APP.models.places.currentGeoPlace;
	
	$('#addPlaceAddress').val(place.formatted_address);
	
}

function addPlaceAdd(e) {
	if (e.preventDefault !== undefined)
		e.preventDefault();

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
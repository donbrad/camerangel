
function onInitPlaces(e) {
	e.preventDefault();



	var dataSource = APP.models.places.placeListDS;

	dataSource.data(APP.models.places.placesDS.data());

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

function onShowCheckIn(e) {
	if (e.preventDefault !== undefined)
		e.preventDefault();

}

function doCheckIn(e) {
	if (e.preventDefault !== undefined)
		e.preventDefault();

}

function updateCurrentLocation (loc) {
	if (loc.uuid !== undefined && loc.uuid === APP.models.places.current.get('uuid')) {
		return;
	} else {
		loc.uuid = uuid.v4();

		var current = APP.models.places.current;

		current.set('address', loc.address);
		current.set('category', loc.category);
		current.set('name', loc.name ? loc.name : '');
		current.set('lat', loc.lat);
		current.set('lat', loc.lng);
		current.set('factualId', loc.factualId ? loc.factualId : '');
		current.set('privacy', loc.privacy ? loc.privacy : "false");
		current.set('visible', loc.visible ? loc.visible : "true");
	}
}
function onLocateMe(e) {
	if (e.preventDefault !== undefined)
		e.preventDefault();

	var latlng = new google.maps.LatLng(APP.location.position.lat, APP.location.position.lng);
	APP.models.places.geoPlacesDS.data([]);
	var locationsArray = [], placesArray = [];

	var thisLocation = '';

	// Is current location an existing user location?
	locationsArray = matchLocationToUserPlace(APP.location.position.lat, APP.location.position.lng);
	if (locationsArray.length !== 0) {
		thisLocation = locationsArray[0];
		updateCurrentLocation(thisLocation);

	} else {
		var loc = {};
		// Reverse Geocode first to ensure we have a valid address
		APP.map.geocoder.geocode({'latLng': latlng}, function(results, status) {
			if (status == google.maps.GeocoderStatus.OK) {
				if (results.length > 0) {
					var number = '', street = '', city='', state = '', zip = '';
					loc = {};

					loc.category = "Location";
					loc.googleId = results[0].place_id;
					loc.name = "Address";
					loc.lat = results[0].geometry.location.A;
					loc.lng = results[0].geometry.location.F;

					for (var i=0; i<results[0].address_components.length; i++) {
						if (results[0].address_components[i].types.length > 0) {

							switch (results[0].address_components[i].types[0]) {
								case "street_number" :
									number = results[0].address_components[i].long_name + " ";
									break;

								case "route" :
									street = results[0].address_components[i].long_name + ", ";
									break;

								case "locality" :
									city = results[0].address_components[i].long_name + ", ";
									break;

								case "administrative_area_level_1" :
									state = results[0].address_components[i].short_name;
									break;

								case "postal_code" :
									zip = "  " + results[0].address_components[i].long_name;
									break;


							}
						}
					}

					loc.address = number + street + city + state + zip;
					APP.models.places.geoPlacesDS.add(loc);

					// add this results to the locationsDS
					locationsArray = results;
					placesGPSSearch(function (results, status) {
						if (status === null && results !== null) {
							if (results.length !== 0) {
								for (var j=0; j<results.length; j++) {
									if (results[j].types[results[j].types.length-1] === 'establishment') {
										loc = {};
										loc.category = "Place";
										loc.googleId = results[j].place_id;
										loc.name = results[j].name;
										loc.address = results[j].vicinity;
										loc.lat = results[j].geometry.location.A;
										loc.lng = results[j].geometry.location.F;
										APP.models.places.geoPlacesDS.add(loc);
									}
								}
							}
						}
					});
				} else {
					mobileNotify('No results found for locaiton');
				}
			} else {
				mobileNotify('Geocoder failed with: ' + status);
			}
		});
	}

}
function matchLocationToUserPlace  (lat, lng) {
	var array = APP.models.places.placesDS.data(), matchArray = [];

	for (var i=0; i< array.length; i++){
		if (inPlaceRadius(lat, lng, array[i].lat,array[i].lng, 50)){
			matchArray.push(array[i]);
		}
	}

	return(matchArray);
}

function placesGPSSearch (callback, radius) {

	if (radius === undefined)
		radius = 50;

	var request = {
		location: new google.maps.LatLng(APP.location.position.lat, APP.location.position.lng),
		radius: radius
	};

	APP.map.googlePlaces.nearbySearch(request,function (results, status) {
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

	APP.models.places.autocomplete = new google.maps.places.Autocomplete(document.getElementById('placeSearchQuery'));
   

  	google.maps.event.addListener(APP.models.places.autocomplete, 'place_changed', onPlaceChanged);
	
     $("#findplace-listview").kendoMobileListView({
        dataSource: APP.models.places.geoPlacesDS,
        template: $("#geoPlacesTemplate").html(),
        click: function (e) {
            var place = e.dataItem;
			place.lat = APP.location.position.lat;
			place.lng = APP.location.position.lng;
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

function getDistanceInKm  (lat1, lon1, lat2, lon2) {
	var R = 6371; // Radius of the earth in km
	var dLat = this.deg2rad(lat2-lat1);  // deg2rad below
	var dLon = this.deg2rad(lon2-lon1);
	var a =
			Math.sin(dLat/2) * Math.sin(dLat/2) +
			Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
			Math.sin(dLon/2) * Math.sin(dLon/2)
		;
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
	var d = R * c; // Distance in km
	return d;
}

function deg2rad (deg) {
	return deg * (Math.PI/180);
}
// Are two points withing a specific distance
function inPlaceRadius (lat1, lng1, lat2, lng2, radius) {

	if (radius === undefined || radius < 10) {
		radius = 30;
	}

	if (typeof lat1 === 'string') {
		lat1 = Number(lat1);
		lng1 = Number(lng1);
	}

	if (typeof lat2 === 'string') {
		lat2 = Number(lat2);
		lng2 = Number(lng2);
	}

	var distance = getDistanceInKm(lat1, lng1, lat2, lng2) * 1000;

	if (distance <= radius) {
		return true;
	} else {
		return false;
	}
}


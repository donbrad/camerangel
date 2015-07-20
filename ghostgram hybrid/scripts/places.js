function onInitPlaces(e) {
	e.preventDefault();

	navigator.geolocation.getCurrentPosition( function (position) {
		var geocoder = new google.maps.Geocoder();
		var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
		geocoder.geocode({ 'latLng': latlng }, function (results, status) {
			if (status !== google.maps.GeocoderStatus.OK) {
				navigator.notification.alert('Something went wrong with the Google geocoding service.');
				return;
			}
			if (results.length === 0) {
				navigator.notification.alert('We couldn\'t locate you.');
				return;
			}

			var locations = matchLocationToUserPlace(position.coords.latitude, position.coords.longitude);
			if (locations.length === 0) {
				return;
			}

			checkInTo(locations[0]);
		});
	});

	$('#nearby-results-list').kendoMobileListView({
		template: $("#placesTemplate").html(),
		click: function (e) {

			APP.models.places.places.filter({
				field: 'googleId',
				operator: 'eq',
				value: e.dataItem.googleId
			});

			// If matches current place, check in to that
			var view = APP.models.places.places.view();
			if (view.length > 1) {
				checkInTo(view[0]);
				return;
			}

			// Otherwise, add place, sync
			e.dataItem.uuid = uuid.v4();
			var newPlace = APP.models.places.places.add(e.dataItem);
			APP.models.places.places.sync();
			checkInTo(e.dataItem);

			$('#nearby-results').data('kendoMobileModalView').close();
		}
	});

	// Activate clearsearch and zero the filter when it's called
	$('#placeSearchQuery').clearSearch({
		callback: function() {
			APP.models.places.placeListDS.data(APP.models.places.placesDS.data());
			APP.models.places.placeListDS.filter({});
			APP.models.places.geoPlacesDS.data([]);

		}
	});

	// Filter current places and query google places on keyup
	$('#placeSearchQuery').keyup(function() {
		var query = this.value;
		if (query.length > 0) {
			APP.models.places.placeListDS.filter(  {"logic":"or",
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
			APP.models.places.geoPlacesDS.data([]);
			APP.models.places.placeListDS.data(APP.models.places.placesDS.data());
			APP.models.places.placeListDS.filter([]);
		}
	});

	var syncPlaces = function () {
		APP.models.places.places.sync();
	}

	var clickPlace = function (e) {
		if (APP.models.places.currentPlace !== undefined) {
			APP.models.places.currentPlace.unbind('change', syncPlaces);
		}
		APP.models.places.currentPlace = e.dataItem;
		APP.models.places.currentPlace.bind('change', syncPlaces);
		$("#placesActions").data("kendoMobileActionSheet").open();
	}

	$("#places-listview").kendoMobileListView({
		dataSource: APP.models.places.places,
		fixedHeaders: true,
		template: $("#placesTemplate").html(),
		click: function (e) {
			$('#check-out').hide();
			clickPlace(e);
		}
	});

	// Fake an event by binding
	$('#current-place > div').click( function () {
		$('#check-out').show();

		APP.models.places.places.filter({
			field: 'uuid',
			operator: 'eq',
			value: APP.models.profile.currentUser.currentPlaceUUID
		});

		var view = APP.models.places.places.view();
		clickPlace({
			dataItem: view[0]
		});

		resetPlacesFilter();
	});
}

function resetPlacesFilter() {
	if (APP.models.profile.currentUser.currentPlaceUUID === undefined) {
		APP.models.places.places.filter({});
		return;
	}

	APP.models.places.places.filter({
		field: 'uuid',
		operator: 'neq',
		value: APP.models.profile.currentUser.currentPlaceUUID
	});
}

function checkInTo(place) {
	APP.models.profile.currentUser.currentPlaceUUID = place.uuid;

	var templateText = $('#placesTemplate').text();
	var template = kendo.template(templateText);

	$('#current-place').show();
	$('#current-place > div').html(template(place));

	// Then filter out currently-checked-in-place
	resetPlacesFilter();
}


function checkOut() {
	APP.models.profile.currentUser.currentPlaceUUID = '';

	$('#current-place').hide();

	resetPlacesFilter();
}

function doEditPlace (e) {
	if (e.preventDefault !== undefined) {
		e.preventDefault();
	}

	APP.kendo.navigate('#editPlace');
}

// Tried everything to re-bind the editPlace view to a new model--nothing worked, so gotta do custom
// binding
function onShowEditPlace (e) {
	if (e.preventDefault !== undefined) {
		e.preventDefault();
	}

	$('#editPlaceName')
		.val(APP.models.places.currentPlace.name)
		.on('change', function () {
			APP.models.places.currentPlace.set('name', $('#editPlaceName').val());
		});

	if (APP.models.places.currentPlace.category === 'Street Address') {
		$('#editPlaceAddress').show().next('br').remove();
		$('#editPlaceAddress')
			.val(APP.models.places.currentPlace.streetNumber)
			.on('change', function () {
				APP.models.places.currentPlace.set('streetNumber', $('#editPlaceAddress').val());
			});

		$('#restOfAddress').html(
			APP.models.places.currentPlace.street + ', ' +
			APP.models.places.currentPlace.city + ', ' +
			APP.models.places.currentPlace.state
		);
	} else {
		$('#editPlaceAddress')
			.after('<br />')
			.hide();
		$('#restOfAddress').html(
			APP.models.places.currentPlace.streetNumber + ' ' +
			APP.models.places.currentPlace.street + ', ' +
			APP.models.places.currentPlace.city + ', ' +
			APP.models.places.currentPlace.state
		);
	}

	$('#editPlacePrivacy').data('kendoMobileSwitch').check(APP.models.places.currentPlace.privacy);
	$('#editPlacePrivacy').data('kendoMobileSwitch').bind('change', function () {
		APP.models.places.currentPlace.set('privacy', $('#editPlacePrivacy').data('kendoMobileSwitch').check());
	});

	$('#editPlaceVisible').data('kendoMobileSwitch').check(APP.models.places.currentPlace.visible);
	$('#editPlaceVisible').data('kendoMobileSwitch').bind('change', function () {
		APP.models.places.currentPlace.set('visible', $('#editPlaceVisible').data('kendoMobileSwitch').check());
	});
}

function onHideEditPlace (e) {
	if (e.preventDefault !== undefined) {
		e.preventDefault();
	}

	$('#editPlaceName').off('change');
	$('#editPlaceAddress').off('change');
	$('#editPlacePrivacy').data('kendoMobileSwitch').unbind('change');
	$('#editPlaceVisible').data('kendoMobileSwitch').unbind('change');

	$("#places-listview").data('kendoMobileListView').refresh();
	// "Refresh" the current place
	APP.models.places.places.filter({
		field: 'uuid',
		operator: 'eq',
		value: APP.models.profile.currentUser.currentPlaceUUID
	});
	var view = APP.models.places.places.view();
	if (view.length !== 0) {
		checkInTo(view[0]);
		resetPlacesFilter();
	}
}

function doDeletePlace (e) {
	if (e.preventDefault !== undefined) {
		e.preventDefault();
	}

	if (APP.models.places.currentPlace.get('uuid') === APP.models.profile.currentUser.currentPlaceUUID) {
		checkOut();
	}

	APP.models.places.places.remove(APP.models.places.currentPlace);
	APP.models.places.places.sync();
}

function goToChat (e) {
	if (e.preventDefault !== undefined) {
		e.preventDefault();
	}

	// Something

}

function onShowPlaces(e) {
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

function getAddressFromComponents(addressComponents) {
	var address = {};

	address.streetNumber = _.findWhere(addressComponents, { 'types': [ 'street_number' ] });
	address.streetNumber = address.streetNumber === undefined ? '' : address.streetNumber.short_name;

	address.street = _.findWhere(addressComponents, { 'types': [ 'route' ] });
	address.street = address.street === undefined ? '' : address.street.short_name;

	address.city = _.findWhere(addressComponents, { 'types': [ 'locality', 'political' ] });
	address.city = address.city === undefined ? '' : address.city.short_name;

	address.state = _.findWhere(addressComponents, { 'types': [ 'administrative_area_level_1', 'political' ] });
	address.state = address.state === undefined ? '' : address.state.short_name;

	address.zip = _.findWhere(addressComponents, { 'types': [ 'postal_code' ] });
	address.zip = address.zip === undefined ? '' : address.zip.short_name;

	address.country = _.findWhere(addressComponents, { 'types': [ 'country', 'political' ] });
	address.country = address.country === undefined ? '' : address.country.short_name;

	return address;
}

function onLocateMe(e) {
	if (e.preventDefault !== undefined) {
		e.preventDefault();
	}

	navigator.geolocation.getCurrentPosition( function (position) {
		var geocoder = new google.maps.Geocoder();
		var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

		var places = APP.map.googlePlaces;

		var locations = matchLocationToUserPlace(position.coords.latitude, position.coords.longitude);
		if (locations.length !== 0) {
			checkInTo(locations[0]);
			return;
		}

		places.nearbySearch({
			location: latlng,
			radius: 10,
			types: ['establishment']
		}, function (placesResults, placesStatus) {
			if (placesStatus === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
				geocoder.geocode({ 'latLng': latlng }, function (geoResults, geoStatus) {
					if (geoStatus !== google.maps.GeocoderStatus.OK) {
						navigator.notification.alert('Something went wrong with the Google geocoding service.');
						return;
					}
					if (geoResults.length === 0 || geoResults[0].types[0] !== 'street_address') {
						navigator.notification.alert('We couldn\'t match your position to a street address.');
						return;
					}

					navigator.notification.confirm(
						'Do you want to check into street address '+geoResults[0].formatted_address+'?',
						function () {

							var address = getAddressFromComponents(geoResults[0].address_components);

							var newPlace = APP.models.places.places.add({
								uuid: uuid.v4(),
								category: 'Street Address',
								placeId: '',
								name: '',
								streetNumber: address.streetNumber,
								street: address.street,
								city: address.city,
								state: address.state,
								zip: address.zip,
								country: address.country,
								googleId: '',
								factualId: '',
								lat: position.coords.latitude,
								lng: position.coords.longitude,
								publicName: '',
								alias: '',
								visible: true,
								privacy: true
							});

							APP.models.places.places.sync();

							checkInTo(newPlace);
						}
					)
					
				});

				return;
			} else if (placesStatus !== google.maps.places.PlacesServiceStatus.OK) {
				navigator.notification.alert('Something went wrong with the Google Places service. '+placesStatus);
				return;
			}

			var nearbyResults = new kendo.data.DataSource();

			placesResults.forEach( function (placeResult) {
				var placeLatLng = new google.maps.LatLng(placeResult.geometry.location.A, placeResult.geometry.location.F);
				geocoder.geocode({ 'latLng': placeLatLng }, function (geoResults, geoStatus) {
					if (geoStatus !== google.maps.GeocoderStatus.OK) {
						navigator.notification.alert('Something went wrong with the Google geocoding service.');
						return;
					}
					if (geoResults.length === 0 || geoResults[0].types[0] !== 'street_address') {
						navigator.notification.alert('We couldn\'t match your position to a street address.');
						return;
					}

					var address = getAddressFromComponents(geoResults[0].address_components);

					nearbyResults.add({
						uuid: uuid.v4(),
						category: 'Place',
						placeId: placeResult.place_id,
						name: placeResult.name,
						streetNumber: address.streetNumber,
						street: address.street,
						city: address.city,
						state: address.state,
						zip: address.zip,
						country: address.country,
						googleId: placeResult.id,
						factualId: '',
						lat: placeResult.geometry.location.A,
						lng: placeResult.geometry.location.F,
						publicName: placeResult.name,
						alias: '',
						visible: true,
						privacy: true
					});
				});
			});

			$('#nearby-results').data('kendoMobileModalView').open();
			$('#nearby-results-list').data('kendoMobileListView').setDataSource(nearbyResults);

			// Show modal letting user select current place

		});
	});
}

function closeNearbyResults() {
	$('#nearby-results').data('kendoMobileModalView').close();
}

function matchLocationToUserPlace  (lat, lng) {
	var placesData = APP.models.places.places.data();

	var matchArray = [];
	for (var i=0; i< placesData.length; i++){
		if (inPlaceRadius(lat, lng, placesData[i].lat,placesData[i].lng, 50)){
			matchArray.push(placesData[i]);
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
// Are two points within a specific distance
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

function onShowFindPlace() {
	
}

function findplaceTest() {
	setTimeout(function(){
		$("#modalview-places-locate").data("kendoMobileModalView").close();
		APP.kendo.navigate('#places-checkIn');
	}, 2000);
	
	
}

// Auto check in
function autoCheckInChange(e) {
	console.log(e.checked);
}



/**
 * Created by donbrad on 9/24/15.
 * mapModel.js
 */
'use strict';

var mapModel = {

    lat: null,
    lng: null,
    latlng : null,

    currentAddress : null,   // Current physical address - location
    currentCity: null,
    currentState : null,
    currentZipcode : null,
    currentPlace: null,       // currentPlace Object - null if none
    currentPlaceId: null,     // currentplace UUID - null if none
    currentGoogleId : null,
    currentPlaceName : null,

    matchedPlaces: null,   // places that match the current lat/lng

    isCheckedIn: false,         // true if user is checked in at current place
    newLocationDetected: false,         // has the user been prompted to check in here
    wasPrompted: false,         // has the user been prompted to check in here

    gpsOptions : {enableHighAccuracy : true, timeout: 5000, maximumAge: 10000},
    lastPosition: {},
    lastPingSeconds : null,
    _pingInterval: 300, //Ping debounce interval in seconds.  app will only get position after _pingInterval seconds
    _radiusCheckIn : 1000,
    _radiusNewLocation : 300,
    _boundsCheckIn : null,
    _location : null,

    geocoder : null,
    mapOptions : {zoom: 14,  center: { lat: 42.1347293 , lng: -91.1362623}},
    googleMap : null,
    googlePlaces : null,


    init: function () {

        mapModel.lastPingSeconds = ggTime.currentTimeInSeconds() - 11;

        var location = window.localStorage.getItem('ggLastPosition');

        if (location !== undefined && location !== null) {
            mapModel.lastPosition = JSON.parse(location);
            mapModel.lat = mapModel.lastPosition.lat;
            mapModel.lng = mapModel.lastPosition.lng;
        } else {
            mapModel.lastPosition = {
                lat: 42.1347293,
                lng: -91.1362623
            };
        }

        mapModel.mapOptions.center.lat =  mapModel.lat;
        mapModel.mapOptions.center.lng =  mapModel.lng;


        mapModel.googleMap = new google.maps.Map(document.getElementById('map-mapdiv'), mapModel.mapOptions);
        mapModel.mapOptions.mapTypeId = google.maps.MapTypeId.ROADMAP;
        mapModel.geocoder =  new google.maps.Geocoder();
        mapModel.googlePlaces = new google.maps.places.PlacesService(mapModel.googleMap);

        mapModel.lastPingSeconds = ggTime.currentTimeInSeconds() + mapModel._pingInterval + 10;

        mapModel.getCurrentAddress(function (isNew, address){

            if (isNew) {
                mapModel.wasPrompted = false;
                mapModel.newLocationDetected = true;
           }

            mapModel.reverseGeoCode(mapModel.lat, mapModel.lng, function (results, error) {
                if (results !== null) {
                    var address = mapModel._updateAddress(results[0].address_components);
                    mapModel.currentAddress = address;
                    mapModel.currentCity = address.city;
                    mapModel.currentState = address.state;
                    mapModel.currentZipcode = address.zipcode;
                }
            });
        });

    },

    validNumber : function (number) {
       var validNum = 0;

        if (number === undefined || number === null) {
            return(validNum);
        } else {
            return(Number(number));
        }
    },

    setLatLng : function (lat, lng) {

        lat = mapModel.validNumber(lat);
        lng = mapModel.validNumber(lng);
        mapModel.lat = lat;
        mapModel.lng = lng;
        mapModel.lastPosition.lat = lat;
        mapModel.lastPosition.lng = lng;
        mapModel.latlng = new google.maps.LatLng(lat, lng);
    },

    isNewLocation : function (lat, lng) {
        lat = mapModel.validNumber(lat);
        lng = mapModel.validNumber(lng);
       return(! placesModel.inRadius(lat, lng, mapModel.lat, mapModel.lng, mapModel._radiusNewLocation));

    },

    checkOut : function () {
        mapModel.wasPrompted = false;
        mapModel.isCheckedIn = false;
        mapModel.currentPlaceId = null;
        mapModel.currentPlace = null;
        mapModel.currentPlaceName = null;
        mapModel.currentGoogleId = null;
    },

    checkIn : function (placeId, placeName, googleId) {

        if (placeId !== null) {
            mapModel.setCurrentPlace(placeId, true);
        } else {
            mapModel.currentPlaceName = placeName;
            mapModel.currentGoogleId = googleId;
            mapModel.currentPlaceId = null;
            mapModel.currentPlace = null;
        }
        mapModel.wasPrompted = true;
        mapModel.isCheckedIn = true;
    },

    isCurrentPlace: function () {
        if (mapModel.currentPlace !== null) {
            var deltaLat = Math.abs(mapModel.currentPlace.lat - mapModel.lat), deltaLng = Math.abs(mapModel.currentPlace.lng - mapModel.lng);

            if (deltaLat > placesModel._radius || deltaLng > placesModel._radius) {
                return(true);
            }

            return(false);

        }
    },

    setLocationAndBounds : function () {
        var geolocation = {
            lat: mapModel.lat,
            lng: mapModel.lng
        };

        mapModel._location = geolocation;
        var circle = new google.maps.Circle({
            center: geolocation,
            radius: mapModel._radiusCheckIn
        });

        var bounds = circle.getBounds();
        mapModel._boundsCheckIn = bounds;

    },


    // Return ggPlaces within radius of current lat / lng
    matchPlaces : function (callback) {

        var placeArray = placesModel.matchLocation(mapModel.lat, mapModel.lng);
        if (placeArray.length === 0) {
            mapModel.matchedPlaces = null;
        } else {
            mapModel.matchedPlaces = placeArray;
        }

        if (callback !== undefined) {
            callback(placeArray);
        }
    },

    getCheckInPlaces : function (callback) {

        var placeArray = placesModel.matchLocation(mapModel.lat, mapModel.lng);
        mapModel.setLocationAndBounds();

        mapModel.googlePlaces.nearbySearch({
            location: mapModel._location,
            radius: mapModel._radiusCheckIn
            //rankBy: google.maps.places.RankBy.DISTANCE

        }, function (results, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                results.forEach( function (result) {
                    var desObj = {ggType:"Venue", googleId: result.place_id};
                    var type = result.types[result.types.length-1];
                    desObj.lat = result.geometry.location.lat();
                    desObj.lng = result.geometry.location.lng();
                    if (type === 'establishment') {
                        desObj.title = result.name;
                        desObj.address = result.vicinity;
                        desObj.type = result.types[0];
                        placeArray.push(desObj);
                    } else if (type === 'political' ) {
                        desObj.title = result.name;
                        desObj.address = result.vicinity;
                        desObj.type = result.types[0];
                        placeArray.push(desObj);
                    } else {
                        desObj.title = "Unknown";
                        desObj.address = "Unknown";
                        desObj.type = 'Unknown';
                    }

                });
            }

            callback(placeArray);
        });


    },


    computePlaceDSDistance : function() {
        var length = placesModel.placesDS.total();

        for (var i=0; i< length; i++) {
            var place = placesModel.placesDS.at(i);
            var distance = getDistanceInMiles(mapModel.lat, mapModel.lng, place.lat, place.lng);
            place.set('distance', distance.toFixed(2));
        }

    },

    computePlaceDistance: function (placeUUID) {

        var placeModel = placesModel.getPlaceModel(placeUUID);
        if (placeModel !== undefined) {
            // computer and store distance in miles
            var distance = getDistanceInMiles(mapModel.lat, mapModel.lng, placeModel.lat, placeModel.lng);
            placeModel.set('distance', distance.toFixed(2));
        }

    },

    computePlaceArrayDistance : function (placeArray) {
        var distance = 0;
        for (var i=0; i<placeArray.length; i++) {
            if (mapModel.lat !== null && mapModel.lng !== null) {
                distance = getDistanceInMiles(mapModel.lat, mapModel.lng, placeArray[i].lat, placeArray[i].lng);

            }
            placeArray[i].distance = distance.toFixed(2);

        }
    },

    getCurrentAddress : function (callback) {

        mapModel.getCurrentPosition (function(lat, lng) {
            if (mapModel.isNewLocation(lat,lng)) {
                // User is at a new location
                var lat = parseFloat(position.coords.latitude.toFixed(6)), lng = parseFloat(position.coords.longitude.toFixed(6));
                mapModel._updatePosition(lat, lng);

                mapModel.reverseGeoCode(lat, lng, function (results, error) {
                    if (results !== null) {
                        var address = mapModel._updateAddress(results[0].address_components);
                        mapModel.currentAddress = address;
                        mapModel.currentCity = address.city;
                        mapModel.currentState = address.state;
                        mapModel.currentZipcode = address.zipcode;
                        if (callback !== undefined)
                            callback(true, address);
                    }
                });
            } else {
                callback(false, null);
            }
        });


    },

    setCurrentPlace : function (placeId, isCheckedIn) {
        mapModel.currentPlaceId = placeId;
        mapModel.currentPlace = placesModel.getPlaceModel(placeId);
        mapModel.currentGoogleId = mapModel.currentPlace.googleId;
        mapModel.currentPlaceName = mapModel.currentPlace.name;

        if (isCheckedIn !== undefined) {
            mapModel.isCheckedIn = isCheckedIn;
        }

    },

    _updateAddress : function (addressComponents) {
        var address = {};

        address.streetNumber = _.findWhere(addressComponents, { 'types': [ 'street_number' ] });
        address.streetNumber = address.streetNumber === undefined ? '' : address.streetNumber.short_name;

        address.street = _.findWhere(addressComponents, { 'types': [ 'route' ] });
        address.street = address.street === undefined ? '' : address.street.short_name;

        address.city = _.findWhere(addressComponents, { 'types': [ 'locality', 'political' ] });
        address.city = address.city === undefined ? '' : address.city.short_name;

        address.state = _.findWhere(addressComponents, { 'types': [ 'administrative_area_level_1', 'political' ] });
        address.state = address.state === undefined ? '' : address.state.short_name;

        address.zipcode = _.findWhere(addressComponents, { 'types': [ 'postal_code' ] });
        address.zipcode = address.zipcode === undefined ? '' : address.zipcode.short_name;

        address.country = _.findWhere(addressComponents, { 'types': [ 'country', 'political' ] });
        address.country = address.country === undefined ? '' : address.country.short_name;

        mapModel.currentAddress = address;
        return(address);
    },

    reverseGeoCode : function(lat,lng, callback) {
        var latlng = new google.maps.LatLng(lat, lng);

        mapModel.geocoder.geocode({
            'latLng': latlng
        }, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                callback(results, null);

            } else {
                mobileNotify('Geocoder failed with: ' + status);
                callback(null, status)
            }
        });

    },

    _updatePosition : function (lat, lng) {
        lat = mapModel.validNumber(lat);
        lng = mapModel.validNumber(lng);
        
        mapModel.lat = lat; mapModel.lng = lng;
        mapModel.latlng = new google.maps.LatLng(lat, lng);
        window.localStorage.setItem('ggLastPosition', JSON.stringify({lat: lat, lng: lng}));
        mapModel.lastPosition.lat = lat;
        mapModel.lastPosition.lng = lng;
    },

    getCurrentPosition : function (callback) {
        var currentPing = ggTime.currentTimeInSeconds();

        if (currentPing > mapModel.lastPingSeconds + mapModel._pingInterval) {
            mapModel.lastPingSeconds = ggTime.currentTimeInSeconds();
            var options = mapModel.gpsOptions;
            navigator.geolocation.getCurrentPosition(function (position) {
                // Mask lat / lng to 6 digits to standardize comparison results
                var lat = parseFloat(position.coords.latitude.toFixed(6)), lng = parseFloat(position.coords.longitude.toFixed(6));
                mapModel._updatePosition(lat, lng);

                callback(lat, lng);
            }, function (error) {
                mobileNotify("GPS error" + error.message);
                callback(0, 0);
            }, options);
        } else {
            callback(mapModel.lat, mapModel.lng);
        }

    },

    setMapCenter : function (lat, lng) {
        if (lat === undefined || lng === undefined) {
            return;
        }
        mapModel.googleMap.setCenter({lat : lat, lng: lng});

    }
};
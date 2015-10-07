/**
 * Created by donbrad on 9/24/15.
 * mapModel.js
 */
'use strict';

var mapModel = {

    lat: null,
    lng: null,
    latlng : null,

    currentAddress : {},   // Current physical address - location
    currentPlace: null,       // currentPlace Object - null if none
    currentPlaceId: null,     // currentplace UUID - null if none

    isCheckedIn: false,         // true if user is checked in at current place

    gpsOptions : {enableHighAccuracy : true, timeout: 5000, maximumAge: 10000},
    lastPosition: {},
    lastPingSeconds : null,
    _pingInterval: 10, //Ping debounce interval in seconds.  app will only get position after _pingInterval seconds

    geocoder : null,
    mapOptions : {zoom: 14,  mapTypeId : google.maps.MapTypeId.ROADMAP},
    googleMap : null,
    googlePlaces : null,


    init: function () {


        mapModel.geocoder =  new google.maps.Geocoder();
        mapModel.googleMap = new google.maps.Map(document.getElementById('map-mapdiv'), mapModel.mapOptions);
        mapModel.googlePlaces = new google.maps.places.PlacesService(mapModel.googleMap);

        mapModel.lastPingSeconds = ggTime.currentTimeInSeconds() - 11;

        var location = window.localStorage.getItem('ggLastPosition');

        if (location !== undefined && location !== null) {
            mapModel.lastPosition = JSON.parse(location);
            mapModel.lat = mapModel.lastPosition.lat;
            mapModel.lng = mapModel.lastPosition.lng;
        } else {
            mapModel.lastPosition = {
                lat: 0,
                lng: 0
            };
        }

        mapModel.getCurrentAddress(function (address){
           var places = placesModel.matchLocation(mapModel.lat, mapModel.lng);
            if (places.length === 0) {
                //No matching places so just return
                return;
            }

            if (places.length === 1) {
                // Just one matching place
                userModel.currentUser.currentPlaceUUID = places[0].uuid;
                userModel.currentUser.currentPlace = places[0].name;
                mobileNotify("Located you at " +  userModel.currentUser.currentPlace);

            } else {
                // Todo: don - Need to display multiple matching places for user to choose
            }
        });

        /*mapModel.getCurrentPosition(function(lat,lng) {

            if (lat !== 0 && lng !== 0) {

                mapModel.reverseGeoCode(lat, lng, function (results,error) {
                    if (results !== null) {

                    }
                });

            }
        })*/

    },

    setLatLng : function (lat, lng) {
        mapModel.lat = lat;
        mapModel.lng = lng;
        mapModel.lastPosition.lat = lat;
        mapModel.lastPosition.lng = lng;
        mapModel.latlng = new google.maps.LatLng(lat, lng);
    },

    getCurrentAddress : function (callback) {

        mapModel.getCurrentPosition (function(lat, lng) {
            mapModel.reverseGeoCode(lat, lng, function (results, error) {
                if (results !== null) {
                    var address = mapModel._updateAddress(results[0].address_components);
                    if (callback !== undefined)
                            callback(address);
                }
            });
        });


    },

    setCurrentPlace : function (placeId, isCheckedIn) {
        mapModel.currentPlaceId = placeId;
        mapModel.currentPlace = placeModel.getPlaceModel(placeId);

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
                // Mask lat / lng to 6 digits to standardize comparision results
                var lat = position.coords.latitude.toFixed(6), lng = position.coords.longitude.toFixed(6);
                mapModel._updatePosition(lat, lng);

                callback(lat, lng);
            }, function (error) {
                mobileNotify("GPS error" + error.message);
                callback(0, 0);
            }, options);
        } else {
            callback(mapModel.lat, mapModel.lng);
        }

    }
};
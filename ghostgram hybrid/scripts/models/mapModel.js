/**
 * Created by donbrad on 9/24/15.
 * mapModel.js
 */
'use strict';

var mapModel = {

    lat: null,
    lng: null,
    latlng : null,
    currentAddress : null,
    gpsOptions : {enableHighAccuracy : true, timeout: 5000, maximumAge: 10000},
    lastPosition: {},

    geocoder : null,
    mapOptions : {zoom: 12,  mapTypeId : google.maps.MapTypeId.ROADMAP},
    googleMap : null,
    googlePlaces : null,


    init: function () {


        mapModel.geocoder =  new google.maps.Geocoder();
        mapModel.googleMap = new google.maps.Map(document.getElementById('map-mapdiv'), mapModel.mapOptions);
        mapModel.googlePlaces = new google.maps.places.PlacesService(mapModel.googleMap);

        var location = window.localStorage.getItem('ggLastPosition');

        if (location !== undefined && location !== null) {
            mapModel.lastPosition = JSON.parse(location);
        } else {
            mapModel.lastPosition = {
                lat: 0,
                lng: 0
            };
        }

        mapModel.getCurrentPosition(function(lat,lng) {
            if (lat !== 0 && lng !== 0) {
                window.localStorage.setItem('ggLastPosition', JSON.stringify({lat: lat, lng: lng}));
                mapModel.lastPosition.lat = lat;
                mapModel.lastPosition.lng = lng;

                mapModel.reverseGeoCode(lat, lng, function (results,error) {
                    if (results !== null) {

                    }
                });
                // See if the new position matches an existing place
                var places = placesView.matchLocationToUserPlace(lat, lng);
                if (places.length === 0) {
                    // No matching places -- get a list of places that match the coord and prompt user to select one
                } else if (places.length === 1) {
                    // Just 1 matching place so prompt the user to check in there
                } else {
                    // Multiple place matches for this coord, prompt the user to select one.
                }
            }
        })

    },

    setLatLng : function (lat, lng) {
        mapModel.lat = lat;
        mapModel.lng = lng;

        mapModel.latlng = new google.maps.LatLng(lat, lng);
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

    getCurrentPosition : function (callback) {

        var options = mapModel.gpsOptions;
        navigator.geolocation.getCurrentPosition( function (position, error, options ) {
            if (error.code !== 0) {
               mobileNotify("GPS error" + error.message)
                callback(0, 0);
            } else {
                var lat = position.coords.latitude.toFixed(6), lng = position.coords.longitude.toFixed(6);
                callback(lat,lng);
            }

        });
    }
};
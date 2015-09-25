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
        navigator.geolocation.getCurrentPosition(function (position) {
            var lat = position.coords.latitude.toFixed(6), lng = position.coords.longitude.toFixed(6);
            callback(lat, lng);
        }, function (error) {
            mobileNotify("GPS error" + error.message);
            callback(0, 0);
        }, options);
    }
};
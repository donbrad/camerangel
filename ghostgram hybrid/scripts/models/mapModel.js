/**
 * Created by donbrad on 9/24/15.
 * mapModel.js
 */

var mapModel = {

    lat: null,
    lng: null,
    latlng : null,
    currentAddress : null,
    lastPosition: {},

    geocoder : new google.maps.Geocoder(),
    mapOptions : {zoom: 12,  mapTypeId : google.maps.MapTypeId.ROADMAP},
    googleMap : new google.maps.Map(document.getElementById('map-mapdiv'), this.mapOptions),
    googlePlaces : new google.maps.places.PlacesService(this.googleMap),


    init: function () {
        var location = window.localStorage.getItem('ggLastPosition');
        if (location !== undefined && location !== null) {
            mapModel.lastPosition = JSON.parse(location);
        } else {
            mapModel.lastPosition = {
                lat: 0,
                lng: 0
            };
        }

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
        navigator.geolocation.getCurrentPosition( function (position) {
            var lat = position.coords.latitude.toFixed(6), lng = position.coords.longitude.toFixed(6);
            callback(lat,lng)
        });
    }
};
/**
 * Created by donbrad on 9/23/15.
 * placeViews.js
 */

'use strict';

/*
 * placesView
 */
var placesView = {

    placeListDS: new kendo.data.DataSource({
        sort: {
            field: "name",
            dir: "asc"
        }
    }),

    onInit: function (e) {
        _preventDefault(e);

        placesModel.locatorActive = false;

        // Activate clearsearch and zero the filter when it's called
        $('#placeSearchQuery').clearSearch({
            callback: function() {
                placesView.placeListDS.data(placesModel.placesDS.data());
                placesView.placeListDS.filter([]);
            }
        });
    },

    onShow: function (e) {
        _preventDefault(e);

        // update actionBtn
        $("#places > div.footerMenu.km-footer > a").css("display", "none");


        navigator.geolocation.getCurrentPosition( function (position) {
            var lat = position.coords.latitude.toFixed(6), lng = position.coords.longitude.toFixed(6);
            var places = placesModel.matchLocation(lat, lng);

            if (places.length === 0) {
                mobileNotify("No places match your current location");
                var findPlaceUrl = "#findPlace?lat="+ lat + "&lng=" +  lng;
                // No current places match the current location
                $("#places > div.footerMenu.km-footer > a").attr("href", findPlaceUrl).css("display", "inline-block");
            } else {
                // set placesView.placeListDS to results
            }

        });
    }

};

/*
 * findPlacesView
 */
var findPlacesView = {

    placesDS :  new kendo.data.DataSource({
        sort: {
            field: "name",
            dir: "asc"
        }
    }),

    onInit : function (e) {
        _preventDefault(e);
        $("#findplace-listview").kendoMobileListView({
            dataSource: findPlacesView.placesDS,
            template: $("#placesTemplate").html(),
            fixedHeaders: true,
            click: function (e) {
                var place = e.dataItem;
            }});
    },

    onShow : function (e) {
        _preventDefault(e);
        if (e.view.params !== undefined) {
            var lat = e.view.params.lat, lng = e.view.params.lng;
        } else {
            // Todo: don - call geolocation to get coordinates
        }
        findPlacesView.updatePlaces(lat,lng);
    },

    updatePlaces : function (lat, lng) {
        var latlng = new google.maps.LatLng(lat, lng);
        var places = APP.map.googlePlaces;
        var ds = findPlacesView.placesDS;

        // empty current data
        ds.data([]);

        places.nearbySearch({
            location: latlng,
            radius: homeView._radius,
            types: ['establishment']
        }, function (placesResults, placesStatus) {
            if (placesStatus === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                APP.map.geocoder.geocode({ 'latLng': latlng }, function (geoResults, geoStatus) {
                    if (geoStatus !== google.maps.GeocoderStatus.OK) {
                        mobileNotify('Something went wrong with the Google geocoding service.');
                        return;
                    }
                    if (geoResults.length === 0 || geoResults[0].types[0] !== 'street_address') {
                        mobileNotify('We couldn\'t match your position to a street address.');
                        return;
                    }

                    var address = placesView.getAddressFromComponents(geoResults[0].address_components);

                    ds.add({
                        uuid: uuid.v4(),
                        category: 'Location',   // valid categories are: Place and Location
                        placeId: '',
                        name: address.streetNumber+' '+address.street,
                        venueName: '',
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
                        isVisible: true,
                        isPrivate: true,
                        autoCheckIn: false,
                        vicinity: address.city+', '+address.state
                    });
                });
            } else if (placesStatus !== google.maps.places.PlacesServiceStatus.OK) {
                mobileNotify('Google Places error: '+placesStatus);
                return;
            }

            placesResults.forEach( function (placeResult) {


                ds.add({
                    uuid: '',
                    category: 'Place',   // valid categories are: Place and Location
                    placeId: '',
                    name: placeResult.name,
                    venueName: placeResult.name,
                    streetNumber: '',
                    street: '',
                    city: '',
                    state: '',
                    zip: '',
                    country: '',
                    googleId: placeResult.place_id,
                    factualId: '',
                    lat: placeResult.geometry.location.G,
                    lng: placeResult.geometry.location.K,
                    publicName: '',
                    alias: '',
                    isVisible: true,
                    isPrivate: true,
                    autoCheckIn: false,
                    vicinity: placeResult.vicinity
                });

            });


            // Show modal letting user select current place
        });
    },

    onDone : function (e) {
        _preventDefault(e);
        APP.kendo.navigate("#places");
    }
};


/*
 * editPlaceView
 */
var editPlaceView = {


};
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
        $("#places > div.footerMenu.km-footer > a").removeAttr('href').css("display", "none");


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
    },

    onHide: function (e) {
        _preventDefault(e);

        // update actionBtn
        $("#places > div.footerMenu.km-footer > a").removeAttr('href').css("display", "none");
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
        },
        group: 'category'
    }),

    onInit : function (e) {
        _preventDefault(e);
        $("#findplace-listview").kendoMobileListView({
            dataSource: findPlacesView.placesDS,
            template: $("#findPlacesTemplate").html(),
            fixedHeaders: true,
            click: function (e) {
                var place = e.dataItem;
            }});
    },

    onShow : function (e) {
        _preventDefault(e);

        $("#findPlaces > div.footerMenu.km-footer > a").removeAttr('href').css("display", "none");

        if (e.view.params !== undefined) {
            var lat = e.view.params.lat, lng = e.view.params.lng;
        } else {
            // Todo: don - call geolocation to get coordinates
        }
        findPlacesView.updatePlaces(lat,lng);
    },

    onHide: function (e) {
        _preventDefault(e);

    },

    getAddressFromComponents: function (addressComponents) {
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
            APP.map.geocoder.geocode({ 'latLng': latlng }, function (geoResults, geoStatus) {
                if (geoStatus !== google.maps.GeocoderStatus.OK) {
                    mobileNotify('Google geocoding service error!');
                    return;
                }
                if (geoResults.length === 0 || geoResults[0].types[0] !== 'street_address') {
                    mobileNotify('We couldn\'t match your position to a street address.');
                    return;
                }

                var address = findPlacesView.getAddressFromComponents(geoResults[0].address_components);

                ds.add({
                    category: 'Location',   // valid categories are: Place and Location
                    name: address.streetNumber+' '+address.street,
                    type: 'Street Address',
                    lat: lat,
                    lng: lng,
                    vicinity: address.city+', '+address.state
                });
            });
            if (placesStatus !== google.maps.places.PlacesServiceStatus.OK) {
                mobileNotify('Google Places error: '+ placesStatus);
                return;
            }

            placesResults.forEach( function (placeResult) {


                ds.add({
                    category: 'Place',   // valid categories are: Place and Location
                    name: placeResult.name,
                    type: placeResult.types[0],
                    googleId: placeResult.place_id,
                    lat: placeResult.geometry.location.G,
                    lng: placeResult.geometry.location.K,
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
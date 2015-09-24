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
            var places = placesModel.matchLocation(position.coords.latitude, position.coords.longitude);
            if (places.length === 0) {
                mobileNotify("No places match your current location");
                var findPlaceUrl = "#findPlace?lat="+ position.coords.latitude + "&lng=" +  position.coords.longitude;
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
    onInit : function (e) {
        _preventDefault(e);
    },

    onShow : function (e) {
        _preventDefault(e);
        if (e.view.params !== undefined) {
            var lat = e.view.params.lat, lng = e.view.params.lng;
        }

    },

    onDone : function (e) {
        _preventDefault(e);
        APP.kendo.navigate("#places");
    }
};
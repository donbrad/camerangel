/**
 * Created by donbrad on 9/23/15.
 * placeViews.js
 */

'use strict';


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
        $("#places > div.footerMenu.km-footer > a").attr("href", "#findPlace").css("display", "inline-block");


        navigator.geolocation.getCurrentPosition( function (position) {
            var locations = placesModel.matchLocation(position.coords.latitude, position.coords.longitude);

        });
    }

};
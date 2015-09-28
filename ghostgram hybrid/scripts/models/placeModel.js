/**
 * Created by donbrad on 9/23/15.
 * placeModel.js
 */


'use strict';

var placesModel = {

    locatorActive : false,
    _radius : 30,
    currentPlaceId: null,
    currentPlace: {},

    placesDS: parseKendoDataSourceFactory.make('places', {
        id: 'id',
        fields: {
            uuid: {
                editable: false,
                nullable: false
            },
            category: {  // Venue or Location
                editable: true,
                nullable: false,
                defaultValue: 'Location'
            },
            placeChatId: {
                editable: false,
                defaultValue: ''
            },
            name: {   // Name chosen by the user
                editable: true,
                nullable: false,
                defaultValue: ''
            },
            venueName: {  // Name from googlePlaces or factual
                editable: false,
                nullable: true,
                defaultValue: ''
            },
            address: {  // Composite field for display - built from streetNumber, street, city, state and zip
                editable: false,
                nullable: false,
                defaultValue: ''
            },
            city: {
                editable: false,
                defaultValue: ''
            },
            state: {
                editable: false,
                defaultValue: ''
            },
            zip: {
                editable: false,
                defaultValue: ''
            },
            country: {
                editable: false,
                defaultValue: ''
            },
            googleId: {   // googleid - from googlePlaces
                editable: false,
                defaultValue: ''
            },
            factualId: {  // factualId -- optional if place exists in factual
                editable: false,
                defaultValue: ''
            },
            lat: {
                editable: false,
                type: 'number'
            },
            lng: {
                editable: false,
                type: 'number'
            },
            statusMessage: {  // Name from googlePlaces or factual
                editable: true,
                nullable: true,
                defaultValue: ''
            },
            isAvailable: {  // Is the user available or busy here?  Sets default value, user can override
                editable: true,
                nullable: false,
                type: 'boolean',
                defaultValue: true
            },
            isVisible: {  // Is the user visible here?  Sets default value, user can override
                editable: true,
                nullable: false,
                type: 'boolean',
                defaultValue: true
            },
            isPrivate: {   // Private place = only members can see it, Public Place = visible to gg users
                editable: true,
                nullable: false,
                type: 'boolean',
                defaultValue: true
            }
        }

    },
        false,
        undefined,
        undefined
    ),

    matchLocation: function (lat, lng) {
        var placesData = placesModel.placesDS.data();

        var matchArray = [];
        for (var i=0; i< placesData.length; i++){
            if (inPlaceRadius(lat, lng, placesData[i].lat,placesData[i].lng, placesModel._radius)){
                matchArray.push(placesData[i]);
            }
        }

        return(matchArray);
    },

    addPlace : function (place) {

    }


};
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
    placesArray : [],
    placeModel : kendo.data.Model.define({
        id: 'id',
        fields: {
            uuid: {

                nullable: false
            },
            category: {  // Venue or Location

                nullable: false,
                defaultValue: 'Location'
            },
            placeChatId: {

                defaultValue: ''
            },
            name: {   // Name chosen by the user

                nullable: false,
                defaultValue: ''
            },
            venueName: {  // Name from googlePlaces or factual
                nullable: true,
                defaultValue: ''
            },
            address: {  // Composite field for display - built from streetNumber, street, city, state and zip

                nullable: false,
                defaultValue: ''
            },
            city: {

                defaultValue: '',
                nullable: false,
            },
            state: {

                defaultValue: 'CA',
                nullable: false,
            },
            zip: {

                defaultValue: '',
                nullable: false,
            },
            country: {

                defaultValue: 'US'
            },
            googleId: {   // googleid - from googlePlaces

                defaultValue: ''
            },
            factualId: {  // factualId -- optional if place exists in factual

                defaultValue: ''
            },
            lat: {
                type: 'number'
            },
            lng: {

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

    } ),

    placesDS : null,


    newPlace : function () {
        return(new placesModel.placeModel);
    },

    init : function () {
        placesModel.placesDS =  parseKendoDataSourceFactory.make('places', placesModel.placeModel ,
            false,
            undefined,
            undefined
        );

        placesModel.placesDS.fetch(function () {
            placesModel.placesArray  = placesModel.placesDS.data();
        });
    },

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
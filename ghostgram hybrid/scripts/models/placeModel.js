/**
 * Created by donbrad on 9/23/15.
 * placeModel.js
 */


'use strict';

var placesModel = {

    locatorActive : false,
    _radius : 500,

    placesArray : [],
    placesFetched : false,
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
                nullable: false,
                defaultValue: ''
            },
            address: {  // Composite field for display - built from streetNumber, street, city, state and zip

                nullable: false,
                defaultValue: ''
            },
            city: {

                defaultValue: '',
                nullable: false
            },
            state: {

                defaultValue: 'CA',
                nullable: false
            },
            zipcode: {
                defaultValue: '',
                nullable: false
            },
            country: {

                defaultValue: 'US'
            },
            googleId: {   // googleid - from googlePlaces

                defaultValue: ''
            },
            hasPlaceChat: {
               type: 'boolean',
                default: false
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

    placesDS: new kendo.data.DataSource({
        offlineStorage: "places",
        sort: {
            field: "distance",
            dir: "asc"
        }
    }),


    newPlace : function () {
        return(new placesModel.placeModel);
    },

    fetch : function () {
        var PlaceModel = Parse.Object.extend("places");
        var query = new Parse.Query(PlaceModel);
        query.limit(512);

        query.find({
            success: function(collection) {
                var models = [];
                for (var i = 0; i < collection.length; i++) {
                    var model = collection[i].toJSON();
                    models.push(model);
                }

                placesModel.placesDS.data(models);
                mapModel.computePlaceDSDistance();

                deviceModel.setAppState('hasPlaces', true);
                deviceModel.isParseSyncComplete();
            },
            error: function(error) {
                handleParseError(error);
            }
        });
    },

    init : function () {
   /*     placesModel.placesDS =  parseKendoDataSourceFactory.make('places', placesModel.placeModel ,
            false,
            undefined,
            undefined
        );

        placesModel.placesDS.fetch(function () {
            placesModel.placesFetched = true;
            placesModel.placesArray  = placesModel.placesDS.data();
        });
*/    },

    matchLocation: function (lat, lng) {

        /*if (!placesModel.placesFetched) {
            return([]);
        }*/

        var placesData = placesModel.placesDS.data();

        var matchArray = [];
        for (var i=0; i< placesData.length; i++){
            if (placesModel.inRadius(lat, lng, placesData[i].lat,placesData[i].lng, placesModel._radius)){
                matchArray.push(placesData[i]);
            }
        }

        return(matchArray);
    },

    // Are two points within a specific distance
    inRadius : function (lat1, lng1, lat2, lng2, radius) {

        if (radius === undefined || radius < 10) {
            radius = 30;
        }

        if (typeof lat1 === 'string') {
            lat1 = Number(lat1);
            lng1 = Number(lng1);
        }

        if (typeof lat2 === 'string') {
            lat2 = Number(lat2);
            lng2 = Number(lng2);
        }

        var distance = getDistanceInMeters(lat1, lng1, lat2, lng2);

        if (distance <= radius) {
            return true;
        } else {
            return false;
        }
    },

    getPlaceModel : function (placeId) {

        var dataSource = placesModel.placesDS;
        dataSource.filter( { field: "uuid", operator: "eq", value: placeId });
        var view = dataSource.view();
        var place = view[0];
        dataSource.filter([]);

        return(place);

    },

    isUniquePlaceName : function (name) {
        var placeObj = placesModel.findPlaceByName(name);

        // If placeObj exists -- the name is not unique
        if (placeObj !== undefined) {
            return (false);
        }

        return(true);
    },

    findPlaceByName : function (name) {

        var dataSource = placesModel.placesDS;
        dataSource.filter( { field: "name", operator: "eq", value: name });
        var view = dataSource.view();
        var place = view[0];
        dataSource.filter([]);

        return(place);

    },

    deletePlace : function (placeId) {
        var dataSource = placesModel.placesDS;
        var uuid = placeId;

        dataSource.filter({field: "uuid", operator: "eq", value: uuid});
        var view = dataSource.view();
        var place = view[0];
        dataSource.filter([]);

        // Delete the parse object directly
        deleteParseObject('places', "uuid", uuid);
        dataSource.remove(place);

    }


};
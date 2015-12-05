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
    _placeModel : {   // Schema and default values to place model
        uuid: null,
        category: "Venue",
        hasPlaceChat: false,
        placeChatId: null,
        alias: null,
        name: null,
        venueName: null,
        address: null,
        city: null,
        state: null,
        zipcode: null,
        country:null,
        googleId: null,
        factualId: null,
        lat: 0,
        lng: 0,
        distance: 0,
        type: null,
        statusMessage: null,
        isAvailable: true,
        isVisible: true,
        isPrivate: true
    },

    placesDS: new kendo.data.DataSource({
        offlineStorage: "places",
        sort: {
            field: "distance",
            dir: "asc"
        }
    }),


    newPlace : function () {
        return(new placesModel._placeModel);
    },

    fetch : function () {
        var PlaceModel = Parse.Object.extend("places");
        var query = new Parse.Query(PlaceModel);
        query.limit(1000);

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

    queryPlace : function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = placesModel.placesDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();
        var place = view[0];

        dataSource.filter(cacheFilter);

        return(place);
    },

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
        var uuid = placeId;

        var place = placesModel.queryPlace({field: "uuid", operator: "eq", value: uuid});

        if (place !== undefined) {
            dataSource.remove(place);

            // Delete the parse object directly
            deleteParseObject('places', "uuid", uuid);
        }
    }

};
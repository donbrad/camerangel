/**
 * Created by donbrad on 9/23/15.
 * placeModel.js
 */


'use strict';

var placesModel = {

    _version: 1,
    _cloudClass : 'places',
    _ggClass : 'Place',

    locatorActive : false,
    _radius : 500,

    placesArray : [],
    deferredList : [],
    fetched : false,
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

    placesDS: null,

    placeListDS: new kendo.data.DataSource({
        sort: {
            field: "distance",
            dir: "asc"
        }
    }),


    init : function () {
        placesModel.placesDS = new kendo.data.DataSource({
            type: 'everlive',
            transport: {
                typeName: 'places'
            },
            schema: {
                model: { Id:  Everlive.idField}
            },
            autoSync: true,
            requestEnd : function (e) {
                var response = e.response,  type = e.type;

                if (!placesModel._fetched) {
                    if (type === 'read') {
                        var changedPlaces = placesModel.placesDS.data();
                        placesModel._fetched = true;
                        var len = changedPlaces.length;
                        for (var i = 0; i < len; i++) {
                            var place = changedPlaces[i];
                            // add to placelist
                            tagModel.addPlaceTag(place.name, place.alias, '', place.uuid);
                        }
                    }
                }
            }
        });
        
        // Reflect any core contact changes to contactList
        placesModel.placesDS.bind("change", function (e) {
            // Rebuild the contactList cache when the underlying list changes: add, delete, update...
            //placesModel.syncPlaceListDS();
            var changedPlaces = e.items;

            if (e.action !== undefined) {


                switch (e.action) {
                    case "itemchange" :
                        var field  =  e.field;
                        var place = e.items[0], placeUUID = place.uuid;
                        var placeList = placesModel.findPlaceListUUID(placeUUID);

                        // if the places's name or alias has been updated, need to update the tag...
                        var tagList = tagModel.findTagByCategoryId(place.uuid);
                        if (tagList.length > 0) {
                            var placeTag = tagList[0];
                            placeTag.set('alias',place.alias);
                            placeTag.set('name', place.name);
                        }


                        if (placeList !== undefined)
                        //placeList[field] = place [field];
                            placeList.set(field, place[field]);

                        break;

                    case "remove" :
                        // delete from places
                        break;

                    case "sync" :
                        // syncing all places...
                        if (changedPlaces !== undefined) {
                            var len = changedPlaces.len;
                        }
                        break;

                    case "add" :
                        var place = e.items[0];
                        // add to placelist
                        var placeList = placesModel.findPlaceListUUID(place.uuid);
                        if (placeList === undefined)
                            placesModel.placeListDS.add(place);
                        var placeObj = placesModel.getPlaceModel(place.uuid);
                       /* if (placeObj === undefined)
                            placesModel.placesDS.add(place);*/
                        tagModel.addPlaceTag(place.name, place.alias, '', place.uuid);
                        break;
                }
            }


        });

        placesModel.placesDS.fetch();
        placesModel.syncPlaceListDS();
      /*  deviceModel.setAppState('hasPlaces', true);
        deviceModel.isParseSyncComplete();*/

    },

    sync : function () {
        placesModel.placesDS.sync();
        placesModel.syncPlaceListDS();
    },
    
    
    newPlace : function () {
        return(new Object(placesModel._placeModel));
    },


   updateDistance : function() {
        var length = placesModel.placeListDS.total();

        for (var i=0; i< length; i++) {
            var place = placesModel.placeListDS.at(i);
            var distance = getDistanceInMiles(mapModel.lat, mapModel.lng, place.lat, place.lng);
            place.set('distance', parseFloat(distance.toFixed(2)));
        }

    },

    computePlaceDistance: function (placeUUID) {

        var placeModel = placesModel.getPlaceModel(placeUUID);
        if (placeModel !== undefined) {
            // computer and store distance in miles
            var distance = getDistanceInMiles(mapModel.lat, mapModel.lng, placeModel.lat, placeModel.lng);
            placeModel.set('distance', parseFloat(distance.toFixed(2)));
        }

    },

    syncPlaceListDS : function () {

        placesModel.placeListDS.data([]);
        var placeList = placesModel.placesDS.data();
        placesModel.placeListDS.data(placeList);
        placesModel.updateDistance();

    },

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

    findPlaceListUUID : function (uuid) {
        var placeList = placesModel.queryPlaceList({ field: "uuid", operator: "eq", value: uuid });
        return(placeList);
    },

    queryPlaceList : function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = placesModel.placeListDS;
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
        var length = placesModel.placesDS.total();

        var matchArray = [];
        for (var i=0; i< length; i++){
            var place = placesModel.placesDS.at(i);
            if (placesModel.inRadius(lat, lng, place.lat,place.lng, placesModel._radius)){
                matchArray.push(place);
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
            lat1 = parseFloat(lat1);
            lng1 = parseFloat(lng1);
        }

        if (typeof lat2 === 'string') {
            lat2 = parseFloat(lat2);
            lng2 = parseFloat(lng2);
        }

        var distance = getDistanceInMeters(lat1, lng1, lat2, lng2);

        if (distance <= radius) {
            return true;
        } else {
            return false;
        }
    },

    getPlaceModel : function (placeUUID) {

        var place = placesModel.queryPlace({ field: "uuid", operator: "eq", value: placeUUID });


       /* var dataSource = placesModel.placesDS;
        dataSource.filter( { field: "uuid", operator: "eq", value: placeUUID });
        var view = dataSource.view();
        var place = view[0];
        dataSource.filter([]);*/

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

        var place = placesModel.queryPlace({ field: "name", operator: "eq", value: name });

       /* var dataSource = placesModel.placesDS;
        dataSource.filter( { field: "name", operator: "eq", value: name });
        var view = dataSource.view();
        var place = view[0];
        dataSource.filter([]);*/

        return(place);

    },

    addSharedPlace : function (place, placeChatId, callback) {

        var existingPlace = placesModel.getPlaceModel(place.uuid);
        if (existingPlace !== undefined) {
            return;
        }

       // var Place = Parse.Object.extend(placesModel._cloudClass);
        var placeObj = new kendo.data.ObservableObject();

        var newPlace = placesModel.newPlace();

        // Check that the place name is unique (in this users place's)
        place.name = place.name.toString();

        //placeObj.setACL(userModel.parseACL);
        placeObj.set('uuid', place.uuid);
        placeObj.set('Id', place.uuid);
        placeObj.set('ggType', placesModel._ggClass);
        placeObj.set('version', placesModel._version);
        placeObj.set('category', place.category);
        var name =  place.name.toString();
        placeObj.set('name', name);
        placeObj.set('venueName', place.venueName);
        if (place.alias === undefined)
            place.alias = null;
        placeObj.set('alias', place.alias);
        placeObj.set('isShared', true);
        placeObj.set('googleId', place.googleId);
        if (place.factualId === undefined)
            place.factualId = null;
        placeObj.set('factualId', place.factualId);
        placeObj.set('address', place.address);
        placeObj.set('lat', place.lat);
        placeObj.set('lng', place.lng);
        placeObj.set('geoPoint', {longitude: place.lng, latitude: place.lat});
        placeObj.set('distance', 0);
        placeObj.set('type', place.type);
        placeObj.set('city', place.city);
        placeObj.set('state', place.state);
        placeObj.set('country', place.country);
        placeObj.set('zipcode', place.zipcode);
        placeObj.set('isVisible', true);
        placeObj.set('isDeleted', false);
        placeObj.set('isAvailable', place.isAvailable === "true");
    //    placeObj.set('isPrivate', place.isPrivate === "true");
        placeObj.set('isPrivate', true);
        placeObj.set('hasPlaceChat', true);
        placeObj.set('placeChatId', placeChatId);
        placeObj.set('placeRadius', 1000);

        var distance = getDistanceInMiles(mapModel.lat, mapModel.lng, place.lat, place.lng);

        // update the distance value for the local object...
        placeObj.set('distance', distance);

        placesModel.placesDS.add(place);
        // Get a json object to add to kendo (strip the parse specific stuff)
      //  var placeObj = placeObj.toJSON();
        everlive.createOne(placesModel._cloudClass, place, function (error, data){
            if (error !== null) {
                mobileNotify ("Error creating place " + JSON.stringify(error));
            } 
        });



      //  placesModel.placesDS.add(place);
       /* placesModel.placesDS.sync();

        placeObj.save(null, {
            success: function(placeIn) {
                // Execute any logic that should take place after the object is saved.

                placeObj = placeIn.toJSON();

                if (callback !== undefined) {
                    callback(placeObj);
                }


            },
            error: function(place, error) {
                // Execute any logic that should take place if the save fails.
                // error is a Parse.Error with an error code and message.
                handleParseError(error);
            }
        });*/

    },

    addPlace: function (place, createChatFlag,  callback) {
        //var Place = Parse.Object.extend(placesModel._cloudClass);
        var placeObj = new kendo.data.ObservableObject();

        var newPlace = placesModel.newPlace();

        // Check that the place name is unique (in this users place's)
        place.name = place.name.toString();

        if (!placesModel.isUniquePlaceName(place.name)) {
            mobileNotify(addPlaceView._activePlace.name + "is already one of your Places!");
            return;
        }

        var guid = uuid.v4();


       // placeObj.setACL(userModel.parseACL);
        placeObj.set('uuid', guid);
        placeObj.set('Id', guid);
        placeObj.set('ggType', placesModel._ggClass);
        placeObj.set('version', placesModel._version);
        placeObj.set('category', place.category);
        var name =  place.name.toString();
        placeObj.set('name', name);
        placeObj.set('venueName', place.venueName);
        if (place.alias === undefined)
            place.alias = null;
        placeObj.set('alias', place.alias);
        placeObj.set('isShared', false);
        placeObj.set('googleId', place.googleId);
        if (place.factualId === undefined)
            place.factualId = null;
        placeObj.set('factualId', place.factualId);
        placeObj.set('address', place.address);
        placeObj.set('lat', place.lat);
        placeObj.set('lng', place.lng);
        placeObj.set('distance',0);
        placeObj.set('type', place.type);
        placeObj.set('city', place.city);
        placeObj.set('state', place.state);
        placeObj.set('country', place.country);
        placeObj.set('zipcode', place.zipcode);
        placeObj.set('isVisible', true);
        placeObj.set('isDeleted', false);
        placeObj.set('isAvailable', true);
 //       placeObj.set('isPrivate', place.isPrivate === "true");
        placeObj.set('isPrivate', true);
        placeObj.set('hasPlaceChat', false);
        placeObj.set('placeChatId', null);
        placeObj.set('placeRadius', 1000);


        if (createChatFlag) {
            placeObj.set('hasPlaceChat', true);
            var placeChatguid = uuid.v4();
            placeObj.set('placeChatId', placeChatguid);
        }

        var distance = getDistanceInMiles(mapModel.lat, mapModel.lng, place.lat, place.lng);

        // Get a json object to add to kendo (strip the parse specific stuff)
        //var placeObj = placeObj.toJSON();
        // update the distance value for the local object...
        placeObj.distance = distance.toFixed(2);
        placeObj.isDirty = true;

        placesModel.placesDS.add(placeObj);
        placesModel.placesDS.sync();
        
        everlive.createOne(placesModel._cloudClass, placeObj, function (error, data){
            if (error !== null) {
                mobileNotify ("Error creating place " + JSON.stringify(error));
            } 
        });

       // placesModel.placesDS.add(placeObj);
        //placesModel.placesDS.sync();

        if (callback !== undefined) {
            callback(placeObj);
        }
        

    },

    deletePlace : function (placeUUID) {

        var place = placesModel.queryPlace({field: "uuid", operator: "eq", value: placeUUID});

        if (place !== undefined) {

            //This is shared place from PlaceChat (this is a member, not the owner)
            if (place.isShared === true) {
                //Mark the place as deleted...
                place.set('isDeleted', true);
                //updateParseObject('places', 'uuid', place.uuid,'isDeleted', true);
            } else {

                // If there's a channel related to this place, need to delete it
                if (place.placeChatId !== undefined && place.placeChatId !== null) {
                    channelModel.deleteChannel(place.placeChatId, false);
                }
                // var placeObj = place.toJSON();
               /* placesModel.placesDS.remove(place);
                placesModel.placesDS.sync();*/
                var Id = place.Id;

                if (Id !== undefined){
                    everlive.deleteOne(placesModel._cloudClass, Id, function (error, data) {
                        placesModel.placesDS.remove(place);
                    });
                }
    
            }

        }
    }

};
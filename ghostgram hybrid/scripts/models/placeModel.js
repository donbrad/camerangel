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

    placeListDS: new kendo.data.DataSource({
        sort: {
            field: "distance",
            dir: "asc"
        }
    }),

    placesTagsDS: new kendo.data.DataSource({
        offlineStorage: "placeTags",
        sort: {
            field: "name",
            dir: "asc"
        }
    }),


    newPlace : function () {
        return(new Object(placesModel._placeModel));
    },

    fetch : function () {
        var PlaceModel = Parse.Object.extend("places");
        var query = new Parse.Query(PlaceModel);

        query.limit(1000);

        query.find({
            success: function(collection) {
                var models = [];
                for (var i = 0; i < collection.length; i++) {
                    var parseModel = collection[i];
                    var dirty = false;
                    if (parseModel.get('isShared') === undefined) {
                        parseModel.set('isShared', false);
                        dirty = true;
                    }
                    if (parseModel.get('isDeleted') === undefined) {
                        parseModel.set('isDeleted', false);
                        dirty = true;
                    }
                    if (parseModel.get('distance') === undefined) {
                        parseModel.set('distance', 0.0);
                        dirty = true;
                    }
                    if (parseModel.get('alias') === undefined) {
                        parseModel.set('alias', null);
                        dirty = true;
                    }
                    if (parseModel.get('factualId') === undefined) {
                        parseModel.set('factualId', null);
                        dirty = true;
                    }
                    if (dirty)
                        parseModel.save();

                    var model = parseModel.toJSON();
                    var tag = {type: 'place', tagname: ux.returnUXPrimaryName(model.name, model.alias), name: model.name, uuid: model.uuid };
                    placesModel.placesTagsDS.add(tag);
                    models.push(model);
                }

                placesModel.placesDS.data(models);
                mapModel.computePlaceDSDistance();

                placesModel.buildPlaceLists();
                deviceModel.setAppState('hasPlaces', true);
                deviceModel.isParseSyncComplete();
            },
            error: function(error) {
                handleParseError(error);
            }
        });
    },

    init : function () {
        // Reflect any core contact changes to contactList
        placesModel.placesDS.bind("change", function (e) {
            // Rebuild the contactList cache when the underlying list changes: add, delete, update...
            //placesModel.buildPlaceLists();
            var changedPlaces = e.items;

            if (e.action !== undefined) {
                switch (e.action) {
                    case "itemchange" :
                        var field  =  e.field;
                        var place = e.items[0], placeId = place.uuid;
                        var placeList = placesModel.findPlaceListUUID(placeId);
                        // if the contact's name or alias has been updated, need to update the tag...
                        if (field === 'name') {
                            var newName = ux.returnUXPrimaryName(place.name, place.alias);
                            var placeTag = placesModel.findPlaceTag(place.uuid);
                            placeTag.alias = newName;
                            placeTag.name = contact.name;
                        }
                        if (field === 'alias') {
                            var newName = ux.returnUXPrimaryName(place.name, place.alias);
                            var placeTag = contactModel.findContactTag(place.uuid);
                            placeTag.alias = newName;
                            placeTag.alias = place.alias;
                        }
                        placeList[field] = place [field];
                        break;

                    case "remove" :
                        // delete from contact list
                        break;

                    case "add" :
                        var place = e.items[0];
                        // add to contactlist and contacttags
                        placesModel.placeListDS.add(place);
                        var tag = {
                            type: 'place',
                            tagname: ux.returnUXPrimaryName(place.name, place.alias),
                            name: place.name,
                            uuid: place.uuid,
                            icon: 'images/icon-location.svg'
                        };
                        contactModel.contactTagsDS.add(tag);
                        break;
                }
            }


        });
     },

    buildPlaceLists : function () {
        placesModel.placesTagsDS.data([]);
        placesModel.placeListDS.data([]);
        var placeList = placesModel.placesDS.data();
        placesModel.placeListDS.data(placeList);

        for (var i=0; i< placeList.length; i++) {
            var model = (placeList[i]).toJSON();
            var tag = {type: 'place', tagname: ux.returnUXPrimaryName(model.name, model.alias), name: model.name, alias: model.alias, uuid: model.uuid };
            placesModel.placesTagsDS.add(tag);
        }
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
        var placeList = placesModel.queryPlaceList({ field: "uuid", operator: "eq", value: placeId });
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

    findPlaceTag: function (uuid) {
        var placeList = placesModel.queryPlaceTag({ field: "uuid", operator: "eq", value: uuid });
        return(placeList);
    },

    queryPlaceTag : function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = placesModel.placesTagsDS;
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

        var place = placesModel.queryPlace({ field: "uuid", operator: "eq", value: placeId });


       /* var dataSource = placesModel.placesDS;
        dataSource.filter( { field: "uuid", operator: "eq", value: placeId });
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

        var Place = Parse.Object.extend("places");
        var placeParse = new Place();

        var newPlace = placesModel.newPlace();

        // Check that the place name is unique (in this users place's)
        place.name = place.name.toString();

        placeParse.setACL(userModel.parseACL);
        placeParse.set('uuid', place.uuid);
        placeParse.set('category', place.category);
        var name =  place.name.toString();
        placeParse.set('name', name);
        placeParse.set('venueName', place.venueName);
        if (place.alias === undefined)
            place.alias = null;
        placeParse.set('alias', place.alias);
        placeParse.set('isShared', true);
        placeParse.set('googleId', place.googleId);
        if (place.factualId === undefined)
            place.factualId = null;
        placeParse.set('factualId', place.factualId);
        placeParse.set('address', place.address);
        placeParse.set('lat', place.lat);
        placeParse.set('lng', place.lng);
        placeParse.set('distance', 0);
        placeParse.set('type', place.type);
        placeParse.set('city', place.city);
        placeParse.set('state', place.state);
        placeParse.set('country', place.country);
        placeParse.set('zipcode', place.zipcode);
        placeParse.set('isVisible', true);
        placeParse.set('isDeleted', false);
        placeParse.set('isAvailable', place.isAvailable === "true");
    //    placeParse.set('isPrivate', place.isPrivate === "true");
        placeParse.set('isPrivate', true);
        placeParse.set('hasPlaceChat', true);
        placeParse.set('placeChatId', placeChatId);

        var distance = getDistanceInMiles(mapModel.lat, mapModel.lng, place.lat, place.lng);

        // update the distance value for the local object...
        placeParse.set('distance', distance);
        // Get a json object to add to kendo (strip the parse specific stuff)
        var placeObj = placeParse.toJSON();
        placesModel.placesDS.add(placeObj);

        placeParse.save(null, {
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
        });

    },

    addPlace: function (place, createChatFlag,  callback) {
        var Place = Parse.Object.extend("places");
        var placeParse = new Place();

        var newPlace = placesModel.newPlace();

        // Check that the place name is unique (in this users place's)
        place.name = place.name.toString();

        if (!placesModel.isUniquePlaceName(place.name)) {
            mobileNotify(addPlaceView._activePlace.name + "is already one of your Places!");
            return;
        }

        var guid = uuid.v4();


        placeParse.setACL(userModel.parseACL);
        placeParse.set('uuid', guid);
        placeParse.set('category', place.category);
        var name =  place.name.toString();
        placeParse.set('name', name);
        placeParse.set('venueName', place.venueName);
        if (place.alias === undefined)
            place.alias = null;
        placeParse.set('alias', place.alias);
        placeParse.set('isShared', false);
        placeParse.set('googleId', place.googleId);
        if (place.factualId === undefined)
            place.factualId = null;
        placeParse.set('factualId', place.factualId);
        placeParse.set('address', place.address);
        placeParse.set('lat', place.lat);
        placeParse.set('lng', place.lng);
        placeParse.set('distance',0);
        placeParse.set('type', place.type);
        placeParse.set('city', place.city);
        placeParse.set('state', place.state);
        placeParse.set('country', place.country);
        placeParse.set('zipcode', place.zipcode);
        placeParse.set('isVisible', true);
        placeParse.set('isDeleted', false);
        placeParse.set('isAvailable', place.isAvailable === "true");
 //       placeParse.set('isPrivate', place.isPrivate === "true");
        placeParse.set('isPrivate', true);

        if (!createChatFlag) {
            placeParse.set('hasPlaceChat', false);
            placeParse.set('placeChatId', null);
        } else {
            placeParse.set('hasPlaceChat', true);
            var placeChatguid = uuid.v4();
            placeParse.set('placeChatId', placeChatguid);
        }

        var distance = getDistanceInMiles(mapModel.lat, mapModel.lng, place.lat, place.lng);

        // Get a json object to add to kendo (strip the parse specific stuff)
        var placeObj = placeParse.toJSON();
        // update the distance value for the local object...
        placeObj.distance = distance.toFixed(2);
        placeObj.isDirty = true;
        placesModel.placesDS.add(placeObj);
        placesModel.placesDS.sync();

        placeParse.save(null, {
            success: function(placeIn) {
                // Set the needs sync (isDirty flag to false)
                var placeInuuid = placeIn.get('uuid');
                var place = placesModel.getPlaceModel(placeInuuid);
                place.set('isDirty', false);
                if (callback !== undefined) {
                    callback(placeIn.toJSON());
                }

            },
            error: function(place, error) {
                // Execute any logic that should take place if the save fails.
                // error is a Parse.Error with an error code and message.
                handleParseError(error);
            }
        });

    },

    deletePlace : function (placeId) {

        var place = placesModel.queryPlace({field: "uuid", operator: "eq", value: placeId});

        if (place !== undefined) {

            //This is shared place from PlaceChat (this is a member, not the owner)
            if (place.isShared === true) {
                //Mark the place as deleted...
                place.set('isDeleted', true);
                updateParseObject('places', 'uuid', place.uuid,'isDeleted', true);
            } else {

                // If there's a channel related to this place, need to delete it
                if (place.placeChatId !== undefined && place.placeChatId !== null) {
                    channelModel.deleteChannel(place.placeChatId, false);
                }
                var placeObj = place.toJSON();
                placesModel.placesDS.remove(place);
                placesModel.placesDS.sync();

                // Delete the parse object directly
                deleteParseObject('places',"uuid", placeId);
            }

        }
    }

};
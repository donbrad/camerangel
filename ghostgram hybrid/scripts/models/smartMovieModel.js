/**
 * Created by donbrad on 1/20/16.
 *
 * smartMovieModel -- features for local moviees and theatres
 */
'use strict';

var smartMovie = {

    _cloudClass : 'smartMovie',
    _ggClass : 'Movie',
    _version : 1,

    moviesDS: null,

    init : function () {
        smartMovie.moviesDS = new kendo.data.DataSource({
            //offlineStorage: "smartMovie",
            type: 'everlive',
            transport: {
                typeName: 'smartMovie'
                //dataProvider: APP.everlive
            },
            schema: {
                model: { id:  Everlive.idField}
            },
            sort: {
                field: "date",
                dir: "desc"
            }
        });
    },

    /*fetch : function () {
        var smartMovies = Parse.Object.extend(smartMovie._cloudClass);
        var query = new Parse.Query(smartMovies);
        query.limit(1000);
        query.find({
            success: function(collection) {
                var models = [];
                for (var i = 0; i < collection.length; i++) {
                    var smartObj = collection[i];

                    models.push(smartObj.toJSON());
                }
                deviceModel.setAppState('hasSmartMovies', true);
                smartMovie.moviesDS.data(models);
                deviceModel.isParseSyncComplete();
            },
            error: function(error) {
                handleParseError(error);
            }
        });
    },*/

    queryMovie: function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = smartMovie.moviesDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();

        dataSource.filter(cacheFilter);

        return (view[0]);
    },

    // Find all objects that aren't deleted...
    findMovie: function (uuid) {
        var result = smartMovie.queryMovie({ field: "uuid", operator: "eq", value: uuid });

        return(result);
    },

    // Find all objects that aren't deleted...
    findMovieByTmsId: function (tmsId) {
        var result = smartMovie.queryMovie({ field: "tmsId", operator: "eq", value: tmsId });

        return(result);
    },

    smartAddMovie : function (objectIn, callback) {
        var objectId = objectIn.uuid;

        var event = smartMovie.findMovie(objectId);
        if ( event  === undefined) {
            // Event doesnt exist -- need to create it
            smartMovie.addMovie(objectIn, callback);
        } else {
            // Event exists, so just return current instance
            if (callback !== undefined && callback !== null) {
                callback(event);
            }
        }
    },

    addMovie : function (objectIn, callback) {
       /* var smartMovies = Parse.Object.extend(smartMovie._cloudClass);
        var smartOb = new smartMovies();*/

        var smartOb = new kendo.data.ObservableObject();

            mobileNotify("Creating Smart Movie...");

        if (objectIn.senderUUID === undefined || objectIn.senderUUID === null) {
            objectIn.senderUUID = userModel._user.userUUID;
        }

        //smartOb.setACL(userModel.parseACL);
        smartOb.set('version', smartMovie._version);
        smartOb.set('ggType', smartMovie._ggClass);
        smartOb.set('uuid', objectIn.uuid);
        smartOb.set('senderUUID', objectIn.senderUUID);
        smartOb.set('senderName', objectIn.senderName);
        smartOb.set('movieTitle', objectIn.movieTitle);
        smartOb.set('description', objectIn.description);
        var dateString = new Date(objectIn.showtime).toISOString();
       /* var d = {"__type":"Date","iso":dateString};
        smartOb.set('showtime', d);*/
        smartOb.set('showtime', dateString);
        smartOb.set('showtimeString', objectIn.showtimeString);
        smartOb.set('theatreId', objectIn.theatreId);
        smartOb.set('theatreName', objectIn.theatreName);
        smartOb.set('theatreAddress', objectIn.theatreAddress);
        smartOb.set('theatrePhone', objectIn.theatrePhone);
        smartOb.set('theatreLat', objectIn.theatreLat);
        smartOb.set('theatreLng', objectIn.theatreLng);
        smartOb.set('imdbId', objectIn.imdbId);
        smartOb.set('tmsId', objectIn.tmsId);
        smartOb.set('imageUrl', objectIn.imageUrl);
        smartOb.set('officialUrl', objectIn.officialUrl);
        smartOb.set('ticketUrl', objectIn.ticketUrl);
        smartOb.set('rating', objectIn.rating);
        smartOb.set('runtime', objectIn.runtime);
        smartOb.set('genre', objectIn.genre);


        everlive.createOne(smartMovie._cloudClass, smartOb, function (error, data){
            if (error !== null) {
                mobileNotify ("Error creating photo " + JSON.stringify(error));
            } else {
                // Add the everlive object with everlive created Id to the datasource
                smartMovie.moviesDS.add(smartOb);
            }
        });
       

        callback(smartOb);

        /*smartOb.save(null, {
            success: function(thisObject) {
                // Execute any logic that should take place after the object is saved.;

                if (callback !== undefined && callback !== null) {
                    callback(thisObject.toJSON());
                }


            },
            error: function(contact, error) {
                // Execute any logic that should take place if the save fails.
                // error is a Parse.Error with an error code and message.
                handleParseError(error);
                if (callback !== undefined && callback !== null) {
                    callback(null);
                }
            }
        });*/
    }

};
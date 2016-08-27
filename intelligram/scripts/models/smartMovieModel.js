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
    _fetched : false,

    moviesDS: null,

    init : function () {
        smartMovie.moviesDS = new kendo.data.DataSource({
            type: 'everlive',
            transport: {
                typeName: 'smartMovie'
            },
            schema: {
                model: { Id:  Everlive.idField}
            },
            sort: {
                field: "date",
                dir: "desc"
            },

            change :  function (e) {todayModel.change(e, smartMovie._ggClass);}
        });
        
        smartMovie.moviesDS.fetch();
    },

    sync: function ()  {
        smartMovie.moviesDS.sync();
    },

    getTodayList : function () {
        // is Showtime Today?
        var len = smartMovie.moviesDS.total();
        var todayArray = [];
        var today = moment();
        for (var i=0; i<len; i++) {
            var movie = smartMovie.moviesDS.at(i);
            if (moment(movie.showtime).isSame(today, 'day') ) {
                todayArray.push(movie);
            }

        }
        return(todayArray);
    },

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

    validatePhone : function (phone) {
        if (phone === undefined || phone === null) {
            return (null);
        }
        if (phone.length < 14) {
            return(phone);
        }

        return (null);
    },

    deleteMovie : function (movie) {
        
    },
    
    addMovie : function (objectIn, callback) {

        var smartOb = new kendo.data.ObservableObject();

            mobileNotify("Creating intelliMovie...");

        if (objectIn.senderUUID === undefined || objectIn.senderUUID === null) {
            objectIn.senderUUID = userModel._user.userUUID;
        }

        smartOb.set('version', smartMovie._version);
        smartOb.set('ggType', smartMovie._ggClass);
        smartOb.set('uuid', objectIn.uuid);
        //smartOb.set('Id', objectIn.uuid);
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
        smartOb.set('theatrePhone', smartMovie.validatePhone(objectIn.theatrePhone));
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

        smartMovie.moviesDS.add(smartOb);
        smartMovie.moviesDS.sync();
        if (callback !== undefined && callback !== null)
            callback(smartOb);
        
        everlive.createOne(smartMovie._cloudClass, smartOb, function (error, data){
            if (error !== null) {
                mobileNotify ("Error creating intelliMovie " + JSON.stringify(error));
            } else {
                // Add the everlive object with everlive created Id to the datasource
                
            }
        });
        
    }

};
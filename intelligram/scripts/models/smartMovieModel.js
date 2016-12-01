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
    _initialSync : false,
    _todayArray : [],

    moviesDS: null,

    init : function () {
        smartMovie.moviesDS = new kendo.data.DataSource({
            type: 'everlive',
            transport: {
                typeName: 'smartMovie',
                dataProvider: APP.everlive
            },
            schema: {
                model: { id:  Everlive.idField}
            },
            sort: {
                field: "date",
                dir: "desc"
            }
        });

        smartMovie.moviesDS.bind("change", function (e) {
            var changedMovies = e.items;
            if (e.action === undefined) {
                if (changedMovies !== undefined && !smartMovie._initialSync) {

                    smartMovie._initialSync = true;
                    smartMovie._todayArray = smartMovie.getTodayList();
                    todayModel.addList(smartMovie._todayArray);
                }

            } else {

                switch (e.action) {
                    case "itemchange" :
                        var field  =  e.field;
                        var movie = e.items[0];

                        break;

                    case "remove" :
                        var movie = e.items[0];
                        todayModel.remove(movie);
                        break;

                    case "sync" :

                        break;

                    case "add" :
                        var movie = e.items[0];
                        var today = moment();
                        if (moment(movie.showtime).isSame(today, 'day') ) {
                            var movieObj = smartMovie.createTodayObject(movie);
                            todayModel.add(movieObj);
                        }
                        break;
                }
            }


        });
        smartMovie.moviesDS.bind("requestEnd", function (e) {
            var response = e.response,  type = e.type;

            if (type === 'read' && response) {
                if (!smartMovie._fetched) {
                    smartMovie._fetched = true;
                }
            }
        });

        smartMovie.moviesDS.fetch();
    },

    sync: function ()  {
        smartMovie.moviesDS.sync();
    },

    createTodayObject : function (movie) {
        var minDate = moment(movie.showtime).subtract(2, 'hours'),
            maxDate = moment(movie.showtime).add(2, 'hours');

        var todayObj = {ggType: 'Movie', uuid: movie.uuid, object: movie};

        var content = smartMovie.renderMovie(movie);

        todayObj.content = content;

        if (movie.senderUUID === userModel._user.userUUID) {
            todayObj.senderName = "Me";
            todayObj.isOwner = true;
        } else {
            todayObj.senderName = movie.senderName;
            todayObj.isOwner = false;
        }

        todayObj.date  = minDate.toDate();
        todayObj.maxDate = maxDate.toDate();

        return(todayObj);

    },

    getTodayList : function () {
        // is Showtime Today?
        var len = smartMovie.moviesDS.total();
        var todayArray = [];
        var today = moment();
        for (var i=0; i<len; i++) {
            var movie = smartMovie.moviesDS.at(i);
            var minDate = moment(movie.showtime).subtract(2, 'hours'),
                maxDate = moment(movie.showtime).add(2, 'hours');
            if (moment(movie.showtime).isSame(today, 'day') ) {

                var todayObj = {ggType: 'Movie', uuid: movie.uuid, object: movie};

                var content = smartMovie.renderMovie(movie);

                todayObj.content = content;

                if (movie.senderUUID === userModel._user.userUUID) {
                    todayObj.senderName = "Me";
                    todayObj.isOwner = true;
                } else {
                    todayObj.senderName = movie.senderName;
                    todayObj.isOwner = false;
                }

                todayObj.date  = minDate.toDate();
                todayObj.maxDate = maxDate.toDate();

                todayArray.push(todayObj);

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

    renderMovie : function (smartMovie) {
        var date = smartMovie.showtime, objectId = smartMovie.uuid;

        var dateStr = moment(date).format('ddd MMM Do YYYY h:mm A');


        var template = kendo.template($("#intelliMovie-chat").html());
        var dataObj = {
            ggType: "Movie",
            imageUrl: smartMovie.imageUrl,
            movieTitle : smartMovie.movieTitle,
            dateStr : dateStr,
            theatreName: smartMovie.theatreName,
            objectId : objectId,
            rating: smartMovie.rating,
            runtime: smartMovie.runtime
        };

        var content = template(dataObj);

        return(content);
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

    removeMovie : function (movie) {
        smartMovie.moviesDS.remove(movie);
        smartMovie.moviesDS.sync();
    },


    removeMovieById : function (movieId) {

        var movie = smartMovie.findMovie(movieId);

        if (movie === undefined || movie === null) {
            ggError("Remove Trip: couldn't find trip");
            return;
        }
        smartMovie.moviesDS.remove(movie);
        smartMovie.moviesDS.sync();
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

        smartOb.Id = uuid.v4();
        smartMovie.moviesDS.add(smartOb);
        smartMovie.moviesDS.sync();
        if (callback !== undefined && callback !== null)
            callback(smartOb);

        if (deviceModel.isOnline()) {
            everlive.createOne(smartMovie._cloudClass, smartOb, function (error, data){
                if (error !== null) {
                    mobileNotify ("Error creating intelliMovie " + JSON.stringify(error));
                }
            });
        }

        
    }

};
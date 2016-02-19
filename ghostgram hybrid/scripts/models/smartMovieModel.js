/**
 * Created by donbrad on 1/20/16.
 *
 * smartMovieModel -- features for local moviees and theatres
 */
'use strict';

var smartMovie = {

    _parseClass : 'smartMovie',
    _ggClass : 'Movie',
    _version : 1,

    moviesDS: new kendo.data.DataSource({
        offlineStorage:"smartMovie",
        sort: {
            field: "date",
            dir: "desc"
        }
    }),

    init : function () {

    },

    fetch : function () {
        var smartMovies = Parse.Object.extend(smartMovie._parseClass);
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
    },


};
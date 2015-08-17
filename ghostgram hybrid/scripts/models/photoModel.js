/**
 * Created by donbrad on 8/12/15.
 *
 * photoModel.js -- photos / gallery interface to parse, kendo and localstorage
 *
 */


'use strict';

var photoModel = {
    currentPhoto: {},
    previewSize: "33%",
    parsePhoto: {},
    photosDS: new kendo.data.DataSource({  // this is the gallery datasource
        offlineStorage: "gallery-offline"
    }),

    init: function () {

    },

    fetch: function () {
        var PhotoModel = Parse.Object.extend("photos");
        var PhotoCollection = Parse.Collection.extend({
            model: PhotoModel
        });

        var photos = new PhotoCollection();

        photos.fetch({
            success: function(collection) {
                var models = [];
                for (var i = 0; i < collection.models.length; i++) {
                    models.push(collection.models[i].attributes);
                }
                deviceModel.setAppState('hasPhotos', true);
                photoModel.photosDS.data(models);
                deviceModel.isParseSyncComplete();
            },
            error: function(collection, error) {
                handleParseError(error);
            }
        });
    }

};

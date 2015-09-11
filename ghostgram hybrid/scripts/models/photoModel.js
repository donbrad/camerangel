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
    optionsShown: false,
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
    },

    findPhotoById: function (photoId) {
        var dataSource = photoModel.photosDS;
        dataSource.filter( { field: "photoId", operator: "eq", value: photoId });
        var view = dataSource.view();
        var photo = view[0];
        dataSource.filter([]);

        return(photo);
    },

    findPhotosByChannel : function (channelId) {
        var dataSource = photoModel.photosDS;
        dataSource.filter( { field: "channelId", operator: "eq", value: channelId });
        var view = dataSource.view();
        var photos = view;
        dataSource.filter([]);

        return(photos);
    },

    findPhotosBySender: function (senderId) {
        var dataSource = photoModel.photosDS;
        dataSource.filter( { field: "senderUUID", operator: "eq", value: senderId });
        var view = dataSource.view();
        var photos = view;
        dataSource.filter([]);

        return(photos);
    },

    deletePhoto: function (photoId) {
        var photo = this.findPhotoById(photoId);
        // Delete from local datasource
        if (photo === undefined || photo === null) {
            mobileNotify("deletePhoto - can't find photo!")
        }
        photoModel.photosDS.remove(photo);
        // Remove from isotope and then rerender the layout
        //$('#gallery-grid').isotope( 'remove', photoModel.currentIsoModel ).isotope('layout');
        // Delete from remote parse collection
        deleteParseObject('photos', 'photoId', photo.photoId);
    },

    deleteAllPhotos : function () {
        var photoArray = photoModel.photosDS.data();

        for (var i=0; i<photoArray.length; i++) {
            this.deletePhoto(photoArray[i].photoId);
        }
    }

};

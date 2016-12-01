'use strict';

var sharedPhotoModel = {
    _version: 1,
    _cloudClass: 'sharedphoto',
    _ggClass: 'SharedPhoto',
    _fetched : false,
    _initialSync : false,


    photosDS : null,
    
    init : function () {
        sharedPhotoModel.photosDS = new kendo.data.DataSource({  // this is the gallery datasource
            type: 'everlive',
            transport: {
                typeName: 'sharedphoto',
                dataProvider: APP.everlive
            },
            schema: {
                model: { id:  Everlive.idField}
            }
        });

        sharedPhotoModel.photosDS.bind("change", function (e) {

            var changedPhotos = e.items;

            if (e.action === undefined) {
                if (changedPhotos !== undefined && !sharedPhotoModel._initialSync) {

                    sharedPhotoModel._initialSync = true;

                }
            }
        });

        sharedPhotoModel.photosDS.fetch();
    },
    
    sync: function () {
        sharedPhotoModel.photosDS.sync();
    },

    clearStorage : function () {
        sharedPhotoModel.photosDS.data([]);
        sharedPhotoModel._fetched = false;
        sharedPhotoModel._initialSync = false;
    },
    
    updateCloud : function (photoObj)  {
        var data = APP.everlive.data(sharedPhotoModel._cloudClass);
        data.update(photoObj, {'uuid' : photoObj.uuid}, function (data) {
            if (data.result === 0) {
                ggError("Unable to update Cloud Shared Photo : " + photoObj.photoUUID);
            }
        });
    },
    
    addSharedPhoto: function (shareuuid, photoUUID, channelUUID, canCopy) {
        var share = new kendo.data.ObservableObject();

        var photo = photoModel.findPhotoById(photoUUID);
        if (photo === undefined) {
            ggError("SharePhoto -- can't find source photo!!!");
            return;
        }

        share.set('version', sharedPhotoModel._version);
        share.set('ggType', sharedPhotoModel._ggClass);
        share.set('uuid', shareuuid);
        share.set('photoUUID', photoUUID);
        share.set('channelUUID', channelUUID);
        share.set('ownerUUID', userModel._user.userUUID);
        share.set('ownerName', userModel._user.name);

        share.set('title', photo.title);
        share.set('timestamp', photo.timestamp);
        share.set('description', photo.description);
        share.set('tagString', photo.tagString);
        share.set('tags', photo.tags);
        share.set('geoPoint', photo.geoPoint);
        
        var imageUrl = photo.cloudUrl;
        if (imageUrl === null) {
            share.set('imageUrl', null);
            share.set('thumbnailUrl', null);
            share.set('isUploaded', false);
        } else {
            share.set('imageUrl',imageUrl);
            share.set('thumbnailUrl', imageUrl.replace('upload//', 'upload//c_fit,h_256,w_256//'));
            share.set('isUploaded', true);
        }
        

        if (canCopy === undefined) {
            canCopy = false;
        }
        share.set('canCopy', canCopy);

        sharedPhotoModel.photosDS.add(share);
        sharedPhotoModel.photosDS.sync();

        everlive.createOne(sharedPhotoModel._cloudClass, share, function (error, data){
            if (error !== null) {
                ggError ("Error creating sharedphoto " + JSON.stringify(error));
            }
        });

    },

    getSharedPhoto : function (uuid, callback) {
        var filter = new Everlive.Query();
        filter.where().eq('uuid', uuid);

        var photodata = APP.everlive.data(sharedPhotoModel._ggClass);
        photodata.get(filter)
            .then(function(data){
                    if (data.count === 0) {
                        callback(null)
                    } else {
                        var photo = data.result[0];
                        callback(photo);
                    }

                },
                function(error){
                    mobileNotify("SharedPhoto Find error : " + JSON.stringify(error));
                });
    },

    getSharedPhotosByChannel : function (channelUUID) {
        var filter = new Everlive.Query();
        filter.where().eq('channelUUID', channelUUID);

        var photodata = APP.everlive.data(sharedPhotoModel._ggClass);
        photodata.get(filter)
            .then(function(data){
                    if (data.count === 0) {
                        callback(null)
                    } else {
                        callback(data.result);
                    }

                },
                function(error){
                    mobileNotify("SharedPhoto Query error : " + JSON.stringify(error));
                });
    },

    getSharedPhotosByUser : function (userUUID) {

    },
    
    sharedPhotoUploaded : function (shareId) {

    },

    recallPhoto: function (photoId, channelId) {

        
    },

    unsharePhoto : function (photoId) {

    }


};

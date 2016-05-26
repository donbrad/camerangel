'use strict';

var sharedPhotoModel = {
    _version: 1,
    _cloudClass: 'sharedphoto',
    _ggClass: 'SharedPhoto',


    photosDS : null,
    
    init : function () {
        sharedPhotoModel.photosDS = new kendo.data.DataSource({  // this is the gallery datasource
            type: 'everlive',
            transport: {
                typeName: 'sharedphoto'
            },
            schema: {
                model: { id:  Everlive.idField}
            }
        });
        
    },
    
    updateCloud : function (photoObj)  {
        var data = APP.everlive.data(sharedPhotoModel._cloudClass);
        data.updateSingle(photoObj, function (data) {
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
        }
        
        share.set('version', sharedPhotoModel._version);
        share.set('ggType', sharedPhotoModel._ggClass);
        share.set('uuid', shareuuid);
        share.set('photoUUID', photoUUID);
        share.set('channelUUID', channelUUID);
        share.set('ownerId', userModel._user.userUUID);
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
            share.set('thumbnailUrl', imageUrl.replace('upload//', 'upload//c_scale,h_512,w_512//')); 
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
                mobileNotify ("Error creating sharedphoto " + JSON.stringify(error));

            } else {

            }
        });

    },

    getSharedPhoto : function (uuid, callback) {
        var filter = new Everlive.Query();
        filter.where().eq('uuid', uuid);

        var data = APP.everlive.data(sharedPhotoModel._ggClass);
        data.get(filter)
            .then(function(data){
                    if (data.count === 0) {
                        callback(null)
                    } else {
                        var photo = data.result[0];
                        callback(photo);
                    }

                },
                function(error){
                    mobileNotify("MemberDirectory Find error : " + JSON.stringify(error));
                });
    },

    getSharedPhotosByChannel : function (channelUUID) {
        var filter = new Everlive.Query();
        filter.where().eq('channelUUID', channelUUID);

        var data = APP.everlive.data(sharedPhotoModel._ggClass);
        data.get(filter)
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

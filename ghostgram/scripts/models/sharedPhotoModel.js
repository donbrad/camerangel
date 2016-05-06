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
                typeName: 'sharedphoto',
                 dataProvider: APP.everlive
            },
            schema: {
                model: { Id:  Everlive.idField}
            },
            sort: {
                field: "timestamp",
                dir: "desc"
            }
        });


    },

    addSharedPhoto: function (shareuuid, photoUUID, channelUUID, uploadFlag, canCopy) {
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
        } else {
            share.set('imageUrl',imageUrl);
            share.set('thumbnailUrl', imageUrl.replace('upload//', 'upload//c_scale,h_512,w_512//'));
        }


        share.set('isUploaded', uploadFlag);

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

    getSharedPhotosByChannel : function (channelUUID) {
        
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

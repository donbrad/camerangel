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

    addSharedPhoto: function (photoUUID, channelUUID, imageUrl, uploadFlag, canCopy) {
        var share = new kendo.data.ObservableObject();

        var shareuuid = uuid.v4();

        share.set('version', sharedPhotoModel._version);
        share.set('ggType', sharedPhotoModel._ggClass);
        share.set('Id', shareuuid);
        share.set('uuid', shareuuid);
        share.set('photoUUID', photoUUID);
        share.set('channelUUID', channelUUID);
        share.set('ownerId', userModel._user.userUUID);
        share.set('ownerName', userModel._user.name);

        share.set('imageUrl', imageUrl);
        share.set('thumbnailUrl', thumbnailUrl);

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

    sharedPhotoUploaded : function (shareId) {

    },

    recallPhoto: function (photoId, channelId) {

    },

    unsharePhoto : function (photoId) {

    }


};

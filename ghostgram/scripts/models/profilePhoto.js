/**
 * Created by donbrad on 5/4/16.
 */


'use strict';

var profilePhotoModel = {
    _version: 1,
    _cloudClass: 'profilephoto',
    _ggClass: 'ProfilePhoto',
    photosDS: null,



    init: function () {

        profilePhotoModel.photosDS = new kendo.data.DataSource({  // this is the gallery datasource
            type: 'everlive',
            transport: {
                typeName: profilePhotoModel._cloudClass,
                dataProvider: APP.everlive
            },
            schema: {
                model: { Id:  Everlive.idField}
            },
            autoSync: true
        });

        profilePhotoModel.photosDS.fetch();
       /* deviceModel.setAppState('hasPhotos', true);

        photoModel.photosDS.bind("change", function (e) {
            var changedPhoto = e.items;

            photoModel._totalPhotos = photoModel.photosDS.total();
        });*/


        /*deviceModel.isParseSyncComplete();*/
    },

    queryPhoto: function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = profilePhotoModel.photosDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();
        var photo = view[0];

        dataSource.filter(cacheFilter);

        return(photo);
    },

    findPhotoById : function (photoId) {

        return(profilePhotoModel.queryPhoto({ field: "uuid", operator: "eq", value: photoId }));
    },

    findPhotosById : function (photoId) {

        return(profilePhotoModel.queryPhotos({ field: "uuid", operator: "eq", value: photoId }));
    },

    findPhotoByContactId : function (contactId) {

        return(profilePhotoModel.queryPhoto({ field: "contactId", operator: "eq", value: contactId }));
    },

    findPhotoByContactUUID : function (contactId) {

        return(profilePhotoModel.queryPhoto({ field: "contactUUID", operator: "eq", value: contactId }));
    },


    queryPhotos: function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = profilePhotoModel.photosDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();


        dataSource.filter(cacheFilter);

        return(view);
    },

    addProfilePhoto : function (photouuid, url, contactId, contactUUID) {

        var photo = new kendo.data.ObservableObject();
        var filename = photouuid.replace(/-/g,'');

        photo.set('version', profilePhotoModel._version);
        photo.set('ggType', profilePhotoModel._ggClass);
        photo.set('photoId', photouuid);
        photo.set('uuid', photouuid);
        photo.set('deviceUrl', url);
        photo.set("contactId", contactId);
        photo.set('contactUUID', contactUUID);
        photo.set('isProfilePhoto', true);

        profilePhotoModel.photosDS.add(photo);
        profilePhotoModel.photosDS.sync();

        devicePhoto.convertImgToDataURL(url, function (dataUrl) {
            var imageBase64= dataUrl.replace(/^data:image\/(png|jpeg);base64,/, "");


            // It's a profile so store in profile cloud and do autoscaling and cropping
            devicePhoto.cloudinaryUploadProfile(photouuid, filename, dataUrl, function (photoData) {
                var photoObj = profilePhotoModel.findPhotoById(photouuid);

                if (photoObj !== undefined && photoData !== null) {
                    photoObj.set('imageUrl', photoData.url);
                    photoObj.set('cloudUrl', photoData.url);
                    photoObj.set('cloudinaryPublicId', photoData.public_id);


                    profilePhotoModel.photoDS.sync();
                    // photoModel.updateCloud(photoObj);
                }
            });
        });

        everlive.createOne(photoModel._cloudClass, photo, function (error, data){
            if (error !== null) {
                mobileNotify ("Error creating photo " + JSON.stringify(error));

            } else {
                // look up the photo (and remove duplicate local copy if there is one)
                var photoList = photoModel.findPhotosById(data.result.photoId);

                if (photoList.length > 1) {
                    var length = photoList.length;

                    for (var i=0; i<length; i++) {
                        if (photoList[i].Id === undefined) {
                            profilePhotoModel.photosDS.remove(photoList[i]);
                        }
                    }
                }

            }
        });



    }


};
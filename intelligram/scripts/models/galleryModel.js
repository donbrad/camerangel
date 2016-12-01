/**
 * Created by donbrad on 8/13/16.
 */

'use strict';

var galleryModel = {

    _version: 1,
    _cloudClass : 'gallery',
    _ggClass : 'Gallery',
    _galleryPhoto : 'galleryphoto',
    _galleryComment : 'gallerycomment',
    _addPhoto : 'addphoto',           // add photo (from owner)
    _removePhoto : 'removephoto',     // remove photo (from owner)
    _deleteGallery : 'deletegallery',     // delete gallery (from owner)
    _fetched : false,
    _initialSync : false,
    galleryDS : null,
    photoDS : new kendo.data.DataSource(),    // cache of photos from shared galleries already fetched
    commentDS : new kendo.data.DataSource(),  // cache of comments from shared galleries already fetched


    init : function() {

        galleryModel.galleryDS = new kendo.data.DataSource({
            type: 'everlive',
            transport: {
                typeName: 'gallery',
                dataProvider: APP.everlive
            },
            schema: {
                model: { id:  Everlive.idField}
            }
        });

        // Reflect any core contact changes to contactList
        galleryModel.galleryDS.bind("change", function (e) {
            // Rebuild the contactList cache when the underlying list changes: add, delete, update...

            var changedGalleries = e.items;

            if (e.action === undefined) {
                if (changedGalleries !== undefined && !galleryModel._initialSync) {

                    galleryModel._initialSync = true;

                }
            } else {
                switch (e.action) {
                    case "itemchange" :
                        var field  =  e.field;
                       /* var group = e.items[0], groupUUID = place.uuid;
                        var groupList = placesModel.findPlaceListUUID(placeUUID);

                        // if the places's name or alias has been updated, need to update the tag...
                        var tagList = tagModel.findTagByCategoryId(place.uuid);
                        if (tagList.length > 0) {
                            var placeTag = tagList[0];
                            placeTag.set('alias',place.alias);
                            placeTag.set('name', place.name);
                        }


                        if (groupList !== undefined)
                        //placeList[field] = place [field];
                            placeList.set(field, place[field]);*/

                        break;

                    case "remove" :
                        // delete from places
                        break;

                    case "sync" :
                        // syncing all places...

                        break;

                    case "add" :
                        var group = e.items[0];
                        // add to group tags
                        //tagModel.addGalleryTag(group.name, group.alias, '', group.uuid);
                        break;
                }
            }


        });


        galleryModel.galleryDS.bind("requestEnd", function (e) {
            var response = e.response,  type = e.type;

            if (type === 'read' && response) {
                if (!galleryModel._fetched){
                    galleryModel._fetched = true;
                }

            }

        });

        galleryModel.galleryDS.fetch();
    },

    sync : function () {
        galleryModel.galleryDS.sync();
    },

    clearStorage : function () {
        galleryModel.galleryDS.data([]);
        galleryModel._fetched  = false;
        galleryModel._initialSync = false;
    },

    fetchSharedGallery : function (galleryId, callback) {
        var hasPhotos = false, hasComments = false;
        var result = {photoError: null, photos: null, commentError: null, comments: null};

        galleryModel.fetchPhotos(galleryId, function (error, photos){
            hasPhotos = true;

            result.photoError = error;
            result.photos = photos;
            if(hasComments) {
                callback (result);
            }
        });

        galleryModel.fetchComments(galleryId, function (error1, comments){
            hasComments = true;
            result.commentError = error1;
            result.comments = comments;
            if(hasPhotos) {
                callback (result);
            }
        });

    },



    queryGalleries: function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = galleryModel.galleryDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();

        dataSource.filter(cacheFilter);

        return(view);
    },

    findGallery: function (uuid) {

        var galleries = galleryModel.queryGalleries({field: "uuid", operator: "eq", value: uuid});

        return (galleries[0]);
    },

    findGalleryByUUID: function (uuid) {

        var galleries = galleryModel.queryGalleries({field: "galleryUUID", operator: "eq", value: uuid});

        return (galleries[0]);
    },


    queryPhotos: function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = galleryModel.photoDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();

        dataSource.filter(cacheFilter);

        return(view);
    },

    findPhotos: function (uuid) {

        var photos = galleryModel.queryPhotos({field: "galleryUUID", operator: "eq", value: uuid});

        return (photos);
    },

    // Get gallery photos from the everlive cloud
    fetchPhotos : function (galleryUUID, callback) {
        var filter = new Everlive.Query();
        filter.where().eq('galleryUUID', galleryUUID);

        var photodata = el.data(galleryModel._galleryPhoto);
        photodata.get(filter)
            .then(function(data){
                   callback (null, data);
                },
                function(error){
                   callback(error, null)
                });
    },

    // Get gallery comments from the everlive cloud
    fetchComments : function (galleryUUID, callback) {
        var filter = new Everlive.Query();
        filter.where().eq('galleryUUID', galleryUUID);

        var commentdata = el.data(galleryModel._galleryComment);
        commentdata.get(filter)
            .then(function(data){
                    callback (null, data);
                },
                function(error){
                    callback(error, null)
                });
    },

    queryComments: function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = galleryModel.commentDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();

        dataSource.filter(cacheFilter);

        return(view);
    },


    findComments: function (uuid) {

        var comments = galleryModel.queryComments({field: "galleryPhotoUUID", operator: "eq", value: uuid});

        return (comments);
    },

    addGallery : function (gallery) {

        if (gallery.Id === undefined) {
            gallery.Id = uuid.v4();
        }

        var galleryObj = JSON.parse(JSON.stringify(gallery));
        galleryModel.galleryDS.add(galleryObj);
        galleryModel.galleryDS.sync();

        if (deviceModel.isOnline()) {
            everlive.createOne(galleryModel._cloudClass, galleryObj, function (error, data){
                if (error !== null) {
                    mobileNotify ("Error creating Gallery " + JSON.stringify(error));
                }
            });

        }

    },

    shareGallery : function (gallery) {

        gallery.isShared = true;

    },

    addGuestGallery : function (galleryUUID, galleryName, ownerUUID, ownerName) {
        var guid = uuid.v4();
        var guestGallery = {
            id : guid,
            uuid : galleryUUID,
            galleryUUID : galleryUUID,
            isShared : true,
            photoCollection :[],
            photos: [],
            ownerName : ownerName,
            ownerUUID : ownerUUID,
            title : galleryName,
            description : null,
            tagString : null

        };

        galleryModel.galleryDS.add(guestGallery);
        galleryModel.galleryDS.sync();

        galleryModel.shareGalleryPhotos(guestGallery);

        if (deviceModel.isOnline()) {
            everlive.createOne(galleryModel._cloudClass, guestGallery, function (error, data){
                if (error !== null) {
                    mobileNotify ("Error creating Shared Gallery " + JSON.stringify(error));
                }
            });

        }
    },

    createGallery : function () {
        // action function called from notification manager if user accepts
        // data-uuid is id of the notification.
    },

    addSharedGallery : function (gallery) {
        var guid = uuid.v4();
        var sharedGallery = {
            id : guid,
            uuid : guid,
            galleryUUID : gallery.uuid,
            isShared : true,
            members : gallery.members,
            photoCollection : gallery.photoCollection,
            photoCount : gallery.photos.length,
            photos: gallery.photos,
            ownerName : gallery.ownerName,
            ownerUUID : gallery.ownerUUID,
            title : gallery.title,
            description : gallery.description,
            tagString : gallery.tagString

        };


        galleryModel.galleryDS.add(sharedGallery);
        galleryModel.galleryDS.sync();

        galleryModel.shareGalleryPhotos(gallery);

        if (deviceModel.isOnline()) {
            everlive.createOne(galleryModel._cloudClass, sharedGallery, function (error, data){
                if (error !== null) {
                    mobileNotify ("Error creating Shared Gallery " + JSON.stringify(error));
                }
            });

        }

    },

    shareGalleryPhotos : function (gallery) {
        if (gallery === undefined || gallery === null) {
            ggError("Invalid Gallery!");
            return;
        }

        var galleryId = gallery.uuid;
        var photoCount = gallery.photos.length;
        gallery.photoCount = photoCount;
        gallery.photos = [];
        gallery.photoCollection = [];
        for (var i=0; i<photoCount; i++ ) {
            var photoId = uuid.v4();
            var photo = photoModel.findPhotoById(gallery.photos[i]);
            galleryModel.addGalleryPhoto(galleryId, photoId, photo);

        }

        galleryModel.galleryDS.sync();

    },

    updateGallery : function (gallery) {

        if (deviceModel.isOnline()) {
            everlive.update(galleryModel._cloudClass, gallery, {'uuid': gallery.uuid}, function (error, data) {
                if (error !== null) {
                    ggError ("Error updating gallery " + JSON.stringify(error));
                }
            });
        }

    },

    addGalleryPhoto : function (galleryId, photoId, photo) {

        var gallery = galleryModel.findGallery(galleryId);

        if (gallery === undefined)  {
            ggError ("GalleryPhoto: can't find gallery!");
            return;
        }

        var gPhoto = {
            Id : photoId,
            photoId : photoId,
            ownerUUID : userModel._user.userUUID,
            ownerName : userModel._user.name,
            photoUUID : photo.photoUUID,
            galleryUUID : galleryId,
            cloudUrl : photo.cloudUrl,
            deviceUrl : null,
            lat: photo.lat,
            lng: photo.lng,
            dateString: photo.dateString,
            addressString: photo.addressString,
            tagString: photo.tagString,
            commentCount: 0,
            likeCount: 0,
            likes: []

        };

        galleryModel.photoDS.add(photo);
        galleryModel.photoDS.sync();

        gallery.photoCollection.push(photoId);
        gallery.photos.push(photoId);
        galleryModel.galleryDS.sync();

        if (deviceModel.isOnline()) {
            everlive.createOne(galleryModel._galleryPhoto, photo, function (error, data){
                if (error !== null) {
                    ggError ("Error creating Gallery Photo " + JSON.stringify(error));
                }
            });
        }
    },

    // from a photo from all private galleries -- when user deletes from user gallery
    removePhotoFromPrivateGalleries : function (photoId) {

        // loop through list of galleries and remove this photo (brute force currently)

    },

    removePhotoFromSharedGalleries : function (photoId) {
        // loop through list of shared galleries and remove all gallery photo objects
    },


    removeGallery : function (galleryId) {
        // remove private gallery
        var gallery = galleryModel.findGallery(galleryId);

        galleryModel.galleryDS.remove(gallery);
        galleryModel.galleryDS.sync();
    },

    removeSharedGallery : function (galleryId) {
        // need to remove galleryphotos in everlive and in photosDS
    },

    removeMemberGallery : function (galleryId) {
        var gallery = galleryModel.findGallery(galleryId);

        var photos = galleryModel.findPhotos(galleryId);
        for (var i=0; i<photos.length; i++) {
            galleryModel.photosDS.remove(photos[i]);
        }
        galleryModel.photosDS.sync();
        galleryModel.galleryDS.remove(gallery);
        galleryModel.galleryDS.sync();
    },

    removeGalleryPhoto : function (gPhoto) {

        if (deviceModel.isOnline()) {
            everlive.deleteOne(galleryModel._galleryPhoto, gPhoto.Id, function (error, data){
                if (error !== null) {
                    mobileNotify ("Error Deleting Gallery Photo " + JSON.stringify(error));
                }
            });
        }
        galleryModel.photoDS.remove(gPhoto);
        galleryModel.photoDS.sync();
    },

    updateGalleryPhoto : function (gPhoto) {

    },


    addGalleryComment: function (comment) {
        galleryModel.commentDS.add(comment);
        galleryModel.commentDS.sync();

    }
};

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
    photoDS : new kendo.data.DataSource(),
    commentDS : new kendo.data.DataSource(),


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

    fetchGallery : function (galleryId, callback) {
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

        return (galleries);
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

        var data = el.data(galleryModel._galleryPhoto);
        data.get(filter)
            .then(function(data){
                   callback (null, data);
                },
                function(error){
                   callback(error, null)
                });
    },

    // Get gallery photos from the everlive cloud
    fetchComments : function (galleryUUID, callback) {
        var filter = new Everlive.Query();
        filter.where().eq('galleryUUID', galleryUUID);

        var data = el.data(galleryModel._galleryComment);
        data.get(filter)
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

        galleryModel.galleryDS.add(gallery);
        galleryModel.galleryDS.sync();

        if (deviceModel.isOnline()) {
            everlive.createOne(galleryModel._cloudClass, gallery, function (error, data){
                if (error !== null) {
                    mobileNotify ("Error creating Gallery " + JSON.stringify(error));
                }
            });

        }

    },


    updateGallery : function (gallery) {

        if (deviceModel.isOnline()) {
            everlive.update(galleryModel._cloudClass, gallery, {'uuid': gallery.uuid}, function (error, data) {
                //placeNoteModel.notesDS.remove(note);
            });
        }

    },

    addGalleryPhoto : function (galleryId, photo) {

        var gPhoto = {
            photoId : photo.photoId,
            onwerUUID : userModel._user.userUUID,
            photoUUID : photo.photoUUID,
            galleryUUID : galleryId,
            cloudUrl : photo.cloudUrl,
            deviceUrl : null,
            lat: photo.lat,
            lng: photo.lng,
            dateString: photo.dateString,
            addressString: photo.addressString,
            tagString: photo.tagString

        };

        galleryModel.photoDS.add(gPhoto);
        galleryModel.photoDS.sync();

        if (deviceModel.isOnline()) {
            everlive.createOne(galleryModel._galleryPhoto, gPhoto, function (error, data){
                if (error !== null) {
                    mobileNotify ("Error creating Gallery Photo " + JSON.stringify(error));
                }
            });
        }
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


    addGalleryComment: function ( comment) {
        galleryModel.commentDS.add(photo);
        galleryModel.commentDS.sync();

        if (deviceModel.isOnline()) {
            everlive.createOne(galleryModel._galleryComment, comment, function (error, data){
                if (error !== null) {
                    mobileNotify ("Error creating Gallery Comment " + JSON.stringify(error));
                }
            });

        }
    }
};

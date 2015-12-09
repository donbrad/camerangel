/**
 * Created by donbrad on 8/12/15.
 *
 * photoModel.js -- photos / gallery interface to parse, kendo and localstorage
 *
 */


'use strict';

var photoModel = {
    _version : 1,
    currentPhoto: {},
    currentOffer: null,
    previewSize: "33%",
    optionsShown: false,
    parsePhoto: {},
    photosDS: new kendo.data.DataSource({  // this is the gallery datasource
        offlineStorage: "gallery-offline"
    }),

    offersDS: new kendo.data.DataSource({  // this is the gallery datasource
        offlineStorage: "offers-offline"
    }),

    init: function () {

    },

    initOffer : function () {
        photoModel.currentOffer = null;
    },


    _fetchPhotos : function () {
        var ParsePhotoModel = Parse.Object.extend("photos");
        var query = new Parse.Query(ParsePhotoModel);

        query.find({
            success: function(collection) {
                var models = [];
                for (var i = 0; i < collection.length; i++) {

                    var parsePhoto = collection[i];
                    var photo = parsePhoto.toJSON();

                    var filename = photo.photoId.replace(/-/g,'');
                    filename = "photo_" + filename + ".jpg";

                    if (photo.imageUrl === null) {
                        photo.imageUrl = photo.thumbnailUrl;
                    }
                    if (window.navigator.simulator === undefined) {
                        if (photo.imageUrl !== null) {
                            photoModel.isPhotoCached(photo.imageUrl, filename, photo);
                        }
                    }


                    models.push(photo);
                }
                deviceModel.setAppState('hasPhotos', true);
                photoModel.photosDS.data(models);
                deviceModel.isParseSyncComplete();
            },
            error: function(error) {
                handleParseError(error);
            }
        });
    },


    _fetchOffers : function () {
        var ParsePhotoOffer = Parse.Object.extend("photoOffer");
        var queryOffer = new Parse.Query(ParsePhotoOffer);

        queryOffer.find({
            success: function(collection) {

                var offers = [];
                for (var i = 0; i < collection.length; i++) {
                    var parseOffer = collection[i];
                    var offer = parseOffer.toJSON();

                    offers.push(offer);
                }

                photoModel.offersDS.data(offers);

            },
            error: function(error) {
                handleParseError(error);
            }
        });
    },

    fetch: function () {
        photoModel._fetchPhotos();
        photoModel._fetchOffers();
    },

    isPhotoCached : function (url, filename, photo) {
        var store = cordova.file.dataDirectory;

        //Check for the file.
        window.resolveLocalFileSystemURL(store + filename, function(){}, function() {photoModel.addToLocalCache(url, filename, photo)});
    },

    addToLocalCache : function (url, name, photo) {
        var store = cordova.file.dataDirectory;

        var fileTransfer = new FileTransfer();
        fileTransfer.download(url, store + name,
            function(entry) {
                photo.deviceUrl =  entry;
                photo.isDirty = true;
                console.log("Cached local copy of " + name);
            },
            function(err) {
                console.log("Error");
                console.dir(err);
            });
    },

    queryPhoto: function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = photoModel.photosDS;
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

    queryPhotoOffer : function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = photoModel.offersDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();
        var offer = view[0];

        dataSource.filter(cacheFilter);

        return(offer);
    },


    findOfferById : function (offerId) {

        return(photoModel.queryPhotoOffer({ field: "uuid", operator: "eq", value: offerId }));
    },

    findOfferByPhotoId : function (photoId) {


        return(photoModel.queryPhotoOffer({ field: "photoId", operator: "eq", value: photoId }));
    },

    findPhotoById : function (photoId) {

       /* var dataSource = photoModel.photosDS;
        dataSource.filter( { field: "photoId", operator: "eq", value: photoId });
        var view = dataSource.view();
        var photo = view[0];
        dataSource.filter([]);*/

        return(photoModel.queryPhoto({ field: "photoId", operator: "eq", value: photoId }));
    },

    findPhotosByChannel : function (channelId) {
       /* var dataSource = photoModel.photosDS;
        dataSource.filter( { field: "channelId", operator: "eq", value: channelId });
        var view = dataSource.view();
        var photos = view;
        dataSource.filter([]);

        return(photos);*/
        return(photoModel.queryPhoto({ field: "channelId", operator: "eq", value: channelId }));
    },

    findPhotosBySender: function (senderId) {
       /* var dataSource = photoModel.photosDS;
        dataSource.filter( { field: "senderUUID", operator: "eq", value: senderId });
        var view = dataSource.view();
        var photos = view;
        dataSource.filter([]);

        return(photos);*/

        return(photoModel.queryPhoto({ field: "senderUUID", operator: "eq", value: senderId }));
    },

    upgradePhoto : function (photo) {
        // current trigger is no version field -- later we'll compare numbers
        if (photo.version === undefined) {
           // photo.version = photoModel._version;

            if (photo.senderUUID === undefined) {
                photo.senderUUID = null;
                photo.senderName = null;

                updateParseObject('photos', "photoId", photo.photoId, "senderUUID",  null);
                updateParseObject('photos', "photoId", photo.photoId, "senderName",  null);
            }

            if (photo.channelId === undefined) {
                photo.channelId = null;
                photo.channelName = null;

                updateParseObject('photos', "photoId", photo.photoId, "channelId",  null);
                updateParseObject('photos', "photoId", photo.photoId, "channelName",  null);
            }

            if (photo.placeId === undefined) {
                photo.placeId = null;
                photo.placeName= null;

                updateParseObject('photos', "photoId", photo.photoId, "placeId",  null);
                updateParseObject('photos', "photoId", photo.photoId, "placeName",  null);
            }

            if (photo.eventId === undefined) {
                photo.eventId = null;
                photo.eventName= null;

                updateParseObject('photos', "photoId", photo.photoId, "eventId",  null);
                updateParseObject('photos', "photoId", photo.photoId, "eventName",  null);
            }

            if (photo.address === undefined) {

                photo.address = null;

                updateParseObject('photos', "photoId", photo.photoId, "address",  null);
            }

            if (photo.deviceUrl === undefined) {

                photo.deviceUrl = null;

                updateParseObject('photos', "photoId", photo.photoId, "deviceUrl",  null);
            }

            if (photo.addressString === undefined) {

                photo.addressString = null;

                updateParseObject('photos', "photoId", photo.photoId, "addressString",  null);
            }

            if (photo.dateString === undefined) {
                var timeStamp = parseInt(photo.timeStamp);
                var timeStr = moment.unix(timeStamp).format('MMMM Do YYYY, h:mm'); // October 7th 2015, 10:26 am

                photo.dateString = timeStr;

                updateParseObject('photos', "photoId", photo.photoId, "dateString",  timeStr);
            }


            if (photo.title === undefined) {

                photo.title = null;

                updateParseObject('photos', "photoId", photo.photoId, "title",  null);
            }

            if (photo.description === undefined) {

                photo.description = null;

                updateParseObject('photos', "photoId", photo.photoId, "description",  null);
            }

            if (photo.tags === undefined) {

                photo.tags = [];

                updateParseObject('photos', "photoId", photo.photoId, "tags",  []);

            }

            if (photo.tagsString === undefined) {


                photo.tagsString = null;

                updateParseObject('photos', "photoId", photo.photoId, "tagsString",  null);
            }

            updateParseObject('photos', "photoId", photo.photoId, "version", photoModel._version);

        }


    },

    addChatPhoto : function (photo) {

    },

    getPhotoOfferACL : function () {
        var acl = new Parse.ACL();
        acl.setPublicReadAccess(true);
        acl.setPublicWriteAccess(false);
        acl.setWriteAccess(Parse.User.current().id, true);
       return(acl);
    },

    addPhotoOffer : function (photoId, thumbnail, image, canCopy) {

        var PhotoOffer = Parse.Object.extend("photoOffer");
        var offer = new PhotoOffer();

        var uploadFlag = false;

        var offeruuid = uuid.v4();
        
        offer.setACL(userModel.parseACL);
        offer.set('version', photoModel._version);

        offer.set('uuid', offeruuid);
        offer.set('photoId', photoId);
        offer.set('ownerId', userModel.currentUser.userUUID);
        offer.set('ownerName', userModel.currentUser.name);

        if (thumbnail === undefined || thumbnail === null) {
            thumbnail = null;
            uploadFlag = false;
        }

        offer.set('thumbnailUrl', thumbnail);

        if (image === undefined) {
            image = null;
        }
        offer.set('imageUrl', image);

        if (image !== null)
            uploadFlag = true;

        offer.set('uploaded', uploadFlag);

        if (canCopy === undefined) {
            canCopy = true;
        }
        offer.set('canCopy', canCopy);

        offer.save(null, {
            success: function(offer) {
                var offerObject = offer.toJSON();
                // Execute any logic that should take place after the object is saved.
                photoModel.currentOffer = offerObject;
                photoModel.offersDS.add(offerObject);

                //Update the photo with offerId
                var photo = photoModel.findPhotoById(photoId);
                if (photo === undefined) {
                    mobileNotify("Photo Offer with photo: " + photoId);
                } else {
                    photo.set("offerId", offeruuid);
                    updateParseObject('photos', 'photoId', photoId, 'offerId', offeruuid);
                }

            },
            error: function(contact, error) {
                // Execute any logic that should take place if the save fails.
                // error is a Parse.Error with an error code and message.
                handleParseError(error);
            }
        });

    },

    // Upload a device resolution photo to parse (update an outstanding offers)
    uploadPhotoImage: function (photoId) {
        var photo = photoModel.findPhotoById(photoId);

        if (photo !== undefined) {

            deviceModel.getNetworkState();

            var filename = photoId.replace(/-/g,'');
            var deviceUrl = photo.get('deviceUrl');
            if (deviceModel.isWifi()) {
                // If the phone is on wifi -- upload the shareable image now...
                devicePhoto.convertImgToDataURL(deviceUrl, function (dataUrl) {

                    var imageBase64= dataUrl.replace(/^data:image\/(png|jpeg);base64,/, "");
                    var parseFileImage = new Parse.File("photo_" + filename + ".jpg", {'base64': imageBase64});
                    parseFileImage.save().then(function () {

                        photo.set('imageUrl', parseFileImage._url);

                        updateParseObject('photos', 'photoId', photoId, 'image', parseFileImage);
                        updateParseObject('photos', 'photoId', photoId, 'imageUrl', parseFileImage._url);

                    });

                });
            } else {
                // If we're not on wifi, set the upload flag to update server image
                photo.set('needsUpload', true);
            }

        }

    },

    addImageToPhotoOffer : function (photoId, image) {
        var offer = photoModel.findOfferByPhotoId(photoId);

        if (offer !== undefined) {
            offer.set('imageUrl', image);
            offer.set('uploaded', true);
            updateParseObject('photoOffer', 'photoId', photoId, 'image', image);
            updateParseObject('photoOffer', 'photoId', photoId, 'uploaded', true);

        }

    },

    addDevicePhoto: function (devicePhoto) {
        mobileNotify("Processing photo....");
        // Todo: add additional processing to create Parse photoOffer
        var Photos = Parse.Object.extend("photos");
        var photo = new Photos();

        photo.setACL(userModel.parseACL);
        photo.set('version', photoModel._version);

        photo.set('photoId', devicePhoto.photoId);
        photo.set('deviceUrl', devicePhoto.phoneUrl);

        photo.set('imageUrl', devicePhoto.imageUrl);
        if (devicePhoto.imageFile !== null) {
            photo.set('image', devicePhoto.imageFile);
        }

        photo.set('thumbnailUrl', devicePhoto.thumbnailUrl);
        photo.set('thumbnail', devicePhoto.thumbnailFile);


        photo.set('title', null);
        photo.set('description', null);
        photo.set('senderUUID', userModel.currentUser.userUUID);
        photo.set('senderName', userModel.currentUser.name);
        photo.set('eventId', null);
        photo.set('eventName', null);
        photo.set('tags', []);
        photo.set('tagsString', null);
        photo.set('placeId', null);
        photo.set('placeName', null);
        photo.set('offerId', null);


        var channelId = (currentChannelModel.currentChannel.get('channelId') === undefined) ? null : currentChannelModel.currentChannel.get('channelId');

        var channelName = (currentChannelModel.currentChannel.get('name') === undefined) ? null : currentChannelModel.currentChannel.get('name');
        photo.set('channelId', channelId);
        photo.set('channelName', channelName);

        var timeStamp = new Date().getTime();
        photo.set("timestamp", timeStamp);
        var timeStr = moment().format('MMMM Do YYYY, h:mm'); // October 7th 2015, 10:26 am
        photo.set("dateString", timeStr);

        photo.set('lat', mapModel.lat.toString());
        photo.set('lng', mapModel.lng.toString());
        photo.set('geoPoint', new Parse.GeoPoint(parseFloat(mapModel.lat), parseFloat(mapModel.lng)));

        if (mapModel.currentAddress !== null && mapModel.currentAddress.city !== undefined) {
            var addressStr = mapModel.currentAddress.city + ', ' + mapModel.currentAddress.state + '  ' + mapModel.currentAddress.zipcode;
            photo.set('addressString', addressStr);
        }

        if (userModel.currentUser.currentPlaceUUID !== null) {
            photo.set('placeId', userModel.currentUser.currentPlaceUUID);
            photo.set('placeString', userModel.currentUser.currentPlace);
        }

        var photoObj = photo.toJSON();
        photoModel.photosDS.add(photoObj);

        photo.save(null, {
            success: function(photoIn) {

                // Execute any logic that should take place after the object is saved.
                photoModel.parsePhoto = photoIn;


            },
            error: function(contact, error) {
                // Execute any logic that should take place if the save fails.
                // error is a Parse.Error with an error code and message.
                handleParseError(error);
            }
        });


       /* var parseFile = new Parse.File("thumbnail_"+photoModel.currentPhoto.filename + ".jpeg",{'base64': data.imageData}, "image/jpg");
        parseFile.save().then(function() {
            photo.set("thumbnail", parseFile);
            photo.set("thumbnailUrl", parseFile._url);
            photoModel.currentPhoto.thumbnailUrl = parseFile._url;
            photo.save(null, {
                success: function(photo) {
                    // Execute any logic that should take place after the object is saved.
                    photoModel.parsePhoto = photo;

                },
                error: function(contact, error) {
                    // Execute any logic that should take place if the save fails.
                    // error is a Parse.Error with an error code and message.
                    handleParseError(error);
                }
            });
        });



        var parseFile2 = new Parse.File("photo_"+photoModel.currentPhoto.filename + ".jpeg",{'base64': photoModel.currentPhoto.photoUrl},"image/jpg");
        parseFile2.save().then(function() {
            photo.set("image", parseFile2);
            photo.set("imageUrl", parseFile2._url);
            photoModel.currentPhoto.photoUrl = parseFile2._url;
            photo.save(null, {
                success: function(photo) {
                    // Execute any logic that should take place after the object is saved.
                    var photoObj = photo.toJSON();
                    mobileNotify('Photo added to ghostgrams gallery');
                    photoModel.photosDS.add(photoObj);
                    photoModel.parsePhoto = photo;
                    currentChannelModel.currentMessage.photo = {thumb: photo.get('thumbnailUrl'), photo: photo.get('imageUrl'), phone: photo.get('phoneUrl')};

                },
                error: function(contact, error) {
                    // Execute any logic that should take place if the save fails.
                    // error is a Parse.Error with an error code and message.
                    handleParseError(error);
                }
            });
        });
*/
    },


    deletePhoto: function (photoId) {
        var photo = this.findPhotoById(photoId);
        // Delete from local datasource
        if (photo === undefined || photo === null) {
            mobileNotify("deletePhoto - can't find photo!");
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

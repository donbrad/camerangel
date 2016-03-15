/**
 * Created by donbrad on 8/12/15.
 *
 * photoModel.js -- photos / gallery interface to parse, kendo and localstorage
 *
 */


'use strict';

var photoModel = {
    _version : 1,
    _parseClass : 'photos',
    _ggClass: 'Photo',
    currentPhoto: {},
    currentOffer: null,
    previewSize: "33%",
    optionsShown: false,
    parsePhoto: {},
    photosDS: null,

    offersDS: new kendo.data.DataSource({
        offlineStorage: "offers"
    }),

    deletedPhotosDS: new kendo.data.DataSource({
        offlineStorage: "deletedphotos"
    }),

    init: function () {

        photoModel.photosDS = new kendo.data.DataSource({  // this is the gallery datasource
            type: 'everlive',
            offlineStorage: "photos",
            transport: {
                typeName: 'photos',
                dataProvider: APP.everlive
            },
            schema: {
                model: { id:  Everlive.idField}
            },
            sort: {
                field: "timestamp",
                dir: "desc"
            }
        });
    },

    initOffer : function () {
        photoModel.currentOffer = null;
    },


    _fetchPhotos : function () {
        var ParsePhotoModel = Parse.Object.extend(photoModel._parseClass);
        var query = new Parse.Query(ParsePhotoModel);
        query.limit(1000);

        query.find({
            success: function(collection) {
                var models = [], elModels = [],
                for (var i = 0; i < collection.length; i++) {

                    var parsePhoto = collection[i];
                    var photo = parsePhoto.toJSON();

                    var filename = photo.photoId.replace(/-/g,'');
                    filename = "photo_" + filename + ".jpg";

                    if (photo.imageUrl === null) {
                        photo.imageUrl = photo.thumbnailUrl;
                    }

                    photo.ggType = photoModel._ggClass;

                    var elPhoto = photo;

                    delete elPhoto.ACL;

                    delete elPhoto.geoPoint.__type;

                    models.push(photo);

                    elModels.push(elPhoto);
                }

                /*everlive.getCount('photos', function(error, count){
                    if (error === null && count === 0) {
                        everlive.createAll('photos', models, function (error1, data) {
                            if (error1 !== null) {
                                mobileNotify("Everlive Photo error " + JSON.stringify(error1));
                            }
                            photoModel.photosDS.sync();
                        });
                    } else {
                        if (error !== null)
                            mobileNotify("Everlive Photo error " + JSON.stringify(error));
                    }

                });
                 photoModel.photosDS.fetch();
*/
                deviceModel.setAppState('hasPhotos', true);
                photoModel.photosDS.data(models);
                photoModel.photosDS.sync();
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
        query.limit(1000);

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
        //photoModel._fetchOffers();
    },

    isPhotoCached : function (photo) {
        var store = deviceModel.fileDirectory;
        var url = photo.imageUrl;
        var filename = photo.photoId.replace(/-/g, '');

        //Check for the file.
        window.resolveLocalFileSystemURL(store + filename, function(){}, function() {photoModel.addToLocalCache(url, filename, photo)});
    },

    addToLocalCache : function (url, name, photo) {
        var store = deviceModel.fileDirectory;

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


    queryPhotos: function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = photoModel.photosDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();


        dataSource.filter(cacheFilter);

        return(view);
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

        return(photoModel.queryPhoto({ field: "photoId", operator: "eq", value: photoId }));
    },

    findPhotosByChannel : function (channelId) {

        return(photoModel.queryPhotos({ field: "channelId", operator: "eq", value: channelId }));
    },

    findPhotosByPlaceId : function (placeId) {

        return(photoModel.queryPhotos({ field: "placeId", operator: "eq", value: placeId }));
    },

    findPhotosByPlaceString : function (placeString) {

        return(photoModel.queryPhotos({ field: "placeString", operator: "contains", value: placeString }));
    },

    findPhotosByAddressString : function (addressString) {

        return(photoModel.queryPhotos({ field: "addressString", operator: "contains", value: addressString }));
    },

    findPhotosBySender: function (senderId) {

        return(photoModel.queryPhotos({ field: "senderUUID", operator: "eq", value: senderId }));
    },

     getChannelOffers : function (channelId, callback) {
        var ParsePhotoOffer = Parse.Object.extend("photoOffer");
        var queryOffer = new Parse.Query(ParsePhotoOffer);

         queryOffer.equalTo("channelId", channelId);
        queryOffer.find({
            success: function(collection) {

                var offers = [];
                for (var i = 0; i < collection.length; i++) {
                    var parseOffer = collection[i];
                    var offer = parseOffer.toJSON();

                    offers.push(offer);
                }

                if (callback !== undefined) {
                    callback(offers)
                }


            },
            error: function(error) {
                handleParseError(error);
            }
        });
    },

    getPhotoOffer : function (channelId, photoId, callback) {
        var ParsePhotoOffer = Parse.Object.extend("photoOffer");
        var queryOffer = new Parse.Query(ParsePhotoOffer);
        queryOffer.equalTo("channelId", channelId);
        queryOffer.equalTo("photoId", photoId);
        queryOffer.find({
            success: function(collection) {
                var offer = null;

                if (collection.length > 0) {
                    var parseOffer = collection[i];

                    if (parseOffer !== undefined) {
                        var offer = parseOffer.toJSON();
                    }

                }

                if (callback !== undefined) {
                    callback(offer)
                }

            },
            error: function(error) {
                handleParseError(error);
            }
        });
    },

    getAllPhotoOffers : function (photoId, callback) {
        var ParsePhotoOffer = Parse.Object.extend("photoOffer");
        var queryOffer = new Parse.Query(ParsePhotoOffer);

        queryOffer.equalTo("photoId", photoId);
        queryOffer.find({
            success: function(collection) {

                var offers = [];
                for (var i = 0; i < collection.length; i++) {
                    var parseOffer = collection[i];
                    var offer = parseOffer.toJSON();

                    offers.push(offer);
                }

                if (callback !== undefined) {
                    callback(offers)
                }


            },
            error: function(error) {
                handleParseError(error);
            }
        });
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
            if (photo.ggType === undefined) {

                photo.ggType = photoModel._ggClass;

                updateParseObject('photos', "photoId", photo.photoId, "ggType",  photoModel._ggClass);
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

            if (photo.uuid === undefined) {

                photo.uuid = photo.photoId;

                updateParseObject('photos', "photoId", photo.photoId, "uuid",  photo.photoId);
            }

            if (photo.description === undefined) {

                photo.description = null;

                updateParseObject('photos', "photoId", photo.photoId, "description",  null);
            }

            if (photo.address === undefined) {

                photo.address = null;

                updateParseObject('photos', "photoId", photo.photoId, "address",  null);
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

    addChatPhoto : function (photoObj, callback) {

        mobileNotify("Adding Chat photo to Memories...");
        var Photos = Parse.Object.extend(photoModel._parseClass);
        var photo = new Photos();

        photo.setACL(userModel.parseACL);
        photo.set('version', photoModel._version);
        photo.set('ggType', photoModel._ggClass);

        //var photoId = uuid.v4();

        var photoId = photoObj.photoId;

        var filename = photoId.replace(/-/g,'');

        var channelId = photoObj.channelId;

        var channel = channelModel.findChannelModel(channelId);
        if (channel !== undefined) {
            photo.set('channelName', channel.name);
        }

        var ownerId = photoObj.ownerId, ownerName = photoObj.ownerName;

        photo.set('photoId', photoObj.photoId);  // use the original photo id from sender to enable recall
        photo.set('uuid', photoObj.photoId);
        photo.set('channelId', channelId);
        photo.set('version', photoModel._version);

        photo.set('senderUUID',ownerId );
        photo.set('senderName', ownerName);


        photo.set('title', _nullString(photoObj.title));
        photo.set('description', _nullString(photoObj.description));
        photo.set('tagString',  _nullString(photoObj.tagString));
        photo.set('address',  _nullString(photoObj.address));
        photo.set('lat', photoObj.lat);
        photo.set('lng', photoObj.lng);
        if (photo.tags === undefined) {
            photo.tags = [];
        }
        photo.set('tags', photoObj.tags);

       /* photo.set('title', photoObj.title);
        photo.set('description',  photoObj.description);
        photo.set('eventId', photoObj.eventId);
        photo.set('eventName', photoObj.eventName);
        photo.set('tagString', photoObj.tagString);
        photo.set('tags', photoObj.tags);
        photo.set('placeId', photoObj.placeId);
        photo.set('placeName', photoObj.placeName);
        photo.set('address', photoObj.address);
        photo.set('lat', photoObj.lat);
        photo.set('lng', photoObj.lng);
        photo.set('offerId', photoObj.offerId);*/

        photo.set('thumbnailUrl',photoObj.thumbnailUrl);
        photo.set('imageUrl',photoObj.imageUrl);

        var photoObj = photo.toJSON();

        photoModel.photosDS.add(photoObj);
        photoModel.photosDS.sync();

        photo.save(null, {
            success: function(photoIn) {

                // Execute any logic that should take place after the object is saved.


            },
            error: function(contact, error) {
                // Execute any logic that should take place if the save fails.
                // error is a Parse.Error with an error code and message.
                handleParseError(error);
            }
        });

        /*devicePhoto.convertImgToDataURL(photoObj.thumbnailUrl, function (dataUrl) {
            var imageBase64= dataUrl.replace(/^data:image\/(png|jpeg);base64,/, "");
            var parseFile = new Parse.File("thumbnail_" + filename + ".jpg", {'base64': imageBase64});
            parseFile.save().then(function () {
                photo.set('thumbnail',parseFile);
                photo.set('thumbnailUrl',parseFile._url);
                var photoObj = photo.toJSON();

                photoModel.photosDS.add(photoObj);
                mobileNotify("Photo added to Memories!");
                photoModel.addOfferImage(photoId, photoObj.imageUrl);
                if (callback !== undefined)
                    callback(photo);
            });

        });
*/
    },

    addOfferImage : function (photoId, imageUrl) {
        var photo = photoModel.findPhotoById(photoId);
        devicePhoto.convertImgToDataURL(imageUrl, function (dataUrl) {
            var imageBase64= dataUrl.replace(/^data:image\/(png|jpeg);base64,/, "");
            var parseFile = new Parse.File("thumbnail_" + filename + ".jpg", {'base64': imageBase64});
            parseFile.save().then(function () {

                photo.set('imageUrl',parseFile._url);

                updateParseObject('photos', 'photoId', photoId, 'image', parseFile);
                updateParseObject('photos', 'photoId', photoId, 'imageUrl', parseFile._url);

            });

        });

    },


    getPhotoOfferACL : function () {
        var acl = new Parse.ACL();
        acl.setPublicReadAccess(true);
        acl.setPublicWriteAccess(false);
        acl.setWriteAccess(Parse.User.current().id, true);
       return(acl);
    },

    addPhotoOffer : function (photoId, channelId, thumbnailUrl, imageUrl, canCopy) {

        var PhotoOffer = Parse.Object.extend("photoOffer");
        var offer = new PhotoOffer();

        var uploadFlag = false;

        var offeruuid = uuid.v4();


        offer.setACL(photoModel.getPhotoOfferACL());
        offer.set('version', photoModel._version);

        offer.set('uuid', offeruuid);
        offer.set('photoId', photoId);
        offer.set('channelId', channelId);
        offer.set('ownerId', userModel.currentUser.userUUID);
        offer.set('ownerName', userModel.currentUser.name);

       /* if (thumbnailUrl === undefined || thumbnailUrl === null) {
            thumbnailUrl = null;
            uploadFlag = false;
        }
*/
        offer.set('thumbnailUrl', thumbnailUrl);

        if (imageUrl === undefined) {
            imageUrl = null;
        }
        offer.set('imageUrl', imageUrl);

        if (imageUrl !== null)
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
                    mobileNotify("Photo Offer with unknown photo: " + photoId);
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
        mobileNotify("Adding  photo....");
        // Todo: add additional processing to create Parse photoOffer
        var Photos = Parse.Object.extend(photoModel._parseClass);
        var photo = new Photos();

        photo.setACL(userModel.parseACL);
        photo.set('version', photoModel._version);
        photo.set('ggType', photoModel._ggClass);

        photo.set('photoId', devicePhoto.photoId);
        photo.set('uuid', devicePhoto.photoId);
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
        photo.set('tagString', null);
        photo.set('tags', []);
        photo.set('tagsString', null);
        photo.set('placeId', null);
        photo.set('placeName', null);
        photo.set('address', null);
        photo.set('offerId', null);


        if (channelView._active) {
            var channelId = channelView._channelId;
            var channelName = channelView._channel.name;
            photo.set('channelId', channelId);
            photo.set('channelName', channelName);
        } else {
            photo.set('channelId', null);
            photo.set('channelName', null);
        }

        var timeStamp = new Date().getTime();
        photo.set("timestamp", timeStamp);
        var timeStr = moment().format('MMMM Do YYYY, h:mm'); // October 7th 2015, 10:26 am
        photo.set("dateString", timeStr);

        var lat = '0.0', lng ='0.0';
        if (mapModel.lat !== null) {
            lat = mapModel.lat.toString();
        }
        if (mapModel.lng !== null) {
            lng = mapModel.lng.toString();
        }
        photo.set('lat', lat);
        photo.set('lng', lng);
        photo.set('geoPoint', new Parse.GeoPoint(parseFloat(lat), parseFloat(lng)));

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
        photoModel.photosDS.sync();

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

var moviePosterPhoto  = {

    checkPhotoCache : function (tmsId, url) {
        var store = deviceModel.fileDirectory;
        var filename = tmsId +'.jpg';

        //Check for the file.
        window.resolveLocalFileSystemURL(store + filename, function(){}, function() {moviePosterPhoto.addToLocalCache(url, filename)});
    },

    addToLocalCache : function (url, name) {
        var store = deviceModel.fileDirectory;

        var fileTransfer = new FileTransfer();
        fileTransfer.download(url, store + name,
            function(entry) {

                console.log("Cached local copy of " + name);
            },
            function(err) {
                console.log("Error");
                console.dir(err);
            });
    },

    addPoster: function (movieTitle, tmsId,  callback) {
        var poster = null;
        var store = deviceModel.fileDirectory;

        movieTitle = movieTitle.replace(" No.", ''); // Todo -- add movie name mapping function

        var title = encodeURIComponent(movieTitle);
        var imdbUrl = 'http://www.omdbapi.com/?t=' + title + '&y=&plot=full&r=json';
        $.ajax({
            url: imdbUrl,
            // dataType:"jsonp",
            //  contentType: 'application/json',
            success: function (result, textStatus, jqXHR) {
                if (result.Response === 'True') {
                    var obj = {};

                    var awards = '';
                    if (result.Awards !== undefined)
                        awards = result.Awards;
                    obj.movieTitle = movieTitle;
                    obj.awards = awards;
                    obj.tmsId= tmsId;
                    if (result.Poster === 'N/A') {
                        result.Poster = null;
                        obj.deviceUrl = null ;
                    } else {
                        moviePosterPhoto.checkPhotoCache(tmsId, result.Poster);
                        obj.deviceUrl = store+tmsId +'.jpg';
                    }
                    obj.metaScore  = result.Metascore;
                    obj.imdbRating = result.imdbRating;
                    obj.imdbVotes = result.imdbVotes;
                    obj.imdbId = result.imdbID;
                    obj.imdbUrl = null;
                    if (obj.imdbId !== undefined && obj.imdbId !== null)
                        obj.imdbUrl = 'www.imdb.com/title/'+obj.imdbId+'/';
                    if (result.Runtime === undefined) {
                        result.Runtime = "0";
                    }
                    obj.runtime = result.Runtime;
                    obj.genre = result.Genre;
                    obj.rating  = result.Rated;

                    if (obj.imdbId !== null) {
                        var theMovieDBUrl = 'https://api.themoviedb.org/3/find/' + obj.imdbId +'?external_source=imdb_id&api_key=4b2d2dd99958a2e41bb9b342195e74c1';
                        $.ajax({
                            url: theMovieDBUrl,
                            // dataType:"jsonp",
                            //  contentType: 'application/json',
                            success: function (result, textStatus, jqXHR) {
                                if (result.textSuccess !== undefined && result.textSuccess === 'success') {
                                    var imageUrl = 'http://image.tmdb.org/t/p/w342/';
                                    if (result.movie_results.length > 0) {

                                        obj.imageUrl = imageUrl + result.movie_results[0].poster_path;
                                        obj.backdropUrl = imageUrl + result.movie_results[0].backdrop_path;
                                    }
                                }
                                callback(obj);
                            },
                            error: function () {
                                callback(obj);
                            }
                        });
                    } else {
                        callback(obj);
                    }

                } else {
                    mobileNotify("Can't get poster info for " + movieTitle);
                    callback(null);
                }



            },
            error: function () {
                mobileNotify("Can't get poster info for " + movieTitle);
                callback(null);
            }
        });

    }

};
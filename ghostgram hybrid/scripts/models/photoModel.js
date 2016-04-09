/**
 * Created by donbrad on 8/12/15.
 *
 * photoModel.js -- photos / gallery interface to parse, kendo and localstorage
 *
 */


'use strict';

var photoModel = {
    _version : 1,
    _cloudClass : 'photos',
    _ggClass: 'Photo',
    currentPhoto: {},
    currentOffer: null,
    previewSize: "33%",
    optionsShown: false,
    parsePhoto: {},
    photosDS: null,

    offersDS : null,

    deletedPhotosDS: null, 

    init: function () {

        photoModel.photosDS = new kendo.data.DataSource({  // this is the gallery datasource
           // offlineStorage: "photos",
            type: 'everlive',
            transport: {
                typeName: 'photos'/*,
                dataProvider: APP.everlive*/
            },
            schema: {
                model: { Id:  Everlive.idField}
            },
            sort: {
                field: "timestamp",
                dir: "desc"
            }
        });


    photoModel.offersDS = new kendo.data.DataSource({  // this is the gallery datasource
        // offlineStorage: "photos",
        type: 'everlive',
        transport: {
            typeName: 'photooffers'/*,
             dataProvider: APP.everlive*/
        },
        schema: {
            model: { Id:  Everlive.idField}
        },
        sort: {
            field: "timestamp",
            dir: "desc"
        }
    });


    photoModel.deletedPhotosDS = new kendo.data.DataSource({  // this is the gallery datasource
        // offlineStorage: "photos",
        type: 'everlive',
        transport: {
            typeName: 'deletedphotos'/*,
             dataProvider: APP.everlive*/
        },
        schema: {
            model: { Id:  Everlive.idField}
        },
        sort: {
            field: "timestamp",
            dir: "desc"
        }
    });


    photoModel.photosDS.fetch();
        deviceModel.setAppState('hasPhotos', true);
        /*deviceModel.isParseSyncComplete();*/
    },

    initOffer : function () {
        photoModel.currentOffer = null;
    },



    _filterEverlive : function (photo) {
        var elPhoto = photo;

         delete elPhoto.ACL;

         delete elPhoto.__proto__;

         delete elPhoto.image;

         delete elPhoto.thumbnail;

         delete elPhoto.objectId;

         delete elPhoto.geoPoint.__type;

         delete elPhoto.geoPoint.__proto__;

         elPhoto.modifiedAt = elPhoto.updatedAt;

         elPhoto.uuid = elPhoto.photoId;

        return(elPhoto);

    },


    updateLocalUrl : function (uuid, localUrl) {
        var photo = photoModel.findPhotoById(uuid);

        if (photo !== undefined && photo !== null) {
            photo.deviceUrl = localUrl;
        }
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

    findPhotosById : function (photoId) {

        return(photoModel.queryPhotos({ field: "photoId", operator: "eq", value: photoId }));
    },

    findPhotosByChannel : function (channelUUID) {

        return(photoModel.queryPhotos({ field: "channelUUID", operator: "eq", value: channelUUID }));
    },

    findPhotosByPlaceId : function (placeUUID) {

        return(photoModel.queryPhotos({ field: "placeUUID", operator: "eq", value: placeUUID }));
    },

    findPhotosByPlaceString : function (placeString) {

        return(photoModel.queryPhotos({ field: "placeString", operator: "contains", value: placeString }));
    },

    findPhotosByAddressString : function (addressString) {

        return(photoModel.queryPhotos({ field: "addressString", operator: "contains", value: addressString }));
    },

    findPhotosInRadius : function (point, radius) {
        var photoArray = [];

        var ds = photoModel.photosDS;
        var length = ds.total();

        for (var i=0; i<length; i++) {
            var photo = ds.at(i);
            if (placesModel.inRadius(point.Latitude, point.Longitude, photo.geoPoint.Latitude, photo.geoPoint.Longitude, radius)){
                photoArray.push(photo);
            }
        }

        return(photoArray);
    },

    findPhotosBySender: function (senderId) {

        return(photoModel.queryPhotos({ field: "senderUUID", operator: "eq", value: senderId }));
    },

    /* getChannelOffers : function (channelUUID, callback) {
        var ParsePhotoOffer = Parse.Object.extend("photoOffer");
        var queryOffer = new Parse.Query(ParsePhotoOffer);

         queryOffer.equalTo("channelUUID", channelUUID);
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

    getPhotoOffer : function (channelUUID, photoId, callback) {
        var ParsePhotoOffer = Parse.Object.extend("photoOffer");
        var queryOffer = new Parse.Query(ParsePhotoOffer);
        queryOffer.equalTo("channelUUID", channelUUID);
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
*/

   
    addChatPhoto : function (photoObj, callback) {

        mobileNotify("Adding Chat photo to Memories...");
      /*  var Photos = Parse.Object.extend(photoModel._cloudClass);
        var photo = new Photos();*/

        var photo = new kendo.data.ObservableObject();

        //photo.setACL(userModel.parseACL);
        photo.set('version', photoModel._version);
        photo.set('ggType', photoModel._ggClass);

        //var photoId = uuid.v4();

        var photoId = photoObj.photoId;

        var filename = photoId.replace(/-/g,'');

        var channelUUID = photoObj.channelUUID;

        var channel = channelModel.findChannelModel(channelUUID);
        if (channel !== undefined) {
            photo.set('channelName', channel.name);
        }

        var ownerId = photoObj.ownerId, ownerName = photoObj.ownerName;

        photo.set('photoId', photoObj.photoId);  // use the original photo id from sender to enable recall
        photo.set('uuid', photoObj.photoId);
        photo.set('channelUUID', channelUUID);
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
        photo.set('placeUUID', photoObj.placeUUID);
        photo.set('placeName', photoObj.placeName);
        photo.set('address', photoObj.address);
        photo.set('lat', photoObj.lat);
        photo.set('lng', photoObj.lng);
        photo.set('offerId', photoObj.offerId);*/

        photo.set('thumbnailUrl',photoObj.thumbnailUrl);
        photo.set('imageUrl',photoObj.imageUrl);

       // var photoObj = photo.toJSON();
        photoModel.photosDS.add(photo);
        if (callback !== undefined)
            callback(photo);

        everlive.createOne(photoModel._cloudClass, photo, function (error, data){
            if (error !== null) {
                mobileNotify ("Error creating photo " + JSON.stringify(error));
            } else {
                // Add the everlive object with everlive created Id to the datasource
                var photoList = photoModel.findPhotosById(data.result.photoId);

                if (photoList.length > 1) {
                    var length = photoList.length;

                    for (var i=0; i<length; i++) {
                        if (photoList[i].Id === undefined) {
                            photoModel.photosDS.remove(photoList[i]);
                        }
                    }
                }

            }
        });

       /* photoModel.photosDS.add(photo);
        photoModel.photosDS.sync();*/

       /* photo.save(null, {
            success: function(photoIn) {

                // Execute any logic that should take place after the object is saved.


            },
            error: function(contact, error) {
                // Execute any logic that should take place if the save fails.
                // error is a Parse.Error with an error code and message.
                handleParseError(error);
            }
        });
*/
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
     /*       var parseFile = new Parse.File("thumbnail_" + filename + ".jpg", {'base64': imageBase64});
            parseFile.save().then(function () {

                photo.set('imageUrl',parseFile._url);

                updateParseObject('photos', 'photoId', photoId, 'image', parseFile);
                updateParseObject('photos', 'photoId', photoId, 'imageUrl', parseFile._url);

            });
*/
        });

    },

/*

    getPhotoOfferACL : function () {
        var acl = new Parse.ACL();
        acl.setPublicReadAccess(true);
        acl.setPublicWriteAccess(false);
        acl.setWriteAccess(Parse.User.current().id, true);
       return(acl);
    },
*/

    addPhotoOffer : function (photoId, channelUUID, thumbnailUrl, imageUrl, canCopy) {

        var PhotoOffer = Parse.Object.extend("photoOffer");
        var offer = new PhotoOffer();

        var uploadFlag = false;

        var offeruuid = uuid.v4();


        offer.setACL(photoModel.getPhotoOfferACL());
        offer.set('version', photoModel._version);

        offer.set('uuid', offeruuid);
        offer.set('photoId', photoId);
        offer.set('channelUUID', channelUUID);
        offer.set('ownerId', userModel._user.userUUID);
        offer.set('ownerName', userModel._user.name);

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
                    //updateParseObject('photos', 'photoId', photoId, 'offerId', offeruuid);
                }

            },
            error: function(contact, error) {
                // Execute any logic that should take place if the save fails.
                // error is a Parse.Error with an error code and message.
                handleParseError(error);
            }
        });

    },

    /*// Upload a device resolution photo to parse (update an outstanding offers)
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

                        //updateParseObject('photos', 'photoId', photoId, 'image', parseFileImage);
                        //updateParseObject('photos', 'photoId', photoId, 'imageUrl', parseFileImage._url);

                    });

                });
            } else {
                // If we're not on wifi, set the upload flag to update server image
                photo.set('needsUpload', true);
            }

        }

    },*/

    addImageToPhotoOffer : function (photoId, image) {
        var offer = photoModel.findOfferByPhotoId(photoId);

        if (offer !== undefined) {
            offer.set('imageUrl', image);
            offer.set('uploaded', true);
            //updateParseObject('photoOffer', 'photoId', photoId, 'image', image);
            //updateParseObject('photoOffer', 'photoId', photoId, 'uploaded', true);

        }

    },

    addDevicePhoto: function (devicePhoto, isCamera, callback) {
        mobileNotify("Adding  photo....");
        var photo = new kendo.data.ObservableObject();

        //photo.setACL(userModel.parseACL);

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
        photo.set('senderUUID', userModel._user.userUUID);
        photo.set('senderName', userModel._user.name);
        photo.set('eventId', null);
        photo.set('eventName', null);
        photo.set('tagString', null);
        photo.set('tags', []);
        photo.set('tagsString', null);
        photo.set('placeUUID', null);
        photo.set('placeName', null);
        photo.set('address', null);
        photo.set('offerId', null);


        if (channelView._active) {
            var channelUUID = channelView._channelUUID;
            var channelName = channelView._channel.name;
            photo.set('channelUUID', channelUUID);
            photo.set('channelName', channelName);
        } else {
            photo.set('channelUUID', null);
            photo.set('channelName', null);
        }

        var timeStamp = new Date().getTime();
        photo.set("timestamp", timeStamp);
        var timeStr = moment().format('MMMM Do YYYY, h:mm'); // October 7th 2015, 10:26 am
        photo.set("dateString", timeStr);

        var lat = '0.0', lng ='0.0';
        if (devicePhoto.lat !== null) {
            lat = devicePhoto.lat.toString();
        }
        if (devicePhoto.lng !== null) {
            lng = devicePhoto.lng.toString();
        }
        photo.set('lat', lat);
        photo.set('lng', lng);
        photo.set('geoPoint', {longitude: parseFloat(lng), latitude: parseFloat(lat)});  // everlive format for geoPoint

        var alt = 0;
        if (devicePhoto.alt !== undefined && devicePhoto.alt !== null) {
           alt = devicePhoto.alt;
        }
        photo.set('alt',alt);
        var timeStamp = new Date().getTime();
        photo.set("timestamp", timeStamp);
        var timeStr = moment().format('MMMM Do YYYY, h:mm'); // October 7th 2015, 10:26 am
        photo.set("dateString", timeStr);


        if (isCamera) {


            // If source is camera than we can use real time location information (not accurate for photos from gallery...)
            if (mapModel.currentAddress !== null && mapModel.currentAddress.city !== undefined) {
                var addressStr = mapModel.currentAddress.city + ', ' + mapModel.currentAddress.state + '  ' + mapModel.currentAddress.zipcode;
                photo.set('addressString', addressStr);
            }

            if (userModel._user.currentPlaceUUID !== null) {
                photo.set('placeUUID', userModel._user.currentPlaceUUID);
                photo.set('placeString', userModel._user.currentPlace);
            }

        } else {
            var dateStr = devicePhoto.date +  " " + devicePhoto.time;
            timeStamp = moment(dataStr);
            photo.set("timestamp", timeStamp);
            timeStr = moment(dataStr).format('MMMM Do YYYY, h:mm');
            photo.set("dateString", timeStr);
            photo.set('addressString', null);
            photo.set('placeUUID', null);
            photo.set('placeString', null);
        }
       
        // For perf reasons add the photo before it's stored on everlive
        photoModel.photosDS.add(photo);
        photoModel.photosDS.sync();
        
        if (callback !== undefined) {
            callback(null, photo);
        }
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
                            photoModel.photosDS.remove(photoList[i]);
                        }
                    }
                }

            }
        });
        
    },

    updateCloud : function (photoObj)  {
        everlive.updateOne(photoModel._cloudClass, photoObj, function (error, data) {
            if (error !== null) {
                mobileNotify("Cloud Photo Update Error : " + JSON.stringify(error));
            }
        });
    },

    deletePhoto: function (photoId) {
        var photo = this.findPhotoById(photoId);
        // Delete from local datasource
        if (photo === undefined || photo === null) {
            mobileNotify("deletePhoto - can't find photo!");
        }

        photoModel.photosDS.remove(photo);
        var Id = photo.Id;
        if (Id !== undefined){
            everlive.deleteOne(photoModel._cloudClass, Id, function (error, data) {
               
            });
        }
        
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
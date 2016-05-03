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
    _iosPrefix: "/var",
    _androidPrefix: "/",
    _emulatorPrefix: "",
    _totalPhotos: 0,
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
                typeName: 'photos',
                dataProvider: APP.everlive
            },
            schema: {
                model: { Id:  Everlive.idField}
            },
            sort: {
                field: "timestamp",
                dir: "desc"
            },
            autoSync: true
        });


      
        photoModel.deletedPhotosDS = new kendo.data.DataSource({  // this is the gallery datasource
            // offlineStorage: "photos",
            type: 'everlive',
            transport: {
                typeName: 'deletedphotos',
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


        photoModel.photosDS.fetch();
        deviceModel.setAppState('hasPhotos', true);

        photoModel.photosDS.bind("change", function (e) {
            var changedPhoto = e.items;
            
            photoModel._totalPhotos = photoModel.photosDS.total();
        });
        
        
        /*deviceModel.isParseSyncComplete();*/
    },

    initOffer : function () {
        photoModel.currentOffer = null;
    },



    updateLocalUrl : function (uuid, localUrl) {
        var photo = photoModel.findPhotoById(uuid);

        if (photo !== undefined && photo !== null) {
            photo.deviceUrl = localUrl;
        }
    },

    createPhotoLocalName : function (photoId) {
        var filename = 'photo_' + photoId.replace(/-/g, '') + '.jpg';
        return (filename);
    },

    isPhotoCached : function (photo) {
       
        var urlCloud= photo.cloudUrl, urlDevice = photo.deviceUrl;

        if (urlCloud !== null && urlDevice !== null) {
            return(true);
        }

        if (urlCloud !== null && urlDevice === null) {
        // Photo is on the cloud but not the local device
            var store = deviceModel.fileDirectory;
            var filename = photoModel.createPhotoLocalName(photo.photoId);
            var localUrl = store + filename;

            //Check for the file.
            window.resolveLocalFileSystemURL(localUrl,
                function () {

                },
                function () {
                    photoModel.addToLocalCache(urlCloud, localUrl, photo);
                    console.log("Caching photo on device :  " + photo.uuid);
                });
        }

        if (urlCloud === null && urlDevice !== null) {
            // Photo is on the device but not stored in the cloud
            console.log("Uploading Photo to cloud : " + photo.uuid);
            photoModel.uploadPhotoToCloud(photo);
        }

        return(false);

    },

    addToLocalCache : function (url, localUrl, photo) {

        var fileTransfer = new FileTransfer();
        fileTransfer.download(url, localUrl,
            function(entry) {
                photo.deviceUrl =  entry;
                console.log("Cached local copy of " + name);
            },
            function(err) {
              ggError("Local Cache Error " + JSON.stringify(err));
            });
    },

    syncLocal : function () {
        photoModel.photosDS.sync();
    },
    
    uploadPhotoToCloud : function (photo) {
        
        var url = photo.deviceUrl, photouuid = photo.uuid;
        
        if (url === null) {
            return;
        }
        devicePhoto.convertImgToDataURL(url, function (dataUrl) {
            var imageBase64= dataUrl.replace(/^data:image\/(png|jpeg);base64,/, "");
            var folder = devicePhoto._userPhoto;
            var filename = photouuid.replace(/-/g,'');
            devicePhoto.cloudinaryUpload(photouuid, filename, dataUrl, folder,  function (photoData) {
                var photoObj = photoModel.findPhotoById(photouuid);

                if (photoObj !== undefined && photoData !== null) {
                    photoObj.set('imageUrl', photoData.url);
                    photoObj.set('cloudUrl', photoData.url);
                    photoObj.thumbnailUrl = photoData.url.replace('upload//','upload//c_scale,h_512,w_512//');
                    photoObj.cloudinaryPublicId = photoData.public_id;
                    photoModel.updateCloud(photoObj);
                    photoModel.syncLocal();
                    
                }
            });
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

    getUploadList : function () {
        var uploadList = photoModel.queryPhotos({ field: "cloudUrl", operator: "eq", value: 'null' });
        return (uploadList);
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

        photo.set('Id', photoObj.photoId);
        photo.set('photoUUID', photoObj.photoUUID);  // use the original photo id from sender to enable recall
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

        photo.set('isProfilePhoto', false);

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
      //  photoModel.syncLocal();

        if (callback !== undefined)
            callback(photo);

        /*everlive.createOne(photoModel._cloudClass, photo, function (error, data){
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

    addProfilePhoto : function (photouuid, url, contactId) {

        var photo = new kendo.data.ObservableObject();

        photo.set('version', photoModel._version);
        photo.set('ggType', photoModel._ggClass);
        photo.set('Id', photouuid);
        photo.set('photoId', photouuid);
        photo.set('uuid', photouuid);
        photo.set('deviceUrl', url);
        photo.set('contactUUID', contactId);
        photo.set('isProfilePhoto', true);

        photoModel.photosDS.add(photo);
        photoModel.photosDS.sync();

        devicePhoto.convertImgToDataURL(url, function (dataUrl) {
            var imageBase64= dataUrl.replace(/^data:image\/(png|jpeg);base64,/, "");


            // It's a profile so store in profile cloud and do autoscaling and cropping
            devicePhoto.cloudinaryUploadProfile(photouuid, filename, dataUrl, function (photoData) {
                var photoObj = photoModel.findPhotoById(photouuid);

                if (photoObj !== undefined && photoData !== null) {
                    photoObj.set('imageUrl', photoData.url);
                    photoObj.set('cloudUrl', photoData.url);
                    photoObj.set('thumbnailUrl', imageUrl);  // The image is the thumbnail...
                    photoObj.set('cloudinaryPublicId', photoData.public_id);
                    photoModel.syncLocal();
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
                            photoModel.photosDS.remove(photoList[i]);
                        }
                    }
                }

            }
        });



    },

    addDevicePhoto: function (devicePhoto, isCamera, isProfilePhoto,  callback) {
        mobileNotify("Adding  photo....");
        var photo = new kendo.data.ObservableObject();

        //photo.setACL(userModel.parseACL);

        photo.set('version', photoModel._version);
        photo.set('ggType', photoModel._ggClass);
        photo.set('Id', devicePhoto.photoId);
        photo.set('photoId', devicePhoto.photoId);
        photo.set('uuid', devicePhoto.photoId);
        photo.set('deviceUrl', devicePhoto.deviceUrl);

        photo.set('imageUrl', devicePhoto.imageUrl);
        if (devicePhoto.imageFile !== null) {
            photo.set('image', devicePhoto.imageFile);
        }

        photo.set('thumbnailUrl', devicePhoto.thumbnailUrl);
        photo.set('cloudUrl', devicePhoto.cloudUrl);
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
        photo.set('isProfilePhoto', isProfilePhoto);

        if (channelView._active) {
            var channelUUID = channelView._channelUUID;
            var channelName = channelView._channel.name;
            photo.set('channelUUID', channelUUID);
            photo.set('channelName', channelName);
        } else {
            photo.set('channelUUID', null);
            photo.set('channelName', null);
        }

        var lat = 0.0, lng =0.0;
        if (devicePhoto.lat !== null) {
            lat = devicePhoto.lat;
        }
        if (devicePhoto.lng !== null) {
            lng = devicePhoto.lng;
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
        var timeStr = moment().format('MMMM Do YYYY, h:mm A'); // October 7th 2015, 10:26 am
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
            var dateStr = devicePhoto.timeStamp;
            timeStamp = moment(dateStr, "YYYY:MM:DD HH:mm:ss");
            photo.set("timestamp", timeStamp);
            timeStr = moment(timeStamp).format('MMMM Do YYYY, h:mm:ss A');
            photo.set("dateString", timeStr);
            photo.set('addressString', null);
            photo.set('placeUUID', null);
            photo.set('placeString', null);
            photo.set('placeName', null);
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
        var data = APP.everlive.data(photoModel._cloudClass);
        data.updateSingle(photoObj, function (data) {
            if (data.result === 0) {
                ggError("Unable to update Cloud Photo : " + photoObj.photoId);
            }
        });
    },

    deleteCloudinaryPhoto : function (photoid) {
        $.ajax({
            url: 'https://api.everlive.com/v1/s2fo2sasaubcx7qe/Functions/deleteCloudinaryPhoto?photoid='+photoid,
            // dataType:"jsonp",
            //  contentType: 'application/json',
            success: function(result) {

            },
            error: function(error) {
                ggError("Error deleting photo " + JSON.stringify(error));

            }
        });
    },


    deletePhoto: function (photoId) {
        var photo = this.findPhotoById(photoId);
        // Delete from local datasource
        if (photo === undefined || photo === null) {
            mobileNotify("deletePhoto - can't find photo!");
        }

        if (photo.cloudinaryPublicId !== null) {
            photoModel.deleteCloudinaryPhoto(photo.cloudinaryPublicId);
        }
        
        photoModel.photosDS.remove(photo);
        photoModel.photosDS.sync();
       /* var Id = photo.Id;
        if (Id !== undefined){
            everlive.deleteOne(photoModel._cloudClass, Id, function (error, data) {
               
            });
        }*/
        
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
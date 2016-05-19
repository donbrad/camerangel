/**
 * Created by donbrad on 7/15/15.
 * devicephoto.js
 * device specific photo interface for camera and gallery
 */

'use strict';

var devicePhoto = {
    currentPhoto : {},
    _uploadActive: false,
    _resolution : 1600,
    _quality : 75,
    _userPhoto: 'userphoto',
    _userProfile: 'userprofile',
    _cloudinaryUrl : 'https://res.cloudinary.com/ghostgrams', //Cloudinary delivery url
    _cloudinaryThumb: 'http://res.cloudinary.com/ghostgrams/image/upload/c_scale,h_512,w_512/v1454612367/',
    _cloudinaryProfile: 'http://res.cloudinary.com/ghostgrams/image/upload/c_thumb,g_adv_faces,w_150,h_150/',
    _cloudinaryImage: 'http://res.cloudinary.com/ghostgrams/image/upload/v1454612367/',


    cloudinaryUpload : function (photoUUID, filename, photoData, callback) {
        var formData = new FormData();
        formData.append('file', photoData);
        formData.append('api_key', 169985831568325);
        formData.append('public_id', filename);
        formData.append('folder', devicePhoto._userPhoto);
        formData.append('unsigned_upload', true);
        formData.append('upload_preset', 'gguserphoto');
        formData.append('callback', '/cloudinary_cors.html');

        $.ajax({
            url: 'https://api.cloudinary.com/v1_1/ghostgrams/image/upload',
            data: formData,
            type: 'POST',
            contentType: false,
            processData: false,
            headers: {
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'X-Requested-With': 'XMLHttpRequest'
            },

            success: function(responseData, textStatus, jqXHR) {
                responseData.photoUUID = photoUUID;
                callback(responseData, null);

            },
                error: function(jqXHR, textStatus, errorThrown) {
                    callback(null, errorThrown);
                }
            });
    },

    cloudinaryUploadProfile : function (photoUUID, filename, photoData, callback) {
        var formData = new FormData();
        formData.append('file', photoData);
        formData.append('api_key', 169985831568325);
        formData.append('public_id', filename);
        formData.append('folder', devicePhoto._userProfile);
        formData.append('unsigned_upload', true);
        formData.append('upload_preset', 'gguserprofile');
        formData.append('callback', '/cloudinary_cors.html');

        $.ajax({
            url: 'https://res.cloudinary.com/v1_1/ghostgrams/image/upload',
            data: formData,
            type: 'POST',
            contentType: false,
            processData: false,
            headers: {
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'X-Requested-With': 'XMLHttpRequest'
            },

            success: function(responseData, textStatus, jqXHR) {
                responseData.photoUUID = photoUUID;
                callback(responseData, null);

            },
            error: function(jqXHR, textStatus, errorThrown) {
                callback(null, errorThrown);
            }
        });
    },

    processAndroidDatum : function (datum) {
        var dataArray = datum.split(',');

        var degrees = parseFloat(dataArray[0]);
        var minutes = parseFloat(dataArray[1]);
        var seconds = parseFloat(dataArray[2]);

        var decimal = degrees + minutes/60 + seconds/(60*60);

        return decimal;

    },

    processGPS : function (gpsData) {
        var gpsObj = {
            hasData : false,
            lat : 0,
            latRef : null,
            lng: 0,
            lngRef: null,
            alt: 0,
            timestamp:  moment().format("YYYY:MM:DD HH:mm:ss")
        };

        if (device.platform === 'iOS') {
            if (gpsData === undefined || gpsData === null) {
                return (gpsObj);
            }
            gpsObj.hasData = true;
            gpsObj.lat = gpsData.Latitude;
            gpsObj.latRef = gpsData.LatitudeRef;
            if (gpsObj.latRef === 'S') {
                gpsObj.lat = -gpsObj.lat;
            }
            gpsObj.lng = gpsData.Longitude;
            gpsObj.lngRef = gpsData.LongitudeRef;
            if (gpsObj.lngRef === 'W') {
                gpsObj.lng = -gpsObj.lng;
            }
            gpsObj.alt = gpsData.Altitude;
            gpsObj.timestamp = gpsData.DateStamp + " " + gpsData.TimeStamp;

            return (gpsObj);
        } else {
            // Assume android for now...
            if (gpsData.gpsLatitude !== null) {
                gpsObj.hasData = true;
                gpsObj.lat = devicePhoto.processAndroidDatum(gpsData.gpsLatitude);
                gpsObj.latRef = gpsData.gpsLatitudeRef;
                if (gpsObj.latRef === 'S') {
                    gpsObj.lat = -gpsObj.lat;
                }
                gpsObj.lng = devicePhoto.processAndroidDatum(gpsData.gpsLongitude);
                gpsObj.lngRef = gpsData.gpsLongitudeRef;
                if (gpsObj.lngRef === 'W') {
                    gpsObj.lng = -gpsObj.lng;
                }
                gpsObj.alt = parseFloat(gpsData.gpsAltitude);
                gpsObj.timestamp = gpsData.gpsDateStamp + " " + gpsData.gpsTimeStamp;
            }
            return(gpsObj);
        }
    },


    deviceCamera : function (resolution, quality, isChat, channelUUID,  displayCallback, shareCallback) {
        if (resolution === undefined) {
            resolution = devicePhoto._resolution;  // default resolution for ghostgrams
        }
        if (quality === undefined) {
            quality = devicePhoto._quality;      // default quality for ghostgrams
        }
        if (isChat === undefined) {
            isChat = false;
        }
        var pictureSource = navigator.camera.PictureSourceType;   // picture source
        var encodingType = navigator.camera.EncodingType;
        var destinationType = navigator.camera.DestinationType; // sets the format of returned value

        var saveToAlbum = userModel._user.get('saveToPhotoAlbum');

       /* if (device.platform === 'iOS') {
            destinationType = navigator.camera.DestinationType.NATIVE_URI;
        }*/

        if (saveToAlbum === undefined) {
            saveToAlbum = false;
        }
        var allowEdit = false;
        if (device.platform === 'iOS') {
            allowEdit = true;
        }

        navigator.camera.getPicture(
            function (imageData) {
                var photouuid = uuid.v4();
                var imageObj = JSON.parse(imageData);
                var metaObj = JSON.parse(imageObj.json_metadata);
    //            var lat = metaObj.GPS.Latitude, lng = metaObj.GPS.Longitude, altitude = metaObj.GPS.Altitude, date = metaObj.GPS.DateStamp, time=metaObj.GPS.TimeStamp;
                var imageUrl = imageObj.filename;
                var gpsObj = null;

                if (device.platform === 'iOS') {
                    imageUrl = imageUrl.replace('file://', '');
                    gpsObj = devicePhoto.processGPS(metaObj.GPS);
                } else {
                    gpsObj =  devicePhoto.processGPS(metaObj);
                }
                var localUrl = null;
                // convert uuid into valid file name;
                var filename = photouuid.replace(/-/g,'');

                // Create a local copy of the
                window.resolveLocalFileSystemURL(imageObj.filename, function fileEntrySuccess(fileEntry) {
                    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function directoryEntrySuccess(directoryEntry) {
                        var uniqueNewFilename = "photo_" + filename + ".jpg";

                        fileEntry.moveTo(directoryEntry.root, uniqueNewFilename, function moveFileSuccess(newFileEntry) {
                            var localUrl = newFileEntry.toURL(), nativeUrl =  newFileEntry.nativeURL;

                            var uri = nativeUrl;
                            if (device.platform === 'iOS') {
                                nativeUrl = nativeUrl.replace('file://', '');
                                uri = nativeUrl;
                            }


                            devicePhoto.currentPhoto.photoId = photouuid;
                            devicePhoto.currentPhoto.filename = filename;
                            devicePhoto.currentPhoto.deviceUrl = nativeUrl;
                            devicePhoto.currentPhoto.imageUrl = nativeUrl;
                            devicePhoto.currentPhoto.cloudUrl = null;
                            devicePhoto.currentPhoto.thumbnailUrl = nativeUrl;
                            devicePhoto.currentPhoto.lat = gpsObj.lat;
                            devicePhoto.currentPhoto.lng = gpsObj.lng;
                            devicePhoto.currentPhoto.alt = gpsObj.alt;

                            
                            mobileNotify("Processing Photo...");
                            var scaleOptions = {
                                uri: uri,
                                filename: "photo_"+filename,
                                quality: 75,
                                width: 1600,
                                height: 1600
                            };

                            var folder = devicePhoto._userPhoto;
                            var isProfilePhoto = false;
                            if (isChat === false) {
                                // This must be a profile photo so need to adjust scale and target userprofile photo store
                                scaleOptions.width = 512;
                                scaleOptions.height = 512;
                                isProfilePhoto = true;
                            }

                            photoModel.addDevicePhoto(devicePhoto.currentPhoto, true, isProfilePhoto,  function (error, photo) {
                                if (error !== null) {
                                    mobileNotify("Photo Save Error : " + JSON.stringify(error));
                                }

                                if (displayCallback !== undefined) {
                                    displayCallback(photouuid, nativeUrl);
                                }
                            });


                            devicePhoto.convertImgToDataURL(nativeUrl, function (dataUrl) {
                                var imageBase64= dataUrl.replace(/^data:image\/(png|jpeg);base64,/, "");

                                devicePhoto.currentPhoto.uploadComplete = false;
                                devicePhoto._uploadActive = true;

                                if (isProfilePhoto) {
                                    // It's a profile so store in profile cloud and do autoscaling and cropping
                                    devicePhoto.cloudinaryUploadProfile(photouuid, filename, dataUrl, function (photoData) {
                                        var photoObj = photoModel.findPhotoById(photouuid);

                                        if (photoObj !== undefined && photoData !== null) {
                                            photoObj.set('imageUrl', photoData.url);
                                            photoObj.set('cloudUrl', photoData.url);
                                            photoObj.set('thumbnailUrl', imageUrl);  // The image is the thumbnail...
                                            photoObj.set('cloudinaryPublicId', photoData.public_id);
                                            photoObj.set('isProfilePhoto', true);
                                            photoModel.syncLocal();
                                            photoModel.updateCloud(photoObj);
                                            if (shareCallback !== undefined) {
                                                shareCallback(photoObj.photoId, photoObj.cloudUrl);
                                            }
                                            devicePhoto._uploadActive = false;
                                            devicePhoto.currentPhoto.uploadComplete = true;

                                        } else {
                                            if (shareCallback !== undefined) {
                                                shareCallback(photoObj.photoId, null);
                                            }
                                        }
                                    });
                                } else {
                                    // It's a chat or gallery photo...
                                    devicePhoto.cloudinaryUpload(photouuid, filename, dataUrl, function (photoData) {
                                        var photoObj = photoModel.findPhotoById(photouuid);

                                        if (photoObj !== undefined && photoData !== null) {
                                            photoObj.set('imageUrl', photoData.url);
                                            photoObj.set('cloudUrl', photoData.url);
                                            photoObj.set('thumbnailUrl', photoData.url.replace('upload//', 'upload//c_scale,h_512,w_512//'));
                                            photoObj.set('cloudinaryPublicId', photoData.public_id);
                                            photoObj.set('isProfilePhoto', false);
                                            photoModel.syncLocal();
                                            photoModel.updateCloud(photoObj);
                                            if (shareCallback !== undefined) {
                                                shareCallback(photoObj.photoId, photoObj.cloudUrl);
                                            }
                                            devicePhoto._uploadActive = false;
                                            devicePhoto.currentPhoto.uploadComplete = true;

                                        } else {
                                            if (shareCallback !== undefined) {
                                                shareCallback(photoObj.photoId, null);
                                            }
                                        }
                                    });
                                }
                            });

                          /*  window.ImageResizer.resize(scaleOptions,
                                function (image) {

                                    var thumbNail = image;
                                   if (device.platform === 'iOS') {
                                        thumbNail = image.replace('file://', '');
                                    }

                                    devicePhoto.convertImgToDataURL(thumbNail, function (dataUrl) {
                                        var imageBase64= dataUrl.replace(/^data:image\/(png|jpeg);base64,/, "");

                                        devicePhoto.currentPhoto.uploadComplete = false;
                                        devicePhoto._uploadActive = true;
                                        devicePhoto.cloudinaryUpload(photouuid, filename, dataUrl, folder,  function (photoData) {
                                            var photoObj = photoModel.findPhotoById(photouuid);

                                            if (photoObj !== undefined) {
                                                photoObj.set('imageUrl',photoData.url);
                                                photoObj.set('cloudUrl',photoData.url);
                                                photoObj.set('thumbnailUrl', photoData.url.replace('upload//','upload//c_scale,h_512,w_512//'));
                                                photoObj.set('cloudinaryPublicId',photoData.public_id);
                                                photoModel.syncLocal();
                                                photoModel.updateCloud(photoObj);
                                                devicePhoto._uploadActive = false;
                                                devicePhoto.currentPhoto.uploadComplete = true;

                                            }
                                        });
                                    });

                                    // success: image is the new resized image
                                }, function () {
                                    mobileNotify("Error resizing image...");

                                });
*/

                            navigator.camera.cleanup(function(){}, function(){});
                        }, function(error){
                            console.log(JSON.stringify(error));
                        });
                    }, function(error){
                        console.log(JSON.stringify(error));
                    });
                }, function(error){
                    console.log(JSON.stringify(error));
                });



            },
            function (error) {
                mobileNotify("Camera error " + error);
            }, {
                correctOrientation: true,
                allowEdit: allowEdit,
                saveToPhotoAlbum: saveToAlbum,
                pictureSource : pictureSource.CAMERA,
                encodingType: encodingType.JPEG,
                targetWidth: resolution,
                targetHeight: resolution,
                destinationType: destinationType.FILE_URI
            }
        );
    },


    deviceGallery : function (resolution, quality, isChat, channelUUID, displayCallback, shareCallback) {
        if (resolution === undefined) {
            resolution = devicePhoto._resolution;  // default resolution for ghostgrams
        }
        if (quality === undefined) {
            quality = devicePhoto._quality;      // default quality for ghostgrams
        }
        if (isChat === undefined) {
            isChat = false;
        }

        var pictureSource = navigator.camera.PictureSourceType;   // picture source
        var destinationType = navigator.camera.DestinationType; // sets the format of returned value
        var encodingType = navigator.camera.EncodingType;

        // Android storage is seriously different -- multiple photo directories with different permissions.
        // So need to get a data url in our space rather an direct link to the image in current storage
        var options = {
            //sourceType: pictureSource.SAVEDPHOTOALBUM,
            sourceType: pictureSource.PHOTOLIBRARY,
            destinationType: destinationType.FILE_URI
        };

       /* if (device.platform === 'iOS') {
            options.destinationType = destinationType.NATIVE_URI;
        }*/

        navigator.camera.getPicture(
            function (imageData) {
                var photouuid = uuid.v4();
                var imageObj = JSON.parse(imageData);
                var metaObj = JSON.parse(imageObj.json_metadata);
                var gpsObj = null;
              //  var lat = metaObj.GPS.Latitude, lng = metaObj.GPS.Longitude, altitude = metaObj.GPS.Altitude, date = metaObj.GPS.DateStamp, time=metaObj.GPS.TimeStamp;
                var imageUrl = imageObj.filename;
                var imageFile = imageObj.filename;
                if (device.platform === 'iOS') {
                    imageUrl = imageUrl.replace('file://', '');
                    gpsObj = devicePhoto.processGPS(metaObj.GPS);
                } else {
                   /* if (imageFile.substring(0,21)=="content://com.android") {
                        var photo_split=imageFile.split("%3A");
                        imageFile="content://media/external/images/media/"+photo_split[1];
                    }*/
                    //imageFile = imageFile.replace('content://', '');
                    gpsObj =  devicePhoto.processGPS(metaObj);
                }

            /*    if (device.platform === 'Android') {
                  imageUrl = imageData.replace('content://', '');
                 }*/
                var localUrl = null;
                // convert uuid into valid file name;
                var filename = photouuid.replace(/-/g,'');

                window.resolveLocalFileSystemURL(imageFile, function fileEntrySuccess(fileEntry) {
                    
                    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function directoryEntrySuccess(directoryEntry) {
                        var uniqueNewFilename = "photo_" + filename + ".jpg";

                        fileEntry.moveTo(directoryEntry.root, uniqueNewFilename, function moveFileSuccess(newFileEntry) {
                            var localUrl = newFileEntry.toURL(), nativeUrl =  newFileEntry.nativeURL;


                            var uri = nativeUrl;
                            if (device.platform === 'iOS') {
                                
                             nativeUrl = nativeUrl.replace('file://', '');
                             }
                            devicePhoto.currentPhoto.photoId = photouuid;
                            devicePhoto.currentPhoto.filename = filename;
                            devicePhoto.currentPhoto.deviceUrl = nativeUrl;
                            devicePhoto.currentPhoto.imageUrl = nativeUrl;
                            devicePhoto.currentPhoto.cloudUrl = null;
                            devicePhoto.currentPhoto.thumbnailUrl = nativeUrl;
                            devicePhoto.currentPhoto.lat = gpsObj.lat;
                            devicePhoto.currentPhoto.lng = gpsObj.lng;
                            devicePhoto.currentPhoto.alt = gpsObj.alt;
                            devicePhoto.currentPhoto.timeStamp = gpsObj.timestamp;


                            mobileNotify("Processing Photo...");
                            /*  if (device.platform === 'iOS') {
                             uri = uri.replace('file://', '');
                             }*/
                            var scaleOptions = {
                                uri: uri,
                                filename: "photo_"+filename + '.jpg',
                                quality: 75,
                                width: 1600,
                                height: 1600
                            };

                            var isProfilePhoto = false;
                            if (isChat === false) {
                                // This must be a profile photo so need to adjust scale and target userprofile photo store
                                scaleOptions.width = 512;
                                scaleOptions.height = 512;

                                isProfilePhoto = true;
                            }



                            photoModel.addDevicePhoto(devicePhoto.currentPhoto, true, isProfilePhoto,  function (error, photo) {
                                if (error !== null) {
                                    mobileNotify("Photo Save Error : " + JSON.stringify(error));
                                }
                                if (displayCallback !== undefined) {
                                    displayCallback(photouuid, nativeUrl);
                                }
                            });

                            window.ImageResizer.resize(scaleOptions,
                                function (image) {

                                    var thumbNail = image;
                                  /*  if (device.platform === 'iOS') {
                                        thumbNail = image.replace('file://', '');
                                    }*/

                                    devicePhoto.convertImgToDataURL(thumbNail, function (dataUrl) {
                                        var imageBase64= dataUrl.replace(/^data:image\/(png|jpeg);base64,/, "");

                                        devicePhoto._uploadActive = true;
                                        devicePhoto.currentPhoto.uploadComplete = false;

                                        if (isProfilePhoto) {
                                            // It's a profile so store in profile cloud and do autoscaling and cropping
                                            devicePhoto.cloudinaryUploadProfile(photouuid, filename, dataUrl, function (photoData) {
                                                var photoObj = photoModel.findPhotoById(photouuid);

                                                if (photoObj !== undefined && photoData !== null) {
                                                    photoObj.set('imageUrl', photoData.url);
                                                    photoObj.set('cloudUrl', photoData.url);
                                                    photoObj.set('thumbnailUrl', imageUrl);  // The image is the thumbnail...
                                                    photoObj.set('cloudinaryPublicId', photoData.public_id);
                                                    photoObj.set('isProfilePhoto', true);
                                                    photoModel.syncLocal();
                                                    photoModel.updateCloud(photoObj);
                                                    if (shareCallback !== undefined) {
                                                        shareCallback(photoObj.photoId, photoObj.cloudUrl);
                                                    }
                                                    devicePhoto._uploadActive = false;
                                                    devicePhoto.currentPhoto.uploadComplete = true;

                                                } else {
                                                    if (shareCallback !== undefined) {
                                                        shareCallback(photoObj.photoId, null);
                                                    }
                                                }
                                            });
                                        } else {
                                            devicePhoto.cloudinaryUpload(photouuid, filename, dataUrl, function (photoData) {
                                                var photoObj = photoModel.findPhotoById(photouuid);

                                                if (photoObj !== undefined && photoData !== null) {
                                                    photoObj.set('imageUrl', photoData.url);
                                                    photoObj.set('cloudUrl', photoData.url);
                                                    photoObj.set('thumbnailUrl', photoData.url.replace('upload//', 'upload//c_scale,h_512,w_512//'));
                                                    photoObj.set('cloudinaryPublicId', photoData.public_id);
                                                    photoObj.set('isProfilePhoto', true);
                                                    photoModel.syncLocal();
                                                    photoModel.updateCloud(photoObj);
                                                    if (shareCallback !== undefined) {
                                                        shareCallback(photoObj.photoId, photoObj.cloudUrl);
                                                    }
                                                    devicePhoto._uploadActive = false;
                                                    devicePhoto.currentPhoto.uploadComplete = true;

                                                } else {
                                                    if (shareCallback !== undefined) {
                                                        shareCallback(photoObj.photoId, null);
                                                    }
                                                }

                                            });
                                        }
                                    });
                                    // success: image is the new resized image
                                }, function () {
                                    mobileNotify("Error resizing image...");

                                });


                        }, function(error){
                                console.log(JSON.stringify(error));
                        });
                    }, function(error){
                        console.log(JSON.stringify(error));
                    });
                }, function(error){
                    console.log(JSON.stringify(error));
                });

  /*              devicePhoto.currentPhoto.photoId = photouuid;
                devicePhoto.currentPhoto.filename = filename;
                devicePhoto.currentPhoto.imageUrl = imageUrl;
                devicePhoto.currentPhoto.cloudUrl = null;
                devicePhoto.currentPhoto.thumbnailUrl = imageUrl;
                devicePhoto.currentPhoto.imageFile = null;
                devicePhoto.currentPhoto.lat = lat;
                devicePhoto.currentPhoto.lng = -lng;
                devicePhoto.currentPhoto.alt = altitude;
                devicePhoto.currentPhoto.date = date;
                devicePhoto.currentPhoto.time = time;

                var uri = imageUrl;
                
                devicePhoto.currentPhoto.phoneUrl = imageUrl;



                mobileNotify("Processing photo ...");
                var scaleOptions = {
                    uri: uri,
                    filename: "photo_"+filename,
                    quality: 75,
                    width: 1600,
                    height: 1600
                };
                var folder = devicePhoto._userPhoto;

                if (isChat === false) {
                    // This must be a profile photo so need to adjust scale and target userprofile photo store
                    scaleOptions.width = 256;
                    scaleOptions.height = 256;

                    folder = devicePhoto._userProfile;
                }

                window.ImageResizer.resize(scaleOptions,
                    function (image) {

                        var thumbNail = image;
                        if (device.platform === 'iOS') {
                            thumbNail = image.replace('file://', '');
                        }

                        devicePhoto.convertImgToDataURL(image, function (dataUrl) {
                            var imageBase64= dataUrl.replace(/^data:image\/(png|jpeg);base64,/, "");

                            devicePhoto.currentPhoto.uploadComplete = false;
                            devicePhoto._uploadActive = true;
                            devicePhoto.currentPhoto.imageUrl = thumbNail;
                            devicePhoto.currentPhoto.cloudUrl = null;
                            devicePhoto.currentPhoto.thumbnailUrl = thumbNail;
                            photoModel.addDevicePhoto(devicePhoto.currentPhoto, false, function (error, photo) {
                                if (error !== null) {
                                    ggError("Photo Cloud Save Error " + JSON.stringify(error));
                                } 
                            });
                            if (displayCallback !== undefined) {
                                displayCallback(photouuid, imageUrl);
                            }

                            devicePhoto.cloudinaryUpload(photouuid, filename, dataUrl, folder,  function (photoData, error) {
                                if (error === null) {
                                    var photoObj = photoModel.findPhotoById(photouuid);

                                    if (photoObj !== undefined) {
                                        photoObj.imageUrl = photoData.url;
                                        photoObj.cloudUrl = photoData.url;
                                        photoObj.thumbnailUrl = photoData.url.replace('upload//','upload//c_scale,h_512,w_512//');
                                        photoObj.publicId = photoData.public_id;
                                        photoModel.updateCloud(photoObj);
                                    }

                                    devicePhoto._uploadActive = false;
                                    devicePhoto.currentPhoto.uploadComplete = true;
                                    /!* devicePhoto.currentPhoto.imageUrl = photoData.url;
                                     devicePhoto.currentPhoto.cloudUrl = photoData.url;
                                     devicePhoto.currentPhoto.thumbnailUrl = photoData.url.replace('upload//','upload//c_scale,h_512,w_512//');
                                     devicePhoto.currentPhoto.publicId = photoData.public_id;*!/
                                } else {
                                     var errString = "Cloudinary Save Error " + JSON.stringify(error);
                                    ggError(errString);

                                }
                            });
                        });

                        // success: image is the new resized image
                    }, function () {
                        ggError("Error resizing image...");

                    });

*//*
                window.ImageResizer.resize(scaleOptions,
                    function (image) {

                        var thumbNail = image;
                        if (device.platform === 'iOS') {
                            thumbNail = image.replace('file://', '');
                        }

                        devicePhoto.convertImgToDataURL(thumbNail, function (dataUrl) {

                            var imageBase64= dataUrl.replace(/^data:image\/(png|jpeg);base64,/, "");
                            var parseFile = new Parse.File("thumbnail_" + filename + ".jpg", {'base64': imageBase64});
                            parseFile.save().then(function () {
                                devicePhoto.currentPhoto.thumbnailFile = parseFile;
                                devicePhoto.currentPhoto.thumbnailUrl = parseFile._url;

                                photoModel.addDevicePhoto(devicePhoto.currentPhoto);
                                if (isChat) {
                                  //  photoModel.addPhotoOffer(photouuid, channelUUID, parseFile._url, null, null, false);
                                    if (displayCallback !== undefined) {
                                        displayCallback(photouuid, imageUrl);
                                    }
                                }


                               // Need to scale the gallery photo (android returns at full resolution)
                                var imageOptions = {
                                    uri: uri,
                                    filename: "photo_"+filename,
                                    quality: 75,
                                    width: 1600,
                                    height: 1600
                                };

                                window.ImageResizer.resize(imageOptions,
                                    function (photo) {
                                        var photoUrl = photo;
                                        if (device.platform === 'iOS') {
                                            photoUrl = photo.replace('file://', '');
                                        }
                                        devicePhoto.convertImgToDataURL(photoUrl, function (dataUrl) {

                                            var imageBase64= dataUrl.replace(/^data:image\/(png|jpeg);base64,/, "");
                                            var parseFilePhoto = new Parse.File("photo_" + filename + ".jpg", {'base64': imageBase64});
                                            parseFilePhoto.save().then(function () {
                                                devicePhoto.currentPhoto.imageFile = parseFilePhoto;
                                                devicePhoto.currentPhoto.imageUrl = parseFilePhoto._url;
                                                var photo = photoModel.findPhotoById(photouuid);
                                                photo.set('imageUrl', parseFilePhoto._url);

                                                if (isChat === false) {
                                                    displayCallback(photouuid, imageUrl);
                                                }

                                                updateParseObject('photos', 'photoId', photouuid, 'image', parseFilePhoto);
                                                updateParseObject('photos', 'photoId', photouuid, 'imageUrl', parseFilePhoto._url);

                                            });

                                        });
                                    },
                                    function () {
                                        mobileNotify("Error creating photo...");
                                    });

                            });

                        });

                        // success: image is the new resized image
                    }, function () {
                        mobileNotify("Error creating thumbnail...");
                        // failed: grumpy cat likes this function
                    });
*/

            },
            function (error) {
                ggError("Phone Gallery error " + JSON.stringify(error));
            }, options
        );

    },

    // Universal success function for profile images -- just resizes the image and
    resizeSuccessProfile : function (data) {
        var imageData = data.imageData, displayUrl = imageData;

        if (device.platform === 'iOS') {
            displayUrl = imageData.replace('file://', '');

        } else {
            displayUrl = "data:image/jpg;base64," + imageData;
        }

        //var scaledImageUrl = "data:image/jpg;base64," + imageData;
       // $('#photoEditImage').attr('src', displayUrl);


        //Set the profile photo editor instance variable (its an image with data and too large for url...)
        editProfilePhotoView.setPhotoUrl(displayUrl);
        APP.kendo.navigate("#profilePhotoEdit");

    },

    // IOS success function for chat photos -- calls resize again to generate thumbnails
    resizeSuccessChat : function (data) {

        var filename = "thumb_"+photoModel.currentPhoto.filename+'.jpg';
        photoModel.currentPhoto.photoUrl = data.imageData;

        // Have the photo scaled, now generate the thumbnail from it
        /*	window.imageResizer.resizeImage(resizeSuccessThumb, resizeFailure,  photoModel.currentPhoto.imageUrl, 140, 0, {
         quality: 50, storeImage: 1, photoAlbum: 0, filename: filename });		*/

        window.imageResizer.resizeImage(resizeSuccessThumb, resizeFailure,  photoModel.currentPhoto.imageUrl, 256, 0, {
            storeImage: false, pixelDensity: true, quality: 75 });
    },

    // Android success function for chat photos -- calls resize again to generate thumbnails
    resizeSuccessAndroidChat : function (data) {

        var filename = "thumb_"+photoModel.currentPhoto.filename+'.jpg';
        photoModel.currentPhoto.photoUrl = data.imageData;

        // Have the photo scaled, now generate the thumbnail from it
        /*	window.imageResizer.resizeImage(resizeSuccessThumb, resizeFailure,  photoModel.currentPhoto.imageUrl, 140, 0, {
         quality: 50, storeImage: 1, photoAlbum: 0, filename: filename });		*/

        window.imageResizer.resizeImage(resizeSuccessThumb, resizeFailure,  photoModel.currentPhoto.imageUrl, 256, 0, {
            imageDataType: ImageResizer.IMAGE_DATA_TYPE_BASE64, storeImage: false, pixelDensity: true, quality: 75 });
    },

    resizeFailure : function (error) {

        mobileNotify("Image Resizer :" + error);

    },

    resizeSuccessThumb : function (data) {

        var imageUrl = deviceModel.fileDirectory+data.filename;

        photoModel.addDevicePhoto();

       /* // Todo: add additional processing to create ParsePhoto and photoOffer
        var Photos = Parse.Object.extend("photos");
        var photo = new Photos();

        photo.setACL(userModel.parseACL);
        photo.set('photoId', photoModel.currentPhoto.photoId);
        photo.set('deviceUrl', photoModel.currentPhoto.phoneUrl);
        photo.set('channelUUID', currentChannelModel.currentChannel.get('channelUUID'));
        photo.set('channelName', currentChannelModel.currentChannel.get('name'));

        var timeStamp = new Date().getTime();
        photo.set("timestamp", timeStamp);
        var timeStr = moment().format('MMMM Do YYYY, h:mm'); // October 7th 2015, 10:26 am
        photo.set("dateString", timeStr);

        photo.set('lat', mapModel.lat);
        photo.set('lng', mapModel.lng);
        photo.set('geoPoint', new Parse.GeoPoint(parseFloat(mapModel.lat), parseFloat(mapModel.lng)));

        if (mapModel.currentAddress !== null && mapModel.currentAddress.city !== undefined) {
            var addressStr = mapModel.currentAddress.city + ', ' + mapModel.currentAddress.state + '  ' + mapModel.currentAddress.zipcode;
            photo.set('addressString', addressStr);
        }

        if (userModel._user.currentPlaceUUID !== null) {
            photo.set('placeUUID', userModel._user.currentPlaceUUID);
            photo.set('placeString', userModel._user.currentPlace);
        }


        var parseFile = new Parse.File("thumbnail_"+photoModel.currentPhoto.filename + ".jpeg",{'base64': data.imageData}, "image/jpg");
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
                    mobileNotify('Photo added to Mer gallery');
                    photoModel.photosDS.add(photo.attributes);
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

    convertImgToDataURL: function (url, callback, outputFormat) {
        var img = new Image();
        img.setAttribute('crossOrigin', 'anonymous');

        if (outputFormat === undefined) {
            outputFormat = "image/jpeg";
        }
        img.onload = function(){
            var canvas = document.createElement('CANVAS');
            var ctx = canvas.getContext('2d');
            var dataURL;
            canvas.height = this.height;
            canvas.width = this.width;
            ctx.drawImage(this, 0, 0);
            dataURL = canvas.toDataURL(outputFormat);
            callback(dataURL);
            canvas = null;
        };
        img.onerror = function () {

        };
        img.src = url;
    }


};
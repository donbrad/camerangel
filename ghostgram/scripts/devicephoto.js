/**
 * Created by donbrad on 7/15/15.
 * devicephoto.js
 * device specific photo interface for camera and gallery
 */

'use strict';

var devicePhoto = {
    currentPhoto : {},
    _uploadActive: false,
    _resolution : 2560,
    _quality : 75,
    _userPhoto: 'userphoto',
    _userProfile: 'userprofile',
    _cloudinaryUrl : 'https://res.cloudinary.com/ghostgrams', //Cloudinary delivery url
    _cloudinaryThumb: 'http://res.cloudinary.com/ghostgrams/image/upload/c_scale,h_512,w_512/v1454612367/',
    _cloudinaryProfile: 'http://res.cloudinary.com/ghostgrams/image/upload/c_thumb,g_adv_faces,w_150,h_150/',
    _cloudinaryImage: 'http://res.cloudinary.com/ghostgrams/image/upload/v1454612367/',


    cloudinaryUpload : function (photoUUID, filename, photoData, uploadCallback) {
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
                uploadCallback(responseData, null);

            },
                error: function(jqXHR, textStatus, errorThrown) {
                uploadCallback(null, errorThrown);
                }
            });
    },

    cloudinaryUploadProfile : function (photoUUID, filename, photoData, uploadCallback) {
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
                uploadCallback(responseData, null);

            },
            error: function(jqXHR, textStatus, errorThrown) {
                uploadCallback(null, errorThrown);
            }
        });
    },

    processAndroidDatum : function (datum) {
        var dataArray = datum.split(',');

        var degrees = parseFloat(dataArray[0]);
        var minutes = parseFloat(dataArray[1]) / 60;
        var seconds = parseFloat(dataArray[2]) / 36000000;

        var decimal = degrees + minutes + seconds;

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
                gpsObj.alt = parseFloat(gpsData.gpsAltitude) / 1000;
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
                            devicePhoto.currentPhoto.cloudinaryPublicId = null;
                            devicePhoto.currentPhoto.thumbnailUrl = nativeUrl;
                            devicePhoto.currentPhoto.lat = gpsObj.lat;
                            devicePhoto.currentPhoto.lng = gpsObj.lng;
                            devicePhoto.currentPhoto.alt = gpsObj.alt;

                            
                            mobileNotify("Processing Photo...");
                            var scaleOptions = {
                                uri: uri,
                                filename: "photo_"+filename,
                                quality: 75,
                                width: devicePhoto._resolution,
                                height: devicePhoto._resolution
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
                                    devicePhoto.cloudinaryUploadProfile(photouuid, filename, dataUrl, function (photoData, error) {
                                        if (error !== null) {
                                            ggError("Cloud Photo Error " + JSON.stringify(error));
                                            return;
                                        }
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
                                    devicePhoto.cloudinaryUpload(photouuid, filename, dataUrl, function (photoData, error) {
                                        if (error !== null) {
                                            ggError("Cloud Photo Error " + JSON.stringify(error));
                                            return;
                                        }


                                        var photoObj = photoModel.findPhotoById(photouuid);

                                        if (photoObj !== undefined && photoData !== null) {
                                            var secureUrl = photoData.secure_url, thumbUrl = photoData.eager[0].secure_url;
                                            photoObj.set('imageUrl', secureUrl);
                                            photoObj.set('cloudUrl', secureUrl);
                                            photoObj.set('thumbnailUrl', thumbUrl);
                                            photoObj.set('cloudinaryPublicId', photoData.public_id);
                                            photoObj.set('isProfilePhoto', false);
                                            photoModel.syncLocal();
                                            //everlive.syncCloud();
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

    _processPhoto : function (imageUrl, isChat, gpsObj, channelUUID, displayCallback, shareCallback) {
        var photouuid = uuid.v4();
        // convert uuid into valid file name;
        var filename = photouuid.replace(/-/g,'');
      /*  if (device.platform !== 'iOS') {

            imageUrl = imageUrl.replace('file://', '');
       }
*/

        mobileNotify("Processing Photo...");
        /*  if (device.platform === 'iOS') {
         uri = uri.replace('file://', '');
         }*/

        var isProfilePhoto = false;
        if (isChat === false) {
            isProfilePhoto = true;
        }


        devicePhoto.currentPhoto.photoId = photouuid;
        devicePhoto.currentPhoto.filename = filename;
        devicePhoto.currentPhoto.deviceUrl = imageUrl;
        devicePhoto.currentPhoto.imageUrl = imageUrl;
        devicePhoto.currentPhoto.cloudUrl = null;
        devicePhoto.currentPhoto.cloudinaryPublicId = null;
        devicePhoto.currentPhoto.thumbnailUrl = imageUrl;
        devicePhoto.currentPhoto.lat = gpsObj.lat;
        devicePhoto.currentPhoto.lng = gpsObj.lng;
        devicePhoto.currentPhoto.alt = gpsObj.alt;
        devicePhoto.currentPhoto.timeStamp = gpsObj.timestamp;

        if (device.platform === 'iOS') {
            if (imageUrl.indexOf('/tmp') !== -1) {
                ggError("Storing photo in temporary storage");
            }
        }

        photoModel.addDevicePhoto(devicePhoto.currentPhoto, true, isProfilePhoto,  function (error, photo) {
            if (error !== null) {
                mobileNotify("Photo Save Error : " + JSON.stringify(error));
            }
            if (displayCallback !== undefined) {
                displayCallback(photouuid, imageUrl);
            }
        });

        devicePhoto.convertImgToDataURL(imageUrl, function (dataUrl) {
            var imageBase64= dataUrl.replace(/^data:image\/(png|jpeg);base64,/, "");

            devicePhoto._uploadActive = true;
            devicePhoto.currentPhoto.uploadComplete = false;

            if (isProfilePhoto) {
                // It's a profile so store in profile cloud and do autoscaling and cropping
                devicePhoto.cloudinaryUploadProfile(photouuid, filename, dataUrl, function (photoData, error) {
                    if (error !== null) {
                        ggError("Cloud Photo Error " + JSON.stringify(error));
                        return;
                    }

                    var photoObj = photoModel.findPhotoById(photouuid);

                    if (photoObj !== undefined && photoData !== null) {
                        var secureUrl = photoData.secure_url;
                        photoObj.set('imageUrl', secureUrl);
                        photoObj.set('cloudUrl', secureUrl);
                        photoObj.set('thumbnailUrl', secureUrl);

                        photoObj.set('cloudinaryPublicId', photoData.public_id);
                        photoObj.set('isProfilePhoto', true);
                        photoModel.syncLocal();
                      //  photoModel.updateCloud(photoObj);
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
                devicePhoto.cloudinaryUpload(photouuid, filename, dataUrl, function (photoData, error) {
                    if (error !== null) {
                        ggError("Cloud Photo Error " + JSON.stringify(error));
                        return;
                    }
                    var photoObj = photoModel.findPhotoById(photouuid);

                    if (photoObj !== undefined && photoData !== null) {
                        var secureUrl = photoData.secure_url, thumbUrl = photoData.eager[0].secure_url;
                        photoObj.set('imageUrl', secureUrl);
                        photoObj.set('cloudUrl', secureUrl);
                        photoObj.set('thumbnailUrl', thumbUrl);
                        photoObj.set('cloudinaryPublicId', photoData.public_id);
                        photoObj.set('isProfilePhoto', true);
                        photoModel.syncLocal();
                        //everlive.syncCloud();
                        // photoModel.updateCloud(photoObj);
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
            destinationType: destinationType.FILE_URI,
            encodingType: encodingType.JPEG,
            targetWidth: resolution,
            targetHeight: resolution
        };

        /* if (device.platform === 'iOS') {
         options.destinationType = destinationType.NATIVE_URI;
         }*/

        navigator.camera.getPicture(
            function (imageData) {

                var imageObj = JSON.parse(imageData);
                var metaObj = JSON.parse(imageObj.json_metadata);
                var gpsObj = null;
                //  var lat = metaObj.GPS.Latitude, lng = metaObj.GPS.Longitude, altitude = metaObj.GPS.Altitude, date = metaObj.GPS.DateStamp, time=metaObj.GPS.TimeStamp;
                var imageUrl = imageObj.filename;
                var imageFile = imageObj.filename;
                if (device.platform === 'iOS') {
                    // *** IOS ***
                    imageUrl = imageUrl.replace('file://', '');
                    gpsObj = devicePhoto.processGPS(metaObj.GPS);
                    window.resolveLocalFileSystemURL(imageFile, function fileEntrySuccess(fileEntry) {
                        var localUrl = fileEntry.toURL(), nativeUrl =  fileEntry.nativeURL;

                        devicePhoto._processPhoto(nativeUrl, isChat, gpsObj, channelUUID, displayCallback, shareCallback );
                    }, function(error){
                        console.log(JSON.stringify(error));
                    });
                } else {
                    // *** Android ***
                    gpsObj =  devicePhoto.processGPS(metaObj);
                    if (imageFile.substring(0,21)=="content://com.android") {
                       var  photo_split=imageFile.split("%3A");
                        imageFile="content://media/external/images/media/"+photo_split[1];
                    }
                    devicePhoto._processPhoto(imageFile, isChat, gpsObj, channelUUID, displayCallback, shareCallback);

                    /*window.FilePath.resolveNativePath(imageFile, function (result) {
                        // onSuccess code
                        imageFile = result;
                        devicePhoto._processPhoto(imageFile, isChat, gpsObj, channelUUID, displayCallback, shareCallback);
                    });*/

                    
                   /* if (imageFile.substring(0,21)=="content://com.android") {
                        var photo_split=imageFile.split("%3A");
                        imageFile="content://media/external/images/media/"+photo_split[1];
                    }*/
                    //imageFile = imageFile.replace('content://', '');

                }


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
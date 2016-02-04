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
    _cloudinaryUrl : 'https://res.cloudinary.com/ghostgrams', //Cloudinary delivery url
    _cloudinaryThumb: 'http://res.cloudinary.com/ghostgrams/image/upload/c_scale,h_512,w_512/v1454612367/',
    _cloudinaryImage: 'http://res.cloudinary.com/ghostgrams/image/upload/v1454612367/',

    cloudinaryUpload : function (photoId, photoData, callback) {
        var formData = new FormData();
        formData.append('file', photoData);
        formData.append('api_key', 169985831568325);
        formData.append('public_id', photoId);
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

                callback(responseData, null);

            },
                error: function(jqXHR, textStatus, errorThrown) {
                    callback(null, errorThrown);
                }
            });
    },

    deviceCamera : function (resolution, quality, isChat, channelId,  displayCallback) {
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

        var saveToAlbum = userModel.currentUser.get('saveToPhotoAlbum');

       /* if (device.platform === 'iOS') {
            destinationType = navigator.camera.DestinationType.NATIVE_URI;
        }*/

        if (saveToAlbum === undefined) {
            saveToAlbum = false;
        }

        navigator.camera.getPicture(
            function (imageData) {
                var photouuid = uuid.v4();
                var imageUrl = imageData;
                if (device.platform === 'iOS') {
                    imageUrl = imageData.replace('file://', '');
                }
                var localUrl = null;
                // convert uuid into valid file name;
                var filename = photouuid.replace(/-/g,'');

                // Create a local copy of the
                window.resolveLocalFileSystemURL(imageData, function fileEntrySuccess(fileEntry) {
                    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function directoryEntrySuccess(directoryEntry) {
                        var uniqueNewFilename = "photo_" + filename + ".jpg";

                        fileEntry.moveTo(directoryEntry.root, uniqueNewFilename, function moveFileSuccess(newFileEntry) {
                            var localUrl = newFileEntry.fullPath, nativeUrl =  newFileEntry.nativeURL;
                            devicePhoto.currentPhoto.photoId = photouuid;
                            devicePhoto.currentPhoto.filename = filename;
                            devicePhoto.currentPhoto.imageUrl = null;
                            devicePhoto.currentPhoto.imageFile = null;
                            var uri = nativeUrl;

                            if (device.platform === 'iOS') {
                                nativeUrl = nativeUrl.replace('file://', '');
                                uri = nativeUrl;
                            }

                            devicePhoto.currentPhoto.phoneUrl = nativeUrl;
                            mobileNotify("Processing Photo...");
                            var scaleOptions = {
                                uri: uri,
                                filename: "photo_"+filename,
                                quality: 75,
                                width: 1600,
                                height: 1600
                            };

                            window.ImageResizer.resize(scaleOptions,
                                function (image) {

                                    var thumbNail = image;
                                   if (device.platform === 'iOS') {
                                        thumbNail = image.replace('file://', '');
                                    }

                                    devicePhoto.convertImgToDataURL(thumbNail, function (dataUrl) {
                                        var imageBase64= dataUrl.replace(/^data:image\/(png|jpeg);base64,/, "");


                                        // Fill in the device photo info incase the user hits send before cloudiary completes
                                        devicePhoto.currentPhoto.imageUrl = devicePhoto._cloudinaryImage+'userphoto/'+ filename + '.jpg';
                                        devicePhoto.currentPhoto.thumbnailUrl = devicePhoto._cloudinaryThumb+'userphoto/'+ filename + '.jpg';

                                        photoModel.addDevicePhoto(devicePhoto.currentPhoto);
                                        if (displayCallback !== undefined) {
                                            displayCallback(photouuid, nativeUrl);
                                        }

                                        
                                        devicePhoto._uploadActive = true;
                                        devicePhoto.cloudinaryUpload(filename, dataUrl, function (photoData) {
                                            devicePhoto._uploadActive = false;
                                            devicePhoto.currentPhoto.imageUrl = photoData.url;
                                            devicePhoto.currentPhoto.thumbnailUrl = devicePhoto._cloudinaryThumb+photoData.public_id + '.jpg';
                                            devicePhoto.currentPhoto.publicId = photoData.public_id;



                                            //photoModel.addPhotoOffer(photouuid, channelId, parseFile._url, null, null , false);


                                        });
                                    });

                                    // success: image is the new resized image
                                }, function () {
                                    mobileNotify("Error creating thumbnail...");

                                });


/*                            if (isChat) {
                                mobileNotify("Processing Chat thumbnail...");
                                var scaleOptions = {
                                    uri: uri,
                                    filename: "thumb_"+filename,
                                    quality: 60,
                                    width: 512,
                                    height: 512
                                };

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
                                                //photoModel.addPhotoOffer(photouuid, channelId, parseFile._url, null, null , false);
                                                if (displayCallback !== undefined) {
                                                    displayCallback(photouuid, nativeUrl);
                                                }

                                                photoModel.uploadPhotoImage(devicePhoto.currentPhoto.photoId);

                                            });

                                        });

                                        // success: image is the new resized image
                                    }, function () {
                                        mobileNotify("Error creating thumbnail...");
                                        // failed: grumpy cat likes this function
                                    });
                            } else {
                                if (displayCallback !== undefined) {
                                    displayCallback(photouuid, nativeUrl);
                                }
                            }*/

                            navigator.camera.cleanup(function(){}, function(){});
                        }, function(){});
                    }, function(){});
                }, function(){});



            },
            function (error) {
                mobileNotify("Camera error " + error);
            }, {
                correctOrientation: true,
                allEdit: true,
                saveToPhotoAlbum: saveToAlbum,
                pictureSource : pictureSource.CAMERA,
                encodingType: encodingType.JPEG,
                targetWidth: resolution,
                destinationType: destinationType.FILE_URI
            }
        );
    },


    deviceGallery : function (resolution, quality, isChat, channelId, displayCallback) {
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


        // Android storage is seriously different -- multiple photo directories with different permissions.
        // So need to get a data url in our space rather an direct link to the image in current storage
        var options = {
            sourceType: pictureSource.SAVEDPHOTOALBUM,
            destinationType: destinationType.FILE_URI
        };

        if (device.platform === 'iOS') {
            options.destinationType = destinationType.NATIVE_URI;
        }

        navigator.camera.getPicture(
            function (imageData) {
                var photouuid = uuid.v4();
                var imageUrl = imageData;
               /* if (device.platform === 'iOS') {
                    imageUrl = imageData.replace('file://', '');
                }*/

            /*    if (device.platform === 'Android') {
                  imageUrl = imageData.replace('content://', '');
                 }*/
                var localUrl = null;
                // convert uuid into valid file name;
                var filename = photouuid.replace(/-/g,'');


                devicePhoto.currentPhoto.photoId = photouuid;
                devicePhoto.currentPhoto.filename = filename;
                devicePhoto.currentPhoto.imageUrl = null;
                devicePhoto.currentPhoto.imageFile = null;
                var uri = imageUrl;

                /*if (device.platform === 'iOS') {
                    nativeUrl = nativeUrl.replace('file://', '');
                    uri = nativeUrl;
                }*/
                devicePhoto.currentPhoto.phoneUrl = imageUrl;




                mobileNotify("Processing photo thumbnail...");
                var scaleOptions = {
                    uri: uri,
                    filename: "thumb_"+filename,
                    quality: 60,
                    width: 512,
                    height: 512
                };

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
                                  //  photoModel.addPhotoOffer(photouuid, channelId, parseFile._url, null, null, false);
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




/*
                var photouuid = uuid.v4();
                var imageUrl = imageData;
                var displayUrl = imageData;

                if (device.platform === 'iOS') {
                    imageUrl = imageData.replace('file://', '');

                }	else {
                    displayUrl = "data:image/jpg;base64," + imageData;
                }
                // convert uuid into valid file name;
                var filename = photouuid.replace(/-/g,'');

                devicePhoto.currentPhoto.photoId = photouuid;
                devicePhoto.currentPhoto.filename = filename;
                devicePhoto.currentPhoto.imageUrl = imageUrl;
                devicePhoto.currentPhoto.phoneUrl = imageUrl;

                photoModel.addDevicePhoto(devicePhoto.currentPhoto);

                if (displayCallback !== undefined) {
                    displayCallback(displayUrl);
                }

                if (isChat) {
                    mobileNotify("Processing photo...");
                    var scaleOptions = {
                        uri: imageUrl,
                        folderName: "thumbnails",
                        quality: 75,
                        width: 512,
                        height: 512
                    };

                    window.ImageResizer.resize(scaleOptions,
                        function (image) {
                            var thumbNail = image;
                            if (device.platform === 'iOS') {
                                thumbNail = image.replace('file://', '');
                            }

                            devicePhoto.convertImgToDataURL(thumbNail, function (dataUrl) {
                                var imageBase64= dataUrl.replace(/^data:image\/(png|jpeg);base64,/, "");

                                var parseFile = new Parse.File("thumbnail" + filename + ".jpg", {'base64': imageBase64});
                                parseFile.save().then(function () {

                                    devicePhoto.currentPhoto.parseThumbnail = parseFile;

                                    devicePhoto.currentPhoto.thumbnailUrl = parseFile._url;

                                    photoModel.addPhotoOffer(photouuid, parseFile._url, null );

                                });

                            });


                        }, function () {
                            mobileNotify("Error creating thumbnail...");
                        });
                }

*/
            },
            function (error) {
                mobileNotify("Phone Gallery error " + error);
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
        photo.set('channelId', currentChannelModel.currentChannel.get('channelId'));
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

        if (userModel.currentUser.currentPlaceUUID !== null) {
            photo.set('placeId', userModel.currentUser.currentPlaceUUID);
            photo.set('placeString', userModel.currentUser.currentPlace);
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
        img.src = url;
    }


};
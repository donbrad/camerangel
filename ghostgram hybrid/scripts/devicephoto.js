/**
 * Created by donbrad on 7/15/15.
 * devicephoto.js
 * device specific photo interface for camera and gallery
 */

'use strict';

var devicePhoto = {
    currentPhoto : {},
    _resolution : 1600,
    _quality : 75,


    deviceCamera : function (resolution, quality, isChat, displayCallback) {
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
        var saveToAlbum = userModel.currentUser.get('saveToPhotoAlbum');

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
                // convert uuid into valid file name;
                var filename = photouuid.replace(/-/g,'');

                devicePhoto.currentPhoto.photoId = photouuid;
                devicePhoto.currentPhoto.filename = filename;
                devicePhoto.currentPhoto.imageUrl = imageUrl;
                devicePhoto.currentPhoto.phoneUrl = imageUrl;

                if (displayCallback !== undefined) {
                    displayCallback(imageData);
                }

                mobileNotify("Processing photo...");

                var scaleOptions = {
                    uri: imageUrl,
                    folderName: "thumbnails",
                    quality: 75,
                    width: 512,
                    height: 512};

                window.ImageResizer.resize(scaleOptions,
                    function(image) {
                        var thumbNail = image;
                        if (device.platform === 'iOS') {
                            thumbNail = image.replace('file://', '');
                        }

                        // success: image is the new resized image
                    }, function() {
                        mobileNotify("Error creating thumbnail...");
                        // failed: grumpy cat likes this function
                    });

              /*  if (isChat) {
                    window.imageResizer.resizeImage(resizeSuccessChat, resizeFailure,  imageUrl, 0, resolution, {
                        storeImage: true, pixelDensity: true, quality: quality });
                } else {
                    window.imageResizer.resizeImage(resizeSuccessProfile, resizeFailure,  imageUrl, 0, resolution, {
                        storeImage: true, pixelDensity: true, quality: quality });
                }*/

            },
            function (error) {
                mobileNotify("Camera error " + error);
            }, {
                correctOrientation: true,
                allEdit: true,
                saveToPhotoAlbum: saveToAlbum,
                encodingType: navigator.camera.EncodingType.PNG,
                targetWidth: resolution,
                destinationType: navigator.camera.DestinationType.FILE_URL
            }
        );
    },


    deviceGallery : function (resolution, quality, isChat, displayCallback) {
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

                if (displayCallback !== undefined) {
                    displayCallback(displayUrl);
                }

                mobileNotify("Processing photo...");
                //resize image to 1200 pixels high
                /*		   window.imageResizer.resizeImage(resizeSuccess, resizeFailure,  imageUrl, 0, 1200, {
                 quality: 75, storeImage: 1, photoAlbum: 0, filename: "photo_"+filename+'.jpg' }); */

              /*  if (device.platform === 'iOS') {
                    if (isChat) {
                        window.imageResizer.resizeImage(resizeSuccessChat, resizeFailure,  imageUrl, 0, resolution, {
                            storeImage: false, pixelDensity: true, quality: quality });
                    } else {
                        window.imageResizer.resizeImage(resizeSuccessProfile, resizeFailure,  imageUrl, 0, resolution, {
                            storeImage: false, pixelDensity: true, quality: quality });
                    }

                } else {
                    if (isChat) {
                        window.imageResizer.resizeImage(resizeSuccessAndroidChat, resizeFailure, imageUrl, 0, resolution, {
                            imageDataType: ImageResizer.IMAGE_DATA_TYPE_BASE64,
                            storeImage: false,
                            pixelDensity: true,
                            quality: quality
                        });
                    } else {
                        window.imageResizer.resizeImage(resizeSuccessProfile, resizeFailure, imageUrl, 0, resolution, {
                            imageDataType: ImageResizer.IMAGE_DATA_TYPE_BASE64,
                            storeImage: false,
                            pixelDensity: true,
                            quality: quality
                        });
                    }
                }*/
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

        photoModel.addDevicePhoto(data);

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
    }


};
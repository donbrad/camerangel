/**
 * Created by donbrad on 8/23/16.
 */

'use strict';

var galleryChannel = {

    lastAccess: 0,   // last access time stamp
    _version: 1,
    _cloudClass: "gallery",
    _ggClass: 'Gallery',
    _class : 'gallery',
    pendingDS: new kendo.data.DataSource(),  // list of offline messages to be sent
    messagesDS: null,  // gallery messages per gallery (likes, comments)
    galleryArray : [],  // list of gallery channels being tracked
    trackArray : [],

    _addPhoto : 'addphoto',             // add photo (from owner)
    _removePhoto : 'removephoto',       // remove photo (from owner)
    _deleteGallery : 'deletegallery',     // delete gallery (from owner)
    _comment : 'comment',
    _like : 'like',


    init : function () {
        galleryChannel.buildGalleryArray();
    },

    buildGalleryArray : function () {
        var len = galleryModel.galleryDS.total();

        galleryChannel.galleryArray = [];
        galleryChannel.trackArray = [];

        for (var i=0; i<len; i++) {
            var gallery = galleryModel.galleryDS.at(i);
            galleryChannel.galleryArray.push(gallery.uuid);
            if (gallery.isTracked) {
                galleryChannel.trackArray.push(gallery.uuid);
            }
        }
    },

    subscribeGalleries : function () {
        APP.pubnub.subscribe({
            channel: galleryChannel.galleryArray,
            windowing: 300,
            message: galleryChannel.channelRead,
            connect: galleryChannel.channelConnect,
            disconnect:galleryChannel.channelDisconnect,
            reconnect: galleryChannel.channelReconnect,
            error: galleryChannel.channelError

        });

    },

    galleryHistory : function (galleryId) {

        APP.pubnub.history({
            channel: galleryId,
            stringifyTimeToken : true,
            callback: function (status, response) {
                if (status.error) {
                    // handle error
                    ggError("Gallery History : " + JSON.stringify(status.error));
                    return;
                }
                var messages = response.messages;
                if (messages.length === 0) {
                    return;
                }

                var chanStart = response.startTimeToken, chanEnd = response.endTimeToken;
                if (messages.length > 0) {
                    for (var i = 0; i < messages.length; i++) {
                        var msg = messages[i].message;

                        galleryChannel.processMessage(msg);
                    }
                }

            }

        });
     },

    processMessage: function (message) {
        var that = galleryChannel;
        var galleryId = message.galleryId;
        var photoId = null;

         switch (message.msgType) {
             case  that._addPhoto :
                 photoId = message.photoId;
                 break;

             case that._removePhoto :
                 photoId = message.photoId;
                 break;

             case that._comment :
                 photoId = message.photoId;
                 break;

             case that._like :
                 photoId = message.photoId;
                 break;

             case that._deleteGallery :
                 break;


         }

    },

    sendAddPhoto : function (galleryId, galleryName,  photoId) {
        var msgID = uuid.v4();

        var targetStr = '#sharedgallery?galleryid='+ galleryId;
        var notificationString =  userModel._user.name + ' added a photo to "' + galleryName + '"';
        var message = {
            msgID: msgID,
            msgClass : galleryChannel._class,
            msgType : galleryChannel._addPhoto,
            sender: userModel._user.userUUID,
            time: ggTime.currentTimeInSeconds(),
            galleryId : galleryId,
            photoId : photoId,
            pn_apns: {
                aps: {
                    alert : notificationString,
                    badge: 1,
                    'content-available' : 1
                },
                target: targetStr ,
                galleryId: galleryId,
                photoId : photoId
            },
            pn_gcm : {
                data : {
                    title: notificationString,
                    message: notificationString,
                    image: "icon",
                    target: targetStr,
                    galleryId: galleryId,
                    photoId : photoId
                }
            }
        };

        if (!deviceModel.isOnline()) {
            galleryChannel.pendingDS.add(message);
        } else {
            galleryChannel.publish(message);
        }

    },

    sendRemovePhoto : function (galleryId, galleryName, photoId) {
        var msgID = uuid.v4();

        var targetStr = '#sharedgallery?galleryid='+ galleryId;
        var notificationString =  userModel._user.name + ' removed a photo to "' + galleryName + '"';
        var message = {
            msgID: msgID,
            msgClass : galleryChannel._class,
            msgType : galleryChannel._removePhoto,
            sender: userModel._user.userUUID,
            time: ggTime.currentTimeInSeconds(),
            galleryId: galleryId,
            photoId : photoId,
            pn_apns: {
                aps: {
                    alert : notificationString,
                    badge: 1,
                    'content-available' : 1
                },
                target: targetStr,
                galleryId: galleryId,
                photoId : photoId
            },
            pn_gcm : {
                data : {
                    title: notificationString,
                    message: notificationString,
                    image: "icon",
                    target: targetStr,
                    galleryId: galleryId,
                    photoId : photoId
                }
            }
        };

        if (!deviceModel.isOnline()) {
            galleryChannel.pendingDS.add(message);
        } else {
            galleryChannel.publish(message);
        }

    },

    sendComment: function (galleryId, photoId, comment) {
        var msgID = uuid.v4();

        var truncStr = comment.smartTruncate(32, true);
        var targetStr = '#sharedgallery?galleryid='+ galleryId + '&photoid=' + photoId;
        var notificationString =  userModel._user.name + ' commented : "' + truncStr + '"';
        var message = {
            msgID: msgID,
            msgClass : galleryChannel._class,
            msgType : galleryChannel._comment,
            sender: userModel._user.userUUID,
            time: ggTime.currentTimeInSeconds(),
            galleryId : galleryId,
            photoId : photoId,
            comment: comment,
            pn_apns: {
                aps: {
                    alert : notificationString,
                    badge: 1,
                    'content-available' : 1
                },
                target: targetStr ,
                galleryId: galleryId,
                photoId : photoId
            },
            pn_gcm : {
                data : {
                    title: notificationString,
                    message: comment,
                    image: "icon",
                    target: targetStr,
                    galleryId: galleryId,
                    photoId : photoId
                }
            }
        };

        if (!deviceModel.isOnline()) {
            galleryChannel.pendingDS.add(message);
        } else {
            galleryChannel.publish(message);
        }

    },

    sendLike : function (galleryId, photoId) {
        var msgID = uuid.v4();

        var targetStr = '#sharedgallery?galleryid='+ galleryId + '&photoid=' + photoId;
        var notificationString =  userModel._user.name + ' Liked A Photo ';
        var message = {
            msgID: msgID,
            msgClass : galleryChannel._class,
            msgType : galleryChannel._like,
            sender: userModel._user.userUUID,
            time: ggTime.currentTimeInSeconds(),
            galleryId : galleryId,
            photoId : photoId,
            comment: comment,
            pn_apns: {
                aps: {
                    alert : notificationString,
                    badge: 1,
                    'content-available' : 1
                },
                target: targetStr ,
                galleryId: galleryId,
                photoId : photoId
            },
            pn_gcm : {
                data : {
                    title: notificationString,
                    message: notificationString,
                    image: "icon",
                    target: targetStr,
                    galleryId: galleryId,
                    photoId : photoId
                }
            }
        };

        if (!deviceModel.isOnline()) {
            galleryChannel.pendingDS.add(message);
        } else {
            galleryChannel.publish(message);
        }
    },

    publish : function (message) {

        if (message.galleryId === undefined || message.galleryId === null) {
            ggError("Invalid Gallery Id");
            return;
        }

        APP.pubnub.publish({
            channel: message.galleryId,
            message: message,
            error: galleryChannel.channelError,
            callback: function (m) {
                var status = m[0], statusText = m[1];
                // userStatusChannel.addMessage(m);

            }
        });
    },

    processPending : function () {
        var len = galleryChannel.pendingDS.total();
        if (len > 0 ) {
            for (var i=0; i<len; i++) {
                if (deviceModel.isOnline()) {
                    var message = galleryChannel.pendingDS.at(i);

                    galleryChannel.publish(message);
                    galleryChannel.pendingDS.remove(message);

                }
            }
        }
    },

    publishCallback : function (m) {
        if (m === undefined)
            return;

        var status = m[0], message = m[1], time = m[2];

        if (status !== 1) {
            mobileNotify('Error publishing gallery: ' + message);
        }

    },

    trackGalleries : function () {
        var list = galleryChannel.trackArray;

        if (list.length === 0) {
            return;
        }

        for (var i=0; i< list.length; i++) {
            serverPush.provisionGroupChannel(list[i]);
        }

    },

    untrackGalleries : function () {
        var list = galleryChannel.trackArray;

        if (list.length === 0) {
            return;
        }

        for (var i=0; i< list.length; i++) {
            serverPush.unprovisionGroupChannel(list[i]);
        }
    },

    errorCallback : function (error) {
        console.log('GalleryChannel Error : ' + error);
    },

    channelConnect: function () {

    },

    channelDisconnect: function () {
        console.log("Gallery Channel Disconnected");
    },

    channelReconnect: function () {
        console.log("Gallery Channel Reconnected");
    },

    channelSuccess : function (status) {

    },

    channelError : function (error) {
        console.log('Gallery Channel Error : ' + JSON.stringify(error));
    }

};
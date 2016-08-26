/**
 * Created by donbrad on 8/1/16.
 *
 * userstatusChannel -- shares user status via pubnub channel, tracks other users status
 *
 */

'use strict';


var userStatusChannel = {
    _version: 1,
    _cloudClass: "statuschannel",
    _ggClass: 'StatusChannel',
    _class : 'userstatus',
    _status : 'status',
    _update : 'update',
    _alert : 'alert',
    _event : 'event',
    _inited : false,
    channelUUID : null,
    myChannel : null,
    messagesDS : null,
    eventActive : false,
    eventUUID : null,
    eventName : null,
    statusArray  : [],  // Array of channel id's for pubnub subscribe.
    trackArray  : [],
    cacheList : [],
    pendingDS : new kendo.data.DataSource(),

    init : function (userId) {
        if (userStatusChannel._inited) {
            return;
        }

        userStatusChannel.channelUUID = 'status-' + userId;
        userStatusChannel._inited = true;
        userStatusChannel.messagesDS = new kendo.data.DataSource({
            type: 'everlive',
            transport: {
                typeName: 'statuschannel',
                dataProvider: APP.everlive
            },
            schema: {
                model: { Id:  Everlive.idField }
            },
            sort : {
                field : "time",
                dir: 'asc'
            }
        });

        userStatusChannel.messagesDS.bind("requestEnd", function (e) {
            var response = e.response,  type = e.type;

            if (type === 'read' && e.response) {

                if (!userStatusChannel._fetched) {
                    userStatusChannel._fetched = true;

                    APP.pubnub.subscribe({
                        channel: userStatusChannel.channelUUID,
                        windowing: 100,
                        message: userStatusChannel.channelRead,
                        connect: userStatusChannel.channelConnect,
                        disconnect:userStatusChannel.channelDisconnect,
                        reconnect: userStatusChannel.channelReconnect,
                        error: userStatusChannel.channelError

                    });

                    userStatusChannel.userHistory();
                }
            }
        });

        userStatusChannel.messagesDS.fetch();
    },

    // Process contacts to build statusArray and trackArray
    subscribeContacts : function () {
        var count = contactModel.contactsDS.total();

        if (count === 0)
            return;

        for (var i=0; i<count; i++) {
            var contact = contactModel.contactsDS.at(i);

            if (contact.contactUUID !== null) {
                var statusUUID = 'status-' + contact.contactUUID;
                    userStatusChannel.statusArray.push(statusUUID);
                if (contact.activeTracking) {
                    userStatusChannel.trackArray.push(statusUUID);
                }
            }
        }

        APP.pubnub.subscribe({
            channel: userStatusChannel.statusArray,
            windowing: 100,
            message: userStatusChannel.channelStatusRead,
            connect: userStatusChannel.channelConnect,
            disconnect:userStatusChannel.channelDisconnect,
            reconnect: userStatusChannel.channelReconnect,
            error: userStatusChannel.channelError

        });

        userStatusChannel.trackContacts();

        userStatusChannel.contactHistory();
    },

    unsubscribeContacts : function () {
        APP.pubnub.unsubscribe({
            channel: userStatusChannel.statusArray
        });
    },

    trackContacts : function () {
        var list = userStatusChannel.trackArray;
        
        if (list.length === 0) {
            return;
        } 
        
        for (var i=0; i< list.length; i++) {
            serverPush.provisionGroupChannel(list[i]);
        }

    },

    untrackContacts : function () {
        var list = userStatusChannel.trackArray;

        if (list.length === 0) {
            return;
        }

        for (var i=0; i< list.length; i++) {
            serverPush.unprovisionGroupChannel(list[i]);
        }
    },

    userHistory : function () {
        APP.pubnub.history({
            channel: userStatusChannel.channelUUID,
            include_token : true,
            error: userStatusChannel.error,
            callback: function(messages) {
                messages = messages[0];
                var chanStart = messages[1], chanEnd = messages[2];
                messages = messages || [];

                if (messages.length > 0) {
                    for (var i=0; i<messages.length; i++) {
                        var msg = messages[i];

                        if (msg.msgType === userStatusChannel._status) {
                            userStatusChannel.cacheList[msg.contactId] = msg.status;
                            return;
                        }
                    }
                }

            }


        });
    },

    contactHistory : function () {

        var length = userStatusChannel.statusArray;

        if (length > 0) {

            for (var i=0; i<length; i++) {

                APP.pubnub.history({
                    channel: userStatusChannel.statusArray[i],
                    include_token: true,
                    error: userStatusChannel.error,
                    callback: function (messages) {
                        messages = messages[0];
                        var chanStart = messages[1], chanEnd = messages[2];
                        messages = messages || [];

                        if (messages.length > 0) {
                            for (var i = 0; i < messages.length; i++) {
                                var msg = messages[i];

                                if (msg.msgType === userStatusChannel._status) {
                                    userStatusChannel.cacheList[msg.contactId] = msg.status;
                                    return;
                                }
                            }
                        }

                    }

                });
            }
        }
    },

    processPending : function () {
        var len = userStatusChannel.pendingDS.total();
        if (len > 0 ) {
            for (var i=0; i<len; i++) {
                if (deviceModel.isOnline()) {
                    var stat = userStatusChannel.pendingDS.at(i);

                    userStatusChannel.send(stat);
                    userStatusChannel.pendingDS.remove(status);

                }
            }
        }
    },


    sendStatus : function (status) {

        if (!deviceModel.isOnline()) {
            userStatusChannel.pendingDS.add(status);
            return;
        }

        APP.pubnub.uuid(function (msgID) {

            var truncStr = status.statusMessage.smartTruncate(32, true);
            var availStr = ' (avail)';
            if (!status.isAvailable) {
                availStr = ' (busy)';
            }
            var notificationString =  userModel._user.name + availStr + ': "' + truncStr + '"';
            var message = {
                msgID: msgID,
                msgClass : userStatusChannel._class,
                msgType : userStatusChannel._status,
                sender: userModel._user.userUUID,
                time: ggTime.currentTimeInSeconds(),
                status : status,
                pn_apns: {
                    aps: {
                        alert : notificationString,
                        badge: 1,
                        'content-available' : 1
                    },
                    target: '#contacts?contactaction='+ userModel._user.userUUID,
                    contactId: userModel._user.userUUID
                },
                pn_gcm : {
                    data : {
                        title: notificationString,
                        message: status.statusMessage,
                        image: "icon",
                        target: '#contacts?contactaction='+ userModel._user.userUUID,
                        contactId: userModel._user.userUUID
                    }
                }
            };

            APP.pubnub.publish({
                channel: userStatusChannel.channelUUID,
                message: message,
                error: userStatusChannel.channelError,
                callback: function (m) {
                    var status = m[0], statusText = m[1];
                   // userStatusChannel.addMessage(m);

                }
            });
        });
    },

    sendUpdate : function (update) {

    },

    sendAlert : function (alert) {

    },

    sendEvent : function (event) {

    },

    channelRead : function (msg) {

       /* switch(m.type) {

            case 'status' : {
                userDataChannel.updateTimeStamp();
                privateChannel.receiveHandler(msg);

            } break;
        }*/
    },

    channelStatusRead : function (msg) {


        switch(msg.type) {

         case 'status' :
            // contact status message
             var status = msg.status;
             userStatusChannel.cacheList[msg.contactId] = status;
             var contact = contactModel.findContact(msg.contactId);
             if (contact !== undefined && contact !== null) {
                var contactList = contactModel.findContactList(msg.contactId);
                 contact.lat = status.lat;
                 contact.lng = status.lng;
                 contact.geopPoint = status.geoPoint;
                 contact.statusMessage = status.statusMessage;
                 contact.isAvailable = status.isAvailable;
                 contact.currentPlace = status.currentPlace;
                 contact.currentPlaceUUID = status.currentPlaceUUID;
                 contact.googlePlaceId = status.googlePlaceId;

                 contactList.set('lat', status.lat);
                 contactList.set('lng', status.lng);
                 contactList.set('geopPoint', status.geoPoint);
                 contactList.set('statusMessage', status.statusMessage);
                 contactList.set('isAvailable', status.isAvailable );
                 contactList.set('currentPlace', status.currentPlace);
                 contactList.set('currentPlaceUUID', status.currentPlaceUUID);
                 contactList.set('googlePlaceId', status.googlePlaceId);

             }

              break;

            case 'update' :
                // contact data update - now member, change phone, email, address, mood photo
                break;

            case 'alert' :
                // contact panic or emergency
                break;

            case 'event' :
                // event related to intelliobject:  flight took off,  trip departure,
                break;
         }
    },

    addMessage : function (message) {

        if (userStatusChannel.isDuplicateMessage(message.msgID))
            return;

        if (deviceModel.isOnline()) {
            everlive.createOne(userStatusChannel._cloudClass, message, function (error, data){
                if (error !== null) {
                    ggError("Error creating status message " + JSON.stringify(error));
                }
            });
        } else {
            userStatusChannel.messagesDS.add(message);
        }
        userStatusChannel.messagesDS.sync();
    },

    queryMessages : function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = userStatusChannel.messagesDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = [];
        }
        dataSource.filter( query);
        var view = dataSource.view();

        dataSource.filter(cacheFilter);

        return(view);
    },

    isDuplicateMessage : function (msgID) {
        var messages = userStatusChannel.queryMessages({ field: "msgID", operator: "eq", value: msgID });

        if (messages === undefined) {
            return (false);
        } else if (messages.length === 0) {
            return (false);
        } else {
            return(true);
        }
    },

    publishCallback : function (m) {
        if (m === undefined)
            return;

        var status = m[0], message = m[1], time = m[2];

        if (status !== 1) {
            mobileNotify('Error publishing status: ' + message);
        }

    },

    errorCallback : function (error) {
        mobileNotify('UserStatusChannel Error : ' + error);
    },

    channelConnect: function () {

    },

    channelDisconnect: function () {
        mobileNotify("Status Channel Disconnected");
    },

    channelReconnect: function () {
        mobileNotify("Status Channel Reconnected");
    },

    channelSuccess : function (status) {

    },

    channelError : function (error) {
        mobileNotify('Status Channel Error : ' + JSON.stringify(error));
    }


};






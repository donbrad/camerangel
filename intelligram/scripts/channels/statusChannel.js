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
    _status : 'status',   // standard status message
    _update : 'update',  // update shared contact fields
    _alert : 'alert',    // alert message
    _event : 'event',    // shared event : emergency, trip, flight...
    _inited : false,
    channelUUID : null,
    userStatus : null,
    myChannel : null,
    messagesDS : null,
    eventActive : false,
    eventUUID : null,
    eventName : null,
    statusArray  : [],  // Array of channel id's for pubnub subscribe.
    trackArray  : [],
    cacheList : [],
    subscribed : false,
    tracked : false,
    pendingDS : new kendo.data.DataSource(),

    init : function (userId) {
        if (userStatusChannel._inited) {
            return;
        }

        userStatusChannel.channelUUID = 'status-' + userId;
        userStatusChannel._inited = true;
        userStatusChannel.messagesDS = new kendo.data.DataSource({
           /* type: 'everlive',
            transport: {
                typeName: 'statuschannel',
                dataProvider: APP.everlive
            },
            schema: {
                model: { id:  Everlive.idField }
            },*/
            sort : {
                field : "time",
                dir: 'asc'
            }
        });

       /* userStatusChannel.messagesDS.bind("change", function (e) {

            var changedChannels = e.items;
            if (e.action === undefined) {
                if (changedChannels !== undefined && !userStatusChannel._fetched) {

                    if (!userStatusChannel._fetched) {
                        userStatusChannel._fetched = true;

                        userStatusChannel.subscribeContacts();

                    }
                }
            }
        });

        userStatusChannel.messagesDS.fetch();*/
    },

    // Process contacts to build statusArray and trackArray
    subscribeContacts : function () {
        var count = contactModel.contactsDS.total();

        if (userStatusChannel.subscribed) {
            return;
        }

        userStatusChannel.statusArray = [];
        userStatusChannel.trackArray = [];

        //userStatusChannel.statusArray.push(userStatusChannel.channelUUID);


        userStatusChannel.subscribed = true;
        if (count === 0)
            return;

        for (var i=0; i<count; i++) {
            var contact = contactModel.contactsDS.at(i);

            if (contact.contactUUID !== null) {
                var statusUUID = 'status-' + contact.contactUUID;
                    userStatusChannel.statusArray.push(statusUUID);

                if (contact.activeTracking !== undefined && contact.activeTracking) {
                    userStatusChannel.trackArray.push(statusUUID);
                }
            }
        }

        /*APP.pubnub.subscribe({
            channels: userStatusChannel.statusArray
        });*/

        //todo: don re-enable status channels
       // userStatusChannel.trackContacts();

        userStatusChannel.contactHistory();
    },

    unsubscribeContacts : function () {
        APP.pubnub.unsubscribe({
            channels: userStatusChannel.statusArray
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

    getStatus : function (contactUUID) {
        var status = userStatusChannel.cacheList[contactUUID];

        if (status === undefined) {
            status = null;
        }

        return(status);
    },

    userHistory : function () {
        APP.pubnub.history({
            channel: userStatusChannel.channelUUID,
            stringifiedTimeToken: true,
            count: 1
        },
         function(status, response) {
                if (status.error) {
                    // handle error
                    ggError("User Contact History : " + JSON.stringify(status.error));
                    return;
                }
                var messages = response.messages;
                if (messages.length === 0) {
                    return;
                }

                var chanStart = response.startTimeToken, chanEnd = response.endTimeToken;

                if (messages.length > 0) {
                    for (var i=0; i<messages.length; i++) {
                        var msg = messages[i].entry;
                        msg.timeToken  = messages[i].timetoken;

                        if (msg.msgType === userStatusChannel._status) {
                            userStatusChannel.cacheList[msg.sender] = msg.status;
                        }
                    }
                }

            }


        );
    },

    contactHistory : function () {

        var length = userStatusChannel.statusArray.length;

        if (length > 0) {

            for (var i=0; i<length; i++) {

                APP.pubnub.history({
                    channel: userStatusChannel.statusArray[i],
                    stringifiedTimeTokens: true,
                    count: 1
                },
                  function (status, response) {
                        if (status.error) {
                            // handle error
                            ggError("User Contact History : " + JSON.stringify(status.error));
                            return;
                        }
                        var messages = response.messages;
                        if (messages.length === 0) {
                            return;
                        }

                        var chanStart = response.startTimeToken, chanEnd = response.endTimeToken;
                        if (messages.length > 0) {
                            for (var i = 0; i < messages.length; i++) {
                                var msg = messages[i].entry;

                                if (msg.msgType === userStatusChannel._status) {
                                    userStatusChannel.cacheList[msg.sender] = msg.status;
                                    userStatusChannel.updateContactStatus(msg.sender, msg.status);
                                }
                            }
                        }

                    }

                );
            }
        }
    },

    processPending : function () {
        var len = userStatusChannel.pendingDS.total();
        if (len > 0 ) {
            for (var i=0; i<len; i++) {
                if (deviceModel.isOnline()) {
                    var message = userStatusChannel.pendingDS.at(i);

                    userStatusChannel.publish(message);
                    userStatusChannel.pendingDS.remove(message);

                }
            }
        }
    },


    sendStatus : function (status) {

        var msgID = uuid.v4();

        var truncStr = "";

        if (status.statusMessage !== undefined && status.statusMessage !== null) {
            status.statusMessage.smartTruncate(32, true);
        }

        var availStr = ' (avail)';
        if (!status.isAvailable) {
            availStr = ' (busy)';
        }
        var notificationString =  userModel._user.name + availStr + ': "' + truncStr + '"';
        status.time = ggTime.currentTimeInSeconds();
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
                    badge: "+1",
                    'content-available' : 1
                },
                target: '#contacts?contactaction='+ userModel._user.userUUID,
                contactId: userModel._user.userUUID
            },
            pn_gcm : {
                data : {
                    title: notificationString,
                    message:  userModel._user.name + " : " + status.statusMessage,
                    icon: "www/images/androidlogo.png",
                    msgcnt: 1,
                    target: '#contacts?contactaction='+ userModel._user.userUUID,
                    contactId: userModel._user.userUUID
                }
            }
        };

        if (!deviceModel.isOnline()) {
            userStatusChannel.pendingDS.add(message);
        } else {
            userStatusChannel.publish(message);
        }

    },

    publish : function (msg) {
        APP.pubnub.publish({
            channel: userStatusChannel.channelUUID,
            message: msg
        },
            function (status, response) {
                if (status.error) {
                    // handle error
                    ggError("User Status Publish Error: " + JSON.stringify(status.error));
                }
            }
        );
    },

    sendUpdate : function () {
        var user = userModel._user, stat = userStatus._statusObj;
        var update = {
            msgClass : userStatusChannel._class,
            msgType : userStatusChannel._update,
            time: ggTime.currentTimeInSeconds(),
            userUUID : user.userUUID,
            name: user.name,
            alias: user.alias,
            photo: user.photo,
            publicKey : user.publicKey,
            phone : user.phone,
            email : user.email,
            address : user.address,
            birthday : user.birthday,
            isCheckedIn : stat.isCheckedIn,
            isAvailable : stat.isAvailable,
            currentPlace : stat.currentPlace,
            currentPlaceUUID : stat.currentPlaceUUID,
            googlePlaceId : stat.googlePlaceId,
            lat : stat.lat,
            lng : stat.lng,
            geoPoint : stat.geoPoint,
            emailValidated : user.emailValidated,
            phoneValidated : user.phoneValidated,
            addressValidated : user.addressValidated
        };

        var msgID = uuid.v4();
        var message = {
            msgID: msgID,
            msgClass : userStatusChannel._class,
            msgType : userStatusChannel._update,
            sender: userModel._user.userUUID,
            time: ggTime.currentTimeInSeconds(),
            update : update
        };

        if (!deviceModel.isOnline()) {
            userStatusChannel.pendingDS.add(message);
        } else {
            userStatusChannel.publish(message);
        }

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

    updateContactStatus : function (contactId, status) {
        var contact = contactModel.findContact(contactId);
        if (contact !== undefined && contact !== null) {
            var contactList = contactModel.findContactListUUID(contactId);
            contact.lat = status.lat;
            contact.lng = status.lng;
            contact.geopPoint = status.geoPoint;
            contact.statusMessage = status.statusMessage;
            contact.isAvailable = status.isAvailable;
            contact.currentPlace = status.currentPlace;
            contact.currentPlaceUUID = status.currentPlaceUUID;
            contact.googlePlaceId = status.googlePlaceId;

            if (contactList !== undefined && contactList !== null) {
                contactList.set('lat', status.lat);
                contactList.set('lng', status.lng);
                contactList.set('geopPoint', status.geoPoint);
                contactList.set('statusMessage', status.statusMessage);
                contactList.set('isAvailable', status.isAvailable);
                contactList.set('currentPlace', status.currentPlace);
                contactList.set('currentPlaceUUID', status.currentPlaceUUID);
                contactList.set('googlePlaceId', status.googlePlaceId);
                if (status.time === undefined) {
                    status.time = ggTime.currentTimeInSeconds();
                }
                contactList.set('time', status.time);
            }
        }
    },

    channelStatusRead : function (msg) {

        if (msg === undefined || msg === null) {
            return;
        }

        switch(msg.msgType) {

         case 'status' :
            // contact status message
             var status = msg.status;
             var contactId = msg.sender;
             userStatusChannel.cacheList[contactId] = status;

             userStatusChannel.updateContactStatus(contactId, status);


              break;

            case 'update' :
                var update = msg.update;
                var cont= contactModel.findContact(msg.userUUID);
                if (cont!== undefined && cont !== null) {

                }
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

        if (message.Id === undefined) {
            message.Id = uuid.v4();
        }
        userStatusChannel.messagesDS.add(message);
        userStatusChannel.messagesDS.sync();

        if (deviceModel.isOnline()) {
            everlive.createOne(userStatusChannel._cloudClass, message, function (error, data){
                if (error !== null) {
                    ggError("Error creating status message " + JSON.stringify(error));
                }
            });
        }

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
        console.log('UserStatusChannel Error : ' + error);
    },

    channelConnect: function () {

    },

    channelDisconnect: function () {
        console.log("Status Channel Disconnected");
    },

    channelReconnect: function () {
        console.log("Status Channel Reconnected");
    },

    channelSuccess : function (status) {

    },

    channelError : function (error) {
        console.log('Status Channel Error : ' + JSON.stringify(error));
    }


};






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
    _inited : false,
    myChannelUUID : null,
    myChannel : null,
    messagesDS : null,
    eventActive : false,
    eventUUID : null,
    eventName : null,
    statusChannels  : [],  // Array of channel id's for pubnub subscribe.
    trackChannels  : [],

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

                    //notificationModel.processUnreadChannels();

                    /* var total = response.length;
                     if (total === 0 ) {
                     var lastAccess = ggTime.lastWeek();
                     } else {
                     var lastMessage = response[(total-1)];
                     lastAccess =  lastMessage.time;
                     }
                     userDataChannel.lastAccess = lastAccess;
                     localStorage.setItem('ggUserDataTimeStamp', userDataChannel.lastAccess);*/

                    APP.pubnub.subscribe({
                        channel: userStatusChannel.channelUUID,
                        windowing: 100,
                        message: userStatusChannel.channelRead,
                        connect: userStatusChannel.channelConnect,
                        disconnect:userStatusChannel.channelDisconnect,
                        reconnect: userStatusChannel.channelReconnect,
                        error: userStatusChannel.channelError

                    });

                    userStatusChannel.history();
                }
            }
        });

        userStatusChannel.messagesDS.fetch();
    },

    // Process contacts to build statusChannels and trackChannels
    subscribeContacts : function () {
        var count = contactModel.contactsDS.total();

        if (count === 0)
            return;

        for (var i=0; i<count; i++) {
            var contact = contactModel.contactsDS.at(i);

            if (contact.contactUUID !== null) {
                var statusUUID = 'status-' + contact.contactUUID;
                    userStatusChannel.statusChannels.push(statusUUID);
                if (contact.activeTracking) {
                    userStatusChannel.trackChannels.push(statusUUID);
                }
            }
        }

        APP.pubnub.subscribe({
            channel: userStatusChannel.statusChannels,
            windowing: 100,
            message: userStatusChannel.channelStatusRead,
            connect: userStatusChannel.channelConnect,
            disconnect:userStatusChannel.channelDisconnect,
            reconnect: userStatusChannel.channelReconnect,
            error: userStatusChannel.channelError

        });

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

         case 'status' : {
            // contact status message

             } break;

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






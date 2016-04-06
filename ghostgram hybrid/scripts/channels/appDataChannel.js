/**
 * Created by donbrad on 8/10/15.
 * appDataChannel - handles all notifications and updates
 *
 * !!! Must be included after pubnub and init must be called after pubnub is initialized
 */


'use strict';

var appDataChannel = {


    channelUUID: '',   // current app channel
    lastAccess: 0,   // last access time stamp
    _channelName: 'app',
    _cloudClass: 'appmessages',
    _version: 1,
    messagesDS : null,

    init: function () {

        // Generate a unique channel name for the app data channel that is recognizable to related userDataChannel
        // replacing - with _ should achive this...
        var channel = userModel._user.userUUID.replace(/-/g,'_');


        appDataChannel.messagesDS = new kendo.data.DataSource({
            type: 'everlive',
            // offlineStorage: "places",
            transport: {
                typeName: 'appmessages'/*,
                 dataProvider: APP.everlive*/
            },
            schema: {
                model: { Id:  Everlive.idField}
            }
        });
        
        appDataChannel.channelUUID = channel;

        var ts = localStorage.getItem('appDataChannel');

        if (ts !== undefined) {
            appDataChannel.lastAccess = parseInt(ts);
            // Was last access more than a month ago -- if yes set it to a month ago
            if (appDataChannel.lastAccess < ggTime.lastMonth()) {
                appDataChannel.lastAccess = ggTime.lastMonth();
                localStorage.setItem('appDataChannel', appDataChannel.lastAccess);
            }
        } else {
            appDataChannel.lastAccess = ggTime.lastMonth();
            localStorage.setItem('appDataChannel', appDataChannel.lastAccess);
        }


        APP.pubnub.subscribe({
            channel: appDataChannel.channelUUID,
            windowing: 500,
            message: appDataChannel.channelRead,
            connect: appDataChannel.channelConnect,
            disconnect: appDataChannel.channelDisconnect,
            reconnect:appDataChannel.channelReconnect,
            error: appDataChannel.channelError

        });

        // Load the appData message queue
       // appDataChannel.history();
    },

    updateTimeStamp : function () {
        appDataChannel.lastAccess = ggTime.currentTime();
        localStorage.setItem('ggAppDataTimeStamp', appDataChannel.lastAccess);
    },

    queryMessages : function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = appDataChannel.messagesDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();

        dataSource.filter(cacheFilter);

        return(view);
    },

    isProcessedMessage : function (msgID) {
        var messages = appDataChannel.queryMessages({ field: "msgID", operator: "eq", value: msgID });

        if (messages === undefined) {
            return (false);
        } else if (messages.length === 0) {
            return (false);
        } else {
            return(true);
        }
    },

    getContactAppChannel : function (channelUUID) {
        return(channelUUID.replace(/-/g,'_'));
    },

    history : function () {
        // Just look back 7 days -- can expand or shorten this window.

        var timeStamp = ggTime.toPubNubTime(appDataChannel.lastAccess);
        // Get any messages in the channel

        APP.pubnub.history({
            channel: appDataChannel.channelUUID,
            start: timeStamp,
            reverse: true,
            callback: function(messages) {
                messages = messages[0];
                messages = messages || [];
                for (var i = 0; i < messages.length; i++) {
                    appDataChannel.channelRead(messages[i]);
                }

            }
        });

        appDataChannel.updateTimeStamp();
    },

    archiveMessage : function (message) {
        message.processed = true;
        message.processTime = ggTime.currentTime();
        appDataChannel.messagesDS.add(message);
        everlive.createOne(appDataChannel._cloudClass, message, function (error, data) {
            if (error !== null) {
                mobileNotify ("App Channel cache error " + JSON.stringify(error));
            }
        });

    },


    channelRead : function (m) {

        appDataChannel.updateTimeStamp();

        if (m.msgID === undefined || appDataChannel.isProcessedMessage(m.msgID)) {
            return;
        }

        appDataChannel.archiveMessage(m);


        switch(m.type) {
            //  { type: 'newUser',  userId: <userUUID>,  phone: <phone>, email: <email>}
            // New user joined service -- enables users to update contact info
            case 'newUser' : {
                // Todo:  Scan contact list to see if this new user is a contact.   haven't seen userid so scan by phone.
                var contact = contactModel.findContactByPhone(m.phone);
                if (contact !== undefined) {
                    contact.set('contactUUID', m.userId);
                    contact.set('contactEmail', m.email);
                    /*updateParseObject('contacts', 'uuid', contact.uuid, 'contactUUID', m.userId);
                    updateParseObject('contacts', 'uuid', contact.uuid, 'contactEmail', m.email);*/
                }
            } break;

            //  { type: 'userValidated',  userId: <userUUID>,  phone: <phone>, email: <email>, publicKey: <publicKey>}
            // User has validated phone and email -- enables users to update contact info and get private key for P2P and Secure Package
            case 'userValidated' : {
                // Todo: Scan contact list for useruuid and then by phone.
                var contact = contactModel.findContact(m.userId);
                if (contact === undefined) {
                    contact = contactModel.findContactByPhone(m.phone);
                }
                if (contact === undefined) {
                    return;
                }
                contact.set('contactUUID', m.userId);
                contact.set('contactPhone', m.phone);
                contact.set('contactEmail', m.email);
                contact.set('publicKey', m.publicKey);

                /*updateParseObject('contacts', 'uuid', contact.uuid, 'contactUUID', m.userId);
                updateParseObject('contacts', 'uuid', contact.uuid, 'contactEmail', m.email);
                updateParseObject('contacts', 'uuid', contact.uuid, 'contactPhone', m.phone);
                updateParseObject('contacts', 'uuid', contact.uuid, 'publicKey', m.publicKey);*/
            } break;

            //  { type: 'channelInvite',  channelUUID: <channelUUID>, ownerID: <ownerUUID>,  ownerName: <text>, channelName: <text>, channelDescription: <text>}
            case 'groupInvite' : {
                if (m.version === appDataChannel._version && m.msgID !== undefined)
                    appDataChannel.processGroupInvite( m.channelUUID, m.channelName, m.channelDescription,  m.channelMembers, m.ownerId, m.ownerName,  m.options);
            } break;

            //  { type: 'channelInvite',  channelUUID: <channelUUID>, owner: <ownerUUID>}
            case 'groupDelete' : {
                if (m.version === appDataChannel._version && m.msgID !== undefined)
                    appDataChannel.processGroupDelete(m.channelUUID, m.channelName, m.ownerId, m.ownerName);
            } break;

            case 'groupUpdate' : {
                if (m.version === appDataChannel._version && m.msgID !== undefined)
                    appDataChannel.processGroupUpdate(m.channelUUID, m.channelName, m.channelDescription, m.channelMembers, m.ownerId, m.ownerName);
            } break;


            case 'placeAdd' : {
                if (m.version === appDataChannel._version && m.msgID !== undefined)
                    appDataChannel.processPlaceAdd(m.placeUUID, m.placeName, m.ownerId,  m.ownerName);
            } break;


            //  { type: 'recallMessage',  channelUUID: <channel Id>,  messageId: <messageId>: ownerId: <ownerUUID>}
            case 'recallMessage' : {
                if (m.version === appDataChannel._version && m.msgID !== undefined)
                    appDataChannel.processRecallMessage(m.channelUUID, m.messageId, m.ownerId, m.isPrivateChat);
            } break;

            //  { type: 'eventAccept',  }
            case 'eventAccept' : {
                if (m.version === appDataChannel._version )
                    appDataChannel.processEventAccept(m.eventId, m.ownerId, m.comment);
            } break;

            //  { type: 'eventDecline',  }
            case 'eventDecline' : {
                if (m.version === appDataChannel._version )
                    appDataChannel.processEventDecline(m.eventId, m.ownerId, m.comment);
            } break;

            //  { type: 'eventUpdate',  }
            case 'eventUpdate' : {
                if (m.version === appDataChannel._version)
                    appDataChannel.processEventUpdate(m.eventId, m.ownerId, m.eventObject, m.comment);
            } break;

            //  { type: 'eventUpdate',  }
            case 'eventCancel' : {
                if (m.version === appDataChannel._version && m.msgID !== undefined)
                    appDataChannel.processEventCancel(m.eventId, m.ownerId, m.comment);
            } break;

            //  { type: 'connectRequest',  contactId: <contactUUID>, owner: <ownerUUID>}
            case 'connectRequest' : {

            } break;

            //  { type: 'connectResponse',  contactId: <contactUUID>, owner: <ownerUUID>. accepted: true|false}
            case 'connectResponse' : {

            } break;

            //  { type: 'packageOffer',  channelUUID: <channelUUID>, owner: <ownerUUID>, packageId: <packageUUID>, private: true|false, type: 'text'|'pdf'|'image'|'video', title: <text>, message: <text>}
            case 'packageOffer' : {

            } break;

            //  { type: 'packageRequest',  channelUUID: <channelUUID>, owner: <ownerUUID>, packageId: <packageUUID>, private: true|false, message: <text>}
            case 'packageRequest' : {

            } break;
            //  { type: 'userBlock',  userID: <userUUID>,  phone: <phone>, email: <email>}
            case 'userBlock' : {
                // Todo:  user has violated terms of service or is spamming.  notify all contacts
            } break;

            //  { type: 'appInfo',  level: 'info'|'update'|issue', id: <id>  message: <text>, url: <url>}
            case 'appInfo' : {

            } break;
        }

    },

    newUserMessage : function (userUUID, phone, email) {
        var msg = {};

        msg.msgID = uuid.v4();
        msg.type = 'newUser';
        msg.version = appDataChannel._version;
        msg.userUUID = userUUID;
        msg.phone = phone;
        msg.email = email;
        msg.time = new Date().getTime();


        APP.pubnub.publish({
            channel: appDataChannel.channelUUID,
            message: msg,
            success: appDataChannel.channelSuccess,
            error: appDataChannel.channelError
        });
    },

    recallMessage : function (contactId, channelUUID, messageId, ownerId, isPrivateChat) {
        var msg = {};

        msg.msgID = uuid.v4();
        msg.type = 'recallMessage';
        msg.version = appDataChannel._version;
        msg.channelUUID = channelUUID;
        msg.messageId = messageId;
        msg.ownerId = ownerId;
        msg.isPrivateChat = isPrivateChat;
        msg.time = new Date().getTime();
        var channel = appDataChannel.getContactAppChannel(contactId);

        APP.pubnub.publish({
            channel: channel,
            message: msg,
            success: appDataChannel.channelSuccess,
            error: appDataChannel.channelError
        });
    },

    userValidatedMessage : function (userUUID, phone, email, publicKey) {
        var msg = new Object();

        msg.msgID = uuid.v4();
        msg.type = 'userValidated';
        msg.version = appDataChannel._version;
        msg.userUUID = userUUID;
        msg.phone = phone;
        msg.email = email;
        msg.publicKey = publicKey;
        msg.time = new Date().getTime();


        APP.pubnub.publish({
            channel: appDataChannel.channelUUID,
            message: msg,
            success: appDataChannel.channelSuccess,
            error: appDataChannel.channelError
        });
    },

    connectRequest: function (recipientId, comment) {
        var channel = appDataChannel.getContactAppChannel(recipientId);
        var msg = new Object();

        var event = smartEvent.findObject(eventId);
        var notificationString =  userModel._user.name + " wants to connect on Ghostgrams";
        msg.msgID = uuid.v4();
        msg.type = 'connectRequest';
        msg.version = appDataChannel._version;
        msg.date = new Date.today();
        msg.comment = comment;
        msg.userUUID = userModel._user.userUUID;
        msg.name = userModel._user.name;
        msg.alias = userModel._user.alias;
        msg.phone = userModel._user.phone;
        msg.email = userModel._user.email;
        msg.publicKey = userModel._user.publicKey;
        msg.pn_apns = {
            aps: {
                alert : notificationString,
                badge: 1,
                'content-available' : 1
            },
            isMessage: false,
            isConnect: true,
            target: '#contacts',
            eventId :eventId
        };
        msg.pn_gcm = {
            data : {
                title: notificationString,
                message: userModel._user.name +  ' wants to share contact information with you.',
                target: '#contacts',
                image: "icon",
                isMessage: false,
                isConnect: true,
                eventId :eventId
            }
        };

        APP.pubnub.publish({
            channel: channel,
            message: msg,
            callback: appDataChannel.publishCallback,
            error: appDataChannel.errorCallback
        });

    },

    connectReponse: function (recipientId, accept, comment) {
        var channel = appDataChannel.getContactAppChannel(recipientId);
        var msg = new Object();

        var event = smartEvent.findObject(eventId);
        var notificationString =  userModel._user.name + " wants to connect on Ghostgrams";
        msg.msgID = uuid.v4();
        msg.type = 'connectResponse';
        msg.version = appDataChannel._version;
        msg.date = new Date.today();
        msg.accept = accept;
        if (accept === true) {
            msg.userUUID = userModel._user.userUUID;
            msg.name = userModel._user.name;
            msg.alias = userModel._user.alias;
            msg.phone = userModel._user.phone;
            msg.email = userModel._user.email;
            msg.publicKey = userModel._user.publicKey;
        }
        msg.comment = comment;
        msg.userUUID = userModel._user.userUUID;
        msg.name = userModel._user.name;
        msg.alias = userModel._user.alias;
        msg.phone = userModel._user.phone;
        msg.email = userModel._user.email;
        msg.pn_apns = {
            aps: {
                alert : notificationString,
                badge: 1,
                'content-available' : 1
            },
            isMessage: false,
            isConnect: true,
            target: '#contacts',
            eventId :eventId
        };
        msg.pn_gcm = {
            data : {
                title: notificationString,
                message: userModel._user.name +  ' wants to share contact information with you.',
                target: '#contacts',
                image: "icon",
                isMessage: false,
                isConnect: true,
                eventId :eventId
            }
        };

        APP.pubnub.publish({
            channel: channel,
            message: msg,
            callback: appDataChannel.publishCallback,
            error: appDataChannel.errorCallback
        });

    },

    eventAccept: function (eventId, senderId, recipientId, comment) {
        var channel = appDataChannel.getContactAppChannel(senderId);
        var msg = new Object();

        var event = smartEvent.findObject(eventId);


        var notificationString =  userModel._user.name + " has accepted " + event.title;
        msg.msgID = uuid.v4();
        msg.type = 'eventAccept';
        msg.version = appDataChannel._version;
        msg.date = new Date.today();
        msg.eventId = eventId;
        msg.recipientId = recipientId;
        msg.comment = comment;
        msg.pn_apns = {
            aps: {
                alert : notificationString,
                badge: 1,
                'content-available' : 1
            },
            isMessage: false,
            isEvent: true,
            target: '#smartEvent?event='+eventId,
            eventId :eventId
        };
        msg.pn_gcm = {
            data : {
                title: notificationString,
                message: userModel._user.name +  ' says "' + comment + '"',
                target: '#smartEvent?event='+eventId,
                image: "icon",
                isMessage: false,
                isEvent: true,
                eventId :eventId
            }
        };

        APP.pubnub.publish({
            channel: channel,
            message: msg,
            callback: appDataChannel.publishCallback,
            error: appDataChannel.errorCallback
        });

    },

    eventDecline : function (eventId, senderId, recipientId, comment) {
        var channel = appDataChannel.getContactAppChannel(senderId);
        var msg = new Object();

        var event = smartEvent.findObject(eventId);

        var notificationString =  userModel._user.name + " has declined " + event.title;
        msg.msgID = uuid.v4();
        msg.type = 'eventDecline';
        msg.version = appDataChannel._version;
        msg.date = new Date.today();
        msg.eventId = eventId;
        msg.recipientId = recipientId;
        msg.comment = comment;
        msg.pn_apns = {
            aps: {
                alert : notificationString,
                badge: 1,
                'content-available' : 1
            },
            isMessage: false,
            isEvent: true,
            target: '#smartEvent?event='+eventId,
            eventId :eventId
        };
        msg.pn_gcm = {
            data : {
                title: notificationString,
                message: userModel._user.name +  ' says "' + comment + '"',
                target: '#smartEvent?event='+eventId,
                image: "icon",
                isMessage: false,
                isEvent: true,
                eventId :eventId
            }
        };
        APP.pubnub.publish({
            channel: channel,
            message: msg,
            callback: appDataChannel.publishCallback,
            error: appDataChannel.errorCallback
        });

    },

    // Must be sent to each invitee or accepted member
    sendEventCancel : function (eventId, recipientId, comment) {
        var channel = appDataChannel.getContactAppChannel(recipientId);
        var msg = new Object();
        var event = smartEvent.findObject(eventId);

        var notificationString =  userModel._user.name + " has cancelled " + event.name;
        msg.msgID = uuid.v4();
        msg.type = 'eventCancel';
        msg.version = appDataChannel._version;
        msg.date = new Date.today();
        msg.eventId = eventId;
        msg.comment = comment;
        msg.pn_apns = {
            aps: {
                alert : notificationString,
                badge: 1,
                'content-available' : 1
            },
            isMessage: false,
            isEvent: true,
            target: '#',
            eventId :eventId
        };
        msg.pn_gcm = {
            data : {
                title: notificationString,
                message: userModel._user.name +  ' says "' + comment + '"',
                target: '#',
                image: "icon",
                isMessage: false,
                isEvent: true,
                eventId :eventId
            }
        };
        APP.pubnub.publish({
            channel: channel,
            message: msg,
            callback: appDataChannel.publishCallback,
            error: appDataChannel.errorCallback
        });
    },

    // Must be sent to each invitee or accepted member
    sendEventUpdate : function (eventId, recipientId, updateObject, comment) {
        var channel = appDataChannel.getContactAppChannel(recipientId);
        var msg = new Object();
        var event = smartEvent.findObject(eventId);

        var notificationString =  userModel._user.name + " has updated " + event.name;
        msg.msgID = uuid.v4();
        msg.type = 'eventUpdate';
        msg.version = appDataChannel._version;
        msg.date = new Date.today();
        msg.eventId = eventId;
        msg.eventUpdate = updateObject;
        msg.comment = comment;

        msg.pn_apns = {
            aps: {
                alert : notificationString,
                badge: 1,
                'content-available' : 1
            },
            isMessage: false,
            isEvent: true,
            target: '#smartEvent?event='+eventId,
            eventId :eventId
        };
        msg.pn_gcm = {
            data : {
                title: notificationString,
                message: userModel._user.name +  ' says "' + comment + '"',
                target: '#smartEvent?event='+eventId,
                image: "icon",
                isMessage: false,
                isEvent: true,
                eventId :eventId
            }
        };
        APP.pubnub.publish({
            channel: channel,
            message: msg,
            callback: appDataChannel.publishCallback,
            error: appDataChannel.errorCallback
        });
    },



    groupChannelInvite : function (contactUUID, channelUUID, channelName, channelDescription,  members, options) {
        var msg = {};

        msg.msgID = uuid.v4();
        var notificationString = "Chat Invite : " + channelName;
        msg.type = 'groupInvite';
        msg.version = appDataChannel._version;
        msg.ownerId = userModel._user.get('userUUID');
        msg.ownerName = userModel._user.get('name');
        msg.channelUUID = channelUUID;
        msg.channelName = channelName;
        msg.channelDescription = channelDescription;
        msg.channelMembers = members;
        msg.message  = "You've been invited to " + channelName;
        if (options === undefined) {
            options = null;
        }
        msg.options = options;

        msg.time = new Date().getTime();
        msg.pn_apns = {
            aps: {
                alert : notificationString,
                badge: 1,
                'content-available' : 1
            },
            isMessage: false,
            target: '#channel?channelUUID=' + channelUUID,
            channelUUID :channelUUID
        };
        msg.pn_gcm = {
            data : {
                title: notificationString,
                message: "You've been invited to " + channelName,
                target: '#channel?channelUUID=' + channelUUID,
                image: "icon",
                isMessage: false,
                channelUUID : channelUUID
            }
        };

        var channel = appDataChannel.getContactAppChannel(contactUUID);

        APP.pubnub.publish({
            channel: channel,
            message: msg,
            callback: appDataChannel.publishCallback,
            error: appDataChannel.errorCallback
        });
    },


    groupChannelDelete : function (contactUUID, channelUUID, channelName, message) {
        var msg = {};

        var notificationString = channelName + " has been deleted...";
        msg.msgID = uuid.v4();
        msg.type = 'groupDelete';
        msg.version = appDataChannel._version;
        msg.ownerId = userModel._user.get('userUUID');
        msg.ownerName = userModel._user.get('name');
        msg.channelUUID = channelUUID;
        msg.channelName = channelName;
        msg.message  = message;
        msg.time = new Date().getTime();
        msg.pn_apns = {
            aps: {
                alert : notificationString,
                badge: 1
            },
            isMessage: false,
            target: '#channels',
            channelUUID :channelUUID
        };
        msg.pn_gcm = {
            data : {
                title: notificationString,
                message: "The owner has deleted : " + channelName,
                target: "#channels",
                image: "icon",
                isMessage: false,
                channelUUID : channelUUID
            }
        };

        var channel = appDataChannel.getContactAppChannel(contactUUID);

        APP.pubnub.publish({
            channel: channel,
            message: msg,
            callback: appDataChannel.publishCallback,
            error: appDataChannel.errorCallback

        });
    },

    groupChannelUpdate : function (contactUUID, channelUUID, channelName, channelDescription,  members) {
        var msg = {};

        var notificationString = "Chat Update : " + channelName;
        msg.msgID = uuid.v4();
        msg.type = 'groupUpdate';
        msg.version = appDataChannel._version;
        msg.ownerId = userModel._user.get('userUUID');
        msg.ownerName = userModel._user.get('name');
        msg.channelUUID = channelUUID;
        msg.channelName = channelName;
        msg.channelDescription = channelDescription;
        msg.channelMembers = members;
        msg.message  = "Chat " + channelName + " has been updated...";
        msg.time = new Date().getTime();
        msg.pn_apns = {
            aps: {
                alert : notificationString,
                badge: 1,
                'content-available' : 1
            },
            isMessage: false,
            target: '#channels',
            channelUUID :channelUUID
        };
        msg.pn_gcm = {
            data : {
                title: notificationString,
                message: "Owner has updated  " + channelName,
                target: '#channels',
                image: "icon",
                isMessage: false,
                channelUUID : channelUUID
            }
        };
        var channel = appDataChannel.getContactAppChannel(contactUUID);

        APP.pubnub.publish({
            channel: channel,
            message: msg,
            callback: appDataChannel.publishCallback,
            error: appDataChannel.errorCallback

        });
    },

    processConnectRequest : function (senderId, senderName, comment) {
        contactModel.connectReceived(senderId);
        notificationModel.addConnectRequest(senderId, senderName);

    },

    processConnectResponse : function (senderId, senderName, accept, comment) {
        if (accept) {
            contactModel.updateContactDetails(senderId, function (contact) {
                notificationModel.addConnectResponse(senderId, senderName, true);
            });
        } else {
            notificationModel.addConnectResponse(senderId, senderName, false);
        }

    },

    processEventAccept : function (eventId, recipientId, comment) {
        smartEvent.recipientAccept(eventId, recipientId, comment, true);
    },

    processEventDecline : function (eventId, recipientId, comment) {
        smartEvent.recipientAccept(eventId, recipientId, comment, false);
    },

    processEventCancel : function (eventId, recipientId, comment) {
        smartEvent.cancel(eventId, comment);
    },

    processEventUpdate : function (eventId, recipientId, eventObj, comment) {

    },


    processGroupInvite: function (channelUUID, channelName, channelDescription, channelMembers, ownerId, ownerName, options) {
        // Todo:  Does channel exist?  If not create,  if so notify user of request
        var channel = channelModel.findChannelModel(channelUUID);

        if (channel === undefined && channelMembers !== undefined && channelMembers.length > 1) {
            //mobileNotify("Chat invite from  " + ownerName + ' " ' + channelName + '"');

            channelModel.queryChannelMap(channelUUID, function (error, data) {
                if (error === null && data !== null) {
                    channelModel.addMemberChannel(channelUUID, channelName, channelDescription, channelMembers, ownerId, ownerName, options, false);
                }
            });

            
            /*getChannelDetails(channelUUID, function (result) {
                if (result.found) {
                    channelModel.addMemberChannel(channelUUID, channelName, channelDescription, channelMembers, ownerId, ownerName, options, false);
                } else {
                    mobileNotify('Warning - owner may have deleted : ' + channelName);
                    channelModel.addMemberChannel(channelUUID, channelName, channelDescription, channelMembers, ownerId, ownerName, options, false);

                }
            });*/
                    //notificationModel.addNewChatNotification(channelUUID, channelName, "new channel...");

        }

    },

    processGroupDelete: function (channelUUID, channelName, ownerId, ownerName) {
        // Todo:  Does channel exist?  If not do nothing,  if so delete the channel
        var channel = channelModel.findChannelModel(channelUUID);
        if (channel === undefined) {
           // mobileNotify('Owner has deleted Chat: "' + channelName + '"');
            channelModel.deleteChannel(channel);
        }

    },

    processGroupUpdate: function (channelUUID, channelName, channelDescription, channelMembers, ownerId, ownerName) {

        if (channelMembers !== undefined && channelMembers !== null && channelMembers.length > 1)
            channelModel.updateChannel(channelUUID, channelName, channelDescription, channelMembers);

    },


    processPlaceAdd : function (placeUUID, placeName, ownerId,  ownerName) {

    },

    processRecallMessage: function (channelUUID, messageId, ownerId, isPrivateChat) {
        channelModel.addMessageRecall(channelUUID, messageId, ownerId, isPrivateChat);
    },

    publishCallback : function (m) {
        if (m === undefined)
            return;

        var status = m[0], message = m[1], time = m[2];

        if (status !== 1) {
            mobileNotify('appDataChannel: Error publishing invite: ' + message);
        }

    },

    errorCallback : function (error) {
        mobileNotify('appDataChannel Error : ' + error);
    },

    channelConnect: function () {

    },

    channelDisconnect: function () {
        mobileNotify("App Data Channel Disconnected");
    },

    channelReconnect: function () {
        mobileNotify("App Data Channel Reconnected");
    },

    channelSuccess : function (status) {

    },

    channelError : function (error) {
        mobileNotify('appDataChannel Error : ' + error)
    }
};
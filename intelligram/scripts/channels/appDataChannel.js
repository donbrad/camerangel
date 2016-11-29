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
    _class : 'app',
    _cloudClass: 'appmessages',
    _version: 1,
    messagesDS : null,
    _fetched : false,
    _intialSync : false,
    needHistory : true,

    init: function () {

        // Generate a unique channel name for the app data channel that is recognizable to related userDataChannel
        // replacing - with _ should achive this...
        var channel = userModel._user.userUUID.replace(/-/g,'_');

        appDataChannel.channelUUID = channel;

        var ts = localStorage.getItem('ggAppDataTimeStamp');

        if (ts !== undefined && ts !== "NaN") {
            appDataChannel.lastAccess = parseInt(ts);
            // Was last access more than a month ago -- if yes set it to a month ago
            if (appDataChannel.lastAccess < ggTime.lastMonth()) {
                appDataChannel.lastAccess = ggTime.lastMonth();
                localStorage.setItem('ggAppDataTimeStamp', appDataChannel.lastAccess);
            }
        } else {
            appDataChannel.lastAccess = ggTime.lastMonth();
            localStorage.setItem('ggAppDataTimeStamp', appDataChannel.lastAccess);
        }



        appDataChannel.messagesDS = new kendo.data.DataSource({
            type: 'everlive',
            transport: {
                typeName: 'appmessages',
                dataProvider: APP.everlive
            },
            schema: {
                model: { id:  Everlive.idField}
            },
            sort: {
                field: "time",
                dir: "asc"
            }
        });


        appDataChannel.messagesDS.bind("change", function (e) {
            var changedMessages = e.items;
            if (e.action === undefined) {
                if (changedMessages !== undefined && !appDataChannel._initialSync) {
                    appDataChannel._initialSync = true;

                    var channelArray = [appDataChannel.channelUUID];
                    APP.pubnub.subscribe({
                        channels: channelArray
                    });

                    appDataChannel.history();
                }
            }
        });

        appDataChannel.messagesDS.bind("requestEnd", function (e) {
            var response = e.response, type = e.type;

            if (type === 'read' && response) {
                if (!appDataChannel._fetched) {
                    appDataChannel._fetched = true;

                }
            }
        });

        appDataChannel.messagesDS.fetch();

    },

    closeChannel : function () {
        APP.pubnub.unsubscribe({
            channel: appDataChannel.channelUUID
        });
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

    isArchivedMessage : function (msgID) {
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

    resumeHistory : function () {
        appDataChannel.needHistory = true;

        appDataChannel.history();
    },


    history : function () {
        if (!appDataChannel.needHistory) {
            return;
        }

        if (APP.pubnub === null || !appDataChannel._fetched || !channelModel._fetched || !contactModel._fetched || !notificationModel._fetched) {
            appDataChannel.needHistory = true;
            return;
        }

        var lastMonth = ggTime.lastMonth();
        appDataChannel.needHistory = false;
        // Get any messages in the channel

        mobileNotify("Loading System Messages...");

        if (appDataChannel.lastAccess === undefined || appDataChannel.lastAccess === null) {
            appDataChannel.lastAccess = lastMonth;
        }

        if (appDataChannel.lastAccess < lastMonth || appDataChannel.messagesDS.total() === 0 ) {
            appDataChannel.lastAccess = lastMonth;
        }

        localStorage.setItem('ggAppDataTimeStamp', appDataChannel.lastAccess);

        var lastAccess = ggTime.toPubNubTime(appDataChannel.lastAccess);


        var end = ggTime.toPubNubTime(ggTime.currentTime());
        appDataChannel._fetchHistory(lastAccess, end);

    },

    _fetchHistory : function (start, end) {

        var startStr = start.toString(), endStr = end.toString();
        // Get any messages in the channel
        APP.pubnub.history({
            channel: appDataChannel.channelUUID,
            stringifiedTimeToken: true,
            start: startStr,
            end: endStr
        },
        function(status, response) {
                if (status.error) {
                    // handle error
                    ggError("App Data History : " + JSON.stringify(status));
                    return;
                }
                var messages = response.messages;
                if (messages.length === 0) {
                    return;
                }

                var appStart = response.startTimeToken, appEnd = response.endTimeToken;
                if (messages.length === 0) {
                    appDataChannel.updateTimeStamp();
                    return;
                }

                var latestTime = 0;
                for (var i = 0; i < messages.length; i++) {
                    var msg  =  messages[i].entry;
                    msg.timeToken = messages[i].timetoken;

                    if (!appDataChannel.isArchivedMessage(msg.msgID))
                        appDataChannel.archiveMessage(msg);
                }

                appDataChannel.messagesDS.sync();
                appDataChannel.updateTimeStamp();
                /*   channelKeys = Object.keys(channelList);
                 channelModel.updatePrivateChannels(channelKeys, channelList);*/

                var endTime = parseInt(appStart);
                if (messages.length === 100 && endTime >= start) {

                    appDataChannel._fetchHistory(start, endTime );
                } else {
                    appDataChannel._historyFetchComplete = true;

                    appDataChannel.processMessages();
                    appDataChannel.removeExpiredMessages();
                }

            }

        );
    },

    removeExpiredMessages : function () {
        var dataSource = appDataChannel.messagesDS;

        if (dataSource === null ) {
            return;
        }
        if (dataSource.total() === 0) {
            return;
        }

        var lastMonth = ggTime.lastMonth();

        var queryCache = dataSource.filter();
        if (queryCache === undefined) {
            queryCache = [];
        }
        dataSource.filter({ field: "time", operator: "lte", value:  lastMonth});
        var messageList = dataSource.view();
        dataSource.filter(queryCache);

        if (messageList.length > 0) {
            for (var i=0; i< messageList.length; i++) {
                var msg = messageList[i];
                dataSource.remove(msg);
            }
        }
        dataSource.sync();

    },

    processMessages : function () {
        var total = appDataChannel.messagesDS.total();
        for (var i=0; i<total; i++) {
            var msg = appDataChannel.messagesDS.at(i);

            if (msg.processed === undefined) {
                appDataChannel.channelRead(msg);
            }
        }
    },

    archiveMessage : function (message) {

        if (message.Id === undefined) {
            message.Id = uuid.v4();
        }

        appDataChannel.messagesDS.add(message);
        appDataChannel.messagesDS.sync();
        if (deviceModel.isOnline()) {
            everlive.createOne(appDataChannel._cloudClass, message, function (error, data) {
                if (error !== null) {
                    ggError("App Channel cache error " + JSON.stringify(error));
                }
            });
        }

    },


    channelRead : function (m) {

        if (m.msgID === undefined || m.processed !== undefined) {
            return;
        }

        // Messages are flattened to basic js objects - no set...
        m.processed = true;
        m.sprocessTime = ggTime.currentTime();

       // appDataChannel.messagesDS.sync();

        switch(m.type) {
            //  { type: 'newUser',  userId: <userUUID>,  phone: <phone>, email: <email>}
            // New user joined service -- enables users to update contact info
            
            case 'autoConnect' : {
                var contactUUID = m.ownerId, contactName = m.ownerName;

                var contact = contactModel.findContact(contactUUID);

                if (contact === undefined || contact === null) {
                    var contactId = uuid.v4();
                    contactModel.createChatContact(contactUUID, contactName, contactId,  function(result) {
                       if (result === null) {
                           ggError("Couldn't Auto Connect with " + contactName);
                       }
                    });
                }
                
            } break;
            
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

            } break;

            case 'userAlert' : {
                if (m.version === appDataChannel._version && m.msgID !== undefined)
                    appDataChannel.processUserAlert( m.channelUUID, m.channelName, m.ownerId, m.ownerName,  m.message);
            } break;

            case 'galleryInvite' : {
                if (m.version === appDataChannel._version && m.msgID !== undefined)
                    appDataChannel.processGalleryInvite( m.galleryUUID, m.galleryName, m.ownerId, m.ownerName);
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

            case 'recallPhoto' : {
                if (m.version === appDataChannel._version && m.msgID !== undefined)
                    appDataChannel.processRecallPhoto(m.channelUUID, m.photoId, m.ownerId, m.isPrivateChat);
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


    userAlert : function (channelUUID, channelName, message) {
        var msg = {};

        msg.msgID = uuid.v4();
        msg.msgClass = appDataChannel._class;
        msg.type = 'userAlert';
        msg.version = appDataChannel._version;
        msg.ownerUUID = userModel._user.userUUID;
        msg.ownerName = userModel._user.name;
        msg.channelUUID = channelUUID;
        msg.channelName = channelName;
        msg.message = message;
        msg.pn_apns = {
            aps: {
                alert :  msg.ownerName + ' : "'  + message + '"',
                badge: 1,
                'content-available' : 1
            },
            isMessage: false,
            isAlert: true,
            target: '#channel?channelUUID=' + channelUUID,
            channelUUID :channelUUID
        };
        msg.pn_gcm = {
            data : {
                title: "IntelliAlert from " + msg.ownerName,
                message: msg.ownerName + ' : "'  + message + '"',
                target: '#channel?channelUUID=' + channelUUID,
                image: "icon",
                isMessage: false,
                isAlert: true,
                channelUUID : channelUUID
            }
        };
        msg.time = new Date().getTime();


        APP.pubnub.publish({
            channel: appDataChannel.channelUUID,
            message: msg
        },
           function (status, response) {
                if (status.error) {
                    // handle error
                    ggError("User Alert Error: " + JSON.stringify(status.error));
                    return;
                }
            }
        );
    },


    newUserMessage : function (userUUID, phone, email) {
        var msg = {};

        msg.msgID = uuid.v4();
        msg.msgClass = appDataChannel._class;
        msg.type = 'newUser';
        msg.version = appDataChannel._version;
        msg.userUUID = userUUID;
        msg.phone = phone;
        msg.email = email;
        msg.time = new Date().getTime();


        APP.pubnub.publish({
            channel: appDataChannel.channelUUID,
            message: msg
            },
            function (status, response) {
                if (status.error) {
                    // handle error
                    ggError("New User Error: " + JSON.stringify(status.error));
                    return;
                }

            }
        );
    },

    recallMessage : function (contactId, channelUUID, messageId, ownerId, isPrivateChat) {
        var msg = {};

        msg.msgID = uuid.v4();
        msg.msgClass = appDataChannel._class;
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
            message: msg
        },
           function (status, response) {
                if (status.error) {
                    // handle error
                    ggError("Recall Message Error: " + JSON.stringify(status.error));
                    return;
                }
            }
        );
    },

    recallPhoto : function (channelUUID, photoId, ownerId, isPrivateChat) {
        var msg = {};

        msg.msgID = uuid.v4();
        msg.msgClass = appDataChannel._class;
        msg.type = 'recallMessage';
        msg.version = appDataChannel._version;
        msg.channelUUID = channelUUID;
        msg.photoId = photoId;
        msg.ownerId = ownerId;
        msg.isPrivateChat = isPrivateChat;
        msg.time = new Date().getTime();
        var channel = appDataChannel.getContactAppChannel(contactId);

        APP.pubnub.publish({
            channel: channel,
            message: msg
        },
           function (status, response) {
                if (status.error) {
                    // handle error
                    ggError("Recall Photo Error: " + JSON.stringify(status.error));
                }
            }
        );
    },

    userValidatedMessage : function (userUUID, phone, email, publicKey) {
        var msg = new Object();

        msg.msgID = uuid.v4();
        msg.msgClass = appDataChannel._class;
        msg.type = 'userValidated';
        msg.version = appDataChannel._version;
        msg.userUUID = userUUID;
        msg.phone = phone;
        msg.email = email;
        msg.publicKey = publicKey;
        msg.time = new Date().getTime();


        APP.pubnub.publish({
            channel: appDataChannel.channelUUID,
            message: msg
        },
           function (status, response) {
                if (status.error) {
                    // handle error
                    ggError("User Validated Error: " + JSON.stringify(status.error));
                }
            }
        );
    },

    connectRequest: function (recipientId, comment) {
        var channel = appDataChannel.getContactAppChannel(recipientId);
        var msg = new Object();

        var event = smartEvent.findObject(eventId);
        var notificationString =  userModel._user.name + " wants to connect on intelligram";
        msg.msgID = uuid.v4();
        msg.msgClass = appDataChannel._class;
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
                icon: "www/images/androidlogo.png",
                msgcnt: 1,
                isMessage: false,
                isConnect: true,
                eventId :eventId
            }
        };

        APP.pubnub.publish({
            channel: channel,
            message: msg
        },
            function (status, response) {
                if (status.error) {
                    // handle error
                    ggError("User Connect Error: " + JSON.stringify(status.error));
                }
            }
        );

    },

    connectResponse: function (recipientId, accept, comment) {
        var channel = appDataChannel.getContactAppChannel(recipientId);
        var msg = new Object();

        var event = smartEvent.findObject(eventId);
        var notificationString =  userModel._user.name + " wants to connect on intelligram";
        msg.msgID = uuid.v4();
        msg.msgClass = appDataChannel._class;
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
                icon: "www/images/androidlogo.png",
                msgcnt: 1,
                isMessage: false,
                isConnect: true,
                eventId :eventId
            }
        };

        APP.pubnub.publish({
            channel: channel,
            message: msg
        }, function (status, response) {
                if (status.error) {
                    // handle error
                    ggError("Connect Response Error: " + JSON.stringify(status.error));
                    return;
                }
            }
        );

    },

    eventAccept: function (eventId, senderId, recipientId, comment) {
        var channel = appDataChannel.getContactAppChannel(senderId);
        var msg = new Object();

        var event = smartEvent.findObject(eventId);


        var notificationString =  userModel._user.name + " has accepted " + event.title;
        msg.msgID = uuid.v4();
        msg.msgClass = appDataChannel._class;
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
                icon: "www/images/androidlogo.png",
                msgcnt: 1,
                isMessage: false,
                isEvent: true,
                eventId :eventId
            }
        };

        APP.pubnub.publish({
            channel: channel,
            message: msg
            },
            function (status, response) {
                if (status.error) {
                    // handle error
                    ggError("Event Accept Error: " + JSON.stringify(status.error));
                    return;
                }
            }
        );

    },

    eventDecline : function (eventId, senderId, recipientId, comment) {
        var channel = appDataChannel.getContactAppChannel(senderId);
        var msg = new Object();

        var event = smartEvent.findObject(eventId);

        var notificationString =  userModel._user.name + " has declined " + event.title;
        msg.msgID = uuid.v4();
        msg.msgClass = appDataChannel._class;
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
                icon: "www/images/androidlogo.png",
                msgcnt: 1,
                isMessage: false,
                isEvent: true,
                eventId :eventId
            }
        };
        APP.pubnub.publish({
            channel: channel,
            message: msg
        },
            function (status, response) {
                if (status.error) {
                    // handle error
                    ggError("Event Decline Error: " + JSON.stringify(status.error));
                }
            }
        );

    },

    // Must be sent to each invitee or accepted member
    sendEventCancel : function (eventId, recipientId, comment) {
        var channel = appDataChannel.getContactAppChannel(recipientId);
        var msg = new Object();
        var event = smartEvent.findObject(eventId);

        var notificationString =  userModel._user.name + " has cancelled " + event.name;
        msg.msgID = uuid.v4();
        msg.msgClass = appDataChannel._class;
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
                icon: "www/images/androidlogo.png",
                msgcnt: 1,
                isMessage: false,
                isEvent: true,
                eventId :eventId
            }
        };
        APP.pubnub.publish({
            channel: channel,
            message: msg
        },
            function (status, response) {
                if (status.error) {
                    // handle error
                    ggError("Event Cancel Error: " + JSON.stringify(status.error));
                }
            }
        );
    },

    // Must be sent to each invitee or accepted member
    sendEventUpdate : function (eventId, recipientId, updateObject, comment) {
        var channel = appDataChannel.getContactAppChannel(recipientId);
        var msg = new Object();
        var event = smartEvent.findObject(eventId);

        var notificationString =  userModel._user.name + " has updated " + event.name;
        msg.msgID = uuid.v4();
        msg.msgClass = appDataChannel._class;
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
                icon: "www/images/androidlogo.png",
                msgcnt: 1,
                isMessage: false,
                isEvent: true,
                eventId :eventId
            }
        };
        APP.pubnub.publish({
            channel: channel,
            message: msg
        },
           function (status, response) {
                if (status.error) {
                    // handle error
                    ggError("Event Update Error: " + JSON.stringify(status.error));
                }
            }
        );
    },

    memberAutoConnect : function (contactUUID) {
        var msg = {};
        msg.msgID = uuid.v4();
        msg.msgClass = appDataChannel._class;
        var notificationString = "New contact : " + userModel._user.name;
        msg.type = 'autoConnect';
        msg.version = appDataChannel._version;
        msg.ownerId = userModel._user.get('userUUID');
        msg.ownerName = userModel._user.get('name');
        msg.message  =  msg.ownerName + " is a new intelligram contact." ;

        msg.time = new Date().getTime();
        msg.pn_apns = {
            aps: {
                alert : notificationString,
                badge: 1,
                'content-available' : 1
            },
            isMessage: false,
            target: '#contacts'
        };
        msg.pn_gcm = {
            data : {
                title: notificationString,
                message: msg.ownerName + " is a new intelligram contact.",
                target: '#contacts',
                icon: "www/images/androidlogo.png",
                msgcnt: 1,
                isMessage: false
            }
        };

        var channel = appDataChannel.getContactAppChannel(contactUUID);

        APP.pubnub.publish({
            channel: channel,
            message: msg
        },
            function (status, response) {
                if (status.error) {
                    // handle error
                    ggError("Member Autoconnect Error: " + JSON.stringify(status.error));
                }
            }
        );
    },

    groupChannelInvite : function (contactUUID, channelUUID, channelName, channelDescription,  members, options) {
        var msg = {};

        msg.msgID = uuid.v4();
        msg.msgClass = appDataChannel._class;
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
                icon: "www/images/androidlogo.png",
                msgcnt: 1,
                isMessage: false,
                channelUUID : channelUUID
            }
        };

        var channel = appDataChannel.getContactAppChannel(contactUUID);

        APP.pubnub.publish({
            channel: channel,
            message: msg
        },
            function (status, response) {
                if (status.error) {
                    // handle error
                    ggError("Group Invite Error: " + JSON.stringify(status.error));
                }
            }
        );
    },


    groupChannelDelete : function (contactUUID, channelUUID, channelName, message) {
        var msg = {};

        var notificationString = channelName + " has been deleted...";
        msg.msgID = uuid.v4();
        msg.msgClass = appDataChannel._class;
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
                icon: "www/images/androidlogo.png",
                msgcnt: 1,
                isMessage: false,
                channelUUID : channelUUID
            }
        };

        var channel = appDataChannel.getContactAppChannel(contactUUID);

        APP.pubnub.publish({
            channel: channel,
            message: msg
        },
            function (status, response) {
                if (status.error) {
                    // handle error
                    ggError("Group Delete Error: " + JSON.stringify(status.error));
                }
            }

        );
    },

    groupChannelUpdate : function (contactUUID, channelUUID, channelName, channelDescription,  members) {
        var msg = {};

        var notificationString = "Chat Update : " + channelName;
        msg.msgID = uuid.v4();
        msg.msgClass = appDataChannel._class;
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
                icon: "www/images/androidlogo.png",
                msgcnt: 1,
                isMessage: false,
                channelUUID : channelUUID
            }
        };
        var channel = appDataChannel.getContactAppChannel(contactUUID);

        APP.pubnub.publish({
            channel: channel,
            message: msg
        },
           function (status, response) {
                if (status.error) {
                    // handle error
                    ggError("Group Delete Error: " + JSON.stringify(status.error));
                }
            }

        );
    },
    

    processUserAlert : function (channelUUID, channelName, userUUID, userName, message) {
        notificationModel.addUserAlert(channelUUID, channelName, userName, message);
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

    processGalleyInvite : function (galleryUUID, galleryName, ownerId, ownerName) {

    },

    processGroupInvite: function (channelUUID, channelName, channelDescription, channelMembers, ownerId, ownerName, options) {
        // Todo:  Does channel exist?  If not create,  if so notify user of request
        var channel = channelModel.findChannelModel(channelUUID);
        var contact = contactModel.findContact(ownerId);
        
      
        if (channel === undefined && channelMembers !== undefined && channelMembers.length > 1) {
            //mobileNotify("Chat invite from  " + ownerName + ' " ' + channelName + '"');
            if (contact === undefined) {
                // This user has been added to group but a member who's not in their contact list
                var guid = uuid.v4();
                contactModel.createChatContact(ownerId, ownerName, guid, function (result) {
                /*    channelModel.queryChannelMap(channelUUID, function (error, data) {
                        if (error === null && data !== null) {*/
                            channelModel.addMemberChannel(channelUUID, channelName, channelDescription, channelMembers, ownerId, ownerName, options, false);
                /*        }
                    });*/
                })
            } else {
               /* channelModel.queryChannelMap(channelUUID, function (error, data) {
                    if (error === null && data !== null) {*/
                        channelModel.addMemberChannel(channelUUID, channelName, channelDescription, channelMembers, ownerId, ownerName, options, false);
         /*           }
                });*/
            }
            

            
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

    processRecallPhoto: function (channelUUID, photoId, ownerId, isPrivateChat) {
        channelModel.addPhotoRecall(channelUUID, photoId, ownerId, isPrivateChat);
    },

    publishCallback : function (m) {
        if (m === undefined)
            return;

        var status = m[0], message = m[1], time = m[2];

        if (status !== 1) {
            console.log('appDataChannel: Error publishing invite: ' + message);
        }

    },

    errorCallback : function (error) {
        console.log('appDataChannel Error : ' + error);
    },

    channelConnect: function () {

    },

    channelDisconnect: function () {
        console.log("App Data Channel Disconnected");
    },

    channelReconnect: function () {
        console.log("App Data Channel Reconnected");
    },

    channelSuccess : function (status) {

    },

    channelError : function (error) {
        console.log('appDataChannel Error : ' + error)
    }
};
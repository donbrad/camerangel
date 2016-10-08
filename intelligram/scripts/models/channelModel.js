/**
 * Created by donbrad on 8/11/15.
 * channelModel.js -- handles all channel model interactions with parse and kendoDS
 */
'use strict';

var channelModel = {

    _version: 1,
    _cloudClass: "channels",
    _ggClass: 'Chat',
    _channelName : "channels",
    _channelMemberName : "channelMember",

    _messageType : 'message',
    _photoType : 'photo',
    _actionUnread : 'unread',
    _actionAdd : 'add',
    _actionAddPrivate : 'addprivate',
    _actionAddMember : 'addmember',
    _actionAddGroup : 'addgroup',
    _actionAddPlace : 'addplace',

    _actionUpdate: 'update',
    _actionDelete : 'delete',
    _actionMute : 'mute',

    currentChannel: new kendo.data.ObservableObject(),
    intervalTimer : undefined,
    _sentMessages : "sentMessages",
    activeChannels: [],
    _syncingChannels : false,
    _fetched : false,
    _initialSync : false,
    recalledMessagesFetched : false,
    recalledPhotosFetched : false,
    photosFetched : false,

    deferredArray : [],
    processingDeferred : false,

    _messageCountRefresh : 300000,   // Delta between message count  calls (in milliseconds)

    channelsDS: null,

    channelsArray : [],
    
    photosDS: new kendo.data.DataSource(),

    // List of all active private channels (those with messages)
    privateChannelsDS: null, 

    recallDS : new kendo.data.DataSource(),

    groupMessagesDS : new kendo.data.DataSource(),


    init :  function () {

        channelModel.activeChannels = [];

        channelModel.channelsDS = new kendo.data.DataSource({
            type: 'everlive',
            transport: {
                typeName: 'channels',
                dataProvider: APP.everlive
            },
            schema: {
                model: { Id:  Everlive.idField}
            },
            sort: {
                field: "lastAccess",
                dir: "desc"
            }
        });
        
        /*channelModel.privateChannelsDS = new kendo.data.DataSource({
            type: 'everlive',
            transport: {
                typeName: 'privatechannels',
                dataProvider: APP.everlive
            },
            schema: {
                model: { Id:  Everlive.idField}
            }
        });*/

        /*channelModel.recalledMessagesDS = new kendo.data.DataSource({
            type: 'everlive',
          
            transport: {
                typeName: 'recall',
                dataProvider: APP.everlive
            },
            schema: {
                model: { Id:  Everlive.idField}
            },
            requestEnd : function (e) {
                var response = e.response,  type = e.type;

                if (type === 'read') {
                    channelModel.recalledMessagesFetched = true;
                }
            }
        });


        channelModel.recalledPhotosDS = new kendo.data.DataSource({
            type: 'everlive',

            transport: {
                typeName: 'recalledPhotos',
                dataProvider: APP.everlive
            },
            schema: {
                model: { Id:  Everlive.idField}
            },
            requestEnd : function (e) {
                var response = e.response,  type = e.type;

                if (type === 'read') {
                    channelModel.recalledPhotosFetched = true;
                }
            }
        });*/

       /* channelModel.photosDS = new kendo.data.DataSource({
            type: 'everlive',

            transport: {
                typeName: 'channelPhotos'
            },
            schema: {
                model: { Id:  Everlive.idField}
            },
            autoSync : true,
            requestEnd : function (e) {
                var response = e.response,  type = e.type;

                if (type === 'read') {
                    channelModel.photosFetched = true;
                }
            }
        });

        channelModel.groupMessagesDS = new kendo.data.DataSource({
            type: 'everlive',
            transport: {
                typeName: 'groupmessages'
            },
            schema: {
                model: { Id:  Everlive.idField}
            }
        });*/



        // Reflect any core channel changes to channelList
        channelModel.channelsDS.bind("change", function (e) {
            // Rebuild the channelView.channelListDS when the underlying list changes: add, delete, update...
           //channelView._channelListDS.data(channelModel.channelsDS.data());
            var changedChannels = e.items;
            if (e.action === undefined) {
                if (changedChannels !== undefined && !channelModel._initialSync) {

                    channelModel._initialSync = true;

                    appDataChannel.history();
                    userDataChannel.history();
                    channelsView.updateChannelListDS();
                    contactModel.updateChatShares();
                    channelModel.buildChannelsArray();
                    groupChannel.subscribeChannelArray(channelModel.channelsArray);
                }
            } else {
                switch (e.action) {

                    case "itemchange" :
                        var field  =  e.field;
                        var channel = e.items[0];
                        if (channel !== undefined && channel !== null) {
                            var channelUUID = channel.channelUUID;
                            var channelList = channelsView.findChannelModel(channelUUID);
                            if (channelList !== undefined)
                                channelList.set(field, channel [field]);
                        }

                        break;

                    case "remove" :
                        var channel = e.items[0];
                        channelsView._channelListDS.remove(channel);
                        // unsubscribe channel
                        groupChannel.unsubscribeChannel(channel.channelUUID);
                        break;

                    case "add" :
                        var channel = e.items[0];
                        // subscribe channel
                        groupChannel.subscribeChannel(channel.channelUUID);
                        var channelList = channelsView.findChannelModel(channel.channelUUID);
                        if (channelList !== undefined)
                            channelsView._channelListDS.add(channel);

                        break;
                }
            }

        });


        channelModel.channelsDS.fetch();
    /*    channelModel.photosDS.fetch();
        channelModel.groupMessagesDS.fetch();
*/


        channelModel.channelsDS.bind("requestEnd", function (e) {
            var response = e.response,  type = e.type;

            if (type === 'read' && response) {
                if (!channelModel._fetched){
                    channelModel._fetched = true;
                }

            }

        });

        deviceModel.setAppState('hasChannels', true);

    },

    sync : function () {
        channelModel.channelsDS.sync();
     /*   channelModel.photosDS.sync();
        channelModel.groupMessagesDS.sync();*/
    },

    buildChannelsArray : function () {
        var len = channelModel.channelsDS.total();

        if (len === 0)
            return;

        for (var i=0; i<len; i++) {
            var channel = channelModel.channelsDS.at(i);

            if (!channel.isPrivate) {
                channelModel.channelsArray.push(channel.channelUUID);
            }
        }
    },

    updateActiveChannel : function (channelUUID) {
        channelModel.activeChannels[channelUUID] = 1;
    },

    defer : function (action, actionObj) {

    },

    processDeferred : function () {

        if (channelModel.deferredArray.length === 0 || channelModel.processingDeferred) {
            return;
        }

        channelModel.processingDeferred = true;

        for (var i=0; i<channelModel.deferredArray.length;  i++ ) {
            var obj = channelModel.deferredArray[0];

            switch (obj.action) {
                case channelModel._actionUnread :
                break;

            }
        }


    },

    getGroupChannels : function () {
        var query = [{ field: "category", operator: "neq", value: 'Private' },
            { field: "isDeleted", operator: "eq", value: false }
        ];
        var dataSource = channelModel.channelsDS;
        if (dataSource === null) {
            ggError("Channels not initialized!");
            return ([]);
        }
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();
        dataSource.filter(cacheFilter);
        return(view);

    },

    queryChannels : function (query) {
        if (query === undefined)
            return([]);
        var dataSource = channelModel.channelsDS;
        if (dataSource === null) {
            ggError("Channels not initialized!");
            return ([]);
        }
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();
        dataSource.filter(cacheFilter);
        return(view);

    },

    queryChannel : function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = channelModel.channelsDS;
        if (dataSource === null) {
            ggError('queryChannel: ds is null!!!');
            debugger;
        }
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();
        var channel = view[0];
        dataSource.filter(cacheFilter);
        return(channel);
    },


    queryRecalledMessages : function (query) {
        if (query === undefined)
            return([]);
        var dataSource = channelModel.recallDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();
        dataSource.filter(cacheFilter);
        return(view);

    },

    queryRecalledMessage : function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = channelModel.recallDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();
        var channel = view[0];
        dataSource.filter(cacheFilter);
        return(channel);
    },

    getRecalledMessages : function (channelUUID) {
        var messages = channelModel.queryRecalledMessages([{ field: "channelUUID", operator: "eq", value: channelUUID },
            { field: "type", operator: "eq", value: channelModel._messageType }]);

        return(messages);
    },

    isMessageRecalled : function (msgID) {
        var message = channelModel.queryRecalledMessage([{ field: "messageId", operator: "eq", value: msgID },
            { field: "type", operator: "eq", value: channelModel._messageType }]);

        if (message === undefined) {
            //msgID not found in recall list
            return(false);
        } else {
            //msgID exists in recall list
            return(true);
        }
    },

    isPhotoRecalled : function (photoId, channelId) {
        var message = channelModel.queryRecalledMessage([{ field: "photoId", operator: "eq", value: photoId },
            { field: "channelId", operator: "eq", value: channelId },
            { field: "type", operator: "eq", value: channelModel._photoType }]);

        if (message === undefined) {
            //msgID not found in recall list
            return(false);
        } else {
            //msgID exists in recall list
            return(true);
        }
    },

    getRecalledPhotos : function (channelUUID) {
        var photos = channelModel.queryRecalledMessages([{ field: "channelUUID", operator: "eq", value: channelUUID },
            { field: "type", operator: "eq", value: channelModel._photoType }]);

        return(photos);
    },

    addMessageRecall : function (channelUUID, msgId, ownerId, isPrivateChat) {


        if (isPrivateChat) {
            privateChannel.recallMessage(channelUUID, msgId);
        } else {
            groupChannel.recallMessage(channelUUID, msgId);
        }
        /*var recallObj = {channelUUID : channelUUID, msgID: msgId, ownerId:  ownerId, isPrivateChat: isPrivateChat};

        var channel = channelModel.findChannelModel(channelUUID);

        if (channel === undefined) {
            return;
        }
        channelModel.recalledMessagesDS.add(recallObj);
        channelModel.recalledMessagesDS.sync();
        if (channelUUID === channelView._channelUUID) {
            // need to delete from channel view too
            var liveMessage = channelView.findMessageById(msgId);
            channelView.messagesDS.remove(liveMessage);
            channelView.messagesDS.sync();
        }
*/
    },


    addPhotoRecall : function (channelUUID, photoId, ownerId, isPrivateChat) {



        if (isPrivateChat) {
            privateChannel.recallPhoto(channelUUID, photoId);
        } else {
            groupChannel.recallPhoto(channelUUID, photoId);
        }

        if (channelUUID === channelView._channelUUID) {

            // Todo -- need to decide how to handle recall in active channel, could force refresh
        }


        /* var channel = channelModel.findChannelModel(channelUUID);
         var recallObj = {channelUUID : channelUUID, photoId: photoId, ownerId:  ownerId,  isPrivateChat: isPrivateChat, timestamp: ggTime.currentTime()};
        if (channel === undefined) {
            return;
        }
        channelModel.recalledPhotosDS.add(recallObj);
        channelModel.recalledPhotosDS.sync();
        if (channelUUID === channelView._channelUUID) {

           // Todo -- need to decide how to handle recall in active channel, could force refresh
        }

        everlive.createOne('recalledPhotos', recallObj, function (error, data) {
            if (error !== null) {
                mobileNotify("Error creating Chat Recall Photo " + JSON.stringify(error));
            }
        });*/

    },


    addPhoto : function (photoObj) {

        var channel = channelModel.findChannelModel(photoObj.channelUUID);

        if (channel === undefined) {
            return;
        }
        
        channelModel.photosDS.add(photoObj);
        channelModel.photosDS.sync();

       /* everlive.createOne('channelPhotos', photoObj, function (error, data) {
            if (error !== null) {
                mobileNotify("Error creating Chat Shared Photo " + JSON.stringify(error));
            } else {
                // look up the photo (and remove duplicate local copy if there is one)
                var photoList = channelModel.findPhotosById(data.photoId);

                if (photoList.length > 1) {
                    var length = photoList.length;

                    for (var i=0; i<length; i++) {
                        if (photoList[i].id === undefined) {
                            channelModel.photosDS.remove(photoList[i]);
                        }
                    }
                } else if (photoList.length === 1) {
                    if (photoList[0].id === undefined) {
                        photoList[0].id = data.id;
                    }

                    photoModel.photosDS.sync();
                }


            }
        });
*/
    },

    queryPhotos : function (query) {
        if (query === undefined)
            return([]);
        var dataSource = channelModel.photosDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();
        dataSource.filter(cacheFilter);
        return(view);

    },
    
    getChannelPhotos : function (channelUUID) {
        var photos = channelModel.queryPhotos({ field: "channelUUID", operator: "eq", value: channelUUID });

        return(photos);
    },
    
    findChannelPhoto : function (channelId, photoId) {
        var photos = channelModel.queryPhotos([{ field: "channelUUID", operator: "eq", value: channelId },
            { field: "photoUUID", operator: "eq", value: photoId }
        ]);
        
        if (photos.length === 0) {
            return (null);
        }
        
        return(photos[0]);
    },

    getUnreadChannels : function () {
        var channels = channelModel.queryChannels({ field: "unreadCount", operator: "gte", value: 0 });

        return(channels);
    },

    updateLastAccess : function (channelUUID, lastAccess) {
        var channel = channelModel.findChannelModel(channelUUID);
        if (channel === undefined) {
            mobileNotify('updateLastAccess: unknown channel ' + channelUUID);
        } else {
            if (lastAccess === undefined || lastAccess === null) {
                lastAccess = ggTime.currentTime();
            }
            channel.set('lastAccess', lastAccess);
            //updateParseObject('channels', 'channelUUID', channelUUID, 'lastAccess', lastAccess);

        }
    },

    getLastAccess : function (channelUUID) {
        var channel = channelModel.findChannelModel(channelUUID);
        if (channel === undefined) {
            ggError('getLastAccess: unknown channel ' + channelUUID);
        } else {
            return(channel.get('lastAccess'));
        }
    },


    updateLastMessageTime : function (channelUUID, lastMessage) {
        var channel = channelModel.findChannelModel(channelUUID);
        if (channel === undefined) {
            ggError('updateLastMessageTime: unknown channel ' + channelUUID);
        } else {
            if (lastMessage === undefined || lastMessage === null) {
                lastMessage = ggTime.currentTime();
            }
            channel.set('lastMessage', lastMessage);

        }
    },

    getLastMessageTime: function (channelUUID) {
        var channel = channelModel.findChannelModel(channelUUID);
        if (channel === undefined) {
            mobileNotify('getLastMessageTime: unknown channel ' + channelUUID);
        } else {
            return(channel.get('lastMessage'));
        }
    },

    cacheGroupMessage : function (message) {
        
        channelModel.groupMessagesDS.add(message);
    },

    zeroUnreadCount: function (channelUUID) {

        if (!channelModel._fetched) {
            channelModel.defer(channelModel._actionUnread, {action: channelModel._actionUnread, channel: channelUUID, count: 0});
            return;
        }
        var channel = channelModel.findChannelModel(channelUUID);
        if (channel === undefined) {
            mobileNotify('updateUnreadCount: unknown channel ' + channelUUID);
        } else {

            var lastAccess = ggTime.currentTime();
            channel.set('unreadCount',0);
            //notificationModel.updateUnreadNotification(channelUUID, channel.get('name'), count);
            //updateParseObject('channels', 'channelUUID', channelUUID, 'unreadCount', 0);
            channelModel.updateLastAccess(channelUUID, lastAccess);

        }
    },

    updateUnreadCount: function (channelUUID, count) {
        if (!channelModel._fetched) {
            channelModel.defer(channelModel._actionUnread, {action: channelModel._actionUnread, channel: channelUUID, count: count, lastAccess : null});
            return;
        }
        var channel = channelModel.findChannelModel(channelUUID);
        if (channel === undefined) {
            mobileNotify('updateUnreadCount: unknown channel ' + channelUUID);
        } else {

            var lastAccess = ggTime.currentTime();
            channel.set('unreadCount',channel.get('unreadCount') + count);
            notificationModel.updateUnreadNotification(channelUUID, channel.get('name'), count);
            //channelsView.updateUnreadCount(channelUUID,  channel.unreadCount + count);
            //updateParseObject('channels', 'channelUUID', channelUUID, 'unreadCount', count);
            channelModel.updateLastMessageTime(channelUUID, lastAccess);

        }
    },

    updatePrivateUnreadCount: function (channelUUID, count) {

        if (!channelModel._fetched) {
            channelModel.defer(channelModel._actionUnread, {action: channelModel._actionUnread, channel: channelUUID, count: count, lastAccess: null});
            return;
        }

        var channel = channelModel.findChannelModel(channelUUID);
        if (channel === undefined) {
            channelModel.confirmPrivateChannel(channelUUID, function(result){
            if (result !== null) {
                var lastAccess = ggTime.currentTime();

                notificationModel.updateUnreadNotification(result.channelUUID, result.name, count);
                channelModel.updateLastMessageTime(result.channelUUID, lastAccess);
            }
            });
        } else {

            var lastAccess = ggTime.currentTime();

            notificationModel.updateUnreadNotification(channelUUID, channel.get('name'), count);
            channel.set('unreadCount',channel.get('unreadCount') + count);
            //channelsView.updateUnreadCount(channelUUID,  channel.unreadCount + count);
            //updateParseObject('channels', 'channelUUID', channelUUID, 'unreadCount', count);
            channelModel.updateLastMessageTime(channelUUID, lastAccess);

        }
    },

    incrementUnreadCount: function (channelUUID, count, lastAccess) {

        if (!channelModel._fetched) {
            channelModel.defer(channelModel._actionUnread, {action: channelModel._actionUnread, channel: channelUUID, count: count, lastAccess: lastAccess});
            return;
        }

        var channel = channelModel.findChannelModel(channelUUID);
        if (channel === undefined) {
            mobileNotify('incrementUnreadCount: unknown channel ' + channelUUID);
            debugger;
        } else {


            if (lastAccess === undefined || lastAccess === null) {
                lastAccess = ggTime.currentTime();
            }
            notificationModel.updateUnreadNotification(channelUUID, channel.get('name'), count);
            channel.set('unreadCount', channel.unreadCount + count);
            //channelsView.updateUnreadCount(channelUUID,  channel.unreadCount + count);
            //updateParseObject('channels', 'channelUUID', channelUUID, 'unreadCount', channel.unreadCount + count);
            channelModel.updateLastMessageTime(channelUUID, lastAccess);
        }

    },
    
    // confirm that there's a private channel for this sender - if not just silently create it
    confirmPrivateChannel: function (channelUUID, callback) {
        var channel = channelModel.findChannelModel(channelUUID);
        if (channel === undefined) {
           var contact = contactModel.findContact(channelUUID);   // ChannelUUID is same as contactUUID
            if (contact !== undefined && contact.contactUUID !== undefined && !contact.isBlocked) {
                channelModel.addPrivateChannel(contact.contactUUID, contact.publicKey, contact.name);
                if (callback !== undefined)
                    callback(channelUUID);
            } else {
                if (callback !== undefined)
                    callback(null);

                // No contact for this .
                /* var guid = uuid.v4();
                contactModel.createChatContact(channelUUID, guid, function (result) {
                    if (result !== null) {
                        mobileNotify("Adding private chat for " + result.name);
                        // This is a memberdirectory result so it's user data...
                        channelModel.addPrivateChannel(result.userUUID, result.publicKey, result.name);
                         if (callback !== undefined) {
                            callback(channelUUID);
                        }
                    } else {
                        if (callback !== undefined) {
                            callback(null);
                        }
                    }
                });*/
            }
        } else {
            if (callback !== undefined) {
                callback(channel.channelUUID);
            }
        }
    },


    updateChannel : function (channelUUID, channelName, channelDescription, channelMembers) {
        var channel = channelModel.findChannelModel(channelUUID);
        if (channel !== undefined) {
            channel.set('name', channelName);

            if (channelDescription === undefined)
                channelDescription  = null;
            channel.set('description', channelDescription);


            if (channelMembers === undefined || channelMembers === null) {
                channelMembers = [];
            }

            if (channelMembers.length === 0) {
                mobileNotify("Updatechat " + channelName + " has no members!");
                return;

            }
            channel.set('members', channelMembers);
            channel.set('isDirty', true);

        }

    },


    // Update members and other channel Member data for this channel
    syncChannel : function (channelUUID) {

        getChannelDetails(channelUUID,  function (result) {
            if (result.found) {
                var channel = channelModel.findChannelModel(channelUUID);
                if (channel === undefined) {
                    mobileNotify('channelModel.updateChannel - channel unknown" ' + channelUUID);
                }
                var channelUpdate = result.channel;

                channel.set("members", channelUpdate.members);
                channelModel.confirmChannelMembers(channelUpdate.members);
                channel.set("name", channelUpdate.name);
                channel.set("description", channelUpdate.description);

            }
        });

    },

    // Update channel membership (for non-owner members)
    updateChannelMembers : function (channelUUID, members) {
        var channel = channelModel.findChannelModel(channelUUID);

        if (channel !== null) {
            channel.set('members', members);
            channelModel.confirmChannelMembers(members);
            //updateParseObject('channels', 'channelUUID', channelUUID, 'members', members );
        }

    },

    // confirm that all members of the channel are user contacts.
    confirmChannelMembers : function (members) {
        if (members === undefined || members.length === 0) {
            return;
        }

        var userId = userModel._user.userUUID;
        for (var i=0; i<members.length; i++) {
            if (members[i] !== userId) {
                var contact = contactModel.findContact(members[i]);
                if (contact === undefined) {

                    if (members[i] !== userModel._user.userUUID) {
                        var contactId = uuid.v4();
                        contactModel.createChatContact(members[i], contactId, function (result){});
                    }
                    
                }
            }
        }
    },



    findChannelModel: function (channelUUID) {

        return(channelModel.queryChannel({ field: "channelUUID", operator: "eq", value: channelUUID }));

        /*var dataSource =  channelModel.channelsDS;
        dataSource.filter( { field: "channelUUID", operator: "eq", value: channelUUID });
        var view = dataSource.view();
        var channel = view[0];
        dataSource.filter([]);

        return(channel);*/
    },


    findChannelList: function (channelUUID) {

        return(channelModel.queryChannels({ field: "channelUUID", operator: "eq", value: channelUUID }));

        /*var dataSource =  channelModel.channelsDS;
         dataSource.filter( { field: "channelUUID", operator: "eq", value: channelUUID });
         var view = dataSource.view();
         var channel = view[0];
         dataSource.filter([]);

         return(channel);*/
    },

    findChannelByName: function (channelName) {

        return(channelModel.queryChannel({ field: "name", operator: "eq", value: channelName }));
      /*  var dataSource =  channelModel.channelsDS;
        dataSource.filter( { field: "name", operator: "eq", value: channelName });
        var view = dataSource.view();
        var channel = view[0];
        dataSource.filter([]);

        return(channel);*/
    },


    findPrivateChannel : function (contactUUID) {
        var dataSource =  channelModel.channelsDS;
        var queryCache = dataSource.filter();
        if (queryCache === undefined) {
            queryCache = {};
        }
        dataSource.filter(
            [
                { field: "isPrivate", operator: "eq", value: true },
                { field: "contactUUID", operator: "eq", value: contactUUID }
            ]);

        var view = dataSource.view();
        var channel = view[0];
        dataSource.filter(queryCache);
        return(channel);
    },

    _cleanDupChannels : function (channelId) {
        var channelList = channelModel.findChannelList(channelId);

        if (channelList !== undefined && channelList.length > 0) {
            if (channelList.length > 1) {
                for (var i=0; i< channelList.length; i++) {
                    var channel = channelList[i];

                    if (channel.Id === undefined) {
                        mobileNotify("Cleaning duplicate channel");
                        channelModel.channelsDS.remove(channel);
                    }
                }
            }
        }
    },



    // Add a new private channel that this user created -- create a channel object
    addPrivateChannel : function (contactUUID, contactPublicKey,  contactName, callback) {

        if (!channelModel._fetched) {
            channelModel.defer(channelModel._actionAddPrivate, {action: channelModel._actionUnread, channel: channelUUID, contactUUID: contactUUID, contactPublicKey: contactPublicKey, contactName: contactName});
            return;
        }


        var channelCheck = channelModel.findChannelModel(contactUUID);
        if (channelCheck !== undefined)  {
            // Channel already exists
            if (callback !== undefined) {
                callback(null, channelCheck);
            }
            return;
        }

        if (contactUUID === undefined) {
            ggError("addPrivateChannel - contactUUID is undefined!");
            return;
        }

        var contactCheck = contactModel.findContact(contactUUID);

        if (contactCheck === undefined) {

            channelModel.syncChatContacts([contactUUID]);
        }

       /* var Channels = Parse.Object.extend(channelModel._cloudClass);*/
        var channel = new kendo.data.ObservableObject();
        var addTime = ggTime.currentTime();
        channel.set('ggType', channelModel._ggClass);
        channel.set("version", channelModel._version);
        channel.set("name", contactName);
        channel.set("isOwner", true);
        channel.set('ownerUUID', userModel._user.userUUID);
        channel.set('ownerName', userModel._user.name);
        channel.set('isPrivate', true);
        channel.set('isPlace', false);
        channel.set('isEmergency', false);
        channel.set('isPrivatePlace', false);
        channel.set('placeUUID', null);
        channel.set('placeName', null);
        channel.set('isDeleted', false);
        channel.set('isMuted', false);
        channel.set('category', 'Private');
        channel.set('isEvent', false);
        channel.set("media",  true);
        channel.set("durationDays", 1);
        channel.set("archive",  false);
        channel.set("unreadCount", 0);
        channel.set("clearBefore", addTime);
        channel.set("lastAccess", addTime);
        channel.set("lastMessage", addTime);
        channel.set("description", "Private: " + contactName);
        channel.set("channelUUID", contactUUID);
        channel.set("contactUUID", contactUUID);
        channel.set('contactKey', contactPublicKey);
        channel.set("members", [userModel._user.userUUID, contactUUID]);

        channelModel.channelsDS.add(channel);
        channelModel.channelsDS.sync();
       

        everlive.createOne(channelModel._cloudClass, channel, function (error, data){
            if (error !== null) {
                if (callback !== undefined) {
                    callback(error, null);
                }
                mobileNotify ("Error creating Channel " + JSON.stringify(error));
            } else {

                channelModel._cleanDupChannels(contactUUID);
            }
        });


        if (callback !== undefined) {
            callback(null, channel);
        }
        
        notificationModel.addNewPrivateChatNotification(contactUUID, contactName);


    },

    syncChatContacts : function (memberList) {
        if (memberList === undefined || memberList.length === 0) {
            return;
        }

        for (var i=0; i<memberList.length; i++ ) {
            if (memberList[i] !== userModel._user.userUUID) {
                var contactUUID = memberList[i];
                var contact = contactModel.findContact(contactUUID);
                if (contact === undefined) {
                    var contactId = uuid.v4();
                    contactModel.createChatContact(contactUUID, contactId, function (result){
                        if (result === null) {
                            ggError ("Error creating Chat contact ");
                        }
                    })

                }
            }
           
        }


    },

    // Add group channel for members...
    // Get's the current owner details from parse and then creates a local channel for this user
    addMemberChannel : function (channelUUID, channelName, channelDescription, channelMembers, ownerUUID, ownerName, options, isDeleted) {
        if (!channelModel._fetched) {
            channelModel.defer(channelModel._actionAddMember, {action: channelModel._actionUnread, channel: channelUUID,
                channelUULD: channelUUID, channelName: channelName, channelDescription : channelDescription,
            channelMembers: channelMembers, ownerUUID : ownerUUID, ownerName : ownerName, options: options});
            return;
        }

        var channel = channelModel.findChannelModel(channelUUID);
        if (channel !== undefined)  {
            // Channel already exists
            return;
        }


        channel = new kendo.data.ObservableObject();
        channel.set('isPlace', false);
        channel.set('placeUUID', null);
        channel.set('placeName', null);
        channel.set('isPrivatePlace', true);
        channel.set('isEmergency', false);
        if (options !== undefined && options !== null) {
            if (options.chatType === 'Place') {
                channel.set('isPlace', true);
                channel.set('placeUUID', options.chatData.uuid);
                channel.set('placeName', options.chatData.name);
                placesModel.addSharedPlace(options.chatData, channelUUID);
            } else if (options.chatType === 'Emergency') {
                channel.set('isEmergency', true);
            }
        }

         if (isDeleted === undefined) {
             isDeleted = false;
         }
        var addTime = ggTime.currentTime();
        channel.set("version", channelModel._version);
        channel.set("ggType", channelModel._ggClass);
        channel.set("channelUUID", channelUUID);
        channel.set("name", channelName);
        channel.set("description", channelDescription);
        channel.set("ownerUUID", ownerUUID);
        channel.set("ownerName", ownerName);
        channel.set("isOwner", false);
        channel.set('isPrivate', false);
        channel.set('isDeleted', isDeleted);
        channel.set('isMuted', false);
        channel.set('category', 'Group');
        channel.set('isEvent', false);
        channel.set("media",  true);
        channel.set("durationDays", 30);
        channel.set("archive",  false);
        channel.set("unreadCount", 0);
        channel.set("clearBefore", addTime);
        channel.set("lastAccess", addTime);
        channel.set("lastMessage", addTime);


        if (channelMembers === undefined || channelMembers === null) {
            channelMembers = [];
        }
        if (channelMembers.length === 0) {
            mobileNotify("addMemberChat: " + channelName + " has no members!");
            return;

        }
        channel.set("members", channelMembers);
        channel.set("invitedMembers", []);

        channelModel.channelsDS.add(channel);
        channelModel.channelsDS.sync();
        serverPush.provisionGroupChannel(channel.channelUUID);
        channelModel.syncChatContacts(channelMembers);

        everlive.createOne(channelModel._cloudClass, channel, function (error, data){
            if (error !== null) {
                mobileNotify ("Error creating Channel " + JSON.stringify(error));
            } else {
                channelModel._cleanDupChannels(channel.channelUUID);
            }
        });
       /* channelModel.channelsDS.add(channel);
        channelModel.channelsDS.sync();
        deviceModel.syncEverlive();*/
        notificationModel.addNewChatNotification(channel.get('channelUUID'), "Group Chat: " + channel.get('name'), channel.get('description'));


    },


    addPlaceChannel : function (channelUUID, placeUUID, placeName, isPrivatePlace) {

        var channel = channelModel.findChannelModel(channelUUID);
        if (channel !== undefined)  {
            // Channel already exists
            return;
        }

        var channel = new kendo.data.ObservableObject();

        var addTime = ggTime.currentTime();
        var name = placeName,
            description = "Place Chat: " + placeName;

        // If this is a member request, channelUUID will be passed in.
        // If user is creating new channel, they own it so create new uuid and update ownerUUID and ownerName


        var ownerUUID = userModel._user.userUUID;
        var ownerName = userModel._user.name;

        // Ensure we have a valid duration for this channel

        var durationDays = 30;

        channel.set('version', channelModel._version);
        channel.set('ggType', channelModel._ggClass);
        channel.set('isMuted', false);
        channel.set('isDeleted', false);
        channel.set('isPrivate', false);

        if (isPrivatePlace === undefined)
            isPrivatePlace = true;

        channel.set('isPlace', true);
        channel.set('isEmergency', true)
        channel.set('isPrivatePlace', isPrivatePlace);
        channel.set('placeUUID', placeUUID);
        channel.set('placeName', placeName);
        channel.set('category', 'Place');


        // Generic fields for owner and members
        channel.set("name", name );

        channel.set('isEvent', false);
        channel.set("media",   true);
        channel.set("archive", true);
        channel.set("description", description);
        channel.set("durationDays", durationDays);
        channel.set("unreadCount", 0);
        channel.set("clearBefore", addTime);
        channel.set("lastAccess", addTime);
        channel.set("lastMessage", addTime);
        channel.set("channelUUID", channelUUID);

        channel.set("ownerUUID", ownerUUID);

        channel.set("ownerName", ownerName);
        // Channel owner can access and edit members...

        channel.set("isOwner", true);
        channel.set("members", [ownerUUID]);
        channel.set("memberCount", 1);
        channel.set("invitedMembers", []);

        channelModel.channelsDS.add(channel);

        everlive.createOne(channelModel._cloudClass, channel, function (error, data){
            if (error !== null) {
                mobileNotify ("Error creating Channel " + JSON.stringify(error));
            } else {
                channelModel._cleanDupChannels(channel.channelUUID);
            }
        });
    /*    channelModel.channelsDS.add(channel);
        channelModel.channelsDS.sync();
        deviceModel.syncEverlive();*/
        //currentChannelModel.currentChannel = channelModel.findChannelModel(channelUUID);
        notificationModel.addNewChatNotification(channel.get('channelUUID'), "Place Chat: " + channel.get('name'), channel.get('description'));

        APP.kendo.navigate('#editChannel?channel=' + channelUUID);
        
    },

    addEmergencyChannel : function (channelName, channelDescription, channelMembers) {
        var channel = new kendo.data.ObservableObject();

        /* var ChannelMap = Parse.Object.extend('channelmap');
         var channelMap = new ChannelMap();*/

        var addTime = ggTime.currentTime();
        var name = channelName,
            description = channelDescription;


        // If this is a member request, channelUUID will be passed in.
        // If user is creating new channel, they own it so create new uuid and update ownerUUID and ownerName

        var channelUUID = uuid.v4();
        var ownerUUID = userModel._user.userUUID;
        var ownerName = userModel._user.name;


        // Ensure we have a valid duration for this channel

        var durationDays = 30;

        channel.set('version', channelModel._version);
        channel.set('ggType', channelModel._ggClass);
        channel.set('isPlace', false);
        channel.set('category', 'Group');
        channel.set('isPrivate', false);
        channel.set('isEmergency', true);
        channel.set('isMuted', false);
        channel.set('isDeleted', false);

        channel.set('isPlace', false);
        channel.set('isPrivatePlace', false);
        channel.set('placeUUID', null);
        channel.set('placeName', null);

        channel.set("name", name );

        channel.set('isEvent', false);
        channel.set("media",   true);
        channel.set("archive", true);
        channel.set("description", description);
        channel.set("durationDays", durationDays);
        channel.set("unreadCount", 0);
        channel.set("clearBefore", addTime);
        channel.set("lastAccess", addTime);
        channel.set("lastMessage", addTime);
        channel.set("channelUUID", channelUUID);
        channel.set("Id", channelUUID);

        channel.set("ownerUUID", ownerUUID);

        channel.set("ownerName", ownerName);
        // Channel owner can access and edit members...

        channel.set("isOwner", true);
        channel.set("members", channelMembers);
        channel.set("memberCount", channelMembers.length);
        channel.set("invitedMembers", []);


       // channelModel.createChannelMap(channel);
        channelModel.channelsDS.add(channel);
        serverPush.provisionGroupChannel(channel.channelUUID);
        mobileNotify('Added Chat : ' + channel.get('name'));

        everlive.createOne(channelModel._cloudClass, channel, function (error, data) {
            if (error !== null) {
                mobileNotify ("Error creating Emergency Chat " + JSON.stringify(error));
            }
        });
    },

    // Add group channel for owner...
    addChannel : function (channelName, channelDescription) {
    
        var channel = new kendo.data.ObservableObject();

       /* var ChannelMap = Parse.Object.extend('channelmap');
        var channelMap = new ChannelMap();*/

        var addTime = ggTime.currentTime();
        var name = channelName,
            description = channelDescription;


        // If this is a member request, channelUUID will be passed in.
        // If user is creating new channel, they own it so create new uuid and update ownerUUID and ownerName

        var channelUUID = uuid.v4();
        var ownerUUID = userModel._user.userUUID;
        var ownerName = userModel._user.name;


        // Ensure we have a valid duration for this channel

        var durationDays = 30;

        channel.set('version', channelModel._version);
        channel.set('ggType', channelModel._ggClass);
        channel.set('isPlace', false);
        channel.set('category', 'Group');
        channel.set('isPrivate', false);
        channel.set('isEmergency', false);
        channel.set('isMuted', false);
        channel.set('isDeleted', false);

        channel.set('isPlace', false);
        channel.set('isPrivatePlace', false);
        channel.set('placeUUID', null);
        channel.set('placeName', null);

        channel.set("name", name );

        channel.set('isEvent', false);
        channel.set("media",   true);
        channel.set("archive", true);
        channel.set("description", description);
        channel.set("durationDays", durationDays);
        channel.set("unreadCount", 0);
        channel.set("clearBefore", addTime);
        channel.set("lastAccess", addTime);
        channel.set("lastMessage", addTime);
        channel.set("channelUUID", channelUUID);
        channel.set("Id", channelUUID);

        channel.set("ownerUUID", ownerUUID);

        channel.set("ownerName", ownerName);
        // Channel owner can access and edit members...

        channel.set("isOwner", true);
        channel.set("members", [ownerUUID]);
        channel.set("memberCount", 1);
        channel.set("invitedMembers", []);


       // channelModel.createChannelMap(channel);
        channelModel.channelsDS.add(channel);
        serverPush.provisionGroupChannel(channel.channelUUID);
        mobileNotify('Added Chat : ' + channel.get('name'));
        APP.kendo.navigate('#editChannel?channel=' + channelUUID);

        everlive.createOne(channelModel._cloudClass, channel, function (error, data) {
            if (error !== null) {
                mobileNotify ("Error creating Channel " + JSON.stringify(error));
            }
        });
        
    },

    deletePrivateChannel : function (channelUUID) {
        var channel = channelModel.findPrivateChannel(channelUUID);

        if (channel !== undefined) {
            //deleteParseObject('channels', 'channelUUID', channelUUID);
            channelModel.channelsDS.remove(channel);
            everlive.deleteOne(channelModel._cloudClass, channel.Id, function(){
                
            });
        }
    },

    deleteChannel : function (channelUUID, silent) {
        var dataSource = channelModel.channelsDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = [];
        }
        dataSource.filter( { field: "channelUUID", operator: "eq", value: channelUUID });
        var view = dataSource.view();
        var channel = view[0];
        dataSource.filter(cacheFilter);

        if (channel !== undefined) {

            groupChannel.removeMember(channelUUID, userModel._user.userUUID);

            if (channel.isOwner) {
                // If this user is the owner -- delete the channel map

               /* if (silent === undefined || silent === false) {
                    if (channel.isPrivate === false) {
                        // Send delete channel messages to all members
                        var members = channel.members;
                        // Skip the first member as it's the owner
                        for (var i = 1; i < channel.members.length; i++) {
                            appDataChannel.groupChannelDelete(members[i], channelUUID, channel.name, 'Chat "' + channel.name + 'has been deleted');
                        }
                    }
                }*/

                if (channel.isPlace) {
                    var placeUUID = channel.placeUUID;
                    if (placeUUID !== undefined && placeUUID !== null) {
                        var place = placesModel.getPlaceModel(placeUUID);
                        if (place !== undefined) {
                            place.set('hasPlaceChat', false);
                            place.set('placeChatId', null);
                        }
                    }
                }

                if (window.navigator.simulator === undefined) {
                    if (!channel.isPrivate)
                        serverPush.unprovisionGroupChannel(channelUUID);
                }


                dataSource.remove(channel);
                dataSource.sync();

                var Id = channel.Id;

                if (Id !== undefined){
                    everlive.deleteOne(channelModel._cloudClass, Id, function (error, data) {
                        dataSource.remove(channel);
                    });
                }

            } else {

                if (window.navigator.simulator === undefined)
                    serverPush.unprovisionGroupChannel(channelUUID);

                dataSource.remove(channel);
                dataSource.sync();

            }
        }
    },

    // For members only -- undelete a previous deleted channel
    unDeleteChannel : function (channelUUID) {
        var dataSource = channelModel.channelsDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = [];
        }
        dataSource.filter( { field: "channelUUID", operator: "eq", value: channelUUID });
        var view = dataSource.view();
        var channel = view[0];
        dataSource.filter(cacheFilter);

        if (channel !== undefined) {
            //updateParseObject("channels", 'channelUUID', channelUUID, 'isDeleted', false);
            channel.set('isDeleted', false);
            serverPush.provisionGroupChannel(channelUUID);
        }

    },

    muteChannel : function (channelUUID, isMuted) {
        var dataSource = channelModel.channelsDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = [];
        }
        dataSource.filter( { field: "channelUUID", operator: "eq", value: channelUUID });
        var view = dataSource.view();
        var channel = view[0];
        dataSource.filter(cacheFilter);

        if (channel !== undefined) {

            //updateParseObject("channels", 'channelUUID', channelUUID, 'isMuted', isMuted);
            channel.set('isMuted', isMuted);
            if (isMuted) {
                serverPush.unprovisionGroupChannel(channelUUID);
            } else {
                serverPush.provisionGroupChannel(channelUUID);
            }

        }
    },

    deleteAllChannels : function () {
        var channelArray = channelModel.channelsDS.data();

        for (var i=0; i<channelArray.length; i++) {
            channelModel.deleteChannel(channelArray.channelUUID);
        }
    }/*,

    createChannelMap : function (channel) {
        var mapObj = {};
        mapObj.Id = channel.channelUUID;
        mapObj.channelUUID = channel.channelUUID;
        mapObj.channelName = channel.name;
        mapObj.description = channel.description;
        mapObj.isPlace = channel.isPlace;
        mapObj.isPrivatePlace = channel.isPrivatePlace;
        mapObj.placeUUID = channel.placeUUID;
        mapObj.placeName = channel.placeName;
        mapObj.category = channel.category;
        mapObj.ownerUUID = channel.ownerUUID;
        mapObj.ownerName = channel.ownerName;
        mapObj.members = channel.members;
        mapObj.memberCount = channel.members.length;
        mapObj.invitedMembers = channel.invitedMembers;

        everlive.createOne('channelmap', mapObj, function (error, data){
            if (error !== null) {
                mobileNotify ("Error creating Channel Map " + JSON.stringify(error));
            }

        });
    },

    updateChannelMap : function (channel) {
        channelModel.queryChannelMap(channel.channelUUID, function (error, data) {
            if (error !== null) {
                channelModel.createChannelMap(channel);
            } else {
                var Id = data.Id;
                if (Id !== undefined){
                    var mapObj = {Id : Id};
                    mapObj.channelUUID = channel.channelUUID;
                    mapObj.channelName = channel.channelName;
                    mapObj.isPlace = channel.isPlace;
                    mapObj.isPrivatePlace = channel.isPrivatePlace;
                    mapObj.placeUUID = channel.placeUUID;
                    mapObj.placeName = channel.placeName;
                    mapObj.category = channel.category;
                    mapObj.ownerUUID = channel.ownerUUID;
                    mapObj.members = channel.members;
                    mapObj.memberCount = channel.members.length;
                    mapObj.invitedMembers = channel.invitedMembers;

                    everlive.update('channelmap', mapObj, {'channelUUID' : mapObj.channelUUID}, function (error, data) {
                        //placeNoteModel.notesDS.remove(note);
                    });
                }
            }
        });

    },

    deleteChannelMap : function (channelUUID) {
        channelModel.queryChannelMap(channel.channelUUID, function (error, data) {
            if (error !== null) {
               mobileNotify ("Error Deleting Channel Map : " + JSON.stringify(error));
            } else {
                var Id = data.Id;
                if (Id !== undefined) {
                    everlive.deleteOne('channelmap', Id, function (error, data) {
                        //placeNoteModel.notesDS.remove(note);
                    });
                }
            }
        });
    },

    queryChannelMap : function (channelUUID, callback) {
        var filter = {channelUUID : channelUUID};
        var data = APP.everlive.data('channelmap');
        data.get(filter)
            .then(function(data){
                    callback (null, data);
                },
                function(error){
                    callback (error, null);
                });
    },

    syncMemberChannels : function () {
        if (channelModel._syncingChannels === true) {
            return;
        }
        channelModel._syncingChannels = true;
        channelModel.queryChannelMapMember(userModel._user.userUUID, function (error, data) {

           if (error === null) {
               var channels = data.result;
                // Todo: proocess and sync channels
           } else {
               ggError ("Channel Sync Error " + JSON.stringify (error));
           }
           channelModel._syncingChannels = false;
       }) ;
    },
    
    queryChannelMapMember : function (memberId, callback) {
        var query = new Everlive.Query();
        query.where().eq('members', memberId).done();

        APP.everlive.data('channelmap').get(query).then (
            function (data) {
                callback(null, data.result);
            },
            function (error){
                callback(error, null);
            });
    },

    queryChannelMapInvite : function (phone, callback) {
        var query = new Everlive.Query();
        query.where().eq('invitedMembers', phone).done();

        APP.everlive.data('channelmap').get(query).then (
            function (data) {
                callback(null, data.result);
            },
            function (error){
                callback(error, null);
            });
    }
*/


};
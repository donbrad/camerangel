/**
 * Created by donbrad on 8/11/15.
 * channelModel.js -- handles all channel model interactions with parse and kendoDS
 */
'use strict';

var channelModel = {

    _version: 1,
    _parseClass: "channels",
    _ggClass: 'Chat',
    _channelName : "channels",
    _channelMemberName : "channelMember",
    currentChannel: new kendo.data.ObservableObject(),
    intervalTimer : undefined,
    _sentMessages : "sentMessages",
    activeChannels: [],

    _messageCountRefresh : 300000,   // Delta between message count  calls (in milliseconds)

    channelsDS: null,

    // List of all active private channels (those with messages)
    privateChannelsDS: new kendo.data.DataSource({
        offlineStorage: "privatechannels"
    }),

    recalledMessagesDS : new kendo.data.DataSource({
        offlineStorage: "recalledMessages"
    }),

    groupMessagesDS : new kendo.data.DataSource({
        offlineStorage: "groupMessages"
    }),

    init :  function () {

        channelModel.recalledMessagesDS.online(false);

        channelModel.activeChannels = [];

        channelModel.channelsDS = new kendo.data.DataSource({
            type: 'everlive',
            offlineStorage: "channels",
            transport: {
                typeName: 'channels',
                dataProvider: APP.everlive
            },
            schema: {
                model: { id:  Everlive.idField}
            },
            sort: {
                field: "lastAccess",
                dir: "desc"
            }
        });

        // Reflect any core channel changes to channelList
        channelModel.channelsDS.bind("change", function (e) {
            // Rebuild the channelView.channelListDS when the underlying list changes: add, delete, update...
           //channelView._channelListDS.data(channelModel.channelsDS.data());

            if (e.action !== undefined) {
                switch (e.action) {
                    case "itemchange" :
                        var field  =  e.field;
                        var channel = e.items[0], channelId = channel.channelId;
                        var channelList = channelsView.findChannelModel(channelId);
                        if (channelList !== undefined)
                            channelList.set(field, channel [field]);
                        break;

                    case "remove" :
                        var channel = e.items[0];
                        channelsView._channelListDS.remove(channel);
                        // delete from channel list
                        break;

                    case "add" :
                        var channel = e.items[0];
                        // add to contactlist and contacttags
                        var channelList = channelsView.findChannelModel(channel.channelId);
                        if (channelList !== undefined)
                            channelsView._channelListDS.add(channel);

                        break;
                }
            }


        });


        // Start the updateMessageCount async after 5 seconds...
     /*   setTimeout(function(){
           // channelModel.intervalTimer = setInterval(channelModel.updateChannelsMessageCount, channelModel._messageCountRefresh);
            channelModel.updateChannelsMessageCount();
        }, 5000);*/
    },

    updateActiveChannel : function (channelId) {
        channelModel.activeChannels[channelId] = 1;
    },


    fetch : function () {
        var Channel = Parse.Object.extend(channelModel._parseClass);
        var query = new Parse.Query(Channel);
        query.limit(1000);

        query.find({
            success: function(collection) {
                var models =[];
                for (var i = 0; i < collection.length; i++) {
                    var object = collection[i];
                    var dirty = false;

                    if (object.get('category') === undefined) {
                        if (object.get('isPrivate') === true) {
                            object.set('category', "Private");
                        } else {
                            object.set('category', "Group");
                        }

                        if (object.get('isPlace') === true) {
                            object.set('category', "Place");
                        }
                        if (object.get('isEvent') === true) {
                            object.set('category', "Event");
                        }
                        dirty = true;
                    }

                    if (object.get('isMuted') === undefined) {
                        object.set('isMuted', false);
                        dirty = true;
                    }

                    if (object.get('ggType') === undefined) {
                        object.set('ggType', channelModel._ggClass);
                        dirty = true;
                    }
                    
                    if (object.get('isDeleted') === undefined) {
                        object.set('isDeleted', false);
                        dirty = true;
                    }

                    if (object.get('isOwner')) {
                        if (object.get('ownerId') === undefined) {
                            object.set('ownerId', userModel.currentUser.userUUID);
                            dirty = true;
                        }

                        if (object.get('ownerName') === undefined) {
                            object.set('ownerName', userModel.currentUser.name);
                            dirty = true;
                        }
                    }

                    if (dirty) {
                        object.save();
                    }
                    var data = object.toJSON();
                    models.push(data);
                }

                everlive.getCount('channels', function(error, count){
                    if (error === null && count === 0) {
                        everlive.createAll('channels', models, function (error1, data) {
                            if (error1 !== null) {
                                mobileNotify("Everlive Channels error " + JSON.stringify(error1));
                            }
                            channelModel.channelsDS.sync();
                        });
                    } else {
                        if (error !== null)
                            mobileNotify("Everlive Channels error " + JSON.stringify(error));
                    }

                });
                channelModel.channelsDS.fetch();
                deviceModel.setAppState('hasChannels', true);
                deviceModel.isParseSyncComplete();

                notificationModel.processUnreadChannels();
            },
            error: function(error) {
                handleParseError(error);
            }
        });

        //Todo: load offline messages.
        deviceModel.setAppState('hasMessages', true);
        deviceModel.isParseSyncComplete();

        deviceModel.setAppState('hasPrivateChannels', true);
        deviceModel.isParseSyncComplete();


    },

    queryChannels : function (query) {
        if (query === undefined)
            return([]);
        var dataSource = channelModel.channelsDS;
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
        var dataSource = channelModel.recalledMessagesDS;
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
        var dataSource = channelModel.recalledMessagesDS;
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

    getRecalledMessages : function (channelId) {
        var messages = channelModel.queryRecalledMessages({ field: "channelId", operator: "eq", value: channelId });

        return(messages);
    },

    isMessageRecalled : function (msgID) {
        var message = channelModel.queryRecalledMessage({ field: "msgID", operator: "eq", value: msgID });

        if (message === undefined) {
            //msgID not found in recall list
            return(false);
        } else {
            //msgID exists in recall list
            return(true);
        }
    },

    addMessageRecall : function (channelId, msgId, ownerId, isPrivateChat) {
        var recallObj = {channelId : channelId, msgID: msgId, ownerId:  ownerId, isPrivateChat: isPrivateChat};

        var channel = channelModel.findChannelModel(channelId);

        if (channel === undefined) {
            return;
        }
        channelModel.recalledMessagesDS.add(recallObj);
        if (channelId === channelView._channelId) {
            // need to delete from channel view too
            var liveMessage = channelView.findMessageById(msgId);
            channelView.messagesDS.remove(liveMessage);
            channelView.messagesDS.sync();
        }

    },

    getUnreadChannels : function () {
        var channels = channelModel.queryChannels({ field: "unreadCount", operator: "gte", value: 0 });

        return(channels);
    },

    updateLastAccess : function (channelId, lastAccess) {
        var channel = channelModel.findChannelModel(channelId);
        if (channel === undefined) {
            mobileNotify('updateLastAccess: unknown channel ' + channelId);
        } else {
            if (lastAccess === undefined || lastAccess === null) {
                lastAccess = ggTime.currentTime();
            }
            channel.set('lastAccess', lastAccess);
            updateParseObject('channels', 'channelId', channelId, 'lastAccess', lastAccess);

        }
    },

    getLastAccess : function (channelId) {
        var channel = channelModel.findChannelModel(channelId);
        if (channel === undefined) {
            mobileNotify('updateLastAccess: unknown channel ' + channelId);
        } else {
            return(channel.get('lastAccess'));
        }
    },

    cacheGroupMessage : function (message) {
        channelModel.groupMessagesDS.add(message);
    },

    zeroUnreadCount: function (channelId) {
        var channel = channelModel.findChannelModel(channelId);
        if (channel === undefined) {
            mobileNotify('updateUnreadCount: unknown channel ' + channelId);
        } else {

            var lastAccess = ggTime.currentTime();
            channel.set('unreadCount',0);
            //notificationModel.updateUnreadNotification(channelId, channel.get('name'), count);
            updateParseObject('channels', 'channelId', channelId, 'unreadCount', 0);
            channelModel.updateLastAccess(channelId, lastAccess);

        }
    },

    updateUnreadCount: function (channelId, count) {

        var channel = channelModel.findChannelModel(channelId);
        if (channel === undefined) {
            mobileNotify('updateUnreadCount: unknown channel ' + channelId);
        } else {

            var lastAccess = ggTime.currentTime();
            channel.set('unreadCount',channel.get('unreadCount') + count);
            notificationModel.updateUnreadNotification(channelId, channel.get('name'), count);
            updateParseObject('channels', 'channelId', channelId, 'unreadCount', count);
            channelModel.updateLastAccess(channelId, lastAccess);

        }
    },

    updatePrivateUnreadCount: function (channelId, count) {
        if (lastAccess === undefined || lastAccess === null) {
            lastAccess = ggTime.currentTime();
        }

        var channel = channelModel.findChannelModel(channelId);
        if (channel === undefined) {
            channelModel.confirmPrivateChannel(channelId);
        } else {

            var lastAccess = ggTime.currentTime();

            notificationModel.updateUnreadNotification(channelId, channel.get('name'), count);
            channel.set('unreadCount',channel.get('unreadCount') + count);
            updateParseObject('channels', 'channelId', channelId, 'unreadCount', count);
            channelModel.updateLastAccess(channelId, lastAccess);

        }
    },

    incrementUnreadCount: function (channelId, count, lastAccess) {
        var channel = channelModel.findChannelModel(channelId);
        if (channel === undefined) {
            mobileNotify('incrementUnreadCount: unknown channel ' + channelId);
        } else {

            if (lastAccess === undefined || lastAccess === null) {
                lastAccess = ggTime.currentTime();
            }
            notificationModel.updateUnreadNotification(channelId, channel.get('name'), count);
            channel.set('unreadCount', channel.unreadCount + count);
            updateParseObject('channels', 'channelId', channelId, 'unreadCount', channel.unreadCount + count);
            channelModel.updateLastAccess(channelId, lastAccess);
        }

    },

    // confirm that there's a private channel for this sender - if not just silently create it
    confirmPrivateChannel: function (channelId) {
        var channel = channelModel.findChannelModel(channelId);
        if (channel === undefined) {
           var contact = contactModel.findContactByUUID(channelId);
            if (contact !== undefined && contact.contactUUID !== undefined) {
                channelModel.addPrivateChannel(contact.contactUUID, contact.publicKey, contact.name);
            }
        }
    },

   /* updateChannelsMessageCount : debounce(function () {
        var channelArray = channelModel.channelsDS.data();

        for (var i=0; i<channelArray.length; i++) {
            var channel = channelArray[i];

            // Only ping non-private (group)channels -- userDataChannels handles private channels
            if (channel.isPrivate === false) {

                APP.pubnub.history({
                    channel: channel.channelId,
                    end: ggTime.toPubNubTime(channel.lastAccess),

                    callback: function(messages) {
                        messages = messages[0];
                        messages = messages || [];
                        var len = messages.length;

                    }
                });
            }


        }
    }, this._messageCountRefresh, true ),*/

   /* // sync channel access/unread counts
    updateParseChannels : function () {
        var channels = channelModel.channelsDS.data();

        for (var i=0; i<channels.length; i++) {
            var channel = channels[i];
            updateParseObject('channels', 'channelId', channel.channelId, 'unreadCount', channel.unreadCount);
            updateParseObject('channels', 'channelId', channel.channelId, 'lastAccess', channel.lastAccess);
        }
    },*/

    syncParseChannels : function (callback) {
        // Only sync channels for users with atleast email or phone validated

       if (userModel.currentUser.phoneVerified || userModel.currentUser.emailValidated)  {
           var uuid = userModel.currentUser.userUUID;

           getUserChannels(uuid, function (result) {
               if (result.found) {
                   var channels = result.channels;

                   for (var i=0; i< channels.length; i++) {
                        var channel = channels[i].attributes;
                        // Need to ignore this users private channel in other users accounts
                        if (channel.channelId !== uuid) {
                            var channelObj = channelModel.findChannelModel(channel.channelId);
                            if ( channelObj=== undefined) {

                                if (channel.isPrivate) {
                                    channelModel.addPrivateChannel(channel.contactUUID, channel.contactKey, channel.name);
                                } else {

                                    channelModel.addChannel(channel.name, channel.description);
                                    channelModel.updateChannelMembers(channel.channelId, channel.members);
                                }
                            }

                        }

                   }
               }
               if (callback !== undefined) {
                   callback();
               }
           });
       }
    },

    updateChannel : function (channelId, channelName, channelDescription, channelMembers) {
        var channel = channelModel.findChannelModel(channelId);
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

            updateParseObject('channels', 'channelId', channelId, 'name', channelName );
            updateParseObject('channels', 'channelId', channelId, 'description', channelDescription );
            updateParseObject('channels', 'channelId', channelId, 'members', channelMembers );
        }

    },


    // Update members and other channel Member data for this channel
    syncChannel : function (channelId) {

        getChannelDetails(channelId,  function (result) {
            if (result.found) {
                var channel = channelModel.findChannelModel(channelId);
                if (channel === undefined) {
                    mobileNotify('channelModel.updateChannel - channel unknown" ' + channelId);
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
    updateChannelMembers : function (channelId, members) {
        var channel = channelModel.findChannelModel(channelId);

        if (channel !== null) {
            channel.set('members', members);
            channelModel.confirmChannelMembers(members);
            updateParseObject('channels', 'channelId', channelId, 'members', members );
        }

    },

    // confirm that all members of the channel are user contacts.
    confirmChannelMembers : function (members) {
        if (members === undefined || members.length === 0) {
            return;
        }

        var userId = userModel.currentUser.userUUID;
        for (var i=0; i<members.length; i++) {
            if (members[i] !== userId) {
                var contact = contactModel.findContact(members[i]);
                if (contact === undefined) {

                    contactModel.createChatContact(members[i]);

                }
            }
        }
    },



    findChannelModel: function (channelId) {

        return(channelModel.queryChannel({ field: "channelId", operator: "eq", value: channelId }));

        /*var dataSource =  channelModel.channelsDS;
        dataSource.filter( { field: "channelId", operator: "eq", value: channelId });
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

/*
    // update current private channels based on channelList passed
    updatePrivateChannels : function (channelKeys, channelList) {
        if (channelList === undefined || channelList.length === 0) {
            return;
        }
        var uuid = userModel.currentUser.userUUID;

        for (var i=0; i<channelKeys.length; i++) {
            var key = channelKeys[i];

            var channel = channelModel.findPrivateChannel(key),
                count = channelList[i];
            if (channel === undefined) {
                // private channel doesn't exist
                var contact = contactModel.findContactByUUID(key);
                if (contact !== undefined) {
                    channelModel.addPrivateChannel(contact.contactUUID, contact.publicKey, contact.name);
                }
            }

            if (count !== 0) {
                notificationModel.addUnreadNotification(channel.channelId, 'Private: ' + channel.name, channelList[i])
            }
        }

    },
*/


    // Add a new private channel that this user created -- create a channel object
    addPrivateChannel : function (contactUUID, contactPublicKey,  contactName) {
        var channel = channelModel.findChannelModel(contactUUID);
        if (channel !== undefined)  {
            // Channel already exists
            return;
        }

        var Channels = Parse.Object.extend(channelModel._parseClass);
        var channel = new Channels();
        var addTime = ggTime.currentTime();
        channel.set("version", channelModel._version);
        channel.set("name", contactName);
        channel.set("isOwner", true);
        channel.set('isPrivate', true);
        channel.set('isPlace', false);
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
        channel.set("description", "Private: " + contactName);
        channel.set("channelId", contactUUID);
        channel.set("contactUUID", contactUUID);
        channel.set('contactKey', contactPublicKey);
        channel.set("members", [userModel.currentUser.userUUID, contactUUID]);

        var channelObj = channel.toJSON();
        channelModel.channelsDS.add(channelObj);
        channelModel.channelsDS.sync();

        channel.setACL(userModel.parseACL);
        channel.save(null, {
            success: function(channel) {
                //ux.closeModalViewAddChannel();
                mobileNotify('New Private Chat : ' + channel.get('name'));
                notificationModel.addNewPrivateChatNotification(channel.get('channelId'), channel.get('name'));
            },
            error: function(channel, error) {
                // Execute any logic that should take place if the save fails.
                // error is a Parse.Error with an error code and message.
                mobileNotify('Error creating Chat: ' + error.message);
                handleParseError(error);
            }
        });

    },


    // Add group channel for members...
    // Get's the current owner details from parse and then creates a local channel for this user
    addMemberChannel : function (channelId, channelName, channelDescription, channelMembers, ownerId, ownerName, options, isDeleted) {

        var channel = channelModel.findChannelModel(channelId);
        if (channel !== undefined)  {
            // Channel already exists
            return;
        }
        var Channels = Parse.Object.extend(channelModel._parseClass);

        channel = new Channels();
        channel.set('isPlace', false);
        channel.set('placeUUID', null);
        channel.set('placeName', null);
        channel.set('isPrivatePlace', true);
        if (options !== undefined && options !== null) {
            if (options.chatType === 'Place') {
                channel.set('isPlace', true);
                channel.set('placeUUID', options.chatData.uuid);
                channel.set('placeName', options.chatData.name);
                placesModel.addSharedPlace(options.chatData, channelId);
            }
        }

         if (isDeleted === undefined) {
             isDeleted = false;
         }
        var addTime = ggTime.currentTime();
        channel.set("version", channelModel._version);
        channel.set("ggType", channelModel._ggClass);
        channel.set("channelId", channelId);
        channel.set("name", channelName);
        channel.set("description", channelDescription);
        channel.set("ownerId", ownerId);
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


        if (channelMembers === undefined || channelMembers === null) {
            channelMembers = [];
        }
        if (channelMembers.length === 0) {
            mobileNotify("addMemberChat: " + channelName + " has no members!");
            return;

        }
        channel.set("members", channelMembers);
        channel.set("invitedMembers", []);

        var channelObj = channel.toJSON();
        channelModel.channelsDS.add(channelObj);
        channelModel.channelsDS.sync();

        channel.setACL(userModel.parseACL);
        channel.save(null, {
            success: function(channel) {
                //ux.closeModalViewAddChannel();
                if (isDeleted === undefined)
                    mobileNotify('Added  Chat : ' + channel.get('name'));
                    notificationModel.addNewChatNotification(channel.get('channelId'), "Group Chat: " + channel.get('name'), channel.get('description'));
            },
            error: function(channel, error) {
                // Execute any logic that should take place if the save fails.
                // error is a Parse.Error with an error code and message.
                mobileNotify('Error creating Chat: ' + error.message);
                handleParseError(error);
            }
        });


       /* if (channelName !== undefined && channelName !== null) {
            mobileNotify("Getting details for channel :" + channelName);
        }

       getChannelDetails(channelId, function (result) {
            if (result.found) {
                var newChannel = result.channel;
                channelModel.addChannel(
                    newChannel.name,
                    newChannel.description,
                    false,
                    newChannel.durationDays,
                    newChannel.channelId,
                    newChannel.ownerId,
                    newChannel.ownerName,
                    newChannel.placeId,
                    newChannel.placeName,
                    newChannel.isPrivatePlace,
                    members
                );

            }
        });*/
    },


    addPlaceChannel : function (channelId, placeId, placeName, isPrivatePlace) {

        var channel = channelModel.findChannelModel(channelId);
        if (channel !== undefined)  {
            // Channel already exists
            return;
        }

        var Channels = Parse.Object.extend(channelModel._parseClass);
        var channel = new Channels();

        /* var ChannelMap = Parse.Object.extend('channelmap');
         var channelMap = new ChannelMap();*/

        var addTime = ggTime.currentTime();
        var name = placeName,
            description = "Place Chat: " + placeName;

        // If this is a member request, channelUUID will be passed in.
        // If user is creating new channel, they own it so create new uuid and update ownerUUID and ownerName


        var ownerUUID = userModel.currentUser.userUUID;
        var ownerName = userModel.currentUser.name;

        // Ensure we have a valid duration for this channel

        var durationDays = 30;

        channel.set('version', channelModel._version);
        channel.set('ggType', channelModel._ggClass);
        channel.set ('category', 'Place');
        channel.set('isMuted', false);
        channel.set('isDeleted', false);
        channel.set('isPrivate', false);

        if (isPrivatePlace === undefined)
            isPrivatePlace = true;

        channel.set('isPlace', true);
        channel.set('isPrivatePlace', isPrivatePlace);
        channel.set('placeUUID', placeId);
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
        channel.set("channelId", channelId);

        channel.set("ownerId", ownerUUID);

        channel.set("ownerName", ownerName);
        // Channel owner can access and edit members...

        channel.set("isOwner", true);
        channel.set("members", [ownerUUID]);
        channel.set("invitedMembers", []);

        var channelObj = channel.toJSON();
        channelModel.channelsDS.add(channelObj);
        channelModel.channelsDS.sync();
        //currentChannelModel.currentChannel = channelModel.findChannelModel(channelId);

        channel.setACL(userModel.parseACL);
        channel.save(null, {
            success: function(channel) {
                // Execute any logic that should take place after the object is saved.
                mobileNotify('Added Place Chat : ' + channel.get('name'));
                notificationModel.addNewChatNotification(channel.get('channelId'), "Place Chat: " + channel.get('name'), channel.get('description'));

                APP.kendo.navigate('#editChannel?channel=' + channelId);

            },
            error: function(channel, error) {
                // Execute any logic that should take place if the save fails.
                // error is a Parse.Error with an error code and message.
                mobileNotify('Error creating Place Chat: ' + error.message);
                handleParseError(error);
            }
        });
    },

    // Add group channel for owner...
    addChannel : function (channelName, channelDescription) {
        var Channels = Parse.Object.extend(channelModel._parseClass);
        var channel = new Channels();

       /* var ChannelMap = Parse.Object.extend('channelmap');
        var channelMap = new ChannelMap();*/

        var addTime = ggTime.currentTime();
        var name = channelName,
            description = channelDescription;


        // If this is a member request, channelUUID will be passed in.
        // If user is creating new channel, they own it so create new uuid and update ownerUUID and ownerName

        var channelId = uuid.v4();
        var ownerUUID = userModel.currentUser.userUUID;
        var ownerName = userModel.currentUser.name;


        // Ensure we have a valid duration for this channel

        var durationDays = 30;

        channel.set('version', channelModel._version);
        channel.set('ggType', channelModel._ggClass);
        channel.set('isPlace', false);
        channel.set ('category', 'Group');
        channel.set('isPrivate', false);
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
        channel.set("channelId", channelId);

        channel.set("ownerId", ownerUUID);

        channel.set("ownerName", ownerName);
        // Channel owner can access and edit members...

        channel.set("isOwner", true);
        channel.set("members", [ownerUUID]);
        channel.set("invitedMembers", []);

        var channelObj = channel.toJSON();
        channelModel.channelsDS.add(channelObj);
        channelModel.channelsDS.sync();
        //currentChannelModel.currentChannel = channelModel.findChannelModel(channelId);

        channel.setACL(userModel.parseACL);
        channel.save(null, {
            success: function(channel) {
                // Execute any logic that should take place after the object is saved.
                mobileNotify('Added Chat : ' + channel.get('name'));
                APP.kendo.navigate('#editChannel?channel=' + channelId);

            },
            error: function(channel, error) {
                // Execute any logic that should take place if the save fails.
                // error is a Parse.Error with an error code and message.
                mobileNotify('Error creating Chat: ' + error.message);
                handleParseError(error);
            }
        });
    },

    deletePrivateChannel : function (channelId) {
        var channel = channelModel.findPrivateChannel(channelId);

        if (channel !== undefined) {
            deleteParseObject('channels', 'channelId', channelId);
            channelModel.channelsDS.remove(channel);
        }
    },

    deleteChannel : function (channelId, silent) {
        var dataSource = channelModel.channelsDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = [];
        }
        dataSource.filter( { field: "channelId", operator: "eq", value: channelId });
        var view = dataSource.view();
        var channel = view[0];
        dataSource.filter(cacheFilter);

        if (channel !== undefined) {
            if (channel.isOwner) {
                // If this user is the owner -- delete the channel map
                // deleteParseObject("channelmap", 'channelId', channelId)
                if (silent === undefined || silent === false) {
                    if (channel.isPrivate === false) {
                        // Send delete channel messages to all members
                        var members = channel.members;
                        // Skip the first member as it's the owner
                        for (var i = 1; i < channel.members.length; i++) {
                            appDataChannel.groupChannelDelete(members[i], channelId, channel.name, 'Chat "' + channel.name + 'has been deleted');
                        }
                    }
                }

                if (channel.isPlace) {
                    var placeId = channel.placeUUID;
                    if (placeId !== undefined && placeId !== null) {
                        var place = placesModel.getPlaceModel(placeId);
                        if (place !== undefined) {
                            place.set('hasPlaceChat', false);
                            place.set('placeChatId', null);
                            updateParseObject("places", 'uuid', placeId, 'hasPlaceChat', false);
                            updateParseObject("places", 'uuid', placeId, 'placeChatId', null);
                        }
                    }
                }

                if (window.navigator.simulator === undefined)
                    serverPush.unprovisionGroupChannel(channelId);
                dataSource.remove(channel);
                deleteParseObject("channels", 'channelId', channelId);
                //mobileNotify("Removed channel : " + channel.get('name'));
            } else {

                if (window.navigator.simulator === undefined)
                    serverPush.unprovisionGroupChannel(channelId);
                updateParseObject("channels", 'channelId', channelId, 'isDeleted', true);
                channel.set('isDeleted', true);
            }
        }
    },

    // For members only -- undelete a previous deleted channel
    unDeleteChannel : function (channelId) {
        var dataSource = channelModel.channelsDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = [];
        }
        dataSource.filter( { field: "channelId", operator: "eq", value: channelId });
        var view = dataSource.view();
        var channel = view[0];
        dataSource.filter(cacheFilter);

        if (channel !== undefined) {
            updateParseObject("channels", 'channelId', channelId, 'isDeleted', false);
            channel.set('isDeleted', false);
            serverPush.provisionGroupChannel(channelId);
        }

    },

    muteChannel : function (channelId, isMuted) {
        var dataSource = channelModel.channelsDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = [];
        }
        dataSource.filter( { field: "channelId", operator: "eq", value: channelId });
        var view = dataSource.view();
        var channel = view[0];
        dataSource.filter(cacheFilter);

        if (channel !== undefined) {

            updateParseObject("channels", 'channelId', channelId, 'isMuted', isMuted);
            channel.set('isMuted', isMuted);
            if (isMuted) {
                serverPush.unprovisionGroupChannel(channelId);
            } else {
                serverPush.provisionGroupChannel(channelId);
            }

        }
    },

    deleteAllChannels : function () {
        var channelArray = channelModel.channelsDS.data();

        for (var i=0; i<channelArray.length; i++) {
            channelModel.deleteChannel(channelArray.channelId);
        }
    }

};
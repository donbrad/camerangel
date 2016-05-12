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
    currentChannel: new kendo.data.ObservableObject(),
    intervalTimer : undefined,
    _sentMessages : "sentMessages",
    activeChannels: [],
    _syncingChannels : false,

    _messageCountRefresh : 300000,   // Delta between message count  calls (in milliseconds)

    channelsDS: null,
    
    photosDS: null,

    // List of all active private channels (those with messages)
    privateChannelsDS: null, 

    recalledMessagesDS : null,

    recalledPhotosDS : null,

    groupMessagesDS : null,

    init :  function () {

        channelModel.activeChannels = [];

        channelModel.channelsDS = new kendo.data.DataSource({
            type: 'everlive',
            transport: {
                typeName: 'channels'
                //dataProvider: APP.everlive
            },
            schema: {
                model: { Id:  Everlive.idField}
            },
            sort: {
                field: "lastAccess",
                dir: "desc"
            },
            autoSync: true
        });
        
        channelModel.privateChannelsDS = new kendo.data.DataSource({
            type: 'everlive',
            transport: {
                typeName: 'privatechannels'
                //dataProvider: APP.everlive
            },
            schema: {
                model: { Id:  Everlive.idField}
            },
            autoSync: true
        });

        channelModel.recalledMessagesDS = new kendo.data.DataSource({
            type: 'everlive',
          
            transport: {
                typeName: 'recalledMessages',
                dataProvider: APP.everlive
            },
            schema: {
                model: { Id:  Everlive.idField}
            },
            autoSync : true
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
            autoSync : true
        });

        channelModel.photosDS = new kendo.data.DataSource({
            type: 'everlive',

            transport: {
                typeName: 'channelPhotos',
                dataProvider: APP.everlive
            },
            schema: {
                model: { Id:  Everlive.idField}
            },
            autoSync : true
        });

        channelModel.groupMessagesDS = new kendo.data.DataSource({
            type: 'everlive',
            transport: {
                typeName: 'groupmessages',
                dataProvider: APP.everlive
            },
            schema: {
                model: { Id:  Everlive.idField}
            },
            autoSync: true
        });

        // Reflect any core channel changes to channelList
        channelModel.channelsDS.bind("change", function (e) {
            // Rebuild the channelView.channelListDS when the underlying list changes: add, delete, update...
           //channelView._channelListDS.data(channelModel.channelsDS.data());

            if (e.action !== undefined) {
                switch (e.action) {
                    case "itemchange" :
                        var field  =  e.field;
                        var channel = e.items[0], channelUUID = channel.channelUUID;
                        var channelList = channelsView.findChannelModel(channelUUID);
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
                        var channelList = channelsView.findChannelModel(channel.channelUUID);
                        if (channelList !== undefined)
                            channelsView._channelListDS.add(channel);

                        break;
                }
            }


        });


        channelModel.channelsDS.fetch();
        deviceModel.setAppState('hasChannels', true);
       /* deviceModel.isParseSyncComplete();*/

        // Start the updateMessageCount async after 5 seconds...
     /*   setTimeout(function(){
           // channelModel.intervalTimer = setInterval(channelModel.updateChannelsMessageCount, channelModel._messageCountRefresh);
            channelModel.updateChannelsMessageCount();
        }, 5000);*/
    },

    updateActiveChannel : function (channelUUID) {
        channelModel.activeChannels[channelUUID] = 1;
    },


/*    fetch : function () {
        var Channel = Parse.Object.extend(channelModel._cloudClass);
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
                            object.set('ownerId', userModel._user.userUUID);
                            dirty = true;
                        }

                        if (object.get('ownerName') === undefined) {
                            object.set('ownerName', userModel._user.name);
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
                            //channelModel.channelsDS.fetch();
                            deviceModel.setAppState('hasChannels', true);
                            deviceModel.isParseSyncComplete();

                            notificationModel.processUnreadChannels();
                        });
                    } else {
                        if (error !== null)
                            mobileNotify("Everlive Channels error " + JSON.stringify(error));

                        channelModel.channelsDS.fetch();
                        deviceModel.setAppState('hasChannels', true);
                        deviceModel.isParseSyncComplete();

                        notificationModel.processUnreadChannels();
                    }

                });

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


    },*/

    queryChannels : function (query) {
        if (query === undefined)
            return([]);
        var dataSource = channelModel.channelsDS;
        if (dataSource === null) {
            console.log("Channels not initialized!");
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

    getRecalledMessages : function (channelUUID) {
        var messages = channelModel.queryRecalledMessages({ field: "channelUUID", operator: "eq", value: channelUUID });

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

    addMessageRecall : function (channelUUID, msgId, ownerId, isPrivateChat) {
        var recallObj = {channelUUID : channelUUID, msgID: msgId, ownerId:  ownerId, isPrivateChat: isPrivateChat};

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

    },

    queryRecalledPhoto : function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = channelModel.recalledPhotosDS;
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

    isPhotoRecalled : function (photoId) {
        var message = channelModel.queryRecalledPhoto({ field: "photoId", operator: "eq", value: photoId });

        if (message === undefined) {
            //msgID not found in recall list
            return(false);
        } else {
            //msgID exists in recall list
            return(true);
        }
    },

    addPhotoRecall : function (channelUUID, photoId, ownerId, isPrivateChat) {
        var recallObj = {channelUUID : channelUUID, photoId: photoId, ownerId:  ownerId,  isPrivateChat: isPrivateChat};

        var channel = channelModel.findChannelModel(channelUUID);

        if (channel === undefined) {
            return;
        }
        channelModel.recalledPhotosDS.add(recallObj);
        channelModel.recalledPhotosDS.sync();
        if (channelUUID === channelView._channelUUID) {
           // Todo -- need to decide how to handle recall in active channel, could force refresh
        }

    },


    addPhoto : function (channelUUID, photoId, photoUrl,  ownerId, ownerName, isPrivateChat) {
        var photoObj = {channelUUID : channelUUID, photoId: photoId, photoUrl: photoUrl,  ownerId:  ownerId,  ownerName: ownerName,  isPrivateChat: isPrivateChat, timestamp: ggTime.currentTime()};

        var channel = channelModel.findChannelModel(channelUUID);

        if (channel === undefined) {
            return;
        }
        
        channelModel.photosDS.add(photoObj);
        channelModel.photosDS.sync();

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
            mobileNotify('updateLastAccess: unknown channel ' + channelUUID);
        } else {
            return(channel.get('lastAccess'));
        }
    },

    cacheGroupMessage : function (message) {


        channelModel.groupMessagesDS.add(message);
    },

    zeroUnreadCount: function (channelUUID) {
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

        var channel = channelModel.findChannelModel(channelUUID);
        if (channel === undefined) {
            mobileNotify('updateUnreadCount: unknown channel ' + channelUUID);
        } else {

            var lastAccess = ggTime.currentTime();
            channel.set('unreadCount',channel.get('unreadCount') + count);
            notificationModel.updateUnreadNotification(channelUUID, channel.get('name'), count);
            //updateParseObject('channels', 'channelUUID', channelUUID, 'unreadCount', count);
            channelModel.updateLastAccess(channelUUID, lastAccess);

        }
    },

    updatePrivateUnreadCount: function (channelUUID, count) {
        if (lastAccess === undefined || lastAccess === null) {
            lastAccess = ggTime.currentTime();
        }

        var channel = channelModel.findChannelModel(channelUUID);
        if (channel === undefined) {
            channelModel.confirmPrivateChannel(channelUUID);
        } else {

            var lastAccess = ggTime.currentTime();

            notificationModel.updateUnreadNotification(channelUUID, channel.get('name'), count);
            channel.set('unreadCount',channel.get('unreadCount') + count);
            //updateParseObject('channels', 'channelUUID', channelUUID, 'unreadCount', count);
            channelModel.updateLastAccess(channelUUID, lastAccess);

        }
    },

    incrementUnreadCount: function (channelUUID, count, lastAccess) {
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
            //updateParseObject('channels', 'channelUUID', channelUUID, 'unreadCount', channel.unreadCount + count);
            channelModel.updateLastAccess(channelUUID, lastAccess);
        }

    },

    // confirm that there's a private channel for this sender - if not just silently create it
    confirmPrivateChannel: function (channelUUID) {
        var channel = channelModel.findChannelModel(channelUUID);
        if (channel === undefined) {
           var contact = contactModel.findContactByUUID(channelUUID);
            if (contact !== undefined && contact.contactUUID !== undefined) {
                channelModel.addPrivateChannel(contact.contactUUID, contact.publicKey, contact.name);
            } else {
                // No contact for this user yet.
                mobileNotify("Finding member for new private chat...");
                var contactUUID = uuid.v4();
                contactModel.createChatContact(channelUUID, contactUUID, function (result) {
                    if (result !== null) {
                        mobileNotify("Adding private chat for " + result.name);
                        channelModel.addPrivateChannel(result.contactUUID, result.publicKey, result.name);
                    }
                });
            }
        }
    },

/*    syncParseChannels : function (callback) {
        // Only sync channels for users with atleast email or phone validated

       if (userModel._user.phoneValidated || userModel._user.emailValidated)  {
           var uuid = userModel._user.userUUID;

           getUserChannels(uuid, function (result) {
               if (result.found) {
                   var channels = result.channels;

                   for (var i=0; i< channels.length; i++) {
                        var channel = channels[i].attributes;
                        // Need to ignore this users private channel in other users accounts
                        if (channel.channelUUID !== uuid) {
                            var channelObj = channelModel.findChannelModel(channel.channelUUID);
                            if ( channelObj=== undefined) {

                                if (channel.isPrivate) {
                                    channelModel.addPrivateChannel(channel.contactUUID, channel.contactKey, channel.name);
                                } else {

                                    channelModel.addChannel(channel.name, channel.description);
                                    channelModel.updateChannelMembers(channel.channelUUID, channel.members);
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
    },*/

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

            //updateParseObject('channels', 'channelUUID', channelUUID, 'name', channelName );
            //updateParseObject('channels', 'channelUUID', channelUUID, 'description', channelDescription );
            //updateParseObject('channels', 'channelUUID', channelUUID, 'members', channelMembers );
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

                    var contactId = uuid.v4();
                    contactModel.createChatContact(members[i], contactId, function (result){});


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
        var channelCheck = channelModel.findChannelModel(contactUUID);
        if (channelCheck !== undefined)  {
            // Channel already exists
            if (callback !== undefined) {
                callback(null, channelCheck);
            }
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
        channel.set('isPrivate', true);
        channel.set('isPlace', false);
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
        channel.set("description", "Private: " + contactName);
        channel.set("channelUUID", contactUUID);
        channel.set("contactUUID", contactUUID);
        channel.set('contactKey', contactPublicKey);
        channel.set("members", [userModel._user.userUUID, contactUUID]);

        channelModel.channelsDS.add(channel);
        channelModel.channelsDS.sync();
        if (callback !== undefined) {
            callback(null, channel);
        }

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


        notificationModel.addNewPrivateChatNotification(channel.get('channelUUID'), channel.get('name'));


    },

    syncChatContacts : function (memberList) {
        if (memberList === undefined || memberList.length === 0) {
            return;
        }

        for (var i=0; i<memberList.length; i++ ) {
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


    },

    // Add group channel for members...
    // Get's the current owner details from parse and then creates a local channel for this user
    addMemberChannel : function (channelUUID, channelName, channelDescription, channelMembers, ownerUUID, ownerName, options, isDeleted) {

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
        if (options !== undefined && options !== null) {
            if (options.chatType === 'Place') {
                channel.set('isPlace', true);
                channel.set('placeUUID', options.chatData.uuid);
                channel.set('placeName', options.chatData.name);
                placesModel.addSharedPlace(options.chatData, channelUUID);
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
        channel.set("channelUUID", channelUUID);

        channel.set("ownerUUID", ownerUUID);

        channel.set("ownerName", ownerName);
        // Channel owner can access and edit members...

        channel.set("isOwner", true);
        channel.set("members", [ownerUUID]);
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
        channel.set("channelUUID", channelUUID);
        channel.set("Id", channelUUID);

        channel.set("ownerUUID", ownerUUID);

        channel.set("ownerName", ownerName);
        // Channel owner can access and edit members...

        channel.set("isOwner", true);
        channel.set("members", [ownerUUID]);
        channel.set("invitedMembers", []);


        channelModel.createChannelMap(channel);
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
            if (channel.isOwner) {
                // If this user is the owner -- delete the channel map
                // deleteParseObject("channelmap", 'channelUUID', channelUUID)
                if (silent === undefined || silent === false) {
                    if (channel.isPrivate === false) {
                        // Send delete channel messages to all members
                        var members = channel.members;
                        // Skip the first member as it's the owner
                        for (var i = 1; i < channel.members.length; i++) {
                            appDataChannel.groupChannelDelete(members[i], channelUUID, channel.name, 'Chat "' + channel.name + 'has been deleted');
                        }
                    }
                }

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

                if (window.navigator.simulator === undefined)
                    serverPush.unprovisionGroupChannel(channelUUID);

                var Id = channel.Id;

                if (Id !== undefined){
                    everlive.deleteOne(channelModel._cloudClass, Id, function (error, data) {
                        dataSource.remove(channel);
                    });
                }
                dataSource.remove(channel);
                //deleteParseObject("channels", 'channelUUID', channelUUID);
                //mobileNotify("Removed channel : " + channel.get('name'));
            } else {

                if (window.navigator.simulator === undefined)
                    serverPush.unprovisionGroupChannel(channelUUID);
                //updateParseObject("channels", 'channelUUID', channelUUID, 'isDeleted', true);
                channel.set('isDeleted', true);
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
    },

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
                    mapObj.invitedMembers = channel.invitedMembers;

                    everlive.updateOne('channelmap', mapObj, function (error, data) {
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



};
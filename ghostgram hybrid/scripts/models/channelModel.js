/**
 * Created by donbrad on 8/11/15.
 * channelModel.js -- handles all channel model interactions with parse and kendoDS
 */
'use strict';

var channelModel = {

    _version: 1,
    _channelName : "channels",
    _channelMemberName : "channelMember",
    currentChannel: new kendo.data.ObservableObject(),
    intervalTimer : undefined,
    _sentMessages : "sentMessages",
    _messageCountRefresh : 300000,   // Delta between message count  calls (in milliseconds)

    channelsDS: new kendo.data.DataSource({
        offlineStorage: "channels",
        sort: {
            field: "name",
            dir: "asc"
        }
    }),

    // List of all active private channels (those with messages)
    privateChannelsDS: new kendo.data.DataSource({
        offlineStorage: "privatechannels-offline"
    }),

    // All active private messages (including archived messages)
    privateMessagesDS: new kendo.data.DataSource({
        offlineStorage: "privatemessages-offline"
    }),
    


    init :  function () {
        // Start the updateMessageCount async after 5 seconds...
        setTimeout(function(){
           // channelModel.intervalTimer = setInterval(channelModel.updateChannelsMessageCount, channelModel._messageCountRefresh);
            channelModel.updateChannelsMessageCount();
        }, 5000);
    },



    fetch : function () {
        var Channel = Parse.Object.extend("channels");
        var query = new Parse.Query(Channel);

        query.find({
            success: function(collection) {
                var models = new Array();
                for (var i = 0; i < collection.length; i++) {
                    var object = collection[i];
                    var data = object.attributes;
                    // Todo: check status of members
                    if (data.isOwner) {
                        if (data.ownerId === undefined) {
                            object.set('ownerId', userModel.currentUser.userUUID);
                            object.save();
                        }
                    }

                    models.push(object.attributes);
                }
                channelModel.channelsDS.data(models);
                deviceModel.setAppState('hasChannels', true);
                deviceModel.isParseSyncComplete();
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

    updateUnreadCount: function (channelId, count) {
        var channel = channelModel.findChannelModel(channelId);
        if (channel === undefined) {
            mobileNotify('incrementUnreadCount: unknown channel ' + channelId);
        } else {
            channel.unreadCount = count;
            updateParseObject('channels', 'channelId', channelId, 'unreadCount', count);
            if (count > 0)
            notificationModel.addUnreadNotification(channelId, channel.name, count);
        }
    },

    incrementUnreadCount: function (channelId, count) {
        var channel = channelModel.findChannelModel(channelId);
        if (channel === undefined) {
            mobileNotify('incrementUnreadCount: unknown channel ' + channelId);
        } else {
            channel.unreadCount = channel.unreadCount + count;
            updateParseObject('channels', 'channelId', channelId, 'unreadCount', count);
        }

    },

    // If the channel exists, increment the message count, if not create the channel and then increment
    incrementPrivateMessageCount: function (channelId, count) {
        var channel = channelModel.findChannelModel(channelId);
        if (channel === undefined) {
           var contact = contactModel.findContactByUUID(channelId);
            if (contact !== undefined && contact.contactUUID !== undefined) {
                channelModel.addPrivateChannel(contact.contactUUID, contact.publicKey, contact.name);
            } else {
                mobileNotify("incrementPrivateMessageCount : unknown contact " + channelId);
            }
        } else {
            channel.unreadCount = channel.unreadCount + count;
            updateParseObject('channels', 'channelId', channelId, 'unreadCount', count);
        }
    },

    updateChannelsMessageCount : debounce(function () {
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
    }, this._messageCountRefresh, true ),


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
                                    channelModel.addPrivateChannel(channel.channelId, channel.contactKey, channel.name);
                                } else {

                                    channelModel.addChannel(channel.name, channel.description, false, channel.durationDays,
                                        channel.channelId, channel.ownerUUID, null, null,false);
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

    // Update members and other channel Member data for this channel
    updateChannel : function (channelId) {

        getChannelMembers(channelId,  function (result) {
            if (result.found) {
                var channel = channelModel.findChannelModel(channelId);
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

    // confirm that all members of the channel are in contact list.
    confirmChannelMembers : function (members) {
        if (members === undefined || members.length === 0) {
            return;
        }

        var userId = userModel.currentUser.userUUID;
        for (var i=0; i<members.length; i++) {
            if (members[i] !== userId) {
                var contact = contactModel.inContactList(members[i]);
                if (contact === undefined) {

                    currentChannelModel.createChatContact(members[i]);

                }
            }
        }
    },



    findChannelModel: function (channelId) {
        var dataSource =  channelModel.channelsDS;
        dataSource.filter( { field: "channelId", operator: "eq", value: channelId });
        var view = dataSource.view();
        var channel = view[0];
        dataSource.filter([]);

        return(channel);
    },

    findChannelByName: function (channelName) {
        var dataSource =  channelModel.channelsDS;
        dataSource.filter( { field: "name", operator: "eq", value: channelName });
        var view = dataSource.view();
        var channel = view[0];
        dataSource.filter([]);

        return(channel);
    },


    findPrivateChannel : function (contactUUID) {
        var dataSource =  channelModel.channelsDS;
        dataSource.filter({ field: "isPrivate", operator: "eq", value: true });
        var view = dataSource.view();
        var channel = undefined;
        for (var i=0; i< view.length; i++) {
            var chan = view[i];

            if (chan.contactUUID === contactUUID) {
                dataSource.filter([]);
                channel = chan;
                return(channel);
            }
        }


        dataSource.filter([]);
        return(channel);
    },

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


    // Add a new private channel that this user created -- create a channel object
    addPrivateChannel : function (contactUUID, contactPublicKey,  contactName) {

        var Channels = Parse.Object.extend(channelModel._channelName);
        var channel = new Channels();
        var addTime = ggTime.currentTime();
        channel.set("version", channelModel._version);
        channel.set("name", contactName);
        channel.set("isOwner", true);
        channel.set('isPrivate', true);
        channel.set('isPlace', false);
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
        channelModel.channelsDS.add(channel.attributes);
        channelModel.channelsDS.sync();

        channel.setACL(userModel.parseACL);
        channel.save(null, {
            success: function(channel) {
                //ux.closeModalViewAddChannel();
                mobileNotify('Added private channel : ' + channel.get('name'));
            },
            error: function(channel, error) {
                // Execute any logic that should take place if the save fails.
                // error is a Parse.Error with an error code and message.
                mobileNotify('Error creating channel: ' + error.message);
                handleParseError(error);
            }
        });

    },

    // Generic add group channel...
    addChannel : function (channelName, channelDescription, isOwner, durationDays, channelUUID, ownerUUID, ownerName, placeId, placeName, isPrivatePlace) {
        var Channels = Parse.Object.extend("channels");
        var channel = new Channels();

       /* var ChannelMap = Parse.Object.extend('channelmap');
        var channelMap = new ChannelMap();*/

        var addTime = ggTime.currentTime();
        var name = channelName,
            description = channelDescription,
            channelId = channelUUID;

        // If this is a member request, channelUUID will be passed in.
        // If user is creating new channel, they own it so create new uuid
        if (isOwner) {
            channelId = uuid.v4();
        }


        // Ensure we have a valid duration for this channel
        if (durationDays === undefined) {
            durationDays = 30;
        } else {
            durationDays = parseInt(durationDays);
        }

        if (durationDays < 1 || durationDays > 30) {
            durationDays = 30;
        }

        if (isPrivatePlace === undefined)
            isPrivatePlace = true;

        channel.set('version', channelModel._version);
        channel.set('isPlace', false);
        channel.set('isPrivate', false);


        // If there's a placeId passed in, need to create a place channel / chat
        if (placeId !== undefined && placeId !== null) {
            channel.set('isPlace', true);
            channel.set('isPrivatePlace', isPrivatePlace);
            channel.set('placeUUID', placeId);
            channel.set('placeName', placeName);
            if (name === '') {
                name =  placeName;
            }
            if (description === '') {
                description = "Place : " + placeName;
            }
        }

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
        if (ownerName === undefined || ownerName === null) {
            if (ownerUUID === userModel.currentUser.userUUID) {
                ownerName = userModel.currentUser.name;
            } else {
                var contact = contactModel.findContactModel(ownerUUID);
                if (contact !== undefined) {
                    ownerName = contact.name;
                }
            }

        }
        channel.set("ownerName", ownerName);
        // Channel owner can access and edit members...
        if (isOwner) {
            channel.set("isOwner", true);
            channel.set("members", [ownerUUID]);
            channel.set("invitedMembers", []);
        } else {
            // Channel members have no access to members...
            channel.set("isOwner", false);
            channel.set("members", [ownerUUID]);

        }

        channelModel.channelsDS.add(channel.attributes);
        channelModel.channelsDS.sync();
        currentChannelModel.currentChannel = channelModel.findChannelModel(channelId);

        channel.setACL(userModel.parseACL);
        channel.save(null, {
            success: function(channel) {
                // Execute any logic that should take place after the object is saved.
                mobileNotify('Added channel : ' + channel.get('name'));
                APP.kendo.navigate('#editChannel');


            },
            error: function(channel, error) {
                // Execute any logic that should take place if the save fails.
                // error is a Parse.Error with an error code and message.
                mobileNotify('Error creating channel: ' + error.message);
                handleParseError(error);
            }
        });
    },

    deleteChannel : function (channelId, silent) {
        var dataSource = channelModel.channelsDS;
        dataSource.filter( { field: "channelId", operator: "eq", value: channelId });
        var view = dataSource.view();
        var channel = view[0];
        dataSource.filter([]);

        if (channel !== undefined) {
            dataSource.filter([]);
            if (channel.isOwner) {
                // If this user is the owner -- delete the channel map
               // deleteParseObject("channelmap", 'channelId', channelId)
                if (silent === undefined || silent === false) {
                    if (channel.isPrivate  === false) {
                        // Send delete channel messages to all members
                        var members = channel.members;
                        // Skip the first member as it's the owner
                        for (var i = 1; i < channel.members.length; i++) {
                            appDataChannel.groupChannelDelete(members[i],channelId, 'Chat "' + channel.name + 'has been deleted' );
                        }
                    }
                }

            }
            dataSource.remove(channel);
            deleteParseObject("channels", 'channelId', channelId);
            //mobileNotify("Removed channel : " + channel.get('name'));
        }
    },

    deleteAllChannels : function () {
        var channelArray = channelModel.channelsDS.data();

        for (var i=0; i<channelArray.length; i++) {
            channelModel.deleteChannel(channelArray.channelId);
        }
    }

};
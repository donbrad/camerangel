/**
 * Created by donbrad on 8/11/15.
 * channelModel.js -- handles all channel model interactions with parse and kendoDS
 */
'use strict';

var channelModel = {

    _channelName : "channels",
    _channelMemberName : "channelMember",
    currentChannel: new kendo.data.ObservableObject(),
    intervalTimer : undefined,
    _messageCountRefresh : 3000000,   // Delta between message refresh calls (in milliseconds)
    channelsDS: new kendo.data.DataSource({
        offlineStorage: "channels-offline",
        sort: {
            field: "name",
            dir: "asc"
        }
    }),

    messagesDS: new kendo.data.DataSource({
        offlineStorage: "messages-offline",
        sort: {
            field: "timeStamp",
            dir: "desc"
        }
    }),

    privateChannelsDS: new kendo.data.DataSource({
        offlineStorage: "privatechannels-offline"
    }),

    channelMapDS: new kendo.data.DataSource({
        offlineStorage: "channelmap-offline"
    }),


    init :  function () {
        channelModel.intervalTimer = setInterval(channelModel.updateChannelsMessageCount, channelModel._messageCountRefresh);
    },

    // Get messages archive for current channel (past 24 hours)
    // This is only called by secure channel as sender messages are encrypted with recipients public key
    getChannelArchive : function (channel) {
        var dataSource =  channelModel.messagesDS;
        var timeStamp = ggTime.currentTime() - 86000;
        dataSource.filter(
            [
                {"logic":"and",
                    "filters":[
                        {
                            "field":"channelId",
                            "operator":"eq",
                            "value":channel},
                        {
                            "field":"time",
                            "operator":"gt",
                            "value":timeStamp}
                    ]}
            ]);
        var view = dataSource.view();
        dataSource.filter([]);
        return(view);
    },


    fetch : function () {
        var Channel = Parse.Object.extend("channels");
        var ChannelCollection = Parse.Collection.extend({
            model: Channel
        });

        var channels = new ChannelCollection();

        channels.fetch({
            success: function(collection) {
                var models = new Array();
                for (var i = 0; i < collection.models.length; i++) {
                    // Todo: check status of members
                    models.push(collection.models[i].attributes);
                }
                channelModel.channelsDS.data(models);
                deviceModel.setAppState('hasChannels', true);
                deviceModel.isParseSyncComplete();
            },
            error: function(collection, error) {
                handleParseError(error);
            }
        });

        var Message = Parse.Object.extend("messages");
        var MessageCollection = Parse.Collection.extend({
            model: Message
        });

        var messages = new MessageCollection();

        messages.fetch({
            success: function(message) {
                var models = new Array();
                for (var i = 0; i < collection.models.length; i++) {

                    var model = collection.models[i], ts = model.get('timeStamp');
                    var deleteTime = ggTime.currentTime() - 86000;
                    if (ts <= deleteTime) {
                            model.destroy();
                    } else {
                        models.push(userModel.decryptBlob(model.get('messageBlob')));
                    }


                }
                channelModel.messagesDS.data(models);
                deviceModel.setAppState('hasMessages', true);
                deviceModel.isParseSyncComplete();
            },
            error: function(collection, error) {
                handleParseError(error);
            }
        });

        getUserPrivateChannels(userModel.currentUser.get('uuid'), function (result) {
            if (result.found) {
                channelModel.privateChannelsDS.data(result.channels);
            }
            deviceModel.setAppState('hasPrivateChannels', true);
            deviceModel.isParseSyncComplete();
        });

    },

    updateChannelsMessageCount : debounce(function () {
        var channelArray = channelModel.channelsDS.data();
        for (var i=0; i<channelArray.length; i++) {
            var channel = channelArray[i];

            APP.pubnub.history({
                channel: channel.channelId,
                start: channel.lastAccess,

                callback: function(messages) {
                    messages = messages[0];
                    messages = messages || [];
                    var len = messages.length;

                }
            });

        }
    }, this._messageCountRefresh, true ),

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

            if (chan.members[0] === contactUUID || chan.members[1] === contactUUID) {
                dataSource.filter([]);
                channel = chan;
                return(channel);
            }
        }


        dataSource.filter([]);
        return(channel);
    },

    // Add a new private channel that this user created -- create a channel object
    addPrivateChannel : function (contactUUID, contactPublicKey,  contactAlias, channelUUID) {

        var Channels = Parse.Object.extend(this._channelName);
        var channel = new Channels();
        var addTime = ggTime.currentTime();
        channel.set("name", contactAlias);
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
        channel.set("description", "Private: " + contactAlias);
        channel.set("channelId", channelUUID);
        channel.set('contactKey', contactPublicKey);
        channel.set("members", [userModel.currentUser.userUUID, contactUUID]);
        channelModel.channelsDS.add(channel.attributes);
        channelModel.channelsDS.sync();

        channel.setACL(userModel.parseACL);
        channel.save(null, {
            success: function(channel) {
                //closeModalViewAddChannel();
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
    addChannel : function (channelName, channelDescription, isOwner, durationDays, channelUUID, ownerUUID, ownerName) {
        var Channels = Parse.Object.extend("channels");
        var channel = new Channels();

        var ChannelMap = Parse.Object.extend('channelmap');
        var channelMap = new ChannelMap();

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

        // Generic fields for owner and members
        channel.set("name", name );
        channel.set('isPrivate', false);
        channel.set('isPlace', false);
        channel.set('isEvent', false);
        channel.set("media",   true);
        channel.set("archive", true);
        channel.set("description", description);
        channel.set("durationDays", durationDays);
        channel.set("unreadCount", 0);
        channel.set("clearBefore", addTime);
        channel.set("lastAccess", addTime);
        channel.set("channelId", channelId);

        // Channel owner can access and edit members...
        if (isOwner) {
            channel.set("isOwner", true);
            channel.set("members", [userModel.currentUser.userUUID]);
            channel.set("invitedMembers", []);
        } else {
            // Channel members have no access to members...
            channel.set("isOwner", false);
            channel.set("ownerId", ownerUUID);
            channel.set("ownerName", ownerName);
        }

        channelModel.channelsDS.add(channel.attributes);
        channelModel.channelsDS.sync();
        currentChannelModel.currentChannel = channelModel.findChannelModel(channelId);
        currentChannelModel.currentChannel = currentChannelModel.currentChannel;

        channel.setACL(userModel.parseACL);
        channel.save(null, {
            success: function(channel) {
                // Execute any logic that should take place after the object is saved.


                mobileNotify('Added channel : ' + channel.get('name'));



                if (isOwner) {
                    channelMap.set("name", channel.get('name'));
                    channelMap.set("channelId", channel.get('channelId'));
                    channelMap.set("channelOwner", userModel.currentUser.userUUID);
                    channelMap.set("members", [userModel.currentUser.userUUID]);

                    channelMap.save(null, {
                        success: function(channel) {
                            // Execute any logic that should take place after the object is saved.


                        },
                        error: function(channel, error) {
                            // Execute any logic that should take place if the save fails.
                            // error is a Parse.Error with an error code and message.
                            mobileNotify('Error creating channelMap: ' + error.message);
                            handleParseError(error);
                        }
                    });
                    APP.kendo.navigate('#editChannel');
                }

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
                deleteParseObject("channelmap", 'channelId', channelId);

                if (silent === undefined || silent === false) {
                    if (channel.isPrivate) {
                        // Owner is always first member of channel
                        userDataChannel.privateChannelDelete(members[1],channelId, 'Chat "' + channel.name + 'has been deleted' );
                    } else {
                        // Send delete channel messages to all members
                        var members = channel.members;
                        // Skip the first member as it's the owner
                        for (var i = 1; i < channel.members.length; i++) {
                            userDataChannel.groupChannelDelete(members[i],channelId, 'Chat "' + channel.name + 'has been deleted' );
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
        var channelArray = this.channelsDS.data();

        for (var i=0; i<channelArray.length; i++) {
            this.deleteChannel(channelArray.channelId);
        }
    }

};
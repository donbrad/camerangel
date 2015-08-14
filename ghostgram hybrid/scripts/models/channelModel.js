/**
 * Created by donbrad on 8/11/15.
 * channelModel.js -- handles all channel model interactions with parse and kendoDS
 */
'use strict';

var channelModel = {

    _channelName : "channels",
    _channelMemberName : "channelMember",
    currentChannel: new kendo.data.ObservableObject(),
    channelsDS: new kendo.data.DataSource({
        offlineStorage: "channels-offline",
        sort: {
            field: "name",
            dir: "asc"
        }
    }),



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
                if (models.length > 0) {
                    deviceModel.setAppState('hasChannels', true);
                }
               channelModel.channelsDS.data(models);
            },
            error: function(collection, error) {
                handleParseError(error);
            }
        });

    },

    findChannelModel: function (channelId) {
        var dataSource =  channelModel.channelsDS;
        dataSource.filter( { field: "channelId", operator: "eq", value: channelId });
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
        var publicKey = userModel.currentUser.get('publicKey');
        var contact = contactModel.getContactModel(contactUUID), contactKey = null;

        contact.privateChannelId = channelUUID;
        //contact.publicKey = contactPublicKey;


        channel.set("name", contactAlias);
        channel.set("isOwner", true);
        channel.set('isPrivate', true);
        channel.set("media",  true);
        channel.set("archive",  false);
        channel.set("description", "Private: " + contactAlias);
        channel.set("channelId", channelUUID);
        channel.set('userKey',  publicKey);
        channel.set('contactKey', contactPublicKey);
        channel.set("members", [userModel.currentUser.userUUID, contactUUID]);

        channel.setACL(userModel.parseACL);
        channel.save(null, {
            success: function(channel) {
                channelModel.channelsDS.add(channel.attributes);
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

    deletePrivateChannel : function (channelId, contactId ) {
        //Todo: Need to delete the channel and remove publicKey and privateChannelId from this contact
    },

    // Generic add group channel...
    addChannel : function (channelName, channelDescription) {
        var Channels = Parse.Object.extend("channels");
        var channel = new Channels();

        var ChannelMap = Parse.Object.extend('channelmap');
        var channelMap = new ChannelMap();

        var name = channelName,
            description = channelDescription,
            channelId = uuid.v4();

        channel.set("name", name );
        channel.set("isOwner", true);
        channel.set('isPrivate', false);
        channel.set("media",   true);
        channel.set("archive", true);

        channel.set("description", description);
        channel.set("members", [userModel.currentUser.userUUID]);
        channel.set("invitedMembers", []);
        channel.set("channelId", channelId);

        channel.setACL(userModel.parseACL);
        channel.save(null, {
            success: function(channel) {
                // Execute any logic that should take place after the object is saved.

                channelModel.channelsDS.add(channel.attributes);
                mobileNotify('Added channel : ' + channel.get('name'));

                APP.models.channel.currentModel = channelModel.findChannelModel(channelId);
                APP.models.channel.currentChannel = APP.models.channel.currentModel;
                APP.kendo.navigate('#editChannel');
            },
            error: function(channel, error) {
                // Execute any logic that should take place if the save fails.
                // error is a Parse.Error with an error code and message.
                mobileNotify('Error creating channel: ' + error.message);
                handleParseError(error);
            }
        });

        channelMap.set("name", name);
        channelMap.set("channelId", channelId);
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

    }

};
/**
 * Created by donbrad on 8/11/15.
 * channelModel.js -- handles all channel model interactions with parse and kendoDS
 */
'use strict';

var channelModel = {

    _channelName : "channels",
    _channelMemberName : "channelMember",
    currentChannel: {},
    currentModel: {},
    currentMessage: {},
    messageLock: true,
    potentialMembersDS: new kendo.data.DataSource({
        group: 'category',
        sort: {
            field: "name",
            dir: "asc"
        },
        schema: {
            model: {
                id: "uuid"
            }
        }
    }),
    membersDS: new kendo.data.DataSource({
        sort: {
            field: "name",
            dir: "asc"
        }
    }),
    messagesDS: new kendo.data.DataSource({
        sort: {
            field: "date",
            dir: "desc"
        }
    }),


    fetch : function () {
        var ChannelModel = Parse.Object.extend("channels");
        var ChannelCollection = Parse.Collection.extend({
            model: ChannelModel
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
                    APP.setAppState('hasChannels', true);
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
        dataSource.filter([
            { field: "isPrivate", operator: "eq", value: true },
            { field: "members", operator: "contains", value: contactUUID }
            ]);
        var view = dataSource.view();
        var channel = view[0];
        dataSource.filter([]);

        return(channel);
    },

    // Add a new private channel that this user created -- create a channel object
    addPrivateChannel : function (contactUUID, contactAlias, channelUUID) {
        var Channels = Parse.Object.extend(this._channelName);
        var channel = new Channels();
        var publicKey = APP.models.profile.currentUser.get('publicKey');
        var contact = contactModel.findContactByUUID(contactUUID), contactKey = null;

        contactKey = contact.get('publicKey');

        channel.set("name", contactAlias);
        channel.set("isOwner", true);
        channel.set('isPrivate', true);
        channel.set("media",  true);
        channel.set("archive",  false);
        channel.set("description", "Private: " + contactAlias);
        channel.set("channelId", channelUUID);
        channel.set('userKey',  publicKey);
        channel.set('contactKey', contactKey);
        channel.set("members", [APP.models.profile.currentUser.userUUID, contactUUID]);

        channel.setACL(APP.models.profile.parseACL);
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
        channel.set("members", [APP.models.profile.currentUser.userUUID]);
        channel.set("invitedMembers", []);
        channel.set("channelId", channelId);

        channel.setACL(APP.models.profile.parseACL);
        channel.save(null, {
            success: function(channel) {
                // Execute any logic that should take place after the object is saved.

                channelModel.channelsDS.add(channel.attributes);
                mobileNotify('Added channel : ' + channel.get('name'));

                channelModel.currentModel = findChannelModel(channelId);
                channelModel.currentChannel = channelModel.currentModel;
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
        channelMap.set("channelOwner", APP.models.profile.currentUser.userUUID);
        channelMap.set("members", [APP.models.profile.currentUser.userUUID]);

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
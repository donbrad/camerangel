/**
 * Created by donbrad on 8/11/15.
 * channelModel.js -- handles all channel model interactions with parse and kendoDS
 */
'use strict';

var channelModel = {

    _channelName : "channel",
    _channelMemberName : "channelMember",


    // Add a new private channel that this user created -- create a channel object
    addPrivateChannel : function (contactUUID, contactAlias, channelUUID) {
        var Channels = Parse.Object.extend(this._channelName);
        var channel = new Channels();
        var publicKey = APP.models.profile.currentUser.get('publicKey');

        channel.set("name", contactAlias);
        channel.set("isOwner", true);
        channel.set('isPrivate', true);
        channel.set("media",  true);
        channel.set("archive",  false);
        channel.set("description", "Private: " + contactAlias);
        channel.set("channelId", channelUUID);
        channel.set('userKey',  publicKey);
        channel.set('contactKey', null);
        channel.set("members", [APP.models.profile.currentUser.userUUID, contactUUID]);

        channel.setACL(APP.models.profile.parseACL);
        channel.save(null, {
            success: function(channel) {
                APP.models.channels.channelsDS.add(channel.attributes);
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

    addPrivateChannelMember : function (contactUUID, contactAlias, channelUUID) {
        var Channels = Parse.Object.extend(this._channelMemberName);
        var channel = new Channels();
        var publicKey = APP.models.profile.currentUser.get('publicKey');

        channel.set("name", contactAlias);
        channel.set('isPrivate', true);
        channel.set("media",  true);
        channel.set("archive",  false);
        channel.set("description", "Private: " + contactAlias);
        channel.set("channelId", channelUUID);
        channel.set('userKey',  publicKey);
        channel.set('contactKey', null);
        channel.set("members", [APP.models.profile.currentUser.userUUID, contactUUID]);

        channel.setACL(APP.models.profile.parseACL);
        channel.save(null, {
            success: function(channel) {
                APP.models.channels.channelsDS.add(channel.attributes);
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

    }

};
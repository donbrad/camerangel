/**
 * Created by donbrad on 8/16/15.
 * channelModel.js -- handles all channel model interactions with parse and kendoDS
 */
'use strict';

var currentChannelModel = {
    currentChannel: new kendo.data.ObservableObject(),
    currentMessage: {},
    membersAdded : [],
    membersDeleted: [],
    privacyMode: false,
    messageLock: true,
    topOffset: 0,
    _debounceInterval: 5000,  // Only call every 5 seconds (counter in millisecs)
    _lastDay : 86400,
    _lastWeek : 604800,
    _lastMonth : 2592000,

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

    archiveMessage : function(time, blob) {
        var Message = Parse.Object.extend('messages');
        var msg = new Message();

        msg.set('messageId', uuid.v4());
        msg.set('timeStamp', time);
        msg.set('channelId', currentChannelModel.currentChannel.channelId);
        msg.set('messageBlob', userModel.encryptBlob(msg));
        msg.save(null, {
            success: function(results) {

            },
            error: function(error) {
                handleParseError(error);
            }
        });
        currentChannelModel.messagesDS.add(msg);
    },

    getArchivedMessages : function (time, callback) {
        // Messages from parse

    },

    // Need to debounce this so we're not updating lastAccess on each message read.
    updateLastAccess: debounce(function () {
        var accessTime = ggTime.currentTime(), channelId = currentChannelModel.currentChannel.channelId;
        updateParseObject('channels', 'channelId', channelId, 'lastAccess', accessTime);

    }, this._debounceInterval),

    updateClearBefore: function () {
        var clearTime = ggTime.currentTime(), channelId = currentChannelModel.currentChannel.channelId;
        updateParseObject('channels', 'channelId', channelId, 'clearBefore', clearTime);
    }



};

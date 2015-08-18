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

    // Need to debounce this so we're not updating lastAccess on each message read.
    updateLastAccess: debounce(function () {
        var accessTime = ggTime.currentTime(), channelId = currentChannelModel.currentChannel.get('channelId');
        updateParseObject('channels', 'channelId', channelId, 'lastAccess', accessTime);

    }, this._debounceInterval),

    updateClearBefore: function () {
        var clearTime = ggTime.currentTime(), channelId = currentChannelModel.currentChannel.get('channelId');
        updateParseObject('channels', 'channelId', channelId, 'clearBefore', clearTime);
    }


};

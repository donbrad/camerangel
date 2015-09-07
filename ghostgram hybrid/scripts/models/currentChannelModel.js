/**
 * Created by donbrad on 8/16/15.
 * channelModel.js -- handles all channel model interactions with parse and kendoDS
 */
'use strict';

var currentChannelModel = {
    currentChannel: new kendo.data.ObservableObject(),  // data for current channel
    handler : null,  // Handler functions for the current channel
    currentMessage: {},
    channelId : null,
    membersAdded : [],
    membersDeleted: [],
    privacyMode: false,
    messageLock: true,

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
            field: "time",
            dir: "des"
        }
    }),


    setCurrentChannel : function (channelId) {
        if (channelId === undefined || channelId === null) {
            mobileNotify("CurrentChat :  Invalid Chat Id!!");
            return;
        }

        var channel = channelModel.findChannelModel(channelId);
        if (channel !== undefined) {
            currentChannelModel.currentChannel = channel;
            currentChannelModel.channelId = channelId;
         }
        return(channel);

    },

    openChannel : function (handler) {

        // if there's a current channel active -- close it
        currentChannelModel.closeChannel();
        if (handler !== undefined) {
            currentChannelModel.handler = handler;
            if (currentChannelModel.handler !== null && currentChannelModel.handler.openChannel !== undefined) {
                currentChannelModel.handler.openChannel();
            }
        }


    },

    closeChannel : function () {
        if (currentChannelModel.handler !== null && currentChannelModel.handler.closeChannel !== undefined) {
            currentChannelModel.handler.closeChannel();
        }
        currentChannelModel.hander = null;
    },

    //

    getArchivedMessages : function () {
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

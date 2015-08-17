/**
 * Created by donbrad on 8/16/15.
 * channelModel.js -- handles all channel model interactions with parse and kendoDS
 */
'use strict';

var currentChannelModel = {
    currentChannel: {},
    currentModel: {},
    currentMessage: {},
    messageLock: true,
    topOffset: 0,
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


};

/**
 * Created by donbrad on 8/23/16.
 */

'use strict';

var trackerChannel = {

    lastAccess: 0,   // last access time stamp
    _version: 1,
    pendingMessagesDS: null,  // list of offline messages to be sent
    messagesDS: null,  // list of  messages by tracker
    channelsDS : null,  // list of tracker channels being tracked
    reportingChannel : null, // active reporting channel for this user

    init : function () {

    }
};
/**
 * Created by donbrad on 8/23/16.
 */

'use strict';

var galleryChannel = {

    lastAccess: 0,   // last access time stamp
    _version: 1,
    pendingMessagesDS: null,  // list of offline messages to be sent
    messagesDS: null,  // list of gallery messages per gallery (photo add/delete, likes, comments)
    channelsDS : null,  // list of gallery channels being tracked

    init : function () {

    }
};
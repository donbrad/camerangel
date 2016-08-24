/**
 * Created by donbrad on 8/1/16.
 *
 * userstatusChannel -- shares user status via pubnub channel, tracks other users status
 *
 */

'use strict';


var userStatusChannel = {
    _version: 1,
    _cloudClass: "statuschannel",
    _ggClass: 'StatusChannel',
    myChannelUUID : null,
    myChannel : null,
    myMessagesDS : null,
    eventActive : false,
    eventUUID : null,
    eventName : null,
    userChannelDS : null,
    userChannels  : [],  // Array of channel id's for pubnub subscribe.
    userMessagesDS: null,

    init : function () {

    }


};






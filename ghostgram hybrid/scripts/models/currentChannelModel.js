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
    memberList: [],
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


    initDataSources : function () {
        currentChannelModel.memberList = [];
        currentChannelModel.messagesDS.data([]);
        currentChannelModel.membersDS.data([]);
    },

    setCurrentChannel : function (channelId) {
        if (channelId === undefined || channelId === null) {
            mobileNotify("CurrentChat :  Invalid Chat Id!!");
            return (null);
        }

        currentChannelModel.initDataSources();

        var channel = channelModel.findChannelModel(channelId);
        if (channel !== undefined) {
            currentChannelModel.currentChannel = channel;
            currentChannelModel.channelId = channelId;

            currentChannelModel.buildMemberList();

            if (!channel.isOwner) {
                currentChannelModel.syncChannelMembers(function (members) {
                    currentChannelModel.currentChannel.set('members', members);
                    currentChannelModel.buildMemberList();
                });
            }
            return(channel);
         } else {
            mobileNotify("CurrentChat :  Couldn't find Chat!!");
            return (null);
        }
    },


    buildMembersDS: function () {
        var members = currentChannelModel.memberList, length = Object.keys(members).length;

        currentChannelModel.membersDS.data([]);

        for (var i=0; i< length; i++) {
            if (members[i].contactUUID !== userModel.currentUser.userUUID) {
                currentChannelModel.membersDS.add(members[i]);
            }
        }

    },

    syncChannelMembers : function (callback) {

        getChannelMembers(currentChannelModel.channelId, function (result) {
            var members = [];
            if (result.found) {
                members = result.channel.members;
            }

            if (callback !== undefined) {
                callback(members);
            }

        });

    },


    createChatContact : function (userId) {

        getUserContactInfo(userId, function (result) {
            if (result.found) {
                var guid = uuid.v4();
                var contact = {};
                contact.isContact = true;
                contact.uuid = guid;
                contact.alias = result.user.alias;
                contact.name = result.user.name;
                var url = contactModel.createIdenticon(guid);
                contact.photo = url;
                contact.publicKey = null;

                currentChannelModel.memberList[guid] = contact;
                currentChannelModel.membersDS.add(contact);
                addContactView.addChatContact(guid, contact.name, contact.alias);
                mobileNotify("Created New Contact for: " + contact.name);
            }

        })

    },

    // Build a member list for this channel
    buildMemberList : function () {

        var contactArray = currentChannelModel.currentChannel.get('members');

        var contactInfoArray = currentChannelModel.memberList, userId = userModel.currentUser.userUUID;

        for (var i=0; i< contactArray.length; i++) {
            var contact = {};

            if (contactArray[i] === userId) {
                contact.isContact = false;
                contact.uuid = userId;
                contact.alias = userModel.currentUser.alias;
                contact.name = userModel.currentUser.name;
                contact.photoUrl = userModel.currentUser.photo;
                contact.publicKey = userModel.currentUser.publicKey;
                contact.isPresent = true;
                contactInfoArray[contact.uuid] = contact;
                // this is our user.
            } else {
                var thisContact = contactModel.findContact(contactArray[i]);
                if (thisContact === undefined) {
                    currentChannelModel.createChatContact(contactArray[i]);
                } else {
                    contact.isContact = true;
                    contact.uuid = contactArray[i];
                    contact.alias = thisContact.alias;
                    contact.name = thisContact.name;
                    contact.photoUrl = thisContact.photo;
                    contact.publicKey = thisContact.publicKey;
                    contact.isPresent = false;
                    contactInfoArray[contact.uuid] = contact;
                    currentContactModel.membersDS.add(contact);
                }
            }
        }

        return (contactInfoArray)

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

    zeroUnreadCount : function () {
        // Messages from parse
        updateParseObject('channels', 'channelId', channelId, 'unreadCount', 0);
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

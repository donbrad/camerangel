/**
 * Created by donbrad on 8/16/15.
 * channelModel.js -- handles all channel model interactions with parse and kendoDS
 */
'use strict';

var currentChannelModel = {
    currentChannel: new kendo.data.ObservableObject(),  // data for current channel
    handler : null,  // Handler functions for the current channel
    currentMessage: {},
    channelUUID : null,
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
       // currentChannelModel.messagesDS.sync();

        currentChannelModel.membersDS.data([]);
       // currentChannelModel.membersDS.sync();

        currentChannelModel.potentialMembersDS.data([]);
        //currentChannelModel.potentialMembersDS.sync();
    },

    setCurrentChannel : function (channelUUID) {
        if (channelUUID === undefined || channelUUID === null) {
            mobileNotify("CurrentChat :  Invalid Chat Id!!");
            return (null);
        }

        currentChannelModel.initDataSources();

        var channel = channelModel.findChannelModel(channelUUID);
        if (channel !== undefined) {
            currentChannelModel.currentChannel = channel;
            currentChannelModel.channelUUID = channelUUID;

            if (channel.category !== 'Private') {
                currentChannelModel.buildMemberList();

            }


           /* if (!channel.isOwner) {
                currentChannelModel.syncChannelMembers(function (members) {
                    mobileNotify("Synced Member List...");
                    currentChannelModel.currentChannel.set('members', members);
                    currentChannelModel.buildMemberList();
                });
            }*/
            return(channel);
         } else {
            mobileNotify("CurrentChat :  Couldn't find Chat!!");
            return (null);
        }
    },


    buildMembersDS: function () {
        var members = currentChannelModel.currentChannel.get('members'), length = members.length;

        currentChannelModel.membersDS.data([]);

        for (var i=0; i< length; i++) {
            if (members[i] !== userModel.currentUser.userUUID) {
                currentChannelModel.membersDS.add(currentChannelModel.memberList[members[i]]);
            }
        }

    },

    syncChannelMembers : function (callback) {

        getChannelDetails(currentChannelModel.channelUUID, function (result) {
            var members = [];
            if (result.found) {
                members = result.channel.members;
            }

            if (callback !== undefined) {
                callback(members);
            }

        });

    },

    // Create a contact for channel member that this user isn't connected to
    // The contact is a valid member and connected to the channel owner
    createChatContact : function (userId) {

        getUserContactInfo(userId, function (result) {
            if (result.found) {
                var guid = uuid.v4();
                var contact = {};
                contact.isContact = true;
                contact.uuid = result.user.userUUID;
                contact.alias = result.user.alias;
                contact.name = result.user.name;
                var url = contactModel.createIdenticon(guid);
                contact.photo = url;
                contact.publicKey = null;

                currentChannelModel.memberList[contact.uuid] = contact;
                currentChannelModel.membersDS.add(contact);
                addContactView.addChatContact(guid, contact.name, contact.alias, contact.uuid);
                mobileNotify("Created New Contact for: " + contact.name);
            }

        })

    },

    // Build a member list for this channel
    buildMemberList : function () {

        currentChannelModel.memberList = [];
        var contactArray = currentChannelModel.currentChannel.get('members');

        if (contactArray === undefined || contactArray === null)
            return;

        var userId = userModel.currentUser.userUUID;

        for (var i=0; i< contactArray.length; i++) {
            var contact = {};

            if (contactArray[i] === userId) {
                contact.isContact = false;
                contact.uuid = userId;
                contact.contactId = null;
                contact.alias = userModel.currentUser.alias;
                contact.name = userModel.currentUser.name;
                contact.photo = userModel.currentUser.photo;
                contact.publicKey = userModel.currentUser.publicKey;
                contact.isPresent = true;
                currentChannelModel.memberList[contact.uuid] = contact;
                // this is our user.
            } else {
                var thisContact = contactModel.findContact(contactArray[i]);
                if (thisContact === undefined) {
                    currentChannelModel.createChatContact(contactArray[i]);
                } else {
                    contact.isContact = true;
                    contact.uuid = contactArray[i];
                    contact.contactId = thisContact.uuid;
                    contact.alias = thisContact.alias;
                    contact.name = thisContact.name;
                    contact.photo = thisContact.photo;
                    contact.publicKey = thisContact.publicKey;
                    contact.isPresent = false;
                    currentChannelModel.memberList[contact.uuid] = contact;
                    currentChannelModel.membersDS.add(contact);
                }
            }
        }
    },

    setMemberPresence : function (memberId, isPresent) {

        var dataSource = currentChannelModel.membersDS;
        dataSource.filter( { field: "uuid", operator: "eq", value: memberId });
        var view = dataSource.view();
        //var contact = view[0].items[0];
        var contact = view[0];
        dataSource.filter([]);

        contact.set('isPresent', isPresent);

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
        updateParseObject('channels', 'channelUUID', channelUUID, 'unreadCount', 0);
    },

    // Need to debounce this so we're not updating lastAccess on each message read.
    updateLastAccess: debounce(function () {
        var accessTime = ggTime.currentTime(), channelUUID = currentChannelModel.currentChannel.channelUUID;
        updateParseObject('channels', 'channelUUID', channelUUID, 'lastAccess', accessTime);

    }, this._debounceInterval),

    updateClearBefore: function () {
        var clearTime = ggTime.currentTime(), channelUUID = currentChannelModel.currentChannel.channelUUID;
        updateParseObject('channels', 'channelUUID', channelUUID, 'clearBefore', clearTime);
    }



};

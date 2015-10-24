/**
 * Created by donbrad on 8/12/15.
 *
 * notificationModel.js -- notification interface to parse, kendo and localstorage
 *
 * Notification types: 'unread', 'newchat', 'newprivate', 'deletechat', 'newmember',
 */

'use strict';

var notificationModel = {

    // Types of notifications...
    _intro: 'ghostgrams recommends',
    _unreadCount : 'Unread Messages',
    _newChat : 'New Chat',
    _newPrivate : 'New Private Chat',
    _newMember : 'New Member',
    _memberStatus : 'New Member Status',
    _deleteChat : 'Delete Chat',
    _deletePrivateChat : 'Delete Private Chat',

    notificationDS: new kendo.data.DataSource({
        offlineStorage: "notifications-offline",
        sort: {
            field: "priority",
            dir: "asc"
        }
    }),

    Notification: function(type, title, date, description, actionTitle, action, href, dismissed, dismissable) {
            this.uuid = new uuid.v4();
            this.type = type ? type : 'system',
            this.title = title ? title : '',
            this.actionTitle = actionTitle ? actionTitle : '',
            this.action = action ? action : null,
            this.href = href ? href : null,
            this.description = description ? description : '',
            this.date = date ? date : ggTime.currentTime(),
            this.dismissed = dismissed ? dismissed : false,
            this.dismissable = dismissable ? dismissable : false
    },

    newNotification: function(type, title, date, description, actionTitle, action, href, dismissable) {
        var notification = new notificationModel.Notification(type, title, date, description, actionTitle, action, href, dismissable);
        notificationModel.notificationDS.add(notification);
    },

    addAppNotification : function () {

    },

    addNewMemberNotification : function (contactId, contactName) {

    },


    memberStatusNotification : function (contactId, contactName) {

    },

    addUnreadNotification : function (channelId, channelName, unreadCount) {
        this.newNotification(this._unreadCount, channelName, null, unreadCount + " new messages.", 'Read Messages', null,
        '#channel?channel='+channelId, true);
    },

    addNewChatNotification : function (channelId, channelName, channelDescription) {
        this.newNotification(this._newChat, channelName, null, channelDescription, 'Goto Chat', null,
            '#channel?channel='+channelId, true);
    },

    addNewPrivateChatNotification : function (channelId, channelName) {
        this.newNotification(this._newPrivate, channelName, null, 'Private Chat Request', 'Goto Chat', null,
            '#channel?channel='+channelId, true);
    },

    deleteChatNotification : function (channelId, channelName) {
        this.newNotification(this._deleteChat, channelName, null, "Has been deleted.", null, null,
           null, true);
    },

    deletePrivateChatNotification : function (channelId, channelName) {
        this.newNotification(this._deletePrivateChat, channelName, null, "Has been deleted.", null, null,
            null, true);
    },

    parseFetch: function () {
        var NotificationModel = Parse.Object.extend("notifications");
     /*   var NotificationCollection = Parse.Collection.extend({
            model: NotificationModel
        });

        var notifications = new NotificationCollection();

        notifications.fetch({*/
        NotificationModel.fetchAll([],{
            success: function(collection) {
                var userNotifications = [];
                for (var i = 0; i < collection.models.length; i++) {
                    // Todo: check status of members
                    var date = collection.models[i].updatedAt;
                    collection.models[i].attributes.date = Date.parse(date);
                    userNotifications.push(JSON.stringify(collection.models[i].attributes));
                    notificationModel.notificationDS.add(collection.models[i].attributes);
                    deviceModel.setAppState('introFetched', true);
                }
                window.localStorage.setItem('ggUserNotifications', JSON.stringify(userNotifications));
                deviceModel.state.userNotifications = userNotifications;
            },
            error: function(collection, error) {
                handleParseError(error);
            }
        });
    },

    localStorageFetch: function () {
        var userNotifications = window.localStorage.getItem('ggUserNotifications');

        userNotifications = JSON.parse(userNotifications);
        deviceModel.state.userNotifications = [];
        if (userNotifications !== null && userNotifications.length > 0) {
            for (var j = 0; j < userNotifications.length; j++) {
                var notification = JSON.parse(userNotifications[j]);
                notificationModel.notificationDS.add(notification);
                deviceModel.state.userNotifications.push(notification);
            }
        }
    },

    findNotificationModel: function (uuid) {
        var dataSource = notificationModel.notificationDS;
        dataSource.filter( { field: "uuid", operator: "eq", value: uuid });
        var view = dataSource.view();
        var contact = view[0];
        dataSource.filter([]);
        return(contact);
    },

    deleteNotification: function (uuid) {
        var dataSource = notificationModel.notificationDS;
        dataSource.filter( { field: "uuid", operator: "eq", value: uuid });
        var view = dataSource.view();
        var notification = view[0];
        dataSource.filter([]);
        // Does this notification exist?  if not, just return
        if (notification === undefined)
            return;
        var data = deviceModel.state.userNotifications;
        for(var i = 0; i < data.length; i++) {
            if(data[i].uuid == uuid) {
                data.splice(i, 1); 
                break;
            }
        }
        deviceModel.setAppState('userNotifications', JSON.stringify(data));
        dataSource.remove(notification);
    }


};
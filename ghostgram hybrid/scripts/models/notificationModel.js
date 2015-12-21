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
        offlineStorage: "notifications",
        sort: {
            field: "date",
            dir: "desc"
        }
    }),

    queryNotification : function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = notificationModel.notificationDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();
        var item = view[0];

        dataSource.filter(cacheFilter);

        return(item);
    },

    queryNotifications : function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = notificationModel.notificationDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();

        var contact = view[0].items[0];

        dataSource.filter(cacheFilter);

        return(contact);
    },

    Notification: function(type,  id, title, date, description, actionTitle, action, href, dismissed, dismissable) {
            this.uuid = new uuid.v4(),
            this.type = type ? type : 'system',
            this.privateId = id ? id : null,
            this.title = title ? title : '',
            this.actionTitle = actionTitle ? actionTitle : '',
            this.action = action ? action : null,
            this.href = href ? href : null,
            this.description = description ? description : '',
            this.date = date ? date : ggTime.currentTime(),
            this.dismissed = dismissed ? dismissed : false,
            this.dismissable = dismissable ? dismissable : false
    },

    newNotification: function(type, id, title, date, description, actionTitle, action, href, dismissable) {
        var notification = new notificationModel.Notification(type, id, title, date, description, actionTitle, action, href, dismissable);
        notificationModel.notificationDS.add(notification);
    },

    addAppNotification : function () {

    },

    addNewMemberNotification : function (contactId, contactName) {

    },


    memberStatusNotification : function (contactId, contactName) {

    },

    addVerifyPhoneNotification : function () {
        this.newNotification('system', 'Please Verify Phone', null, "Please verify your mobile phone", "Verify", launchVerifyPhone , null, false);
    },

    addUnreadNotification : function (channelId, channelName, unreadCount) {
        this.newNotification(this._unreadCount, channelId, channelName, null, unreadCount + " new messages.", 'Read Messages', null,
        '#channel?channelId='+channelId, true);
    },

    addNewChatNotification : function (channelId, channelName, channelDescription) {
        this.newNotification(this._newChat, channelId, channelName, null, channelDescription, 'Goto Chat', null,
            '#channel?channelId='+channelId, true);
    },

    addNewPrivateChatNotification : function (channelId, channelName) {
        this.newNotification(this._newPrivate, channelId, channelName, null, 'Private Chat Request', 'Goto Chat', null,
            '#channel?channelId='+channelId, true);
    },

    deleteChatNotification : function (channelId, channelName) {
        this.newNotification(this._deleteChat, channelId, channelName, null, "Has been deleted.", null, null,
           null, true);
    },

    deletePrivateChatNotification : function (channelId, channelName) {
        this.newNotification(this._deletePrivateChat, channelId, channelName, null, "Has been deleted.", null, null,
            null, true);
    },

    parseFetch: function () {
        var NotificationModel = Parse.Object.extend("notifications");
        var query = new Parse.Query(NotificationModel);
     /*   var NotificationCollection = Parse.Collection.extend({
            model: NotificationModel
        });

        var notifications = new NotificationCollection();

        notifications.fetch({*/
        query.find({
            success: function(collection) {
                var userNotifications = [];
                for (var i = 0; i < collection.length; i++) {
                    var object = collection[i];
                    // Todo: check status of members
                    var date = object.get('updatedAt');
                    object.set('date',Date.parse(date));
                    var data = object.toJSON();
                    userNotifications.push(JSON.stringify(data));
                    notificationModel.notificationDS.add(data);
                    deviceModel.setAppState('introFetched', true);
                }
                window.localStorage.setItem('ggUserNotifications', JSON.stringify(userNotifications));
                deviceModel.state.userNotifications = userNotifications;
            },
            error: function(error) {
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
        return (notificationModel.queryNotification({ field: "uuid", operator: "eq", value: uuid }));
     /*   var dataSource = notificationModel.notificationDS;
        dataSource.filter( { field: "uuid", operator: "eq", value: uuid });
        var view = dataSource.view();
        var contact = view[0];
        dataSource.filter([]);
        return(contact);*/
    },

    updateUnreadNotification : function (channelId, channelName, unreadCount) {
        var notObj = notificationModel.findNotificationByPrivateId(channelId);

        if (notObj === undefined) {
            notificationModel.addUnreadNotification(channelId, channelName, unreadCount);
        } else {
            if (unreadCount === 0) {
                notificationModel.notificationDS.remove(notObj);
            } else {
                notObj.set('unreadCount', unreadCount);
            }
        }

    },

    findNotificationByPrivateId : function (privateId) {
        return (notificationModel.queryNotification({ field: "privateId", operator: "eq", value: privateId }));
    },

    deleteAllNotifications : function () {
        notificationModel.notificationDS.data([]);
        notificationModel.notificationDS.sync();
    },

    deleteNotificationsByType : function (notificationType) {
        var list = notificationModel.queryNotifications({ field: "type", operator: "eq", value: notificationType });

        for (var i=0; i<list.length; i++) {
            var item = list[i];
            notificationModel.deleteNotification(item.uuid);
        }
    },

    deleteNotification: function (uuid) {
        var notification = notificationModel.findNotificationModel(uuid);
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
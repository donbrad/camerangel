/**
 * Created by donbrad on 8/12/15.
 *
 * notificationModel.js -- notification interface to  kendo and localstorage
 *
 * Notification types: 'unread', 'newchat', 'newprivate', 'deletechat', 'newmember',
 */

'use strict';

var notificationModel = {

    // Types of notifications...
    _cloudClass : 'notifications',
    _ggClass : 'Notification',
    _intro: 'intelligram recommends',
    _unreadCount : 'Unread Messages',
    _newChat : 'New Chat',
    _newPrivate : 'New Private Chat',
    _newMember : 'New Member',
    _memberStatus : 'New Member Status',
    _deleteChat : 'Delete Chat',
    _deletePrivateChat : 'Delete Private Chat',
    _system: 'intelligram',
    _verifyPhone : 'Verify Phone',
    _verifyEmail : 'Verify Email',
    _connectRequest: 'Connect Request',
    _connectResponse: 'Connect Response',
    _userAlert: 'Urgent Message',


    notificationDS: null, 
    
    
    init : function () {
       notificationModel.notificationDS = new kendo.data.DataSource({
           type: 'everlive',
           transport: {
               typeName: 'notifications'
           },
           schema: {
               model: { Id:  Everlive.idField}
           },
           sort: {
               field: "date",
               dir: "desc"
           },
           autoSync: true
       });

        notificationModel.notificationDS.fetch();
    },

    sync: function () {
        notificationModel.notificationDS.sync();
    },

    findNotification : function (type, id) {
        var query = [
            { field: "type", operator: "eq", value: type },
            { field: "id", operator: "gte", value: 0 }
        ];
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

    findNotificationByUUID : function (uuid) {
        var query = [
            { field: "uuid", operator: "eq", value: uuid }
        ];
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

       // var contact = view[0].items[0];
        dataSource.filter(cacheFilter);

        return(view);
    },

    Notification: function(type, id, title, date, description, actionTitle, action, href, dismissed, dismissable) {
            this.uuid = uuid.v4(),
            this.type = type ? type : notificationModel._system,
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

    _cleanDupNotifications : function (noteId) {
        var noteList = notificationModel.findNotificationByUUID(noteId);

        if (noteList !== undefined && noteList.length > 0) {
            if (noteList.length > 1) {
                for (var i=0; i< noteList.length; i++) {
                    var note = noteList[i];

                    if (note.Id === undefined) {
                        mobileNotify("Cleaning duplicate notification");
                        notificationModel.notificationsDS.remove(note);
                    }
                }
            }
        }
    },

    newNotification: function(type, id, title, date, description, actionTitle, action, href, dismissable) {
        var notification = new notificationModel.Notification(type, id, title, date, description, actionTitle, action, href, dismissable);
        
        notificationModel.notificationDS.add(notification);
        notificationModel.notificationDS.sync();
        everlive.createOne(notificationModel._cloudClass, notification, function (error, data){
            if (error !== null) {
                mobileNotify ("Error creating Notification " + JSON.stringify(error));
            } else {
                notificationModel._cleanDupNotifications(notification.uuid);
            }
        });

        return(notification);
    },

    addAppNotification : function () {

    },

    addNewMemberNotification : function (contactId, contactName) {

    },


    memberStatusNotification : function (contactId, contactName) {

    },

    addVerifyPhoneNotification : function () {
        this.newNotification(notificationModel._verifyPhone, 0, 'Please Verify Phone', null, "Please verify your mobile phone", "Verify", verifyPhoneModal.openModal , null, false);
    },
    
    addVerifyEmailNotification : function () {
        this.newNotification(notificationModel._verifyEmail, 0, 'Please Verify Email', null, "Please verify your email address", "Verify", launchVerifyPhone , null, false);
    },


    addConnectRequest : function (contactId, contactName) {
        this.newNotification(this._connectRequest, contactId, contactName, null, contactName  + " wants to connect.", 'New Contact', null,
            '#contacts', true);
    },

    addConnectResponse : function (contactId, contactName, accept) {
        var responseStr = "has declined your Connect request";
        if (accept) {
            responseStr = "has accepted your Connect request!";
        }
        this.newNotification(this._connectResponse, contactId, contactName, null, contactName  + responseStr, 'New Contact', null,
            '#contacts', true);
    },

    addUnreadNotification : function (channelUUID, channelName, unreadCount) {
        this.newNotification(this._unreadCount, channelUUID, channelName, null, unreadCount + " new messages.", 'Read Messages', null,
        '#channel?channelUUID='+channelUUID, true);
    },

    addNewChatNotification : function (channelUUID, channelName, channelDescription) {
        this.newNotification(this._newChat, channelUUID, channelName, null, channelDescription, 'Goto Chat', null,
            '#channel?channelUUID='+channelUUID, true);
    },

    addUserAlert : function (channelUUID, channelName, senderName, message) {
        this.newNotification(this._userAlert, channelUUID, "Urgent from " + channelName, null,  message,  'Goto Chat', null,
            '#channel?channelUUID='+channelUUID, true);
    },
    addNewPrivateChatNotification : function (channelUUID, channelName) {
        this.newNotification(this._newPrivate, channelUUID, channelName, null, 'New Private Chat', 'Goto Chat', null,
            '#channel?channelUUID='+channelUUID, true);
    },

    deleteChatNotification : function (channelUUID, channelName) {
        this.newNotification(this._deleteChat, channelUUID, channelName, null, "Has been deleted.", null, null,
           null, true);
    },

    deletePrivateChatNotification : function (channelUUID, channelName) {
        this.newNotification(this._deletePrivateChat, channelUUID, channelName, null, "Has been deleted.", null, null,
            null, true);
    },


    localStorageFetch: function () {
        var userNotifications = window.localStorage.getItem('ggUserNotifications');

       /* userNotifications = JSON.parse(userNotifications);
        deviceModel.state.userNotifications = [];
        if (userNotifications !== null && userNotifications.length > 0) {
            for (var j = 0; j < userNotifications.length; j++) {
                var notification = JSON.parse(userNotifications[j]);
                notificationModel.notificationDS.add(notification);
                deviceModel.state.userNotifications.push(notification);
            }
        }*/
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

    updateUnreadNotification : function (channelUUID, channelName, unreadCount) {
        var notObj = notificationModel.findNotificationByPrivateId(channelUUID);

        if (notObj === undefined ) {
            if (unreadCount > 0)
                notificationModel.addUnreadNotification(channelUUID, channelName, unreadCount);
        } else {
            var Id = notObj.Id;
            if (unreadCount === undefined || unreadCount === 0) {

                notificationModel.notificationDS.remove(notObj);

                everlive.delete(notificationModel._cloudClass, {'uuid' : notObj.uuid}, function (error, data) {

                });


            } else {
                notObj.set('unreadCount', unreadCount);

                notificationModel.notificationDS.sync();
                everlive.update(notificationModel._cloudClass, notObj, {'uuid' : notObj.uuid}, function (error, data) {
                    //placeNoteModel.notesDS.remove(note);
                });

            }
        }

    },

    processUnreadChannels : function () {
        // app is resuming / becoming active -- add unread notifications
        var channels = channelModel.getUnreadChannels();

        for (var i=0; i<channels.length; i++) {
            var channel = channels[i];
            if (channel.unreadCount === undefined)
                channel.unreadCount = 0;

            notificationModel.updateUnreadNotification(channel.channelUUID, channel.name, Number(channel.unreadCount));


        }
    },


    findNotificationByPrivateId : function (privateId) {
        return (notificationModel.queryNotification({ field: "privateId", operator: "eq", value: privateId }));
    },

    deleteAllNotifications : function () {
        notificationModel.notificationDS.data([]);
        notificationModel.notificationDS.sync();
    },

    deleteNotificationsByType : function (notificationType, id) {
        var query = [{ field: "type", operator: "eq", value: notificationType }];

        if (id !== undefined && id !== null) {
            query = [
                { field: "type", operator: "eq", value: notificationType },
                { field: "privateId", operator: "eq", value: id }
            ];
        }
        var list = notificationModel.queryNotifications(query);

        for (var i=0; i<list.length; i++) {
            var item = list[i];
            notificationModel.deleteNotificationById(item.uuid);
        }
    },

    deleteNotificationById: function (uuid) {
        var notification = notificationModel.findNotificationModel(uuid);
        // Does this notification exist?  if not, just return
        if (notification === undefined)
            return;

        notificationModel.notificationDS.remove(notification);
    }


};
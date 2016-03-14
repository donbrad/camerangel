/**
 * Created by donbrad on 3/1/16.
 *
 * everlive interface for userManagement
 *
 */
'use strict';

var everlive = {

    _token : null,
    _signedIn : false,

    createAccount: function (username, name, password, callback) {
        var attrs = {
            Email: username,
            DisplayName: name
        };

        APP.everlive.users.register(username,
            password,
            attrs,
            function(data) {
                everlive._token = data.result.Id;
                everlive._signedIn = true;

                callback(null, data);
            },
            function(error) {
                callback(error, null);
            });
    },

    login : function (username, password, callback) {
        APP.everlive.users.login(username, password,
            function (data) {
                everlive._token = data.result.Id;
                everlive._signedIn = true;
                callback(null, data);
            },
            function(error){
                callback(error, null);
            });
    },

    updateAll : function (dataType, dataList) {
        var data = APP.everlive.data(dataType);
        data.update(dataList, // filter expression
            function(data){
                alert(JSON.stringify(data));
            },
            function(error){
                alert(JSON.stringify(error));
            });
    },

    createAll : function (dataType, dataList, callback) {
        var data = APP.everlive.data(dataType);
        data.create(dataList, // filter expression
            function(data){
               callback(data);
            },
            function(error){
                mobileNotify("Everlive CreateAll Error : " + JSON.stringify(error));
            });
    },

    logout : function () {
        APP.everlive.authentication.clearAuthorization();
        everlive._signedIn = false;
    },

    syncStart : function () {

    },

    syncEnd : function (syncInfo)  {
        var err = syncInfo.error;
        if (err) {
            mobileNotify('Kendo Sync Error : ' + JSON.stringify(err));
        } else if (err === '') {
            mobileNotify('Kendo Sync Error : unknown...');
        }

    }

};
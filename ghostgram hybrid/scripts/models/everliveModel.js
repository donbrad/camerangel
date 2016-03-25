/**
 * Created by donbrad on 3/1/16.
 *
 * everlive interface for userManagement
 *
 */
'use strict';

var everlive = {

    _token : null,
    _tokenType: null,
    _id : null,
    _signedIn : false,
    _status: null,
    _user : null,

    init: function () {
        var provider = Everlive.Constants.StorageProvider.FileSystem;
        if (window.navigator.simulator === undefined) {
            // Use local storage in the emulator
            provider = Everlive.Constants.StorageProvider.LocalStorage;
        }

        APP.everlive = new Everlive({
            appId: 's2fo2sasaubcx7qe',
            scheme: 'https',
            offline: true,
            offlineStorage: {
                storage: {
                    provider: provider
                }/*,
                 conflicts: {
                 strategy: Everlive.Constants.ConflictResolutionStrategy.ClientWins
                 }*/
            },
            encryption: {
                provider: Everlive.Constants.EncryptionProvider.Default
                //key: 'intelligram'
            },
            authentication: {
                persist: true,
                onAuthenticationRequired: function() {

                }
            }
        });

        // Wire up the everlive sync monitors
        APP.everlive.on('syncStart', everlive.syncStart);

        APP.everlive.on('syncEnd', everlive.syncEnd);

        everlive.checkAuthStatus(function (error, data) {
            if (error === null) {
                everlive._status = data;
            }
        })

    },

    checkAuthStatus : function (callback) {
        APP.everlive.authentication.getAuthenticationStatus(
            function (data) {
                callback(null, data);
            }, 
            function (error) {
                callback(error, null);
                
            });
    },
    

    createAccount: function (username, name, password, callback) {
        var attrs = {
            Email: username,
            DisplayName: name
        };

        APP.everlive.users.register(username,
            password,
            attrs,
            function(data) {

                everlive._id = data.result.Id;
                userModel.Id =  data.result.Id;
                userModel._user.Id = data.result.Id;
                callback(null, data);
            },
            function(error) {
                callback(error, null);
            });
    },

    login : function (username, password, callback) {
        APP.everlive.users.login(username, password,
            function (data) {
                everlive._token = data.result.access_token;
                everlive._tokenType = data.result.token_type;
                everlive._id = data.result.principal_id;
                userModel._user.Id = data.result.principal_id;
                everlive._signedIn = true;
                callback(null, data);
            },
            function(error){
                callback(error, null);
            });
    },

    logout : function (callback) {
        APP.everlive.users.logout().then(function () {
                everlive._signedIn = false;
                callback(true);
            }, // success
            function () {
                callback(false);
            });
    },

    changePassword : function (newPassword, callback) {
        var username = userModel._user.get('Username');
        var password = userModel._getRecoveryPassword();
        APP.everlive.users.changePassword(username, password, newPassword, true, 
            function (data) {
                callback(null, true);
            },
            function (error) {
               callback(error, false);
            }
        );
    },


    updateUser : function () {
        var updateObj = userModel._user;
        
        if (updateObj.useIdenticon) {
            updateObj.photo = null;     //Don't store the image on the cloud -- just create it when the user logs in.
        }

        APP.everlive.Users.updateSingle(updateObj,
            function(data){
                var result = data.result;
            },
            function(error){
                mobileNotify("User Update Error : " + JSON.stringify(error));
            });
    },


    updateUserField : function (field, value) {
        var updateObj = {Id : userModel._user.Id};
        
        updateObj[field] = value;
        APP.everlive.Users.updateSingle(updateObj,
            function(data){
                var result = data.result;
            },
            function(error){
                mobileNotify("User UpdateField Error : " + JSON.stringify(error));
            }); 
        
    },


    currentUser : function (callback) {
        APP.everlive.Users.currentUser()
            .then(function (data) {
                    everlive._user = data.result;
                    callback(null, data.result)
                },
                function(error){
                    callback(error, null);

                });
    },
    

    getCount : function (dataType, callback) {
        var data = APP.everlive.data(dataType);
        data.count()
            .then(function(data){
                    var count = null;
                    if (data.result !== undefined)
                        count = data.result;
                    callback(null, count)
                },
                function(error){
                    callback(error, null);
                });
    },



    updateOne: function (dataType, dataObject, callback) {
        var data = APP.everlive.data(dataType);
        data.update(dataObject,
            function(data){
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


    createOne: function (dataType, dataObject, callback) {
        var data = APP.everlive.data(dataType);
        data.create(dataObject,
            function(data){
                callback(null, data);
            },
            function(error){
                callback(error, null);
            });
    },

    createAll : function (dataType, dataList, callback) {
        var data = APP.everlive.data(dataType);
        data.create(dataList, // filter expression
            function(data){
               callback(null, data);
            },
            function(error){
               callback(error, null);
            });
    },

    deleteOne : function (dataType, dataObject,callback) {
        var data = APP.everlive.data(dataType);
        data.destroy(dataObject, // filter expression
            function(data){
                callback(null, data);
            },
            function(error){
                callback(error, null);
            });
    },

    deleteAll : function (dataType, callback) {
        var data = APP.everlive.data(dataType);
        data.destroy( // filter expression
            function(data){
                callback(null, data);
            },
            function(error){
                callback(error, null);
            });
    },

    clearAuthentication : function () {
        APP.everlive.authentication.clearAuthorization();
       
    },

    syncStart : function () {
        mobileNotify("Syncing with Everlive");
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
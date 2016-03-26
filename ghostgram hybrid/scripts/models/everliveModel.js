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
    _isAuthenticated : false,
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
                persist: true/*,
                onAuthenticationRequired: function() {

                }*/
            }
        });

        // Wire up the everlive sync monitors
        APP.everlive.on('syncStart', everlive.syncStart);

        APP.everlive.on('syncEnd', everlive.syncEnd);

        everlive.checkAuthStatus(function (error, status) {
            if (error === null) {
                if (!status) {
                    if (userModel.hasAccount) {
                        userModel.initialView = '#usersignin';
                    } else {
                        userModel.initialView = '#newuserhome';
                    }
                } else {
                    userModel.initialView = '#home';
                }

            }
        });

    },

    checkAuthStatus : function (callback) {
        APP.everlive.authentication.getAuthenticationStatus(
            function (data) {
                if (data.status === "unauthenticated") {
                    everlive._status = data.status;
                    everlive._isAuthenticated = false;
                } else {
                    everlive._status = data.status;
                    everlive._isAuthenticated = true;
                }
                callback(null, everlive._isAuthenticated);
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
                callback(null, userModel._user.Id);
            },
            function(error){
                callback(error, null);
            });
    },

    loadUserData : function () {
        everlive.currentUser( function (err, user) {
            if (err !== null) {
                mobileNotify("Can't access User's Account : " + err.message);
                return;
            }

            userModel.setUserUUID(user.userUUID);

            var publicKey = user.publicKey;
            var privateKey = user.privateKey;
            if (publicKey === null || privateKey === null) {
                userModel.generateNewPrivateKey();
            }

            userModel._user.set('username', user.Username);
            userModel._user.set('Username', user.Username);
            userModel._user.set('DisplayName', user.DisplayName);
            userModel._user.set('name', user.name);
            userModel._user.set('recoveryPassword', user.recoveryPassword);
            userModel._user.set('Email', user.Email);
            userModel._user.set('email', user.email);
            userModel._user.set('phone', user.phone);
            userModel._user.set('alias', user.alias);
            userModel._user.set('address', user.address);
            userModel._user.set('aliasPhoto', user.aliasPhoto);
            userModel._user.set('statusMessage', user.statusMessage);
            userModel._user.set('isAvailable', user.isAvailable);
            userModel._user.set('isCheckedIn', user.isCheckedIn);
            userModel._user.set('isVisible', user.isVisible);
            userModel._user.set('isRetina', user.isRetina);
            userModel._user.set('isWIFIOnly', user.isWIFIOnly);
            userModel._user.set('isPhotoStored', user.isPhotoStored);
            userModel._user.set('saveToPhotoAlbum', user.saveToPhotoAlbum);
            userModel._user.set('currentPlace', user.currentPlace);
            userModel._user.set('googlePlaceId', user.googlePlaceId);
            userModel._user.set('lat', user.lat);
            userModel._user.set('lng', user.lng);
            userModel._user.set('currentPlaceUUID', user.currentPlaceUUID);
            userModel._user.set('photo', user.photo);
            userModel._user.set('aliasPublic', user.aliasPublic);
            userModel._user.set('userUUID', user.userUUID);
            userModel._user.set('useIdenticon', user.useIdenticon);
            userModel._user.set('useLargeView', user.useLargeView);
            userModel._user.set('rememberUsername', user.rememberUsername);

            userModel._user.set('addressList', user.addressList);
            userModel._user.set('emailList', user.emailList);
            userModel._user.set('phoneList', user.phoneList);
            userModel._user.set('homeIntro', user.homeIntro);


            userModel._user.set('publicKey', publicKey);
            userModel._user.set('privateKey', privateKey);
            userModel.decryptPrivateKey();

            userModel.createIdenticon(user.userUUID);

            var photo = user.photo;
            if (photo === undefined || photo === null) {
                userModel._user.photo =  userModel.identiconUrl;
            }


            var phoneValidated = user.phoneValidated;
            userModel._user.set('phoneValidated',phoneValidated);
            userModel._user.set('addressValidated',user.addressValidated);
            userModel._user.set('availImgUrl', 'images/status-away.svg');
            var isAvailable  = userModel._user.get('isAvailable');
            if (isAvailable) {
                userModel._user.set('availImgUrl', 'images/status-available.svg');
            }


            userModel._user.set('emailValidated', user.Verified);
            
            everlive.updateUser();
            userModel.initCloudModels();
            userModel.initPubNub();
            userStatus.update();

            APP.kendo.navigate('#home');
            userModel._user.bind('change', userModel.sync);
            

            if (phoneValidated) {
                deviceModel.setAppState('phoneValidated', true);
                notificationModel.deleteNotificationsByType(notificationModel._verifyPhone, 0);
            } else {

                mobileNotify("Please verify your phone number");
                verifyPhoneModal.openModal();

            }
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

        if (updateObj.Id === undefined || updateObj.Id === null) {
            updateObj.Id = everlive._id;
        }

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
        APP.everlive.Users.currentUser(
            function (data) {
                    everlive._user = data.result;
                    callback(null, data.result);
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
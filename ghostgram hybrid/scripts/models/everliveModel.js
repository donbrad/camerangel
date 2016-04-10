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
    _authenticating: false,
    _user : null,
    _lastSync: 0,
    _syncInProgress: true,
    _syncComplete: false,
    _delta : 30,

    init: function () {
        
      /*  var provider = Everlive.Constants.StorageProvider.FileSystem;
        if (window.navigator.simulator === undefined) {*/
            // Use local storage in the emulator
            var provider = Everlive.Constants.StorageProvider.LocalStorage;
    /*    }*/


        APP.everlive = new Everlive({
            appId: 's2fo2sasaubcx7qe',
            scheme: 'https',
            /*caching: {
                maxAge: 30, //Global setting for maximum age of cached items in minutes. Default: 60.
                enabled: true, //Global setting for enabling/disabling cache. Default is FALSE.
                typeSettings: { //Specify content type-specific settings that override the global settings.
                    "userstatus": {
                        maxAge: 5

                    }
                }
            },*/

           offline: {
               // syncUnmodified: true,
                encryption: {
                    provider: Everlive.Constants.EncryptionProvider.Default,
                        key : 'intelligram'
                }
            },

               /* storage: {
                    provider: provider
                    /!*,
                 conflicts: {
                    strategy: Everlive.Constants.ConflictResolutionStrategy.ClientWins
                    }*!/
                }/!*,

                files: {
                    storagePath: 'ghostgrams',
                    metaPath: 'ghostrams_meta'
                }*!/
            },*/
            authentication: {
                persist: true/*,
                onAuthenticationRequired: function() {
                    mobileNotify("Auth Required - kendo...");
                    if (userModel.hasAccount) {
                        everlive._signedIn = false;
                        userModel.initialView = '#usersignin';
                    } else {
                        userModel.initialView = '#newuserhome';
                    }
                    APP.kendo.navigate(userModel.initialView);
                }*/
            }
        });

        everlive.getTimeStamp();

        if (deviceModel.isOnline() ) {
            APP.everlive.online();
        } else {
            APP.everlive.offline();
        }


        // Wire up the everlive sync monitors
        APP.everlive.on('syncStart', everlive.syncStart);

        APP.everlive.on('syncEnd', everlive.syncEnd);

        everlive.isUserSignedIn();

    },

    updateTimeStamp : function () {
        everlive._lastSync = ggTime.currentTime();
        localStorage.setItem('ggEverliveTimeStamp',  everlive._lastSync);
    },

    getTimeStamp : function () {
        everlive._lastSync = localStorage.getItem('ggEverliveTimeStamp');

        if (everlive._lastSync === undefined || everlive._lastSync === null) {
            everlive.updateTimeStamp();
            everlive._syncComplete = false;
        }
    },



    syncCloud : function (){
        var time = ggTime.currentTimeInSeconds();

        if (everlive._lastSync < time) {

            everlive.updateTimeStamp();
            APP.everlive.sync();

        }
    },

    isUserSignedIn : function () {
        everlive.checkAuthStatus(function (error, status) {
            if (error === null) {
                if (status === "unauthenticated" || status === "invalidAuthentication" ||
                    status === "expiredAuthentication" || status === "invalidAuthentication") {
                    everlive.clearAuthentication();
                    everlive._authenticating = false;
                    if (userModel.hasAccount) {
                        everlive._signedIn = false;
                        everlive._syncComplete = false;
                        userModel.initialView = '#usersignin';
                    } else {
                        userModel.initialView = '#newuserhome';
                    }
                    APP.kendo.navigate(userModel.initialView);
                } else if (status === "authenticated") {
                    everlive._authenticating = false;
                    everlive._signedIn = true;
                    everlive._syncComplete = false;
                    everlive.loadUserData();
                    deviceModel.syncEverlive();
                    userModel.initialView = '#home';
                    //APP.kendo.navigate(userModel.initialView);

                }  else if (status === "authenticating") {
                    mobileNotify("Authenticating your account...");
                    if (!everlive._authenticating) {
                        everlive._authenticating = true;
                        setTimeout(function(){
                            everlive.isUserSignedIn();
                        }, 3000);
                    }

                }

            } else {
                if (error.code === 1003) {
                    setTimeout(function(){
                        everlive.isUserSignedIn();
                    }, 3000);
                } else {
                    mobileNotify("Authentication error " + JSON.stringify(error));
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
                } else if (data.status === "authenticated"){
                    everlive._status = data.status;
                    everlive._user = data.user;
                    everlive._id = data.user.Id;
                    everlive._isAuthenticated = true;

                } else if (data.status === "authenticating") {
                    everlive._status = data.status;
                    everlive._isAuthenticated = false;
                } else if (data.status === "invalidAuthentication" ){
                    everlive._status = data.status;
                    everlive._isAuthenticated = false;
                }
                callback(null, data.status);
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
        APP.everlive.authentication.login(username, password,
            function (data) {
                everlive._token = data.result.access_token;
                everlive._tokenType = data.result.token_type;
                everlive._id = data.result.principal_id;
                userModel._user.Id = data.result.principal_id;
                everlive._signedIn = true;
                everlive._isAuthenticated = true;
                callback(null, userModel._user.Id);
            },
            function(error){
                callback(error, null);
            });
    },

    loadUserData : function () {
        mobileNotify("Loading user information...");
        everlive.currentUser( function (err, user) {
            if (err !== null) {
                mobileNotify("Can't access User's Account : " + err.message);
                return;
            }

            userModel.update_user(user);
            everlive.updateUser();
            userModel.initCloudModels();
            userModel.initPubNub();
            userStatus.update();
            deviceModel.isPushProvisioned();

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
                everlive._isAuthenticated = false;
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

    recoverPassword : function (email, callback) {
        var attrs = {
            Email: email
        };
        APP.everlive.users.resetPassword(attrs,
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
        
        if (updateObj.RSAKey !== undefined) {
            delete updateObj.RSAKey;
        }


        if (deviceModel.isOnline()) {
            APP.everlive.online();
            userModel._needSync = false;
            APP.everlive.Users.updateSingle(updateObj,
                function (data) {
                    var result = data.result;
                },
                function (error) {
                    if (error.code === 107) {
                        mobileNotify("Deferring User Update...");
                    } else {
                        console.log("User Update Error : " + JSON.stringify(error));
                    }

                });
        } else {
            userModel._needSync = true;
        }
    },

    updateUserStatus : function () {
        var updateObj = {Id : everlive._id};
       
        updateObj.isAvailable  = userModel._user.isAvailable;
        updateObj.isVisible  = userModel._user.isVisible;
        updateObj.statusMessage  = userModel._user.statusMessage;
        updateObj.currentPlace  = userModel._user.currentPlace;
        updateObj.lat  = userModel._user.lat;
        updateObj.lng  = userModel._user.lng;
        updateObj.geoPoint = {longitude:  updateObj.lng, latitude: updateObj.lat};
        updateObj.googlePlaceId  = userModel._user.googlePlaceId;
        updateObj.currentPlaceUUID  = userModel._user.currentPlaceUUID;
        updateObj.isCheckedIn  = userModel._user.isCheckedIn;

        if (deviceModel.isOnline()) {
            APP.everlive.online();
            userModel._needStatusSync = false;
            APP.everlive.Users.updateSingle(updateObj,
                function(data){
                    var result = data.result;
                  
                },
                function(error){
                    if (error.code === 107) {
                        mobileNotify("Deferring User Status Update...");
                    } else {
                        console.log("User Update Status Error : " + JSON.stringify(error));
                    }
                });
        } else {
            userModel._needStatusSync = true;
        }

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
        if (!everlive._isAuthenticated) {
            callback (null, null);
            return;
        }

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

    readOne: function (dataType, objectId, callback) {
        var data = APP.everlive.data(dataType);
        data.getById(objectId,
            function(data){
                callback(null, data);
            },
            function(error){
                callback(error, null);
            });
    },

    updateOne: function (dataType, dataObject, callback) {
        var data = APP.everlive.data(dataType);
        data.updateSingle(dataObject,
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
                var Id = data.result.Id;  // get the Id from the server object
                dataObject.Id = Id;   // Add the everlive Id so caller can add to local datasource
                callback(null, dataObject);
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

    deleteOne : function (dataType, objectId, callback) {
        var data = APP.everlive.data(dataType);
        data.destroySingle({Id: objectId},
            function(data){
                callback(null, data);
            },
            function(error){
                callback(error, null);
            });
    },

    deleteMatching : function (dataType, query, callback) {
        var data = APP.everlive.data(dataType);
        data.destroy( query, // filter expression
            function(data){
                callback(null, data);
            },
            function(error){
                callback(error, null);
            });
    },

    deleteAll : function (dataType, callback) {
        var data = APP.everlive.data(dataType);
        data.destroy(
            function(data){
                callback(null, data);
            },
            function(error){
                callback(error, null);
            });
    },

    clearAccount : function () {

    },

    clearAuthentication : function () {

        APP.everlive.authentication.clearAuthorization();
        APP.everlive.authentication.clearPersistedAuthentication();
        APP.everlive.users.logout();
       
    },

    clearLocalStorage : function (callback) {
        APP.everlive.offlineStorage.purgeAll(
            function (data) {
                mobileNotify("Device storage erased");
                if (callback !== undefined) {
                    callback(null);
                }
        }, function (error) {
                if (error !== null) {
                    mobileNotify("Error clearing device storage : " + JSON.stringify(error));
                }
                if (callback !== undefined) {
                    callback(error);
                }
            });
    },
    
    syncStart : function () {

        //$('#modalview-syncEverlive').kendoMobileModalView("open");
        everlive._syncInProgress = true;
    },

    syncEnd : function (syncInfo)  {
        var err = syncInfo.error !== undefined;
        var failedItems = syncInfo.failedItems, syncedItems = syncInfo.syncedItems;

      //  $('#modalview-syncEverlive').kendoMobileModalView("close");
        everlive._syncInProgress = false;
        if (!everlive._syncComplete) {
            everlive._syncComplete = true;
            appDataChannel.history();
            userDataChannel.history();
            notificationModel.processUnreadChannels();

        }
      
        if (err ) {
            mobileNotify('Cloud Sync Error : ' + JSON.stringify(syncInfo.error));
        }


    }

};
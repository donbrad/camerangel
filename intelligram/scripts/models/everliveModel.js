/**
 * Created by donbrad on 3/1/16.
 *
 * everlive interface for userManagement
 *
 */
'use strict';

var everlive = {

    _token : null,
    _tokenType: 'bearer',
    _id : null,
    _signedIn : false,
    _isAuthenticated : false,
    _status: null,
    _authenticating: false,
    _user : null,
    _lastSync: 0,
    _syncInProgress: false,
    _syncComplete: true,
    _delta : 30,
    _initialized: false,
    _triedToken: false,

    reset : function () {
        everlive._initialized = false;
        everlive._isAuthenticated = false;
        everlive._signedIn = false;
        everlive._syncInProgress = false;
        everlive._syncComplete = false;
        everlive._user = null;
        everlive._id = null;
        everlive._token = null;
        everlive._lastSync = 0;
    },

     isConnected : function () {
         if (deviceModel.isOnline()){
             APP.everlive.online();
             return(true);
         } else {
             APP.everlive.offline();
             return(false);
         }
    },

    init: function () {
        
      /*  var provider = Everlive.Constants.StorageProvider.FileSystem;
        if (window.navigator.simulator === undefined) {*/
            // Use local storage in the emulator
            var provider = Everlive.Constants.StorageProvider.LocalStorage;
    /*    }*/

        if (everlive._initialized) {
            var online = everlive.isConnected();
            return;
        }

        
        if (deviceModel.isOnline()) {

            everlive._initialized = true;

            APP.everlive = new Everlive({
                appId: 's2fo2sasaubcx7qe',
                scheme: 'https',/*,
                caching: {
                    maxAge: 10, //Global setting for maximum age of cached items in minutes. Default: 60.
                    enabled: true
                },*/
                /*caching: {
                     maxAge: 30, //Global setting for maximum age of cached items in minutes. Default: 60.
                     enabled: true, //Global setting for enabling/disabling cache. Default is FALSE.
                     typeSettings: { //Specify content type-specific settings that override the global settings.
                     "userstatus": {
                         maxAge: 5
                     }
                    }
                 },
*/
               /* offlineStorage: true,*/
                offlineStorage: {
                    storage: {
                        provider: Everlive.Constants.StorageProvider.FileStorage
                    },
                    encryption: {
                        key : 'kkwllc2016'
                    },
                    conflicts: {
                        strategy: Everlive.Constants.ConflictResolutionStrategy.ClientWins
                    }
                },
                authentication: {
                    persist: true/*,
                     onAuthenticationRequired: function() {
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
    
            everlive.getCredentials();
    
            //everlive.updateCredentials();

            // Wire up the everlive sync monitors
            APP.everlive.on('syncStart', everlive.syncStart);

            APP.everlive.on('syncEnd', everlive.syncEnd);

            everlive.isUserSignedIn();

        } else {
            everlive.goOffline();
            if (userModel._userObj !== null) {
                userModel.update_user(userModel._userObj);
            } else {

            }

        }
    },

    getCredentials : function () {
       everlive._id =  localStorage.getItem('ggEverliveUserId');
        if (everlive._id === undefined) {
            everlive._id = null;
        }
        everlive._token =  localStorage.getItem('ggEverliveUserToken');
        if (everlive._token === undefined) {
            everlive._token = null;
        }
    },

    putCredentials : function () {
        localStorage.setItem('ggEverliveUserToken',  everlive._token);
        localStorage.setItem('ggEverliveUserId',  everlive._id);
    },

    updateCredentials : function () {
        if (everlive._token !== null && everlive._id !== null) {
            APP.everlive.authentication.setAuthorization(everlive._token, 'bearer', everlive._id)
        }

    },

    updateTimeStamp : function () {
        everlive._lastSync = ggTime.currentTime();
        localStorage.setItem('ggEverliveTimeStamp',  everlive._lastSync);
    },

    getTimeStamp : function () {
        everlive._lastSync = localStorage.getItem('ggEverliveTimeStamp');

        if (everlive._lastSync === undefined || everlive._lastSync === null) {
            everlive.updateTimeStamp();
            everlive._syncComplete = true;
        }
    },

    goOnline : function () {
        if (APP.everlive !== null)
            APP.everlive.online();
    },

    goOffline : function () {
        if (APP.everlive !== null)
            APP.everlive.offline();
    },

    syncCloud : function (){
        if (!everlive.isConnected()) {
            return;
        }
        var time = ggTime.currentTimeInSeconds();

        if (everlive._lastSync < time) {

            everlive.updateTimeStamp();
            APP.everlive.online();
            userModel.syncCloudModels();
            //APP.everlive.sync();

        }
    },

    resendEmailValidation : function (email, callback) {

        var object = {
            "Username": userModel._user.username
        };

        $.ajax({
            type: "POST",
            url: 'http://api.everlive.com/v1/s2fo2sasaubcx7qe/Users/verify/resend',
            contentType: "application/json",
            data: JSON.stringify(object),
            success: function(data){
                mobileNotify("Email verification instructtions were sent to " + email);
                if (callback !== undefined && callback !== null) {
                    callback({error: null, wasSent: true, isVerifed: false});
                }
            },
            error: function(error){
                if (error.responseJSON.errorCode === 210) {
                    if (callback !== undefined && callback !== null) {
                        callback({error: null, wasSent: true, isVerified: true});
                    }
                } else {
                    ggError("Email Validation Resend Error : " + JSON.stringify(error));
                    if (callback !== undefined && callback !== null) {
                        callback({error: error, wasSent: false, isVerifed: false});
                    }
                }


            }
        });

        /*APP.everlive.Users.updateSingle(updateObject,
            function (data) {
                var result = data.result;
                mobileNotify("Email verification instructtions were sent to " + email);
            },
            function (error) {
                if (error.code === 107) {
                    mobileNotify("Emall Validation Resend - Deferring User Update...");
                } else {
                    ggError("Emall Validation Resend Error : " + JSON.stringify(error));
                }

            });*/
    },

    isUserSignedIn : function () {

        APP.everlive.Users.currentUser(
            function (data) {
                if (data.result) {
                    everlive._user = data.result;
                    everlive._authenticating = false;
                    everlive._signedIn = true;
                    everlive._syncComplete = false;
                   // everlive.checkCurrentUser();
                    everlive.loadUserData(everlive._user);
                    everlive.isAuthenticated = true;
                    everlive.triedToken = false;
                    userModel.initialView = '#home';
                    APP.kendo.navigate(userModel.initialView);
                } else {
                    if (userModel.hasAccount) {
                        everlive._signedIn = false;
                        everlive._syncComplete = false;
                        everlive.isAuthenticated = false;
                        userModel.initialView = '#usersignin';
                    } else {
                        userModel.initialView = '#newuserhome';
                    }
                    APP.kendo.navigate(userModel.initialView);
                }

            },
            function(error){
                everlive.clearAuthentication();
          //      everlive.logout(function (){
                    if (userModel.hasAccount) {
                        everlive._signedIn = false;
                        everlive._syncComplete = false;
                        everlive.isAuthenticated = false;
                        userModel.initialView = '#usersignin';
                    } else {
                        userModel.initialView = '#newuserhome';
                    }
                    APP.kendo.navigate(userModel.initialView);
  //              });

        });

       /* everlive.checkAuthStatus(function (error, status) {
            if (error === null) {
                if (status === "unauthenticated" || status === "invalidAuthentication" ||
                    status === "expiredAuthentication" ) {
                    everlive._authenticating = false;
                    if (userModel.hasAccount) {
                        everlive._signedIn = false;
                        everlive._syncComplete = false;
                        everlive.isAuthenticated = false;
                        userModel.initialView = '#usersignin';
                    } else {
                        userModel.initialView = '#newuserhome';
                    }
                    APP.kendo.navigate(userModel.initialView);
                } else if (status === "authenticated") {
                    everlive._authenticating = false;
                    everlive._signedIn = true;
                    everlive._syncComplete = false;
                    everlive.checkCurrentUser();
                    everlive.isAuthenticated = true;
                    userModel.initialView = '#home';
                   // APP.kendo.navigate(userModel.initialView);

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
                if (error !== undefined && error !== null && error !== "") {
                    if (error.code !== undefined) {
                        if (error.code === 1003) {
                            setTimeout(function () {
                                everlive.isUserSignedIn();
                            }, 3000);
                        } else {
                            ggError("Authentication error " + JSON.stringify(error));
                        }
                    }
                }
            }
        });*/

    },

/*    checkAuthStatus : function (callback) {
        APP.everlive.authInfo(
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
    },*/


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
                everlive._token = data.result.access_token;
                everlive._tokenType = data.result.token_type;
                everlive.putCredentials();
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
                everlive._isAuthenticated = true;
                everlive.putCredentials();
                callback(null, userModel._user.Id);
            },
            function(error){
                callback(error, null);
            });
    },

    checkCurrentUser : function () {
        everlive.currentUser( function (err, user) {
            if (err!== undefined && err !== null) {
                ggError("Can't access User's Account : " + err.message);
                return;
            }

            everlive.loadUserData(user);
        });
    },

    loadUserData : function (user) {
        mobileNotify("Loading user data...");

        userModel.update_user(user);
        userModel.initPubNub();
        everlive.updateUser();
        userModel.initCloudModels();
        userStatus.update();
        //userModel.syncCloudModels();


        //deviceModel.syncEverlive();

        homeView.enableHotButtons();
        userModel._user.bind('change', userModel.sync);

        if (deviceModel.initialAction !== null) {
            var action = deviceModel.initialAction.action.capitalize('title');
            mobileNotify(action + " requested @ " + moment(deviceModel.initialAction.timestamp).format("MM/DD/YY hh:mm a"));

        }

        if (APP.kendo.view().id !== 'home') {
            APP.kendo.navigate("#home");
        }
    },

    logout : function (callback) {
        if (!everlive.isConnected()) {
            callback(false);
        }
        APP.everlive.users.logout(function (result) {
                everlive._signedIn = false;
                everlive._isAuthenticated = false;
                callback(true);
            }, // success
            function (error) {
                callback(false);
            });
    },

    changePassword : function (newPassword, callback) {
        if (!everlive.isConnected()) {
            callback("No Connection", false);
        }
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
        if (!everlive.isConnected()) {
            callback("No Connection", false);
        }
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
                    if (error !== undefined && error !== null && error !== "") {
                        if (error.code !== undefined) {
                            if (error.code === 107) {
                                mobileNotify("Deferring User Update...");
                            } else {
                                debugger;
                                //console.log("User Update Error : " + JSON.stringify(error));
                            }
                        }
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
                    if (error !== undefined && error !== null && error !== "") {
                        if (error.code !== undefined) {
                            if (error.code === 107) {
                                mobileNotify("Deferring User Status Update...");
                            } else {
                                debugger;
                                //console.log("User Update Status Error : " + JSON.stringify(error));
                            }
                        }
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
        if (!everlive.isConnected()) {
            callback("No Connection", null);
        }

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

    update: function (dataType, dataObject, filterObject, callback) {
        var data = APP.everlive.data(dataType);
        data.update(dataObject, filterObject,
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

        APP.everlive.users.clearAuthorization();
        APP.everlive.authentication.clearPersistedAuthentication();
        //APP.everlive.authentication.logout();
       
    },

    clearLocalStorage : function () {
        APP.everlive.offlineStorage.purgeAll(
            function (data) {
                mobileNotify("Device storage erased");

        }, function (error) {
                if (error !== null) {
                    ggError("Error clearing device storage : " + JSON.stringify(error));
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


        everlive._syncInProgress = false;
        if (!everlive._syncComplete) {
            everlive._syncComplete = true;

        }
      
        if (err ) {
            ggError('Cloud Sync Error : ' + JSON.stringify(syncInfo.error));
        }


    }

};
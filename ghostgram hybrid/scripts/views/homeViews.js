/**
 * Created by donbrad on 9/29/15.
 * homeViews.js -- all view management for userstatus, login, logout, home and newuserhome
 */


'use strict';

/*
 * userStatusView -- currently modalview
 */

var userStatusView = {
    _activeStatus : new kendo.data.ObservableObject(),
    _returnView : null,
    _modalId : "#modalview-profileStatus",
    _profileStatusMax: 35,

    _update : function () {
        var status = userStatusView._activeStatus, user = userModel.currentUser;
        
       	/// setting up user

        // Set name/alias layout
        ux.formatNameAlias(user.name, user.alias, "#modalview-profileStatus");
        $('#profileStatusMessage').text(user.get('statusMessage'));

        // Zero the status character count
        $("#profileStatusUpdate").val('');
        $("#statusCharCount").text(userStatusView._profileStatusMax);
        /* Setup syncing for automatic update
        userStatusView._activeStatus.unbind('change' , userStatusView.syncUserStatus);
        */

        // Set available
		if(user.isAvailable){
			$(".userAvailable").attr("src", "images/status-available.svg");
			$(".userAvailableRev").attr("src", "images/status-away.svg");
			$("#currentAvailableTxt").text("busy");

		} else {
			$(".userAvailable").attr("src", "images/status-away.svg");
			$(".userAvailableRev").attr("src", "images/status-available.svg");
			$("#currentAvailableTxt").text("available");
		}

		/// Setting up status

        status.set('statusMessage', user.statusMessage);

        if (user.isCheckedIn) {
            status.set('currentPlace', user.currentPlace);
        } else {
            status.set('currentPlace','');
        }

        status.set('isAvailable', user.isAvailable);

        // if there's a current checked in place -- select it in the list
        if (user.currentPlaceUUID !== null && user.isCheckedIn) {

        	$("#profileCheckOutLi").removeClass("hidden");
        	$("#checkOut-text").text(user.currentPlace);

        } else {
            $('#profileCheckOutLi').addClass('hidden');
        	// hide checkout if not checked in
        	$("#checked-in-place").addClass("hidden");

        	// hide checkin selection 
        	$("#userStatusLocationBox").addClass("hidden");

        }

    },

    // Main entry point for userstatus modal
    openModal : function (e) {
        _preventDefault(e);

        //Cache the current view
        userStatusView._returnView = APP.kendo.view().id;

       // mobileNotify("Updating your location...");

        if (userModel.currentUser.isCheckedIn && userModel.currentUser.currentPlaceUUID !== null) {
            // hide location if the user is not checked in
            $("#profileLocation, #checked-in-place").removeClass("hidden");
        } else {
            $("#profileLocation, #checked-in-place").addClass("hidden");
        }

        $(".statusCharacterCount").css("color", "#979797");

        mapModel.getCurrentAddress(function (isNew, address) {
            // Is this a new location
           /* if (isNew) {
                $('#profileCheckInLi').removeClass('hidden');
            } else {
                $('#profileCheckInLi').addClass('hidden');
            }*/
        });

        userStatusView._update();

        $(userStatusView._modalId).data("kendoMobileModalView").open();

    },

    // close and redirect for user status
    closeModal : function () {

      	// if there's a return URL, need to close the modal and then redirect to original view
        $(userStatusView._modalId).data("kendoMobileModalView").close();

        var updatedStatus = $("#profileStatusUpdate").val();
        if(updatedStatus !== "") {
            // Save new status
            userModel.currentUser.set("statusMessage", updatedStatus);
            updateParseObject('userStatus','userUUID', userModel.currentUser.uuid, "statusMessage", updatedStatus);
        }
        // clear status box
        $("#profileStatusUpdate").val("");
        $(".statusCharCount").text(userStatusView._profileStatusMax);

        if (userStatusView._returnView !== null) {
            if (APP.kendo.view().id !== userStatusView._returnView)
                APP.kendo.navigate('#' + userStatusView._returnView);

            userStatusView._returnView = null;

        }

    },

    openCheckIn : function (e) {
        _preventDefault(e);

        userStatusView.closeModal();

        checkInView.locateAndOpenModal(function () {
            userStatusView.openModal();
        })
    },

    checkIn : function (e) {
        _preventDefault(e);

        if (mapModel.currentPlaceId !== null) {

            userModel.checkIn(mapModel.currentPlaceId);
            mapModel.checkIn(mapModel.currentPlaceId);
            mobileNotify("You're checked in!");
            $('#profileCheckOutLi').velocity("slideDown", {begin: function(element){
            	$(element).removeClass("hidden");
            }
        });
        } else {
            mobileNotify("No place to check in to...");
        }

    },

    checkOut : function (e) {
        _preventDefault(e);

        $('#profileCheckInLi').removeClass('hidden');
        $('#profileCheckOutLi').velocity("slideUp", {complete: function(element){
        	$(element).addClass("hidden");
        	}
    	});
        userModel.checkOut();
        mapModel.checkOut();
        $('#profileStatusCheckInPlace').text('');
    },

    syncUserStatus: function (e) {
        _preventDefault(e);

        userModel.currentUser.set(e.field, this[e.field]);
        updateParseObject('userStatus','userUUID', userModel.currentUser.uuid, e.field, this[e.field]);

    },

    // Important to put all jquery and other event handlers here so created only once...
    onInit : function (e) {
        _preventDefault(e);

        userStatusView.statusCharCount(e);

        userStatusView._activeStatus.bind('change' , userStatusView.syncUserStatus);
    },

    statusCharCount: function(e) {
		// set max length
		var maxLength = userStatusView._profileStatusMax;
		var currentLength;
		
		// set current status count 
		$(".statusCharCount").text(maxLength);
		$("#profileStatusUpdate").keyup(function(e){
			var length = $(this).val().length;

			currentLength = maxLength - length;
			$(".statusCharCount").text(currentLength);

			if(currentLength < 8){
				$(".statusCharacterCount").css("color", "#EF5350");
			} else {
				$(".statusCharacterCount").css("color", "");
			}	
		});

	},


    // Kendo open
    onOpen: function (e) {
        _preventDefault(e);
    },

    // Kendo close
    onClose: function (e) {
      //  _preventDefault(e);   calling on close prevents kendos normal modal handling

    }
};

/*
 * Generic parameterized modal dialog
 */
var modalView = {
    okAction: null,
    cancelAction: null,

    init: function() {
        modalView.okAction = null;
        modalView.cancelAction = null;
        $('#modalCancel').addClass('hidden');

    },

    // Open the standard Ok/Cancel dialog
    open: function (title, description, ok, okAction, cancel, cancelAction) {

       $('#modalTitle').html(title);
        if (description !== null) {
            $('#modalDescription').html(description);
        }

        $('#modalOk').html(ok);


        if (okAction !== null) {
            modalView.okAction = okAction;
        }

        if (cancelAction !== null) {
            modalView.cancelAction = cancelAction;
        }
        if (cancel !== null) {
            $('#modalCancel').html(cancel);
        }

        $('#modalCancel').removeClass('hidden');
        $('#modal-dialog').data('kendoMobileModalView').open();
    },

    // Open an info dialog -- just OK no cancel button or ux.
    openInfo : function (title, description, ok, okAction) {
        $('#modalTitle').html(title);
        if (description !== null) {
            $('#modalDescription').html(description);
        }

        $('#modalOk').html(ok);


        if (okAction !== null) {
            modalView.okAction = okAction;
        }

        $('#modalCancel').addClass('hidden');
        $('#modal-dialog').data('kendoMobileModalView').open();
    },

    close : function () {
        $('#modal-dialog').data('kendoMobileModalView').close();
    },

    okClick: function () {
        modalView.close();

        if (modalView.okAction !== null) {
            modalView.okAction();
        }
        modalView.init();
    },

    cancelClick: function () {
        modalView.close();

        if (modalView.cancelAction !== null) {
            modalView.cancelAction();
        }
        modalView.init();
    }


};


var ghostEditView = {
    _callback : null,
    _returnview : null,

    onInit: function (e) {

        _preventDefault(e);
        autosize($('#ghostEmailEditor'));

        $("#ghostEmailEditor").kendoEditor({
            tools: [
                "bold",
                "italic",
                "underline",
                "justifyLeft",
                "justifyCenter",
                "justifyRight",
                "insertUnorderedList",
                "indent",
                "outdent",
                "createTable",
                "fontSize",
                {
                    name: "insertImage",
                    exec: function (e) {
                        e.preventDefault();
                        modalGalleryView.openModal(function(imageUrl){
                            $('#ghostEmailEditor').data("kendoEditor").paste('<div style="max-width: 50%; max-height: 50%;>" <img src="'+imageUrl+'"/></div>', {split: true});
                        });
                    }

                }
            ]
        });
    },

    onShow : function (e) {
        _preventDefault(e);
        if (e.view.params.callback !== undefined) {
            ghostEditView._callback = e.view.params.callback;
        } else {
            ghostEditView._callback = null;
        }

        if (e.view.params.returnview !== undefined) {
            ghostEditView._returnview = e.view.params.returnview;
        } else {
            ghostEditView._returnview = null;
        }

        autosize.update($('#ghostEmailEditor'));
        $('#ghostEmailEditor').data("kendoEditor").value("");
        $('#ghostEmailEditor').data("kendoEditor").focus();
    },

    onDone : function (e) {
        _preventDefault(e);

        if (ghostEditView._returnview !== null) {
            APP.kendo.navigate('#'+ghostEditView._returnview);
        }

        if (ghostEditView._callback  === 'contactaction') {

            contactActionView.restoreModal();
        }
    },

    openModal : function(callback) {

        if (callback !== undefined) {
            ghostEditView._callback = callback;
        } else {
            ghostEditView._callback = null;
        }
        $('#ghostEmailEditor').data("kendoEditor").value("");
        $('#ghostEditModal').data('kendoMobileModalView').open();
        $('#ghostEmailEditor').data("kendoEditor").focus();

    },

    closeModal : function (e) {

        _preventDefault(e);

        $('#ghostEditModal').data('kendoMobileModalView').close();
        if (ghostEditView._callback  !== null) {
            ghostEditView._callback();
        }
    },

    sendGhostEmail : function (e) {
        _preventDefault(e);

        var content = $('#ghostEmailEditor').data("kendoEditor").value();
        var contactKey = contactModel.currentContact.get('publicKey'), email = contactModel.currentContact.get('email');
       /* if (contactKey === null) {
            mobileNotify("Invalid Public Key for " + contactModel.currentContact.get('name'));
            return;
        }
        var encryptContent = cryptico.encrypt(content, contactKey);*/
        if (window.navigator.simulator === true){
            alert("Mail isn't supported in the emulator");
        } else {
            var thisUser = userModel.currentUser.get('name');
            cordova.plugins.email.open({
                to:          [email],
                subject:     'ghostgram from ' + thisUser,
                body:        content,
                isHtml:      true
            }, function (msg) {
                mobileNotify("Email sent to " + thisUser);
                ghostEditView.onDone();
                // navigator.notification.alert(JSON.stringify(msg), null, 'EmailComposer callback', 'Close');
            });
        }

    }
};

/*
 * Profile Photo Capture / Edit
 * parameterized for user profile and contact profile
 */

var editProfilePhotoView = {
    _callback : null,
    _photoUrl: null,
    _isUserProfile : true,
    _contactId : null,

    onInit : function (e) {
        _preventDefault(e);

    },

    onShow : function (e) {
        _preventDefault(e);

    },

    onDone : function (e) {

    },

    setCallback : function (callback) {
        if (callback !== undefined) {
            editProfilePhotoView._callback = callback;
        }
    },

    setPhotoUrl : function (url) {
        editProfilePhotoView._photoUrl = url;
        $("#profilePhotoImage").attr('src', url);
    },

    doCamera : function (e) {
      _preventDefault(e);

        deviceCamera(
            1200, // max resolution in pixels
            75,  // quality: 1-99.
            false,  // isChat -- generate thumbnails and autostore in gallery.  photos imported in gallery are treated like chat photos
           editProfilePhotoView.setPhotoUrl  // Optional preview callback
        )
    },

    doPhotoGallery : function(e) {
        _preventDefault(e);

        deviceGallery(
            1200, // max resolution in pixels
            75,  // quality: 1-99.
            false,  // isChat -- generate thumbnails and autostore in gallery.  photos imported in gallery are treated like chat photos
            editProfilePhotoView.setPhotoUrl  // Optional preview callback
        );
    },

    doMemories : function (e) {
       _preventDefault(e);
        galleryPicker.openModal(function (photo) {

        });
    },

    updateUserPhotoUrl : function (e) {
        _preventDefault(e);
        userModel.currentUser.set("photo", editProfilePhotoView._photoUrl);
    }
};


var newUserView = {
    _actionCreate: "Join ghostgrams",
    _actionLogin : "Sign In",
    _clickCreate : true,

    onInit : function (e) {
        _preventDefault(e);

        $("#home-signin-username").on("input", function(e) {
            newUserView.checkUserName();
        });

        $("#home-signin-password").on("input", function(e){

        });

    },

    checkUserName : function () {
        var email = $("#home-signin-password").val();
        if (email.length > 0) {
            newUserView.setLoginMode();
        } else {
            newUserView.setCreateMode();
        }
    },

    onShow : function (e) {
        _preventDefault(e);

        if (userModel.rememberUsername && userModel.username !== '') {
            $('#home-signin-username').val(userModel.username)
        }

       newUserView.checkUserName();
    },

    onClick : function (e) {

        if (newUserView._clickCreate) {
            newUserView.doCreateAccount();
        } else {
            newUserView.doSignIn();
        }
    },

    onClear : function (e) {
        $('#home-signin-username').val('');
        $('#home-signin-password').val('');
        newUserView.setCreateMode();
    },

    setCreateMode : function () {
        $("#newuserhomeActionBtn").text(newUserView._actionCreate);
        newUserView._clickCreate = true;
    },

    setLoginMode : function () {
        $("#newuserhomeActionBtn").text(newUserView._actionLogin);
        newUserView._clickCreate = false;
    },

    validate : function () {
        var form = $("#formSignIn").kendoValidator().data("kendoValidator");

        if (form.validate()) {
            // If the form is valid, run sign in
            newUserView.doSignIn();
        }
    },

    doSignIn : function () {
        // hide keyboard
        ux.hideKeyboard();

        var username = $('#home-signin-username').val(), password = $('#home-signin-password').val();

        mobileNotify("Signing you in to ghostgrams....");


        Parse.User.logIn(username,password , {
            success: function(user) {
                // Do stuff after successful login.
                ux.closeModalViewLogin();
                // Clear sign in form
                $("#home-signin-username, #home-signin-password").val("");
                userModel.parseUser = user;

                userModel.generateUserKey();

                // Check version -- ensure all users are version 1 with new public/private keys
                if (userModel.parseUser.get("version") === undefined) {
                    userModel.generateNewPrivateKey(userModel.parseUser);
                    userModel.parseUser.set("version", 1);
                    userModel.parseUser.save();
                }
                var publicKey = user.get('publicKey');
                var privateKey = user.get('privateKey');
                if (publicKey === undefined || privateKey === undefined) {
                    userModel.generateNewPrivateKey(user);
                } else {
                    userModel.updatePrivateKey();
                }

                userModel.currentUser.set('username', userModel.parseUser.get('username'));
                userModel.currentUser.set('name', userModel.parseUser.get('name'));
                userModel.currentUser.set('email', userModel.parseUser.get('email'));
                userModel.currentUser.set('phone', userModel.parseUser.get('phone'));
                userModel.currentUser.set('alias', userModel.parseUser.get('alias'));
                userModel.currentUser.set('aliasPhoto', userModel.parseUser.get('aliasPhoto'));
                userModel.currentUser.set('statusMessage', userModel.parseUser.get('statusMessage'));
                userModel.currentUser.set('isAvailable', userModel.parseUser.get('isAvailable'));
                userModel.currentUser.set('isCheckedIn', userModel.parseUser.get('isCheckedIn'));
                userModel.currentUser.set('isVisible', userModel.parseUser.get('isVisible'));
                userModel.currentUser.set('isRetina', userModel.parseUser.get('isRetina'));
                userModel.currentUser.set('isWIFIOnly', userModel.parseUser.get('isWIFIOnly'));
                userModel.currentUser.set('isPhotoStored', userModel.parseUser.get('isPhotoStored'));
                userModel.currentUser.set('saveToPhotoAlbum', userModel.parseUser.get('saveToPhotoAlbum'));
                userModel.currentUser.set('currentPlace', userModel.parseUser.get('currentPlace'));
                userModel.currentUser.set('currentPlaceUUID', userModel.parseUser.get('currentPlaceUUID'));
                userModel.currentUser.set('photo', userModel.parseUser.get('photo'));
                userModel.currentUser.set('aliasPublic', userModel.parseUser.get('aliasPublic'));
                userModel.currentUser.set('userUUID', userModel.parseUser.get('userUUID'));
                userModel.currentUser.set('useIdenticon', userModel.parseUser.get('useIdenticon'));
                userModel.currentUser.set('useLargeView', userModel.parseUser.get('useLargeView'));
                userModel.currentUser.set('rememberUsername', userModel.parseUser.get('rememberUsername'));
                userModel.currentUser.set('publicKey', publicKey);
                userModel.decryptPrivateKey();
                //		userModel.currentUser.set('privateKey', privateKey);
                userModel.createIdenticon(userModel.parseUser.get('userUUID'));
                var phoneVerified = userModel.parseUser.get('phoneVerified');
                userModel.currentUser.set('phoneVerified', phoneVerified);
                userModel.currentUser.set('availImgUrl', 'images/status-away.svg');
                var isAvailable  = userModel.currentUser.get('isAvailable');
                if (isAvailable) {
                    userModel.currentUser.set('availImgUrl', 'images/status-available.svg');
                }

                if (phoneVerified) {
                    deviceModel.setAppState('phoneVerified', true);
                    notificationModel.deleteNotification('phoneVerified');
                } else {
                    mobileNotify("Please verify your phone number");
                    $("#modalview-verifyPhone").data("kendoMobileModalView").open();
                }
                userModel.currentUser.set('emailValidated', userModel.parseUser.get('emailVerified'));
                userModel.parseACL = new Parse.ACL(userModel.parseUser);
                userModel.currentUser.bind('change', userModel.sync);
                userModel.fetchParseData();

                APP.kendo.navigate('#home');
            },
            error: function(user, error) {
                // The login failed. Check error to see why.
                mobileNotify("Error: " + error.code + " " + error.message);
            }
        });

    },

    doCreateAccount : function (e) {
        _preventDefault (e);

        var user = new Parse.User();
        var username = $('#home-signup-username').val();
        var name = $('#home-signup-fullname').val();
        var password = $('#home-signup-password').val();
        var phone = $('#home-signup-phone').val();
        var alias = $('#home-signup-alias').val();

        var userUUID = uuid.v4();

        // clean up the phone number and ensure it's prefixed with 1
        // phone = phone.replace(/\+[0-9]{1-2}/,'');
        phone = unformatPhoneNumber(phone);

        Parse.Cloud.run('validateMobileNumber', { phone: phone }, {
            success: function(result) {
                if (result.status !== 'ok' || result.result.carrier.type !== 'mobile') {
                    mobileNotify("This phone number is not a valid mobile number.");
                    return;
                } else {
                    Parse.Cloud.run('preflightPhone', { phone: phone }, {
                        success: function(result) {
                            if (result.status !== 'ok' || result.count !== 0) {
                                mobileNotify("Your phone number matches existing user.");
                                return;
                            } else {

                                //Phone number isn't a duplicate -- create user
                                user.set("username", username);
                                user.set("password", password);
                                user.set("email", username);
                                user.set("name", name);
                                user.set("phone", phone);
                                user.set("alias", alias);
                                user.set("aliasPublic", "ghostgram user");
                                user.set("currentPlace", "");
                                user.set("currentPlaceUUID", "");
                                user.set('photo', null);
                                user.set('aliasPhoto', null);
                                user.set("isAvailable", true);
                                user.set("isVisible", true);
                                user.set("isCheckedIn", false);
                                user.set("availImgUrl", "images/status-available.svg");
                                user.set("phoneVerified", false);
                                user.set("useIdenticon", true);
                                user.set("useLargeView", false);
                                user.set("rememberUsername", false);
                                user.set("userUUID", userUUID);
                                //user.set("publicKey", publicKey);
                                //user.set("privateKey", privateKey);

                                user.signUp(null, {
                                    success: function(user) {

                                        userModel.parseUser = user;
                                        userModel.generateUserKey();
                                        // Hooray! Let them use the app now.
                                        userModel.currentUser.set('username', user.get('username'));
                                        userModel.currentUser.set('name', user.get('name'));
                                        userModel.currentUser.set('email', user.get('email'));
                                        userModel.currentUser.set('phone', user.get('phone'));
                                        userModel.currentUser.set('alias', user.get('alias'));
                                        userModel.currentUser.set('currentPlace', user.get('currentPlace'));
                                        userModel.currentUser.set('currentPlaceUUID', user.get('currentPlaceUUID'));
                                        userModel.currentUser.set('photo', user.get('photo'));
                                        userModel.currentUser.set('isAvailable', user.get('isAvailable'));
                                        userModel.currentUser.set('isVisible', user.get('isVisible'));
                                        userModel.currentUser.set('isRetina', user.get('isRetina'));
                                        userModel.currentUser.set('isWIFIOnly', user.get('isWIFIOnly'));
                                        userModel.currentUser.set('isPhotoStored', user.get('isPhotoStored'));
                                        userModel.currentUser.set('saveToPhotoAlbum', user.get('saveToPhotoAlbum'));
                                        userModel.currentUser.set('aliasPhoto', user.get('aliasPhoto'));
                                        userModel.currentUser.set('userUUID', user.get('userUUID'));
                                        userModel.currentUser.set('phoneVerified', false);
                                        userModel.currentUser.set('useLargeView', false);
                                        userModel.currentUser.set('useIdenticon',user.get('useIdenticon'));
                                        userModel.currentUser.set('emailValidated',user.get('emailVerified'));
                                        userModel.generateNewPrivateKey(user);

                                        userModel.createIdenticon(userUUID);
                                        //userModel.currentUser.set('publicKey',user.get('publicKey'));
                                        //userModel.currentUser.set('privateKey',user.get('privateKey'));
                                        userModel.currentUser.bind('change', userModel.sync);
                                        userModel.parseACL = new Parse.ACL(Parse.User.current());
                                        mobileNotify('Welcome to ghostgrams!');
                                        /*if (window.navigator.simulator !== true) {

                                         cordova.plugins.notification.local.add({
                                         id         : 'userWelcome',
                                         title      : 'Welcome to ghostgrams',
                                         message    : 'You have a secure connection to your family, friends and favorite places',
                                         autoCancel : true,
                                         date : new Date(new Date().getTime() + 120)
                                         });
                                         }*/

                                        Parse.Cloud.run('sendPhoneVerificationCode', { phoneNumber: phone }, {
                                            success: function (result) {
                                                mobileNotify('Please verify your phone');
                                                $("#modalview-verifyPhone").data("kendoMobileModalView").open();
                                            },
                                            error: function (result, error){
                                                mobileNotify('Error sending verification code ' + error);
                                            }
                                        });



                                        APP.kendo.navigate('#home');
                                    },

                                    error: function(user, error) {
                                        // Show the error message somewhere and let the user try again.
                                        mobileNotify("Error: " + error.code + " " + error.message);
                                    }
                                });

                            }
                        },
                        error: function(error) {
                            mobileNotify("Error checking phone number" + error);
                        }
                    });
                }
            },
            error: function(user, error) {
                // Show the error message somewhere and let the user try again.
                mobileNotify("Error: " + error.code + " " + error.message);
            }
        });

    }


};
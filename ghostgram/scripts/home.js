/* global placesView, APP, userModel */

'use strict';



function homeBeforeShow () {

    if (userModel._user) {
        // Have current user - redirect to user view
        APP.kendo.navigate('#home');

    } else {
        // No current user -redirect to no user view
       APP.kendo.navigate('#newuserhome');
    }
} 

function dismissNotification (e) {
	e.preventDefault();
	var uuid = e.sender.element[0].attributes['data-uuid'].value;
	
	var data = deviceModel.state.userNotifications;
	for(var i = 0; i < data.length; i++) {
		if(data[i].uuid == uuid) {
			data.splice(i, 1);
			break;
		}
	}
	
	deviceModel.setAppState('userNotifications', JSON.stringify(data));
	notificationModel.deleteNotificationById(uuid);
	
}



function onBeforeOpenPhoto() {
	$('#photoImage').attr('src', photoModel.currentPhoto.src);
}

function pruneNotifications() {
	if 	( deviceModel.state.phoneValidated) {
		notificationModel.deleteNotificationsByType(notificationModel._verifyPhone, 0);
	}

}

function initSignUp() {
	// Simple phone mask - http://jsfiddle.net/mykisscool/VpNMA/
	/*
	$('#home-signup-phone')

	.keydown(function (e) {
		var key = e.charCode || e.keyCode || 0;
		var $phone = $(this);

		// Auto-format- do not expose the mask as the user begins to type
		if (key !== 8 && key !== 9) {
			if ($phone.val().length === 4) {
				$phone.val($phone.val() + ')');
			}
			if ($phone.val().length === 5) {
				$phone.val($phone.val() + ' ');
			}			
			if ($phone.val().length === 9) {
				$phone.val($phone.val() + '-');
			}
		}

		// Allow numeric (and tab, backspace, delete) keys only
		return (key == 8 || 
				key == 9 ||
				key == 46 ||
				(key >= 48 && key <= 57) ||
				(key >= 96 && key <= 105));	
	})
	.keyup(function(e){
		if ($(this).val().length === 14) {
				continueSignUp();
			$('#home-signup-phone').unbind("keyup")
			}
	})
	
	.bind('focus click', function () {
		var $phone = $(this);
		
		if ($phone.val().length === 0) {
			$phone.val('(');
		}
		else {
			var val = $phone.val();
			$phone.val('').val(val); // Ensure cursor remains at the end
		}
	})
	
	.blur(function () {
		var $phone = $(this);
		
		if ($phone.val() === '(') {
			$phone.val('');
		}
	});
	

	$("#create-user-email, #create-user-name, #create-user-alias, #create-user-password").css("display", "none");
	*/

}



function onShowSignIn(e){

	e.preventDefault();


	$("#home-signin-username").on("input", function(e) {
		var email = $("#home-signin-password").val();


	});

	$("#home-signin-password").on("keyup", function(e){
		if (e.keyCode === 13) {
			signInValidate(e);
		}
	});
}


function setUserStatusUI(e){
	_preventDefault(e);

	//Set available
	var currentAvailable = userModel._user.isAvailable;
    if (currentAvailable) {
    	$(".userStatus-icon").attr("src","images/status-available.svg");
    } else {
    	$(".userStatus-icon").attr("src","images/status-away.svg");
    }

    //set private photo
    var privatePhoto = userModel._user.photo;
    var publicPhoto = userModel._user.aliasPhoto;

    if(privatePhoto !== ""){
    	$(".userStatus-photo").attr("src", privatePhoto);
    } else {
    	$(".userStatus-photo").attr("src", publicPhoto);
    }
}

function testingStatus(e) {
	_preventDefault(e);
	
}

function _signOut() {
	Parse.User.logOut();
	userModel.parseUser = null;
	userModel._user.unbind('change', userModel.sync);
	userModel._user.set('username', null);
	userModel._user.set('email', null);
	userModel._user.set('phone',null);
	userModel._user.set('alias', null);
	userModel._user.set('userUUID', null);
	userModel._user.set('rememberUsername', false);
	userModel._user.set('phoneValidated', false);
	userModel._user.set('emailValidated', false);
	userModel.parseACL = '';
	deviceModel.resetDeviceState();
}


function homeSignout (e) {
	_preventDefault(e);

	_signOut();

    APP.kendo.navigate('#usersignin');
}

function doInitSignIn () {
	if (userModel.rememberUsername && userModel.username !== '') {
		$('#home-signin-username').val(userModel.username)
	}
}

// sign in validator 
function signInValidate(e){
    e.preventDefault();
    var form = $("#formSignIn").kendoValidator().data("kendoValidator");

    if (form.validate()) {
        // If the form is valid, run sign in
        homeSignin();
    }
}
	
function homeSignin (e) {
	_preventDefault(e);
	
	}
function launchVerifyPhone (e) {
	_preventDefault(e);
	$("#modalview-verifyPhone").data("kendoMobileModalView").open();
}


function closeModalViewVerifyPhone() {
	$("#modalview-verifyPhone").data("kendoMobileModalView").close();
}

function sendVerificationCode ()
{
  var phone = userModel._user.get('phone');
   Parse.Cloud.run('sendPhoneVerificationCode', { phoneNumber:  phone}, {
		success: function(result) {
			mobileNotify('Your phone verification was sent');
			$("#modalview-verifyPhone").data("kendoMobileModalView").open();
		},
		error: function (result,error){
			mobileNotify("Error sending phone verification " + error);
		}
  });
}

function validateCreateAccount(e) {
    e.preventDefault();
    var form = $("#formCreateAccount").kendoValidator().data("kendoValidator");
    
    if (form.validate()) {
        homeCreateAccount();
    } 
}

function homeCreateAccount() {
    
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
					user.set("phoneValidated", false);
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
							userModel._user.set('username', user.get('username'));
							userModel._user.set('name', user.get('name'));
							userModel._user.set('email', user.get('email'));
							userModel._user.set('phone', user.get('phone'));
							userModel._user.set('alias', user.get('alias'));
							userModel._user.set('currentPlace', user.get('currentPlace'));
							userModel._user.set('currentPlaceUUID', user.get('currentPlaceUUID'));
							userModel._user.set('photo', user.get('photo'));
							userModel._user.set('isAvailable', user.get('isAvailable'));
							userModel._user.set('isVisible', user.get('isVisible'));
							userModel._user.set('isRetina', user.get('isRetina'));
							userModel._user.set('isWIFIOnly', user.get('isWIFIOnly'));
							userModel._user.set('isPhotoStored', user.get('isPhotoStored'));
							userModel._user.set('saveToPhotoAlbum', user.get('saveToPhotoAlbum'));
							userModel._user.set('aliasPhoto', user.get('aliasPhoto'));
							userModel._user.set('userUUID', user.get('userUUID'));
							userModel._user.set('phoneValidated', false);
							userModel._user.set('useLargeView', false);
							userModel._user.set('useIdenticon',user.get('useIdenticon'));
							userModel._user.set('emailValidated',user.get('emailValidated'));
							userModel.generateNewPrivateKey(user);

							userModel.createIdenticon(userUUID);
							//userModel._user.set('publicKey',user.get('publicKey'));
							//userModel._user.set('privateKey',user.get('privateKey'));
							userModel._user.bind('change', userModel.sync);
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

function requestBeta (e) {
    e.preventDefault();
    if (APP.models.sync.requestActive) {
        mobileNotify("Processing current request.");
        return;
    }
    APP.models.sync.requestActive = true;
    var userUUID = null, name = null, email = null, phone = null;
    mobileNotify("Preparing your beta request");
    
    if (userModel.parseUser === null) {
        mobileNotify("You must be a user to join iPhone beta");
        return;
    } else {
        userUUID = userModel._user.get('userUUID');
        name = userModel._user.get('name');
        email = userModel._user.get('email');
        phone = userModel._user.get('phone');
    }
    
    var Beta = Parse.Object.extend('betarequest');
    var beta = new Beta();
    beta.set("userUUID", userUUID);
	if (name === undefined || name === null)
		name = email;
    beta.set("name", name);
    beta.set("email",email );
    beta.set("phone", phone);
    beta.set("udid", userModel.device.udid);
    beta.set("device", userModel.device.device);
    beta.set("model", userModel.device.model);
    beta.set("platform", userModel.device.platform);
    
    beta.save(null, {
        success: function(support) {
            mobileNotify("You beta request was sent. Thank you!");
            APP.models.sync.requestActive = false;
        },
        error: function(support, error) {
            mobileNotify("Error sending your beta request: " + error);
            APP.models.sync.requestActive = false;
        }
    })
}
    

function importMe(e) {
	e.preventDefault();
	var username = $('#home-signup-fullname').val();
	if (username.length === 0) {
		mobileNotify("Please enter your name and try again");
		return;
	}
	
	findContactMe(query);
}

function findContactMe(query) {
	var options      = new ContactFindOptions();
    options.filter   = query;
    options.multiple = true;
    var fields       = [navigator.contacts.fieldType.phoneNumbers];
     
    navigator.contacts.find(fields, function(contacts){

		contactModel.deviceContactsDS.data([]);
        var contactsCount = contacts.length;
        
        for (var i=0;  i<contactsCount; i++){
            var contactItem = new Object();
            contactItem.type = "device";
            contactItem.name = contacts[i].name.formatted;
            contactItem.phoneNumbers = new Array();
            if (contacts[i].phoneNumbers !== null) {
                for (var j=0; j<contacts[i].phoneNumbers.length; j++){
                    var phone = new Object();
                    phone.name = contacts[i].phoneNumbers[j].type + " : " + contacts[i].phoneNumbers[j].value ;
                    phone.number = contacts[i].phoneNumbers[j].value;
                    contactItem.phoneNumbers.push(phone);
                }
            }
            
            contactItem.emails = new Array();
            if (contacts[i].emails !== null) {
                 for (var k=0; k<contacts[i].emails.length; k++){
                    var email = new Object();
                    email.name = contacts[i].emails[k].type + " : " + contacts[i].emails[k].value;
                    email.address = contacts[i].emails[k].value;
                    contactItem.emails.push(email);
                }
            }
            
            contactItem.addresses = new Array();
              if (contacts[i].addresses !== null) {
                 for (var a=0; a<contacts[i].addresses.length; a++){
                    var address = new Object();
                    if (contacts[i].addresses[a].type === null) {
                         address.type = 'Home';
                    } else {
                        address.type = contacts[i].addresses[a].type;
                    }
                    address.name = address.type + " : " + contacts[i].addresses[a].streetAddress + ', ' +
                        contacts[i].addresses[a].locality;
                    address.address = contacts[i].addresses[a].streetAddress;
                    address.city = contacts[i].addresses[a].locality;
                    address.state = contacts[i].addresses[a].region;
                    address.zipcode = contacts[i].addresses[a].postalcode;
                    address.fullAddress = address.address + " ," + address.city + ' , ' + address.state;
                    contactItem.addresses.push(address);
                }
            } 
            contactItem.photo = 'images/missing_profile_photo.jpg';
            if (contacts[i].photos !== null) {
				deviceContacts.returnValidPhoto(contacts[i].photos[0].value, function(validUrl) {
                	contactItem.photo = validUrl;
					if (contactItem.phoneNumbers.length > 0)
						contactModel.deviceContactsDS.add(contactItem);
				});
            } else {
				if (contactItem.phoneNumbers.length > 0)
					contactModel.deviceContactsDS.add(contactItem);
			}
			// Only add device contacts with phone numbers
			
        }
         
    },function(error){mobileNotify(error);}, options);
}

function doUpdateStatusMessage(e) {
	if (e.preventDefault !== undefined) {
		e.preventDefault();
	}
	
	var message = $('#profileStatusMessage').val();
	
	userModel._user.set('statusMessage', message);

}

function initProfilePhotoEdit(e) {
	if (e.preventDefault !== undefined) {
		e.preventDefault();
	}
	
}

function updateProfilePhototUrl(url) {
	userModel._user.set("photo", url);
	saveUserProfilePhoto(url);
}

function doProfilePhotoEdit(e) {
	if (e.preventDefault !== undefined) {
		e.preventDefault();
	}

	photoModel.currentPhoto.callBack = updateProfilePhotoUrl;
}

function saveProfilePhoto(e) {
	if (e.preventDefault !== undefined) {
		e.preventDefault();
	}
	
	var photoMessage = $('#profilePhotoMessage').val();
}

function onShowMainMenuDrawer(e) {
	if (e.preventDefault !== undefined) {
		e.preventDefault();
	}
	var profilePhoto = userModel._user.get('photo');

	if (profilePhoto === undefined) {
		profilePhoto = 'images/ghost-default.svg';
	}

	$('#profilePhoto').attr('src', profilePhoto);
	$('#profilePhotoImage').attr('src', profilePhoto);
	
}

function homeRecoverPassword(e) {

    var emailAddress = $("#home-recoverPassword-email").val();
	Parse.User.requestPasswordReset(emailAddress, {
		success: function() {
			mobileNotify("Sent password recovery to " + emailAddress);
			ux.closeModalViewRecoverPassword();
		},
		error: function(error) {
			// Show the error message somewhere
			mobileNotify("Recover Password Error: " + error.code + " " + error.message);
		}
	});

}

function syncPresence () {

    var userId = userModel._user.get('userUUID'), presence = '';
	// Todo - Update status UI (JE)
    findParseObject('presence', 'userId', userId, function (results) {
       if (results !== undefined && results.length > 0) {
           presence = results[0];
           APP.models.presence.current.unbind('change' , syncPresence);
           presence.set('isAvailable', APP.models.presence.current.get('isAvailable'));

           APP.models.presence.current.bind('change' , syncPresence);
       } else {
           var PresObject = Parse.Object.extend('presence');
           presence = new PresObject()


       }
        presence.set('isVisible', APP.models.presence.current.get('isVisible'));
        presence.set('message', APP.models.presence.current.get('message'));
        presence.set('activity', APP.models.presence.current.get('activity'));
        presence.set('activityInfo', APP.models.presence.current.get('activityInfo'));
        presence.set('location', APP.models.presence.current.get('location'));
        presence.set('locationId', APP.models.presence.current.get('locationId'));

        presence.save(null, {
            success: function (model) {

            },
            error: function (error) {
                handleParseError(error);
            }
        });
    });
}

function onGalleryPickerInit(e) {
	if (e !== undefined && e.preventDefault !== undefined) {
		e.preventDefault();
	}
	var galleryOptions = [
		{name: "Today", value: 0, group: "Date"},
		{name: "Yesterday", value: -1, group: "Date"},
		{name: "This Week", value: -7, group: "Date"},
		{name: "Last Week", value: -14, group: "Date"},
		{name: "This Month", value: -30, group: "Date"},
		{name: "Last Month", value: -60, group: "Date"}
	];

	$("#galleryPickerSearch").kendoMultiSelect({
		dataTextField: "name",
		dataValueField: "value",
		height: 320,
		dataSource: {
			data: galleryOptions
		},
		select: function(e) {
			var view = this.dataSource.view(), index = e.item.index();
			var dataItem = view[index];
			// Use the selected item or its text
		}
	});


}

function galleryPickerClick(e) {
	if (e !== undefined && e.preventDefault !== undefined) {
		e.preventDefault();
	}

	var imageUrl = e.dataItem.imageUrl;

	photoModel.currentPhoto.callBack(imageUrl);
}

function modalGalleryZoomIn (e)  {
	if (e !== undefined && e.preventDefault !== undefined) {
		e.preventDefault();	
	}

	$("#galleryPicker-listview li").css("width","50%");
	$("#galleryPicker-listview li").css("padding-bottom","50%");
	//$("#galleryPicker-listview").data("kendoMobileListView").refresh();

}

function modalGalleryZoomOut (e)  {
	if (e !== undefined && e.preventDefault !== undefined) {
		e.preventDefault();
	}

	$("#galleryPicker-listview li").css("width","33%");
	$("#galleryPicker-listview li").css("padding-bottom","33%");
	//$("#galleryPicker-listview").data("kendoMobileListView").refresh();

}

function modalGallerySortAsc (e)  {
	if (e !== undefined && e.preventDefault !== undefined) {
		e.preventDefault();
	}
}

function modalGallerySortDesc (e)  {
	if (e !== undefined && e.preventDefault !== undefined) {
		e.preventDefault();
	}
}

function go2Archive(e){
	e.preventDefault;
	APP.kendo.navigate("views/archive.html");
}
function go2Settings(e){
	e.preventDefault;
	APP.kendo.navigate("#settings");
}
function go2Profile(e){
	e.preventDefault;
	APP.kendo.navigate("#profile");
}

function go2Support(e){
	e.preventDefault;
	$("#settingsAction").data("kendoMobileActionSheet").close();
	$("#modalview-support").data("kendoMobileModalView").open();
}

function gpsLocateUpdate(){
	
}

function statusCharCount(e) {
	// set max length
	var maxLength = 40;
	var updateAreaMax = $("#profileStatusUpdate").attr("maxlength", maxLength);
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


	

}

function dialogClose(e){
	$("#modal-OptionDialog").data("kendoMobileModalView").close();
}

function gpsLocateUpdate(){
	// Todo - Auto locate first if enabled, then manual input show
	$(".userLocationUpdate").velocity("slideDown");

}


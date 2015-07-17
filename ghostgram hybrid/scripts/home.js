function homeBeforeShow () {

    if (APP.models.profile.currentUser) {
        // Have current user - redirect to user view
        APP.kendo.navigate('#home');

    } else {
        // No current user -redirect to no user view
       APP.kendo.navigate('#newuserhome');
    }
    
}

function dismissNotification (e) {
	e.preventDefault();
	var uuid = e.sender.element[0].attributes['data-param'].value;
	
	var data = APP.state.userNotifications;
	for(var i = 0; i < data.length; i++) {
		if(data[i].uuid == uuid) {
			data.splice(i, 1);
			break;
		}
	}
	
	APP.setAppState('userNotifications', JSON.stringify(data));
	deleteNotificationModel(uuid);
	
}

function findNotificationModel(uuid) {
	 var dataSource = APP.models.home.notificationDS;
    dataSource.filter( { field: "uuid", operator: "eq", value: uuid });
    var view = dataSource.view();
    var contact = view[0];
	dataSource.filter([]);
	console.log(dataSource);
	return(contact);
}

function deleteNotificationModel(uuid) {
	 var dataSource = APP.models.home.notificationDS;
    dataSource.filter( { field: "uuid", operator: "eq", value: uuid });
    var view = dataSource.view();
    var notification = view[0];
	dataSource.filter([]);
	// Does this notification exist?  if not, just return
	if (notification === undefined)
		return;
	var data = APP.state.userNotifications;
	for(var i = 0; i < data.length; i++) {
		if(data[i].uuid == uuid) {
			data.splice(i, 1);
			break;
		}
	}
	APP.setAppState('userNotifications', JSON.stringify(data));
	dataSource.remove(notification);
}

function onBeforeOpenPhoto() {
	$('#photoImage').attr('src', APP.models.gallery.currentPhoto.src);	
}


function savePhoto () {
	
}

function pruneNotifications() {
	if 	( APP.state.phoneVerified) {
		deleteNotificationModel('verifyphone');
	}

}

function onInitHome () {
	
}

function initSignUp() {
	// Simple phone mask - http://jsfiddle.net/mykisscool/VpNMA/
	$('#home-signup-phone')

	.keydown(function (e) {
		var key = e.charCode || e.keyCode || 0;
		$phone = $(this);

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
		$phone = $(this);
		
		if ($phone.val().length === 0) {
			$phone.val('(');
		}
		else {
			var val = $phone.val();
			$phone.val('').val(val); // Ensure cursor remains at the end
		}
	})
	
	.blur(function () {
		$phone = $(this);
		
		if ($phone.val() === '(') {
			$phone.val('');
		}
	});
	

	$("#create-user-email, #create-user-name, #create-user-alias, #create-user-password").css("display", "none");


}

function continueSignUp() {

	$("#create-user-email, #create-user-name, #create-user-alias, #create-user-password").velocity("slideDown", { delay: 500, duration: 300 }, [ 250, 15 ]);
	// ToDo - Add step form validation
	

}

function onInitProfile(e) {
	e.preventDefault();
    
    if (APP.models.profile.currentUser.emailVerified){
        $("#verified-email").removeClass("hidden");
    }
    
    if(APP.models.profile.currentUser.phoneVerified){
        $("#verified-phone").removeClass("hidden");
    }

}

function onShowHome(e) {
	e.preventDefault();

	$('#profileName').text(APP.models.profile.currentUser.alias);
    var myPublicImg = APP.models.profile.currentUser.aliasPhoto;
	//TODO:  add code to update user profile image
	if (myPublicImg !== ""){
        $(".myPublicImg").attr("src", APP.models.profile.currentUser.aliasPhoto);
    }
    // set verified ui for start screen 
    if(APP.models.profile.currentUser.phoneVerified) {
    	$("#startPhoneVerified").addClass("hidden");
    }

        
    APP.models.presence.current.bind('change' , syncPresence);
} 

function homeSignout (e) {

    e.preventDefault();
    Parse.User.logOut();
    APP.models.profile.parseUser = null;
    APP.models.profile.currentUser.unbind('change', syncProfile);
    APP.models.profile.currentUser.set('username', null);
    APP.models.profile.currentUser.set('email', null);
    APP.models.profile.currentUser.set('phone',null);
    APP.models.profile.currentUser.set('alias', null);
    APP.models.profile.currentUser.set('userUUID', null);
	 APP.models.profile.currentUser.set('rememberUsername', false);
    APP.models.profile.currentUser.set('phoneVerified', false);
    APP.models.profile.currentUser.set('emailVerified', false);
    APP.models.profile.parseACL = '';
    APP.kendo.navigate('#newuserhome');
}

function doInitSignIn () {
	if (APP.models.profile.rememberUsername && APP.models.profile.username !== '') {
		$('#home-signin-username').val(APP.models.profile.username)
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
    

   var username = $('#home-signin-username').val(), password = $('#home-signin-password').val()

    mobileNotify("Signing you in to ghostgrams....");


   Parse.User.logIn(username,password , {
        success: function(user) {
        // Do stuff after successful login.
            closeModalViewLogin();
            // Clear sign in form
            $("#home-signin-username, #home-signin-password").val("");
            APP.models.profile.parseUser = user;
			
			
			var publicKey = user.get('publicKey');
			var privateKey = user.get('privateKey');
			if (publicKey === undefined || privateKey === undefined) {
				var RSAkey = cryptico.generateRSAKey(1024);
				publicKey = cryptico.publicKeyString(RSAkey);
				privateKey = cryptico.privateKeyString(RSAkey);
				
				user.set('privateKey', privateKey);
				user.set('publicKey', publicKey);
				
				user.save();
			}
			   
            APP.models.profile.currentUser.set('username', APP.models.profile.parseUser.get('username'));
            APP.models.profile.currentUser.set('email', APP.models.profile.parseUser.get('email'));
            APP.models.profile.currentUser.set('phone', APP.models.profile.parseUser.get('phone'));
            APP.models.profile.currentUser.set('alias', APP.models.profile.parseUser.get('alias'));
            APP.models.profile.currentUser.set('aliasPhoto', APP.models.profile.parseUser.get('aliasPhoto'));
			APP.models.profile.currentUser.set('statusMessage', APP.models.profile.parseUser.get('statusMessage'));
			APP.models.profile.currentUser.set('isAvailable', APP.models.profile.parseUser.get('isAvailable'));
			APP.models.profile.currentUser.set('isVisible', APP.models.profile.parseUser.get('isVisible'));
			APP.models.profile.currentUser.set('currentPlace', APP.models.profile.parseUser.get('currentPlace'));
			APP.models.profile.currentUser.set('currentPlaceUUID', APP.models.profile.parseUser.get('currentPlaceUUID'));
			APP.models.profile.currentUser.set('photo', APP.models.profile.parseUser.get('photo'));
			APP.models.profile.currentUser.set('aliasPublic', APP.models.profile.parseUser.get('aliasPublic'));
            APP.models.profile.currentUser.set('userUUID', APP.models.profile.parseUser.get('userUUID'));
			APP.models.profile.currentUser.set('rememberUsername', APP.models.profile.parseUser.get('rememberUsername'));
			APP.models.profile.currentUser.set('publicKey', publicKey);
			APP.models.profile.currentUser.set('privateKey', privateKey);
			var phoneVerified = APP.models.profile.parseUser.get('phoneVerified');
            APP.models.profile.currentUser.set('phoneVerified', phoneVerified);
			console.log(APP.models.profile.parseUser);
            if (phoneVerified) {
				APP.setAppState('phoneVerified', true);
				deleteNotificationModel('phoneVerified');
			} else {
				  mobileNotify("Please verify your phone number");
              $("#modalview-verifyPhone").data("kendoMobileModalView").open();
			}
            APP.models.profile.currentUser.set('emailVerified', APP.models.profile.parseUser.get('emailVerified'));
            APP.models.profile.parseACL = new Parse.ACL(APP.models.profile.parseUser);
            APP.models.profile.currentUser.bind('change', syncProfile);
            window.onUserSignIn();
            APP.kendo.navigate('#home');
        },
        error: function(user, error) {
        // The login failed. Check error to see why.
             mobileNotify("Error: " + error.code + " " + error.message);
        }
    });
}



function closeModalViewVerifyPhone() {
	$("#modalview-verifyPhone").data("kendoMobileModalView").close();
}

function sendVerificationCode ()
{
  var phone = APP.models.profile.currentUser.get('phone');
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
				   // Generate Keys for the user.  
					var RSAkey = cryptico.generateRSAKey(1024);
					var publicKey = cryptico.publicKeyString(RSAkey);
					var privateKey = cryptico.privateKeyString(RSAkey);


					 //Phone number isn't a duplicate -- create user
					user.set("username", username);
					user.set("password", password);
					user.set("email", username);
					user.set("name", name);
					user.set("phone", phone);
					user.set("alias", alias);
					user.set("aliasPublic", "ghostgram user");
					user.set("currentPlace", "");
				    user.set('photo', "images/ghost-default.svg");
				    user.set('aliasPhoto', "images/ghost-default.svg");
					user.set("isAvailable", true);	   
					user.set("isVisible", true);	 
					user.set("phoneVerified", false);
					user.set("rememberUsername", false);
					user.set("userUUID", userUUID);
					user.set("publicKey", publicKey);
					user.set("privateKey", privateKey);

					user.signUp(null, {
						success: function(user) {
							// Hooray! Let them use the app now.
						   closeModalViewSignup();
							APP.models.profile.currentUser.set('username', user.get('username'));
							APP.models.profile.currentUser.set('email', user.get('email'));
							APP.models.profile.currentUser.set('phone', user.get('phone'));
							APP.models.profile.currentUser.set('alias', user.get('alias'));
							APP.models.profile.currentUser.set('currentPlace', user.get('currentPlace'));
							APP.models.profile.currentUser.set('photo', user.get('photo'));
							APP.models.profile.currentUser.set('isAvailable', user.get('isAvailable'));
							APP.models.profile.currentUser.set('isVisible', user.get('isVisible'));
							APP.models.profile.currentUser.set('aliasPhoto', user.get('aliasPhoto'));
							APP.models.profile.currentUser.set('userUUID', user.get('userUUID'));
							APP.models.profile.currentUser.set('phoneVerified', false);
							APP.models.profile.currentUser.set('emailVerified',user.get('emailVerified'));
							APP.models.profile.currentUser.set('publicKey',user.get('publicKey'));
							APP.models.profile.currentUser.set('privateKey',user.get('privateKey'));
							APP.models.profile.currentUser.bind('change', syncProfile);
							APP.models.profile.parseACL = new Parse.ACL(Parse.User.current());
						   mobileNotify('Welcome to ghostgrams!');
							if (window.navigator.simulator !== true) {

								cordova.plugins.notification.local.add({
								  id         : 'userWelcome',
								  title      : 'Welcome to ghostgrams',
								  message    : 'You have a secure connection to your family, friends and favorite places',
								  autoCancel : true,
								  date : new Date(new Date().getTime() + 120 * 1000)
								});
							}
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
        mobileNotify("Processing current request.")
        return;
    }
    APP.models.sync.requestActive = true;
    var userUUID = null, name = null, email = null, phone = null;
    mobileNotify("Preparing your beta request");
    
    if (APP.models.profile.parseUser === null) { 
        mobileNotify("You must be a user to join iPhone beta");
        return;
    } else {
        userUUID = APP.models.profile.currentUser.get('userUUID');
        name = APP.models.profile.currentUser.get('name');
        email = APP.models.profile.currentUser.get('email');
        phone = APP.models.profile.currentUser.get('phone');
    }
    
    var Beta = Parse.Object.extend('betarequest');
    var beta = new Beta();
    beta.set("userUUID", userUUID);
	if (name === undefined || name === null)
		name = email;
    beta.set("name", name);
    beta.set("email",email );
    beta.set("phone", phone);
    beta.set("udid", APP.models.profile.udid);
    beta.set("device", APP.models.profile.device);
    beta.set("model", APP.models.profile.model);
    beta.set("platform", APP.models.profile.platform);
    
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
    
function sendSupportRequest(e) {
    e.preventDefault();
    if (APP.models.sync.requestActive){
        mobileNotify("Processing current support request.")
        return;
    }
        
    APP.models.sync.requestActive = true;
    var category = $('#supportCategory').val(), message =  $('#supportMessage').val();
    var userUUID = null, name = null, email = null, phone = null;
    mobileNotify("Preparing your support request");
    
   if (APP.models.profile.parseUser !== null) {
        userUUID = APP.models.profile.currentUser.get('userUUID');
        name = APP.models.profile.currentUser.get('name');
        email = APP.models.profile.currentUser.get('email');
        phone = APP.models.profile.currentUser.get('phone');
    }
    
    var Support = Parse.Object.extend('support');
    var support = new Support();
    support.set("userUUID", userUUID);
    support.set("name", name);
    support.set("email",email );
    support.set("phone", phone);
    support.set("category", category);
    support.set("message", message);
    support.set("udid", APP.models.profile.udid);
    support.set("device", APP.models.profile.device);
    support.set("model", APP.models.profile.model);
    support.set("platform", APP.models.profile.platform);
    
    support.save(null, {
        success: function(support) {
            mobileNotify("You support request was sent. Thank you!");
            closeModalViewSupport();
            APP.models.sync.requestActive = false;
        },
        error: function(support, error) {
            mobileNotify("Error sending your support request: " + error);
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
    options.filter   = query
    options.multiple = true;
    var fields       = ["name", "displayName", "nickName" ,"phoneNumbers", "emails", "addresses", "photos"];
     
    navigator.contacts.find(fields, function(contacts){
        
        APP.models.contacts.deviceContactsDS.data([]);
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
				returnValidPhoto(contacts[i].photos[0].value, function(validUrl) {
                	contactItem.photo = validUrl;
					if (contactItem.phoneNumbers.length > 0)
            			APP.models.contacts.deviceContactsDS.add(contactItem);
				});
            } else {
				if (contactItem.phoneNumbers.length > 0)
            			APP.models.contacts.deviceContactsDS.add(contactItem);
			}
			// Only add device contacts with phone numbers
			
        }
         
    },function(error){mobileNotify(error);}, options);
}

function doUpdateStatusMessage(e) {
	if (e.preventDefault !== undefined) {
		e.preventDefault();
	}
	
	var message = $('#profilePhotoMessage').val();
	
	APP.models.profile.currentUser.set('statusMessage', message);

}

function initProfilePhotoEdit(e) {
	if (e.preventDefault !== undefined) {
		e.preventDefault();
	}
	
}

function updateProfilePhototUrl(url) {
	APP.models.profile.currentUser.set("photo", url);
	saveUserProfilePhoto(url);
}

function doProfilePhotoEdit(e) {
	if (e.preventDefault !== undefined) {
		e.preventDefault();
	}

	APP.models.gallery.currentPhoto.callBack = updateProfilePhototUrl;
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
	var profilePhoto = APP.models.profile.currentUser.get('photo');

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
			closeModalViewRecoverPassword();
		},
		error: function(error) {
			// Show the error message somewhere
			mobileNotify("Recover Password Error: " + error.code + " " + error.message);
		}
	});

}

function syncPresence () {

    var userId = APP.models.profile.currentUser.get('userUUID'), presence = '';
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

function galleryPickerClick(e) {
	if (e !== undefined && e.preventDefault !== undefined) {
		e.preventDefault();
	}

	var image = e.item;
	var url = APP.models.gallery.currentPhoto.targetUrl;

	APP.models.gallery.currentPhoto.callBack(e.item.photoUrl);
}

function closeStartModal() {
	$("#modalview-start").data("kendoMobileModalView").close();
}

function closeTestingBox(){
	$("#testing").data("kendoMobileModalView").close();
}


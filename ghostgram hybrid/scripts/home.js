function homeBeforeShow () {

    if (APP.models.profile.currentUser) {
        // Have current user - redirect to user view
        APP.kendo.navigate('#home');

    } else {
        // No current user -redirect to no user view
       APP.kendo.navigate('#nouser');
    }
}

function dismissNotification () {
	
}

function onInitHome () {
	    var NotificationModel = Parse.Object.extend("notifications");
	var NotificationCollection = Parse.Collection.extend({
	  model: NotificationModel
	});

	var notifications = new NotificationCollection();

	notifications.fetch({
		  success: function(collection) {
			 for (var i=0; i<collection.models.length; i++) {
				 // Todo: check status of members
				 var date = collection.models[i].updatedAt;
				 collection.models[i].attributes.date = Date.parse(date);
				  APP.models.home.notificationDS.add(collection.models[i].attributes);
			 }
		  },
		  error: function(collection, error) {
			  handleParseError(error);
		  }
	});
	
	$("#notification-listview").kendoMobileListView({
        dataSource: APP.models.home.notificationsDS,
        template: $("#notificationTemplate").html(),
		click: function (e) {
			var thisNotification = e.dataItem;
			
		}
		
    });
}

function onShowHome() {
	
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
	 APP.models.profile.currentUser.set('rememberUsername', false)
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
	
function homeSignin (e) {
    e.preventDefault();
    
   var username = $('#home-signin-username').val(), password = $('#home-signin-password').val();
	if (username === '' || password === '') {
		mobileNotify("Username or password cannont be blank");
		return;
	}

   Parse.User.logIn(username,password , {
        success: function(user) {
        // Do stuff after successful login.
            closeModalViewLogin();
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
            APP.models.profile.currentUser.set('userUUID', APP.models.profile.parseUser.get('userUUID'));
			APP.models.profile.currentUser.set('rememberUsername', APP.models.profile.parseUser.get('rememberUsername'));
			APP.models.profile.currentUser.set('publicKey', publicKey);
			APP.models.profile.currentUser.set('privateKey', privateKey);
            APP.models.profile.currentUser.set('phoneVerified', APP.models.profile.parseUser.get('phoneVerified'));
            APP.models.profile.currentUser.set('emailVerified', APP.models.profile.parseUser.get('emailVerified'));
            APP.models.profile.parseACL = new Parse.ACL(APP.models.profile.parseUser);
            APP.models.profile.currentUser.bind('change', syncProfile);
            window.onUserSignIn();
            
            if (!APP.models.profile.currentUser.get('phoneVerified')) {
			  mobileNotify("Please verify your phone number");
              $("#modalview-verifyPhone").data("kendoMobileModalView").open();
            }
            APP.kendo.navigate('#home');
        },
        error: function(user, error) {
        // The login failed. Check error to see why.
             alert("Error: " + error.code + " " + error.message);
        }
    });
}

function sendVerificationCode ()
{
  var phone = APP.models.profile.currentUser.get('phone');
   Parse.Cloud.run('sendPhoneVerificationCode', { phoneNumber:  phone}, {
				  success: function(result) {
					  mobileNotify('Sent your phone');
					  $("#modalview-verifyPhone").data("kendoMobileModalView").open();
				  },
				 error: function (result,error){
					 mobileNotify("Error sending phone verification " + error);
				 }
  });
}
function homeCreateAccount(e) {
    e.preventDefault();

    var user = new Parse.User();
    var username = $('#home-signup-username').val();
    var password = $('#home-signup-password').val();
    var phone = $('#home-signup-phone').val();
    var alias = $('#home-signup-alias').val();

    var userUUID = uuid.v4();
    
    // clean up the phone number and ensure it's prefixed with 1
   // phone = phone.replace(/\+[0-9]{1-2}/,'');
    phone = phone.replace(/\D+/g, "");
	if (phone[0] !== '1') {
		phone = '1'+phone;
	}
    
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
                user.set("phone", phone);
                user.set("alias", alias);
                user.set("aliasPublic", "ghostgram user");
                user.set("profilePhoto", null)
                user.set("phoneVerified", false);
			    user.set("rememberUsername", false);
                user.set("userUUID", userUUID);
			    user.set("publicKey", publicKey);
			    user.set("privateKey", privateKey)

                user.signUp(null, {
                    success: function(user) {
                        // Hooray! Let them use the app now.
                       closeModalViewSignup();
                        APP.models.profile.currentUser.set('username', user.get('username'));
                        APP.models.profile.currentUser.set('email', user.get('email'));
                        APP.models.profile.currentUser.set('phone', user.get('phone'));
                        APP.models.profile.currentUser.set('alias', user.get('alias'));
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
                                  modileNotify('Please verify your phone');
                                  $("#modalview-verifyPhone").data("kendoMobileModalView").open();
                              },
                             error: function (result, error){
                                 mobileNotify('Error sending verification code ' + error);
                             }
                         });
                       
                        
            
                       ///APP.kendo.navigate('#home');
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

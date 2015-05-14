function syncCurrentContact(e) {
    updateParseObject('contacts','uuid', APP.models.contacts.currentContact.uuid, e.field, this[e.field]);  
    APP.models.contacts.currentModel.set(e.field, this[e.field]);
}
    
function syncProfile (e) {
    APP.models.profile.parseUser.set(e.field, APP.models.profile.currentUser.get(e.field));
    APP.models.profile.parseUser.save(null, {
        success : function (user){
            mobileNotify("Updated your " + e.field);
        },
        error: function (user, error){
            mobileNotify("Profile save error: " + error);
        }
    });
}

function inviteUser(e) {
	
}

function privateMessage(e) {

	var contact = APP.models.contacts.currentContact;
	var contactUUID = contact.contactUUID;
	
	if (contactUUID === undefined || contactUUID === null) {
		// TODO: look up contact in user table...
		mobileNotify(contact.get('name') + "hasn't verified their contact info");
		return;
	}
	
    processPrivateInvite(contactUUID, APP.models.profile.currentUser.get('alias') + " requests a Private Channel");
}

function getContactModel(contactUUID) {
	 var dataSource = APP.models.contacts.contactsDS;
    dataSource.filter( { field: "contactUUID", operator: "eq", value: contactUUID });
    var view = dataSource.view();
    var contact = view[0];
	dataSource.filter([]);
	
	return(contact);
}

function findContactByUUID(uuid) {
var dataSource = APP.models.contacts.contactsDS;
    dataSource.filter( { field: "uuid", operator: "eq", value: uuid });
    var view = dataSource.view();
    var contact = view[0];
	dataSource.filter([]);
	
	return(contact);	
}


function editContact() {
    APP.kendo.navigate("#editContact");  
}



function deleteContact(e) {
	if (e !== undefined)
		e.preventDefault();
    var dataSource = APP.models.contacts.contactsDS;
	var string = "Deleted contact: " + APP.models.contacts.currentContact.name + " ("+ APP.models.contacts.currentContact.alias + ")" ;
	
    dataSource.filter( { field: "uuid", operator: "eq", value: APP.models.contacts.currentContact.uuid });
    var view = dataSource.view();
    var contact = view[0];
	 dataSource.filter([]);
    dataSource.remove(contact); 
    deleteParseObject("contacts", 'uuid', APP.models.contacts.currentContact.get('uuid'));
	mobileNotify(string);
	APP.kendo.navigate('#contacts');
    
}

function syncContact(model) {
	var phone = model.get('phone');
	 findUserByPhone(phone, function (result) {
		 if (result.found) {
			 var uuid = model.get('uuid'), contactUUID = model.get('contactUUID'), publicKey = model.get('publicKey'), 
				 phoneVerified = model.get('phoneVerfied'),  emailVerified = model.get('emailVerfied'), parseEmailVerified = result.user.get('emailVerified') ;
			
			// Does the contact have a verified email address
			if (result.user.get('emailVerified')) {
				// Yes - save the email address the contact verified
				model.set("email", result.user.get('email'));
			} 
			model.set('publicKey',  result.user.get('publicKey'));
			model.set("contactUUID", result.user.get('userUUID'));
			 if (contactUUID === undefined) {
				 updateParseObject('contacts', 'uuid', uuid, 'contactUUID',  result.user.userUUID);
			 }
			 if (publicKey === undefined) {
				 updateParseObject('contacts', 'uuid', uuid, 'publicKey',result.user.publicKey );
			 }
			 if (phoneVerified !== result.user.get('phoneVerified')) {
				 if (result.user.get('phoneVerified') === undefined)
					 result.user.set('phoneVerified',false);
				  model.set("phoneVerified", result.user.get('phoneVerified'));
				  updateParseObject('contacts', 'uuid', uuid, 'phoneVerified',result.user.get('phoneVerified') );
			 }
		 }

	 });
}


function contactSendEmail() {
    var email = APP.models.contacts.currentContact.get('email');
	 if (window.navigator.simulator === true){
		 alert("Mail isn't supported in the emulator");
	 } else {
		 var thisUser = APP.models.profile.currentUser.get('name');
		 cordova.plugins.email.open({
			   to:          [email],
			   subject:     '',
			   body:        '</br></br></br></br><em>From ' + thisUser + ' via ghostgrams</em>',
			   isHtml:      true
			}, function (msg) {
			  navigator.notification.alert(JSON.stringify(msg), null, 'EmailComposer callback', 'Close');
		 });
	 }
	
}
    

function contactSendEmailInvite() {
    var email = APP.models.contacts.currentContact.get('email');
	 if (window.navigator.simulator === true){
		 alert("Mail isn't supported in the emulator");
	 } else {
		 var thisUser = APP.models.profile.currentUser.get('name');
		 cordova.plugins.email.open({
			   to:          [email],
			   subject:     'Check out ghostgrams',
			   body:        '<h2>A invitation From ' + thisUser + ' to try Ghostgrams</h2>',
			   isHtml:      true
			}, function (msg) {
			  navigator.notification.alert(JSON.stringify(msg), null, 'EmailComposer callback', 'Close');
		 });
	 }
	
}
function contactCallPhone() {
     var number = APP.models.contacts.currentContact.get('phone');
}
    
function contactSendSMS() {

    var number = APP.models.contacts.currentContact.get('phone');
    var message = "";


    //CONFIGURATION
    var options = {
        android: {
            intent: 'INTENT'  // send SMS with the native android SMS messaging
            //intent: '' // send SMS without openning any other app
        }
    };

    var success = function () { mobileNotify('Message sent successfully'); };
    var error = function (e) { mobileNotify('Message Failed:' + e); };
    
    if (window.navigator.simulator === true){
   //running in the simulator
        alert('Simulating SMS to ' + number + ' message: ' + message);
    } else {
       sms.send(number, message, options, success, error);
    }

}
    
function updateCurrentContact (contact) {
   
    // Wish observables set took an object -- need to set fields individually
    APP.models.contacts.currentModel = contact;
    APP.models.contacts.currentContact.unbind('change' , syncCurrentContact);
    APP.models.contacts.currentContact.set('name', contact.name);
    APP.models.contacts.currentContact.set('alias', contact.alias);
    APP.models.contacts.currentContact.set('phone', contact.phone);
    APP.models.contacts.currentContact.set('email', contact.email);
    APP.models.contacts.currentContact.set('address', contact.address);
    APP.models.contacts.currentContact.set('uuid', contact.uuid);
	APP.models.contacts.currentContact.set('contactUUID', contact.contactUUID);
	APP.models.contacts.currentContact.set('contactEmail', contact.contactEmail);
    APP.models.contacts.currentContact.set('privateChannel', contact.privateChannel);
	APP.models.contacts.currentContact.set('privateChannelUUID', contact.privateChannelUUID);
	APP.models.contacts.currentContact.set('phoneVerified',contact.phoneVerified);
	APP.models.contacts.currentContact.set('publicKey',contact.publicKey);
    APP.models.contacts.currentContact.bind('change' , syncCurrentContact);
   
   
}

function onCommandActionSheet(e) {
    var currentTarget = e.currentTarget,
        parentElement = currentTarget.parent();

    setTimeout(function() {
        currentTarget.remove().appendTo(parentElement);
    }, 100);
}

function onInitContact(e) {
	e.preventDefault();
	
}

function onShowEditContact(e) {

	syncContact(APP.models.contacts.currentContact);
	
}

function onDoneEditContact (e) {
	 APP.models.contacts.currentContact.unbind('change' , syncCurrentContact);
	APP.kendo.navigate("#contacts");
}

function onInitContacts(e) {
   e.preventDefault();
    /*
    function swipe(e) {
        var button = kendo.fx($(e.touch.currentTarget).find("[data-role=button]"));
        button.expand().duration(200).play();        
    }
    
    function tap(e) {
        var contact = APP.models.contacts.contactsDS.getByUid($(e.touch.target).attr("data-uid"));
        updateCurrentContact(contact);
        APP.kendo.navigate("#editContact");
    }
     function touchstart(e) {
        var target = $(e.touch.initialTouch),
            listview = $("#contacts-listview").data("kendoMobileListView"),
            contact,
            dataSource = APP.models.contacts.contactsDS,
            button = $(e.touch.target).find("[data-role=button]:visible");
            
        if (target.closest("[data-role=button]")[0]) {
            contact = dataSource.getByUid($(e.touch.target).attr("data-uid"));
            this.events.cancel();
            e.event.stopPropagation();
            updateCurrentContact(contact);
             $("#contactActions").data("kendoMobileActionSheet").open();
            
        	
       } else if (button[0]) {
            button.hide();
            //prevent `swipe`
            this.events.cancel();
        } else {
            listview.items().find("[data-role=button]:visible").hide();
        }
    }
     $("#contacts-listview").kendoMobileListView({
        dataSource: APP.models.contacts.contactsDS,
        template: $("#contactsTemplate").html(),
        filterable: {
            field: "name",
            operator: "startswith"
        }
     }).kendoTouch({
            filter: ">li",
            enableSwipe: true,
            tap: tap,
            touchstart: touchstart,
            swipe: swipe
       });
       */
    
     $("#contacts-listview").kendoMobileListView({
        dataSource: APP.models.contacts.contactsDS,
        template: $("#contactsTemplate").html(),
        click: function (e) {
            var contact = e.dataItem;
            updateCurrentContact(contact);
			// If we know the contacts uuid enable the full feature set
			if (contact.contactUUID !== undefined && contact.contactUUID !== null){
				$("#contactUserActions").data("kendoMobileActionSheet").open();
			} else {
				$("#contactActions").data("kendoMobileActionSheet").open();
			}
             
        },
         filterable: {
            field: "name",
            operator: "startswith"
        }
     });
}
    
    
function onInitContactImport (e) {
    e.preventDefault();
	
    $("#contactimport-listview").kendoMobileListView({
            dataSource: APP.models.contacts.deviceContactsDS,
            template: $("#deviceContactsTemplate").text(),
            click: function(e) {
               APP.models.contacts.currentDeviceContact = e.dataItem;
               APP.models.contacts.emailArray = new Array();
                
               for (var i = 0; i<APP.models.contacts.currentDeviceContact.emails.length; i++) {
                    var email = new Object();
                    email.name = APP.models.contacts.currentDeviceContact.emails[i].name;
                    email.address =  APP.models.contacts.currentDeviceContact.emails[i].address;

                   APP.models.contacts.emailArray.push(email);

               }

               APP.models.contacts.phoneArray = new Array();
                 for (var j = 0; j<APP.models.contacts.currentDeviceContact.phoneNumbers.length; j++) {
                    var phone = new Object();
                    phone.name = APP.models.contacts.currentDeviceContact.phoneNumbers[j].name;
                    phone.number =  APP.models.contacts.currentDeviceContact.phoneNumbers[j].number;

                   APP.models.contacts.phoneArray.push(phone);

               }
                
                APP.models.contacts.addressArray = new Array();
                    for (var a = 0; a<APP.models.contacts.currentDeviceContact.addresses.length; a++) {
                    var address = new Object();
                    address.name = APP.models.contacts.currentDeviceContact.addresses[a].name;
                    address.address =  APP.models.contacts.currentDeviceContact.addresses[a].fullAddress;

                    APP.models.contacts.addressArray.push(address);
               }
               
               APP.models.contacts.phoneDS.data( APP.models.contacts.phoneArray);
               APP.models.contacts.emailDS.data( APP.models.contacts.emailArray);
               APP.models.contacts.addressDS.data( APP.models.contacts.addressArray);
               APP.kendo.navigate('#addContact');
             
            }
    });
}
    

    
function contactsFindContacts(e) {
    e.preventDefault(e);   
    var query = $('#contactSearchQuery').val();
   
    var options      = new ContactFindOptions();
    options.filter   = query
    options.multiple = true;
    var fields       = ["name", "phoneNumbers", "emails", "addresses"];
     
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
					if (contacts[i].phoneNumbers !== null)
            			APP.models.contacts.deviceContactsDS.add(contactItem);
				});
            } 
			// Only add device contacts with phone numbers
			
        }
         
    },function(error){alert(error);}, options);
 }
			
 function returnValidPhoto(url,callback){
    var img = new Image();
    img.onload = function() {
    //Image is ok
        callback(url);
    };
    img.onerror = function(err) {
        //Returning a default image for users without photo 
        callback("images/missing_profile_photo.jpg");
    }
    img.src = url;
}
			
function doShowAddContacts() {
    var data = APP.models.contacts.currentDeviceContact;
    
    $("#addContactName").val(data.name);
    $('#addContactAlias').val(data.name);
	
    if (data.photo === null) {
        $("#addContactPhoto").attr("src",'images/missing_profile_photo.jpg');
    } else {
         $("#addContactPhoto").attr("src",data.photo);
    }
   
    
    
   
}

function contactsAddContact(e){
    e.preventDefault(e);
     var Contacts = Parse.Object.extend("contacts");
    var contact = new Contacts();
    
    var name = $('#addContactName').val(),
        alias = $('#addContactAlias').val(),
        phone = $('#addContactPhone').val(),
        email = $('#addContactEmail').val(), 
        photo = $('#addContactPhoto').prop('src'),
        address = $('#addContactAddress').val();
        guid = uuid.v4();
	
    //phone = phone.replace(/\+[0-9]{1-2}/,'');
    phone = phone.replace(/\D+/g, "");
	if (phone[0] !== '1')
		phone = '1' + phone;
	
	 mobileNotify("Saving new contact...");
	// Look up this contacts phone number in the gg directory
	findUserByPhone(phone, function (result) {
		contact.setACL(APP.models.profile.parseACL);
		contact.set("name", name );
		contact.set("alias", alias);
		contact.set("phone", phone);
		contact.set("address", address);
		contact.set("photo", photo);
		contact.set("group", '');
		contact.set("priority", 0);
		contact.set("privateChannel", null);
		contact.set("uuid", guid);
		if (result.found) {	
			contact.set("phoneVerified", result.user.phoneVerified);
			// Does the contact have a verified email address
			if (result.user.emailVerified) {
				// Yes - save the email address the contact verified
				contact.set("email", result.user.email);
			} else {
				// No - just use the email addres the our user selected
				contact.set("email", email);
			}
			contact.set('publicKey',  result.user.publicKey);
			contact.set("contactUUID", result.user.userUUID);
			
		} else {
			contact.set("phoneVerified", false);
			contact.set('publicKey',  null);
			contact.set("contactUUID", null);
		}
							
			

		getBase64FromImageUrl(photo, function (fileData) {
			var parseFile = new Parse.File(guid+".png", {base64 : fileData}, "image/png");
			parseFile.save().then(function() {
				contact.set("parsePhoto", parseFile);
				 contact.save(null, {
					  success: function(contact) {
						// Execute any logic that should take place after the object is saved.
						mobileNotify('Added contact : ' + contact.get('name'));
						APP.models.contacts.contactsDS.add(contact.attributes);
						APP.kendo.navigate('#contacts');
					  },
					  error: function(contact, error) {
						// Execute any logic that should take place if the save fails.
						// error is a Parse.Error with an error code and message.
						  handleParseError(error);
					  }
					});
				}, function(error) {
				  // The file either could not be read, or could not be saved to Parse.
						 handleParseError(error);
				}); 
		});    

	});
   
}
    
function contactsPickContact(e) {
   // e.preventDefault(e);
    navigator.contacts.pickContact(function(contact){
       alert(JSON.stringify(contact));
    },function(err){
        alert('Error: ' + err);
    });
}
    
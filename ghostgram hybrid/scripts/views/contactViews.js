/**
 *
 * Created by donbrad on 8/22/15.
 *
 * The objects / functions behind all contacts and contact views
 */


'use strict';


/*
 * Contacts
 */

var contactsView = {

    _viewInitialized : false,
    updateInterval: null,

    onInit : function (e) {
        _preventDefault(e);

        contactModel.deviceQueryActive = false;

        $("#contacts-listview").kendoMobileListView({
            dataSource: contactModel.contactListDS,
            template: $("#contactsTemplate").html(),
            headerTemplate: $("#contactsHeaderTemplate").html(),
            fixedHeaders: true,
            dataBound: function(e){
                ux.checkEmptyUIState(contactModel.contactListDS, "#contactListDiv >");
            }

        }).kendoTouch({
            filter: ".contactListBox",
            // filter: "div",
            enableSwipe: true,
            tap: function(e){
            	var contactId = e.touch.currentTarget.attributes['data-contact'].value;
            	
                var contact = contactModel.findContactByUUID(contactId);
                if (contact === undefined) {
                    mobileNotify('Contact List: no matching Contact in ContactsDS');
                    return;
                }

                // Todo: don remove current contact logic...
                contactModel.setCurrentContact(contact);
                if (contact.contactUUID !== undefined && contact.contactUUID !== null){
                    $("#contactActionBtns > li:first-child").show();
                } else {
                    $("#contactActionBtns > li:first-child").hide();
                }

                if (contact.category === 'phone') {
                    if (contactModel.unifiedDeviceContact) {
                        // Have a unified device contact -- just to add contact
                       addContactView.openModal(contact);
                    } else {
                        // Still have multiple contacts
                        APP.kendo.navigate('#contactImport?query=' + contact.name);
                    }

                } else if (contact.category === 'unknown') {
                    // Chat contacts - click to connect
                    contactActionView.openModal(contact.uuid);

                } else if (contact.category === 'zapped') {
                    // Deleted Contacts -- click to undelete
                    mobileNotify("Undeleting " + contact.name +  "...");
                    contactModel.undeleteContact(contactId);
                    contactActionView.openModal(contact.uuid);

                } else {
                    // Memebers and Invited Chat Member
                    mobileNotify("Looking up " + contact.name);

                    // Get the latest information from this contact's user data
                    contactModel.updateContactDetails(contact.uuid, function (thisContact) {
                        if (contact.category === 'new' && thisContact.category === 'member') {
                            mobileNotify(thisContact.name + " is now a member!");
                        }

                    });
                    contactActionView.openModal(contact.uuid);
                }
                
            },
            swipe: function(e) {
                // Need to set current contact before exposing editing ux!
                var selection = e.sender.events.currentTarget;
                
                if(e.direction === "left" && !$(selection).hasClass("noSlide")){
                    var otherOpenedLi = $(".contact-active");
                    $(otherOpenedLi).velocity({translateX:"0"},{duration: "fast"}).removeClass("contact-active");
                    
                    if($(selection).hasClass("member") && $(window).width() < 375){
                    	$(selection).velocity({translateX:"-75%"},{duration: "fast"}).addClass("contact-active");
                    } else if ($(selection).hasClass("member"))  {
                    	$(selection).velocity({translateX:"-60%"},{duration: "fast"}).addClass("contact-active");
                    } else if($(window).width() < 375) {
        				$(selection).velocity({translateX:"-85%"},{duration: "fast"}).addClass("contact-active");
                    } else {
                    	$(selection).velocity({translateX:"-75%"},{duration: "fast"}).addClass("contact-active");
                    }
                }
                if (e.direction === "right" && $(selection).hasClass("contact-active")){
                    $(selection).velocity({translateX:"0"},{duration: "fast"}).removeClass("contact-active");
                }

            }
        });



        // Update search UX whenever search input content changes.
       // $("#contactSearchInput" ).on('input', contactsView.updateSearchUX);
    },

    onShow : function (e) {
       _preventDefault(e);
       
        if (!contactsView._viewInitialized) {
            contactsView._viewInitialized = true;
         
            $("#contacts .gg_mainSearchInput").on('input', function() {

                var query = this.value;
                if (query.length > 0) {
                    contactModel.contactListDS.filter( {"logic":"or",
                        "filters":[
                            {
                                "field":"name",
                                "operator":"contains",
                                "value":query},
                            {
                                "field":"alias",
                                "operator":"contains",
                                "value":query},
                            {
                                "field":"group",
                                "operator":"contains",
                                "value":query}
                        ]});

                    $('#contacts .enterSearch').removeClass('hidden');

                    if (query.length > 2) {
                        $('#btnSearchDeviceContacts').removeClass('hidden');
                        
                    }

                    $("#btnSearchDeviceName").text(query);

                } else {
                    contactModel.contactListDS.filter([]);
                    contactsView.hideSearchUX();
                    $('#contacts .enterSearch').addClass('hidden');
                }
            });

			// bind clear search btn
			$("#contacts .enterSearch").on("click", function(){
					$("#contacts .gg_mainSearchInput").val('');
					
					// reset data filters
					contactModel.contactListDS.data(contactModel.contactListDS.data());
                    contactModel.contactListDS.filter([]);

                    // hide find on device btn
                    $('#btnSearchDeviceContacts').addClass('hidden');
                    $('#btnSearchDeviceName').val('');

                    // hide clear btn
                    $(this).addClass('hidden');
			});

        }

        $("#contacts .gg_mainSearchInput").attr("placeholder", "Search contacts...");
        
       // contactModel.contactListDS.data(contactModel.contactsDS.data());
        //APP.models.contacts.contactListDS.data(APP.models.contacts.deviceContactsDS.data());

        contactsView.updateContactListDS();
        mobileNotify("Updating contact status...");
        contactModel.updateContactListStatus();

        // Update the contact list every 5 minutes while the contact list view is active
        //contactsView.updateInterval = setInterval(function(){ contactModel.updateContactListStatus(true) }, 300000);
        // Reset the filters and ux state on show.
        

        // set action button
    	ux.showActionBtn(true, "#contacts", "#contactImport");
    	ux.showActionBtnText("#contacts", "3em", "New Contact");
    	// Bind contact search

    },

    // All update the ContactListDS item with current changes
    updateContactListDS : function () {
        contactModel.contactListDS.data([]);
        contactModel.contactListDS.data(contactModel.contactsDS.data());
    },

    onHide: function(){
    	ux.showActionBtn(false, "#contacts");
    	$("#btnSearchDeviceContacts").addClass("hidden");
    	ux.hideSearch();
        /*if (contactsView.updateInterval !== null) {
            clearInterval(contactsView.updateInterval);
            contactsView.updateInterval = null;
        }*/

    },

    updateSearchUX: function (event) {
        var query = $('#contacts .gg_mainSearchInput').val();

        if (query.length > 2) {
            $("#btnSearchDeviceName").text(query);
            $('#btnSearchDeviceContacts').removeClass('hidden');
        } else {
            contactsView.hideSearchUX();
        }
    },

    hideSearchUX : function () {
      /*  var dataSource = contactModel.contactListDS;
        dataSource.data([]);
        contactModel.deviceContactsDS.data([]);
        dataSource.data(contactModel.contactsDS.data());
        dataSource.filter([]);*/
        contactModel.deviceContactsDS.data([]);
        $('#btnSearchDeviceContacts').addClass('hidden');

    },

    searchDeviceContacts: function (e) {
       _preventDefault(e);
       // hide clear search
       	$("#contacts .enterSearch").addClass("hidden");

        var query = $('#contacts .gg_mainSearchInput').val();
        ux.hideSearch();
        
        APP.kendo.navigate("#contactImport?query="+query);

    },


    doEditContact: function (e) {
        _preventDefault(e);
        var contactId = e.button[0].attributes["data-contact"].value;

        APP.kendo.navigate("#editContact?contact=" + contactId);
    },


    doBlockContact : function (e) {
    	// Todo Don - review Contact block from contact list
        _preventDefault(e);
        var contactId = e.button[0].attributes["data-contact"].value;
        contactModel.blockContact(contactId);

    },

    doUnBlockContact : function (e) {
        _preventDefault(e);
        var contactId = e.button[0].attributes["data-contact"].value;
        contactModel.unblockContact(contactId);

    },

    doDeleteContact : function (e) {
        _preventDefault(e);

        var contactId = e.button[0].attributes["data-contact"].value;
        contactModel.deleteContact(contactId);
        var contact = contactModel.findContactByUUID(contactId)
        var string = "Deleted contact: " + contact.name + " ("+ contact.alias + ")" ;

        mobileNotify(string);
        APP.kendo.navigate('#contacts');

    },

     doInviteContact : function (e) {
        _preventDefault(e);

        var contactId = e.button[0].attributes["data-contact"].value;
        var contact = contactModel.findContactByUUID(contactId);


        var email = contact.email, inviteSent = contact.inviteSent;

        if (inviteSent === undefined || inviteSent === false) {
            contactSendEmailInvite(email);
            contactModel.currentContact.set('inviteSent', true);
            contactModel.currentContact.set('lastInvite', ggTime.currentTime());
            //  updateParseObject('contacts', 'uuid', uuid, 'inviteSent', true );
            //  updateParseObject('contacts', 'uuid', uuid, 'lastInvite', ggTime.currentTime() );
        } else {
            mobileNotify(contact.name + "has already been invited");
        }

    }
};

/*
 * Contact Import View
 */

var contactImportView = {

    onInit: function (e) {
        _preventDefault(e);
        

        $("#contactimport-listview").kendoMobileListView({
            dataSource: contactModel.deviceContactsDS,
            template: $("#deviceContactsTemplate").html(),
            headerTemplate: "${value}",
            fixedHeaders: true,
            click: contactImportView.processDeviceContact,
            dataBinding: function(e){
            	// todo jordan - wire results UI
            	
            }

        });

        $("#addContactPhone").change(function() {
            var phone = $("#addContactPhone").val();
            mobileNotify("Please wait - validating phone...");
            isValidMobileNumber(phone, function(result){
                if (result.status === 'ok') {
                    if (result.valid === false) {
                        mobileNotify("Sorry, " + phone + 'is not a  mobile number!');
                    } else {
                        mobileNotify("Success!! " + phone + 'is a mobile number');
                    }
                }
            });
        });

        // Top search
        $('#contactImport .gg_mainSearchInput').attr("placeholder", "Search device contacts...");

        $("#contactImport .gg_mainSearchInput").on('input', function(e) {
            var timer = 0, delay = 800;  //delay is .8 secs
        	var query = $(this).val();
        	
        	if(query.length > 0){
        		$("#contactImport .enterSearch").removeClass("hidden");
        	} else {
        		$("#contactImport .enterSearch").addClass("hidden");
        	}


            if(query.length > 2) {
                // delay
                window.clearTimeout(timer);
                timer = window.setTimeout(function () {
                    contactImportView.searchContacts(query);
                }, delay);
        	} 
        }).keyup(function(e){
        	var query = $(this).val();

        	if (e.keyCode === 13) {
				contactImportView.searchContacts(query);
			}
        });

        $("#contactImport .enterSearch").on("click", function(){
			$("#contactImport .gg_mainSearchInput").val('');
					
			// reset data filters
            contactModel.deviceContactsDS.filter([]);
            contactModel.deviceContactsDS.data(contactModel.deviceContactsDS.data());

            // hide clear btn
            $(this).addClass('hidden');
		});
    },

    onShow: function (e) {
       _preventDefault(e);
        var query = null;
        query = e.view.params.query;
        
        if (query !== null && query !== undefined) {
            
            deviceFindContacts(query);
            //console.log("passed: " + query);
            // Pass query to search box
            $("#contactImport .gg_mainSearchInput").val(query);
            $("#contactImport .enterSearch").removeClass('hidden');

        } else {
        	$("#contactImport .gg_mainSearchInput").val("");
        	$("#contactImport .enterSearch").addClass("hidden");
        }

        // always show search
        $(".gg_mainSearchBox").css("display", "block").data("visible", true);
    },

    searchContacts: function (query) {
       	//_preventDefault(e);
		deviceFindContacts(query, function(contacts) {

		});

       
    },

    onHide: function(e){
    	// clear contact import search

    },

    processDeviceContact: function (e) {
        _preventDefault();

        contactModel.currentDeviceContact = e.dataItem;
        // User has picked a contact from the list --
        // sync data from  any contacts with same name
        var query = e.dataItem.name;
        mobileNotify("Unifying contact information for " + query);

        syncContactWithDevice(query, function (contacts) {

            contactModel.emailArray = [];

            for (var i = 0; i<contactModel.currentDeviceContact.emails.length; i++) {
                var email = {};
                email.name = contactModel.currentDeviceContact.emails[i].name;
                email.address =  contactModel.currentDeviceContact.emails[i].address;

                contactModel.emailArray.push(email);

            }

            contactModel.phoneArray = [];
            for (var j = 0; j<contactModel.currentDeviceContact.phoneNumbers.length; j++) {
                var phone = {};
                phone.name = contactModel.currentDeviceContact.phoneNumbers[j].name;
                phone.number = contactModel.currentDeviceContact.phoneNumbers[j].number;

                contactModel.phoneArray.push(phone);

            }

            contactModel.addressArray = [];
            for (var a = 0; a<contactModel.currentDeviceContact.addresses.length; a++) {
                var address = {};
                address.name = contactModel.currentDeviceContact.addresses[a].name;
                address.address =  contactModel.currentDeviceContact.addresses[a].fullAddress;

                contactModel.addressArray.push(address);
            }

            contactModel.phoneDS.data( contactModel.phoneArray);
            contactModel.emailDS.data( contactModel.emailArray);
            contactModel.addressDS.data( contactModel.addressArray);


            /*
             $("#addNicknameBtn").removeClass("hidden");
             $("#contactNicknameInput input").val("");*/

            var data = contactModel.currentDeviceContact;

            // Set name
            var name = data.name;
            $("#addContactName").val(name);

            if (data.photo !== null) {
                returnValidPhoto(data.photo, function(validUrl) {
                    $("#addContactPhoto").attr("src",validUrl);
                });
            } 

            // Select the contact
            contactModel.deviceContactsDS.data([contacts[0]]);


            addContactView.openModal(contacts[0]);

        });
    }
};

/*
 * Add Contact
 */

var addContactView = {
	_closeModal: false,
    _emailValid: false,

    doInit: function (e) {
        _preventDefault(e);

        $( "#addContactPhone" ).on('input', function() {
            var phone = $("#addContactPhone").val();

            isValidMobileNumber(phone, function(result){
                if (result.status === 'ok') {
                    if (result.valid === false) {
                    mobileNotify(phone + ' is not a valid mobile number');
                    $("#vaildMobileNumberError").velocity("slideDown");
                    $("#addContacViewAddButton").text("Close");
                    addContactView._closeModal = true;
                } else {
                    $("#vaildMobileNumberError").velocity("slideUp");
                    $("#addContacViewAddButton").text("Add Contact");
                    addContactView._closeModal = false;
                }
                }
            });
        });

        $("#addContactForm").kendoValidator({
        	errorTemplate: '<span class="error-msg">#=message#</span>'
        });


        $('#addContactEmail').on('blur', function () {
            var email = $('#addContactEmail').val();
            if (!addContactView.validateContact(email)){
                addContactView._emailValid = false;
                mobileNotify(email + " + is not a valid email address");
            } else {
                addContactView._emailValid = true;
            }
        });

        // Generate a contact alias on blur if the user hasn't already added one...
        $('#addContactName').on('blur', function () {
            var alias =  $('#addContactAlias').val();

            if (alias.length === 0) {
                var name = $('#addContactName').val();
                if (name.length > 0) {
                    var nameArray = name.split(' ');

                    if (nameArray.length === 1) {
                        $('#addContactAlias').val(nameArray[0]);
                    } else {
                        var lastInitial = nameArray[nameArray.length-1].charAt(0);
                        nameArray[nameArray.length-1] = lastInitial;
                        var newAlias = '';
                        for (var i=0; i<nameArray.length; i++) {
                            newAlias += nameArray[i] + ' ';
                        }

                        newAlias.trim();
                        $('#addContactAlias').val(newAlias);

                    }

                }

            }

        });
    },

    openModal : function (contact) {


        // Hide the Add Contact Button until the mobile number is validated...
        //$('#addContacViewAddButton').addClass('hidden');
        var data = contact;

        // Set name
        var name = data.name;

        if(name !== ''){
        	$("#addContactName-blank").removeClass("hidden");
        	$("#addContactName, #addContactName-error").val(name);
        } else {
        	$("#addContactName-blank").addClass("hidden");
        }
        


        if (data.photo === null) {
            $("#addContactPhoto").attr("src","images/ghostgramcontact.png");

        } else {
            returnValidPhoto(data.photo, function(validUrl) {
                $("#addContactPhoto").attr("src",validUrl);
            });
        }
        contactModel.emailArray = new Array();

        for (var i = 0; i<contactModel.currentDeviceContact.emails.length; i++) {
            var email = new Object();
            email.name = contactModel.currentDeviceContact.emails[i].name;
            email.address =  contactModel.currentDeviceContact.emails[i].address;

            contactModel.emailArray.push(email);

        }

        contactModel.phoneArray = new Array();
        for (var j = 0; j<contactModel.currentDeviceContact.phoneNumbers.length; j++) {
            var phone = new Object();
            phone.name = contactModel.currentDeviceContact.phoneNumbers[j].name;
            phone.number = contactModel.currentDeviceContact.phoneNumbers[j].number;

            contactModel.phoneArray.push(phone);

        }

        contactModel.addressArray = new Array();
        for (var a = 0; a<contactModel.currentDeviceContact.addresses.length; a++) {
            var address = new Object();
            address.name = contactModel.currentDeviceContact.addresses[a].name;
            address.address =  contactModel.currentDeviceContact.addresses[a].fullAddress;

            contactModel.addressArray.push(address);
        }

        contactModel.phoneDS.data( contactModel.phoneArray);
        contactModel.emailDS.data( contactModel.emailArray);
        contactModel.addressDS.data( contactModel.addressArray);


        /*
         $("#addNicknameBtn").removeClass("hidden");
         $("#contactNicknameInput input").val("");*/


        $("#modalview-AddContact").data("kendoMobileModalView").open();


        // Moved mobile number test to validate contact -- this is an expensive call in time and $$


    },

    closeModal : function () {
        $("#modalview-AddContact").data("kendoMobileModalView").close();
    },

    validateEmail : function (email) {
        var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    },


    validateContact: function(e) {
        _preventDefault(e);
        var name = $('#addContactName').val(),
            alias = $('#addContactAlias').val(),
            phone = $('#addContactPhone').val(),
            email = $('#addContactEmail').val(),
            photo = $('#addContactPhoto').prop('src'),
            group =  $('#addContactGroup').val(),
            address = $('#addContactAddress').val();

        var form = $("#addContactForm").kendoValidator().data("kendoValidator");


        // Confirm that there not an existing contact with this phone number.
        var contact = contactModel.findContactByPhone(phone);

        if (contact !== undefined) {
            mobileNotify('Phone: ' + phone + " matches existing contact: " + contact.name);
            return;
        }
        mobileNotify("Please wait - validating mobile phone....");
        isValidMobileNumber(phone, function(result){
            if (result.status === 'ok') {
                if (result.valid === false) {
                    mobileNotify(phone + ' is not a valid mobile number');
                    $("#vaildMobileNumberError").velocity("slideDown");
                    //$("#addContacViewAddButton").text("Close");
                    return;

                } else {

                    $("#vaildMobileNumberError").velocity("slideUp");
                    $("#addContacViewAddButton").text("Add Contact");
                    mobileNotify("Mobile phone is valid!");

                    if (addContactView._emailValid){
                        isValidEmail(email, function(emailResult) {
                            if (emailResult.status === 'ok' )
                                addContactView.addContact();
                        });
                    } else {
                        addContactView.addContact();
                    }

                }
            }
        });
    	/*if(form.validate() && addContactView._closeModal === false){
    		addContactView.addContact();
    	} else {
    		addContactView.closeModal();
    	}
*/
    },

    addContact : function (e) {
        _preventDefault(e);

        var Contacts = Parse.Object.extend("contacts");
        var contact = new Contacts();

        var name = $('#addContactName').val(),
            alias = $('#addContactAlias').val(),
            phone = $('#addContactPhone').val(),
            email = $('#addContactEmail').val(),
            //photo = $('#addContactPhoto').prop('src'),
            group =  $('#addContactGroup').val(),
            address = $('#addContactAddress').val(),
            emailValid = false,
            addressValid = false;



        if (phone === null || phone.length < 10) {
            // Todo: need better UX for contacts without phone
            mobileNotify('Contacts must have a valid phone number!');
            return;
        }


        var guid = uuid.v4();

       if (email === undefined) {
           email = null;
           emailValid  = false;
       }

        if (address === undefined) {
            address = null;
            addressValid = false;
        }
        var url = contactModel.createIdenticon(guid);
        $('#addContactPhoto').prop('src', url);
        contact.setACL(userModel.parseACL);
        contact.set("version", contactModel._version );
        contact.set("name", name );
        contact.set("alias", alias);
        contact.set("email", email);
        contact.set("address", address);
        contact.set("group", group);
        contact.set("photo", null);
        contact.set('category', "new");
        contact.set("priority", 0);
        contact.set("isFavorite", false);
        contact.set("isBlocked", false);
        contact.set("inviteSent", false);
        contact.set("lastInvite", 0);
        contact.set("uuid", guid);
        contact.set('contactUUID', null);
        contact.set('contactPhone', null);
        contact.set('contactEmail', null);
        contact.set('ownerUUID', userModel.currentUser.userUUID);

        //phone = phone.replace(/\+[0-9]{1-2}/,'');

        phone = phone.replace(/\D+/g, "");
        if (phone[0] !== '1')
            phone = '1' + phone;

        if (contactModel.findContactByPhone(phone) !== undefined) {
            mobileNotify("Existing contact with this phone number");
            addContactView.closeModal();
            return;
        }

        contact.set("phone", phone);

        // Close modal
       // addContactView.closeModal();

       // mobileNotify("Invite sent");

        // Look up this contacts phone number in the gg directory
      findUserByPhone(phone, function (result) {

            if (result.found) {
                var thisContact = result.user;
                contact.set("phoneVerified", thisContact.phoneVerified);
                // Does the contact have a verified email address
                contact.set("email", thisContact.email);
                if (thisContact.emailVerified) {
                    // Yes - save the email address the contact verified
                    contact.set("emailValidated", true);
                } else {
                    // No - just use the email address the our user selected
                    contact.set("emailValidated", false);
                }
                contact.set('contactUUID', thisContact.userUUID);
                contact.set('contactPhone', thisContact.phone);
                contact.set('phoneVerified', thisContact.phoneVerified);
                contact.set('phone', thisContact.phone);
                if (thisContact.phoneVerified) {
                    contact.set('category', 'member');
                }
                contact.set('contactEmail', thisContact.email);
                contact.set('photo', null);
                contact.set('contactPhoto', thisContact.photo);
                contact.set('publicKey', thisContact.publicKey);

            } else {
                // No - just use the email address the our user selected
                contact.set("email", email);
                if (emailValid)
                    contactSendEmailInvite(email);
                contact.set("phoneVerified", false);
                contact.set('publicKey',  null);
                contact.set("contactUUID", null);
                contact.set("contactPhone", null);
                contact.set("contactEmail", null);
            }


          contact.save(null, {
              success: function(thiscontact) {
                  // Execute any logic that should take place after the object is saved.
                  mobileNotify('Added contact : ' + thiscontact.get('name'));
                  //var photo = contact.get('photo');

                  var contactx = thiscontact.toJSON();

                  contactx.identicon = url;
                  contactx.photo = url;
                  contactModel.contactsDS.add(contactx);
                  //contactModel.contactListDS.add(contactx);

                  addContactView.closeModal();
                  APP.kendo.navigate('#contacts');
              },
              error: function(contact, error) {
                  // Execute any logic that should take place if the save fails.
                  // error is a Parse.Error with an error code and message.
                  handleParseError(error);
              }
          });

            /*getBase64FromImageUrl(photo, function (fileData) {
                var parseFile = new Parse.File(guid+".png", {base64 : fileData}, "image/png");
                parseFile.save().then(function() {
                    contact.set("parsePhoto", parseFile);
                    contact.set("photo", parseFile._url);
                    contact.save(null, {
                        success: function(contact) {
                            // Execute any logic that should take place after the object is saved.
                            mobileNotify('Added contact : ' + contact.get('name'));
                            contactModel.contactsDS.add(contact.attributes);
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
            });*/

        });

    }
};

/*
 * Edit Contact
 */

var editContactView = {

    // User status flags for potential use in UX.  if true, the contact has updated information
    addressUpdate: false,
    phoneUpdate: false,
    emailUpdate: false,
    memberUpdate: false,
    publicKeyUpdate : false,

    _activeContact : new kendo.data.ObservableObject(),

    onInit: function (e) {
       _preventDefault(e);

       $("#editContactForm").kendoValidator({
       		errorTemplate: "<span class='error-msg'>#=message#</span>"
       });

    },

    updateVerifiedUX: function (phone, email) {

        if (phone){
            $("#edit-verified-phone").removeClass("hidden");
            $("#editContactPhone").prop("readonly", true);
        }

        if(email){
            $("#edit-verified-email").removeClass("hidden");
            $("#editContactEmail").prop("readonly", true);
        }
    },

    // Set active contact object and process any updates (with user notification)
    setActiveContact : function (contact) {
        if (contact !== undefined) {
           // editContactView._activeContact.unbind('change' , editContactView.syncActiveContact);
            editContactView._activeContact.set("uuid", contact.uuid);
            editContactView._activeContact.set("name", contact.name);
            editContactView._activeContact.set("alias", contact.alias);
            editContactView._activeContact.set("phone", contact.phone);
            editContactView._activeContact.set("phoneVerified", contact.phoneVerified);
            editContactView._activeContact.set("email", contact.email);
            editContactView._activeContact.set("emailVerified", contact.emailValidated);  // emailVerified is a reserved term on Parse...
            editContactView._activeContact.set("group", contact.group);
            editContactView._activeContact.set("isFavorite", contact.isFavorite);
            editContactView._activeContact.set("isBlocked", contact.isBlocked);
            editContactView._activeContact.set("photo", contact.photo);
            editContactView._activeContact.set("inviteSent", contact.inviteSent);
            editContactView._activeContact.set("connectSent", contact.connectSent);
            editContactView._activeContact.set("connectReceived", contact.connectReceived);

            editContactView._activeContact.set("address", contact.address);
            editContactView._activeContact.set("category", contact.category);
            if (contact.contactUUID !== undefined) {
                editContactView._activeContact.set("contactUUID", contact.contactUUID);
                editContactView._activeContact.set("contactPhone", contact.contactPhone);
                editContactView._activeContact.set("contactEmail", contact.contactEmail);
                editContactView._activeContact.set("contactAddress", contact.contactAddress);
                editContactView._activeContact.set("publicKey", contact.publicKey);

            }
            if (contact.memberUpdate !== undefined) {
                editContactView.memberUpdate = true;
                mobileNotify(contact.alias + '( ' + contact.name + ') is now a member!');
            }

            if (contact.phoneUpdate !== undefined) {
                editContactView.phoneUpdate = true;
                mobileNotify(contact.alias + '( ' + contact.name + ') has updated their phone number!');
                editContactView._activeContact.set("phone", contact.contactPhone);

            }

            if (contact.emailUpdate !== undefined) {
                editContactView.emailUpdate = true;
                mobileNotify(contact.alias + '( ' + contact.name + ') has updated their email address!');
                editContactView._activeContact.set("email", contact.contactEmail);

            }

          //  editContactView._activeContact.bind('change' , editContactView.syncActiveContact);
        }
    },

    updateContact : function () {
        var contact = contactModel.findContactByUUID(editContactView._activeContact.uuid);
        var contactList = contactModel.findContactListUUID(editContactView._activeContact.uuid);

        contact.set("name", editContactView._activeContact.name);
        contact.set("alias", editContactView._activeContact.alias);
        contact.set("phone", editContactView._activeContact.phone);
        contact.set("email", editContactView._activeContact.email);
        contact.set("photo", editContactView._activeContact.photo);
        contact.set("isFavorite", editContactView._activeContact.isFavorite);
        contact.set("isBlocked", editContactView._activeContact.isBlocked);
        if (editContactView._activeContact.contactUUID !== undefined && editContactView._activeContact.contactUUID !== null) {
            contact.set("contactUUID", editContactView._activeContact.contactUUID);
            contact.set("contactEmail", editContactView._activeContact.contactEmail);
            contact.set("contactPhone", editContactView._activeContact.contactPhone);
            contact.set("contactAddress", editContactView._activeContact.contactAddress);
            contact.set("publicKey", editContactView._activeContact.publicKey);
        }

        contact.set("group", editContactView._activeContact.group);
        contact.set("address", editContactView._activeContact.address);
        contact.set("category", editContactView._activeContact.category);


        contactList.set("name", editContactView._activeContact.name);
        contactList.set("alias", editContactView._activeContact.alias);
        contactList.set("phone", editContactView._activeContact.phone);
        contactList.set("email", editContactView._activeContact.email);
        contactList.set("photo", editContactView._activeContact.photo);
        contactList.set("group", editContactView._activeContact.group);
        contactList.set("isFavorite", editContactView._activeContact.isFavorite);
        contactList.set("isBlocked", editContactView._activeContact.isBlocked);
        contactList.set("address", editContactView._activeContact.address);
        contactList.set("category", editContactView._activeContact.category);
        if (editContactView._activeContact.contactUUID !== undefined && editContactView._activeContact.contactUUID !== null) {
            contactList.set("contactUUID", editContactView._activeContact.contactUUID);
            contactList.set("contactEmail", editContactView._activeContact.contactEmail);
            contactList.set("contactPhone", editContactView._activeContact.contactPhone);
            contactList.set("contactAddress", editContactView._activeContact.contactAddress);
            contactList.set("publicKey", editContactView._activeContact.publicKey);
        }


        updateParseObject('contacts', 'uuid', editContactView._activeContact.uuid,"name", editContactView._activeContact.name);
        updateParseObject('contacts', 'uuid', editContactView._activeContact.uuid,"alias", editContactView._activeContact.alias);
        updateParseObject('contacts', 'uuid', editContactView._activeContact.uuid,"phone", editContactView._activeContact.phone);
        updateParseObject('contacts', 'uuid', editContactView._activeContact.uuid,"email", editContactView._activeContact.email);
        updateParseObject('contacts', 'uuid', editContactView._activeContact.uuid,"photo", editContactView._activeContact.photo);
        updateParseObject('contacts', 'uuid', editContactView._activeContact.uuid,"group", editContactView._activeContact.group);
        updateParseObject('contacts', 'uuid', editContactView._activeContact.uuid,"isFavorite", editContactView._activeContact.isFavorite);
        updateParseObject('contacts', 'uuid', editContactView._activeContact.uuid,"isBlocked", editContactView._activeContact.isBlocked);
        updateParseObject('contacts', 'uuid', editContactView._activeContact.uuid,"address", editContactView._activeContact.address);
        updateParseObject('contacts', 'uuid', editContactView._activeContact.uuid,"category", editContactView._activeContact.category);

        if (editContactView._activeContact.contactUUID !== undefined && editContactView._activeContact.contactUUID !== null) {
            updateParseObject('contacts', 'uuid', editContactView._activeContact.uuid, "contactUUID", editContactView._activeContact.contactUUID);
            updateParseObject('contacts', 'uuid', editContactView._activeContact.uuid, "contactPhone", editContactView._activeContact.contactPhone);
            updateParseObject('contacts', 'uuid', editContactView._activeContact.uuid, "contactEmail", editContactView._activeContact.contactEmail);
            updateParseObject('contacts', 'uuid', editContactView._activeContact.uuid, "contactAddress", editContactView._activeContact.contactAddress);
            updateParseObject('contacts', 'uuid', editContactView._activeContact.uuid, "publicKey", editContactView._activeContact.publicKey);
        }
        //$("#contacts-listview").data("kendoMobileListView").refresh();

    },

    syncActiveContact: function (e) {

        _preventDefault(e);

        if (e.field !== 'emailVerified') {
            // Parse throws an error if we try to update emailVerified it's a protected field...
            updateParseObject('contacts','uuid', editContactView._activeContact.uuid, e.field, this[e.field]);
        }


    },

    onShow: function (e) {

       _preventDefault(e);

        var contactId = e.view.params.contact, contact = null;


        contact = contactModel.findContactByUUID(contactId);
        if (contact !== undefined) {
           editContactView.setActiveContact(contact);
        } else {
            mobileNotify("EditContact : invalid contactId " + contactId);
        }


        //Show the status update div
        contactModel.updateContactDetails(contactId, function(contact) {
            editContactView.setActiveContact(contact);
            editContactView.updateVerifiedUX(contact.phoneVerified, contact.emailValidated);
            editContactView.updateContact();
            // Hide the status update div
        });

       // Set verified inputs
       if(editContactView._activeContact.phoneVerified){
       		$("#edit-verified-phone").addClass("hidden");
       } else {
       		$("#edit-verified-phone").addClass("hidden");
       }

       if(editContactView._activeContact.emailVerified){
       		$("#edit-verified-email").addClass("hidden");
       } else {
       		$("#edit-verified-email").addClass("hidden");
       }

    },

    validate: function(){
    	var form = $("#editContactForm").kendoValidator().data("kendoValidator");

    	if (form.validate()) {
        	editContactView.updateDone();
    	}

    },

    updateDone: function (e) {
        _preventDefault(e);

        // Update any user changes
        editContactView.updateContact();

        // Close and navigate back
        editContactView.onDone();

    },

    onDone : function (e) {
        _preventDefault(e);

       // contactModel.currentContact.unbind('change' , syncCurrentContact);
        APP.kendo.navigate("#contacts");
        // reset UI
        $("#contactEditList").velocity("fadeIn");
    },

    syncWithParse: function (e) {
        _preventDefault(e);

        mobileNotify("Getting lastest info for " + contactModel.currentContact.name);
        var contact = editContactView._activeContact;
        if (contact.contactUUID !== undefined) {
            getUserContactInfo(contact.contactUUID, function (result) {
                if (result.found) {
                    var user = result.user, dirty = false;
                    if (contact.email !== user.email) {
                        dirty = true;
                        contact.email = user.email;
                        mobileNotify(contact.name + " has changed their preferred email.");
                    }
                    if (contact.phone !== user.phone) {
                        dirty = true;
                        contact.phone = user.phone;
                        mobileNotify(contact.name + " has changed their preferred phone.");
                    }
                    if (contact.phoneVerified !== user.phoneVerified) {
                        dirty = true;
                        contact.phoneVerified = user.phoneVerified;
                        mobileNotify(contact.name + " has verified their phone.");
                    }
                    if (contact.emailValidated !== user.emailVerified) {
                        dirty = true;
                        contact.set('emailValidated',user.emailVerified);
                        mobileNotify(contact.name + " has verified their email.");
                    }
                    if (contact.publicKey !== user.publicKey) {
                        dirty = true;
                        contact.publicKey = user.publicKey;
                        mobileNotify(contact.name + " has changed their public key.");
                    }

                    editContactView.updateVerifiedUX(contact.phoneVerified, contact.emailValidated);

                }

            });
        } else {
            findUserByPhone(contact.phone, function (result) {
                if (result.found) {
                    var user = result.user, dirty = false;
                    if (contact.email !== user.email) {
                        dirty = true;
                        contact.email = user.email;
                        mobileNotify(contact.name + " has changed their preferred email.");
                    }
                    if (contact.phone !== user.phone) {
                        dirty = true;
                        contact.phone = user.phone;
                        mobileNotify(contact.name + " has changed their preferred phone.");
                    }
                    if (contact.phoneVerified !== user.phoneVerified) {
                        dirty = true;
                        contact.phoneVerified = user.phoneVerified;
                        mobileNotify(contact.name + " has verified their phone.");
                    }
                    if (contact.emailValidated !== user.emailVerified) {
                        dirty = true;
                        contact.set('emailValidated',user.emailVerified);
                        mobileNotify(contact.name + " has verified their email.");
                    }
                    if (contact.publicKey !== user.publicKey) {
                        dirty = true;
                        contact.publicKey = user.publicKey;
                        mobileNotify(contact.name + " has changed their public key.");
                    }

                    editContactView.updateVerifiedUX(contact.phoneVerified, contact.emailValidated);

                }

            });
        }
    },

    syncWithDevice : function (e) {

    }
};

var contactActionView = {
    _activeContactId : null,
    _returnModalId : null,
    _activeContact : new kendo.data.ObservableObject(),

    onInit: function (e) {
    	
    },

    refreshUX : function (contact) {

        if (contact.category === 'unknown') {
            $("#contactActionBtns").addClass('hidden');
            $("#contactActionConnect").removeClass('hidden');
            $("#contactActionAccept").addClass('hidden');
        } else {
            $("#contactActionBtns").removeClass('hidden');
            $("#contactActionConnect").addClass('hidden');
            $("#contactActionAccept").addClass('hidden');
            if (contact.category === 'member'){
                $("#contactActionBtns > li:first-child").show();
            } else {
                $("#contactActionBtns > li:first-child").hide();
            }
        }
    },

    setReturnModal : function (modalId) {
        contactActionView._returnModalId = modalId;
    },

    openModal : function (contactId) {

        $("#contactActionBtns").removeClass('hidden');
        var thisContact = contactModel.findContactByUUID(contactId);
        contactActionView.setContact(thisContact);

        contactActionView.refreshUX(thisContact);
        $(".statusContactCard-icon").attr("src", "images/status-away.svg");

        //Show the status update div
        if (thisContact.contactUUID !== undefined && thisContact.contactUUID !== null && thisContact.category !== 'unknown') {
            contactModel.getContactStatusObject(thisContact.contactUUID, function (user) {
                if (user !== null) {
                    var contactIsAvailable = user.get('isAvailable');
                    contactActionView._activeContact.set('contactUUID', thisContact.contactUUID);
                    contactActionView._activeContact.set('statusMessage', user.get('statusMessage'));
                    contactActionView._activeContact.set('currentPlace', user.get('currentPlace'));
                    contactActionView._activeContact.set('currentPlaceId', user.get('currentPlaceId'));
                    contactActionView._activeContact.set('isAvailable', contactIsAvailable);
                    // set available
                    if(contactIsAvailable){
                        $(".statusContactCard-icon").attr("src", "images/status-available.svg");
                    }

                    // Update the contactList object too
                    var contactList = contactModel.findContactList(thisContact.contactUUID);
                    contactList.set('statusMessage', user.get('statusMessage'));
                    var contactPlace = user.get('currentPlace');
                    contactList.set('currentPlace', contactPlace);
                    contactList.set('currentPlaceId', user.get('currentPlaceId'));
                    contactList.set('isAvailable', contactIsAvailable);

                    // set current place
                    if(contactPlace !== "" && contactPlace !== undefined){
                        $("#contactCurrentPlace").text("@" + contactPlace);
                    }
                }
            });
        }

        if (thisContact.category !== 'unknown') {
            // Need to connect with this user before updating contact details
            contactModel.updateContactDetails(contactId, function (contact) {

                if (contact === undefined) {
                    // This is a new contact.
                    contact = contactModel.findContactByUUID(contactId);
                }


                var contactName = contact.name;
                var contactAlias = contact.alias;
                var contactVerified = contact.phoneVerified;
                var contactGroup = contact.group;

                var contactIsAvailable = contact.isAvailable;

                // Add group name
                if (contactGroup !== '' && contactGroup !== null) {
                    $("#currentGroup").removeClass("hidden");
                    $("#currentContactGroup").text(contactGroup);
                } else {
                    $("#currentGroup").addClass("hidden");
                    $("#currentContactGroup").text("");
                }

                contactActionView._activeContact.set('contactUUID', contact.contactUUID);
                contactActionView._activeContact.set('publicKey', contact.publicKey);
                contactActionView._activeContact.set('phone', contact.phone);
                contactActionView._activeContact.set('category', contact.category);
                contactActionView._activeContact.set('name', contactName);
                contactActionView._activeContact.set('alias', contactAlias);
                if (contact.photo !== undefined && contact.photo !== null) {
                    contactActionView._activeContact.set('photo', contact.photo);
                } else {
                    contactActionView._activeContact.set('photo', contact.identicon);
                }

                // Set name/alias layout
                ux.formatNameAlias(contactName, contactAlias, "#modalview-contactActions");

                // set verified status
                if (contactVerified) {
                    $("#currentContactVerified").removeClass("hidden");
                } else {
                    $("#currentContactVerified").addClass("hidden");
                }

                // set profile img
                $("#contactProfileImg").attr("src", contact.photo);

                contactActionView.refreshUX(contact);


            });
        }


        $("#modalview-contactActions").data("kendoMobileModalView").open();

        $("#contactProfileImg").velocity("fadeIn", {delay: 150, duration: 300, display: "inline-block"});
        $("#contactStatusImg").velocity("fadeIn", {delay: 150, duration: 300, display: "inline-block"});
        
        $("#modalview-contactActions .modal-top h2").velocity({translateY: "20%", opacity: 1}, {delay: 300, duration: 500, display: "block"});
        $("#modalview-contactActions .modal-top p").velocity({translateY: "20%", opacity: 1}, {delay: 600, duration: 500, display: "block"});
        $("#modalview-contactActions .modal-bottom .hasMotion").velocity("fadeIn", {duration: 500, delay: 700});
    },


    closeModal : function(){
        $("#modalview-contactActions").data("kendoMobileModalView").close();

        // Clear place
        $("#contactCurrentPlace").text("");

        $("#modalview-contactActions .preMotionUp, #modalview-contactActions .hasMotion").css("display", "none").velocity("fadeOut", {opacity: 0, translateY: "0%"});
    	$("#contactProfileImg, #contactStatusImg").css("opacity", 0);

        if (contactActionView._returnModalId !== null) {
            $(contactActionView._returnModalId).data("kendoMobileModalView").open();
            contactActionView._returnModalId = null;
        }

    },

    restoreModal : function () {
        contactActionView.openModal(contactActionView._activeContactId);
    },

    privateChat : function (e) {
        _preventDefault(e);

        var contact = contactActionView._activeContact;
        var contactUUID = contact.contactUUID, contactName = contact.name, contactPublicKey = contact.publicKey;

        if (contactUUID === undefined || contactUUID === null) {
            mobileNotify(contact.name + " hasn't verified their contact info");
            return;
        }
        // Is there already a private channel provisioned for this user?
        var channel = channelModel.findPrivateChannel(contactUUID);

        var navStr = '#channel?channelId=';
        if (channel !== undefined) {
            navStr = navStr + channel.channelId;
            APP.kendo.navigate(navStr);
        } else {
            channelModel.addPrivateChannel(contactUUID,contactPublicKey, contactName);
            navStr = navStr + contactUUID;
            APP.kendo.navigate(navStr);
        }

    },

    ghostEmail : function (e) {
        _preventDefault(e);
        var viewId = APP.kendo.view().id;

        //Close contactAction to display ghostEdit
        contactActionView.closeModal();

        APP.kendo.navigate("#ghostEditor?returnview="+viewId+"&callback=contactaction");

    },

    callPhone : function (e) {
        _preventDefault(e);

        if (window.navigator.simulator === true){
            mobileNotify("Phone Calls are't supported in the emulator");
            return;
        }

        var number = contactActionView._activeContact.get('phone');
        window.plugins.CallNumber.callNumber(

            function(success) {
                mobileNotify("Dialing " + number);
            },
            function(err) {
                mobileNotify("Dailer error: " + err);
            },
            number
        );
    },

    sendSMS : function (e) {
        _preventDefault(e);

        var number = contactActionView._activeContact.get('phone');
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
    },


    setContact : function (thisContact) {

        contactActionView._activeContactId = thisContact.uuid;
        contactActionView._activeContact.set('name', thisContact.name);
        contactActionView._activeContact.set('alias', thisContact.alias);
        contactActionView._activeContact.set('photo', thisContact.photo);
        contactActionView._activeContact.set('contactUUID', thisContact.contactUUID);
        contactActionView._activeContact.set('contactKey', thisContact.contactKey);
        contactActionView._activeContact.set('statusMessage', thisContact.statusMessage);
        contactActionView._activeContact.set('currentPlace',thisContact.currentPlace);
        contactActionView._activeContact.set('isAvailable', thisContact.isAvailable);

        // set available
        if(thisContact.isAvailable){
            $(".statusContactCard-icon").attr("src", "images/status-available.svg");
        }

        if (thisContact.phoneVerified) {
            $("#currentContactVerified").removeClass("hidden");
        } else {
            $("#currentContactVerified").addClass("hidden");
        }

    }

};
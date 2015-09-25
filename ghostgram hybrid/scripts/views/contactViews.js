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

    onInit : function (e) {
        _preventDefault(e);

        // set search bar
        var scroller = e.view.scroller;
        scroller.scrollTo(0,-44);

        contactModel.deviceQueryActive = false;

        contactModel.contactsDS.bind("change", function (e){
            var data = this.data();
            var ds = contactModel.contactListDS;

        });


        var dataSource = contactModel.contactListDS;

       /* // Activate clearsearch and zero the filter when it's called
        $('#contactSearchInput').clearSearch({
            callback: function() {
                dataSource.data([]);
                dataSource.data(contactModel.contactsDS.data());
                dataSource.filter([]);
                contactModel.deviceContactsDS.data([]);
                $('#btnSearchDeviceContacts').addClass('hidden');
            }
        });*/

        // Filter current contacts and query device contacts on keyup
        // Todo: cache local contacts on first call and then just filter that list
        $('#contactSearchInput').on('input', function() {
            var query = this.value;
            if (query.length > 0) {
                dataSource.filter( {"logic":"or",
                    "filters":[
                        {
                            "field":"name",
                            "operator":"contains",
                            "value":query},
                        {
                            "field":"alias",
                            "operator":"contains",
                            "value":query}
                    ]});
                if (query.length > 2) {
                    $('#btnSearchDeviceContacts').removeClass('hidden');
                }
                $("#btnSearchDeviceName").text(query);

            } else {
                contactsView.hideSearchUX();
            }
        });

        $("#contacts-listview").kendoMobileListView({
            dataSource: contactModel.contactListDS,
            template: $("#contactsTemplate").html(),
            headerTemplate: $("#contactsHeaderTemplate").html(),
            fixedHeaders: true,
            click: function (e) {
                var contact = e.dataItem;

                contact = contactModel.findContactByUUID(contact.uuid);
                if (contact === undefined) {
                    mobileNotify('Contact List: no matching Contact in ContactsDS');
                    return;
                }
                updateCurrentContact(contact);

                if (contact.category === 'phone') {
                    if (contactModel.unifiedDeviceContact) {
                        // Have a unified device contact -- just to add contact
                        launchAddContact({dataItem : contact});
                    } else {
                        // Still have multiple contacts
                        APP.kendo.navigate('#contactImport?query=' + contact.name);
                    }

                } else {
                    // If we know the contacts uuid enable the full feature set
                   // $("#modalview-contactActions").data("kendoMobileModalView").open();

                    contactActionView.openModal(contact.uuid);
                    if (contact.contactUUID !== undefined && contact.contactUUID !== null){
                        $("#contactActionBtns > li:first-child").show();
                    } else {
                        $("#contactActionBtns > li:first-child").hide();
                    }

                }

            },
            dataBound: function(e){
                ux.checkEmptyUIState(contactModel.contactListDS, "#contactListDiv >");
            }

        }).kendoTouch({
            filter: ".contactListBox",
            // filter: "div",
            enableSwipe: true,
            swipe: function(e) {
                // Need to set current contact before exposing editing ux!
                var selection = e.sender.events.currentTarget;
                
                if(e.direction === "left"){
                    var otherOpenedLi = $(".contact-active");
                    $(otherOpenedLi).velocity({translateX:"0"},{duration: "fast"}).removeClass("contact-active");
                    
                    if($(selection).hasClass("member") && $(window).width() < 375){
                    	$(selection).velocity({translateX:"-40%"},{duration: "fast"}).addClass("contact-active");
                    } else {
                    	$(selection).velocity({translateX:"-65%"},{duration: "fast"}).addClass("contact-active");
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
        if (e.preventDefault !== undefined)
            e.preventDefault();

        contactModel.contactListDS.data(contactModel.contactsDS.data());
        //APP.models.contacts.contactListDS.data(APP.models.contacts.deviceContactsDS.data());

        // set action button
    	ux.showActionBtn(true, "#contacts", "#contactImport");
    },

    // All update the ContactListDS item with current changes
    updateContactListDS : function () {
        contactModel.contactListDS.data([]);
        contactModel.contactListDS.data(contactModel.contactsDS.data());
    },

    onBeforeHide: function(){
    	ux.showActionBtn(false, "#contacts");
    },

    updateSearchUX: function (event) {
        var query = $('#contactSearchInput').val();

        if (query.length > 2) {
            $("#btnSearchDeviceName").text(query);
            $('#btnSearchDeviceContacts').removeClass('hidden');
        } else {
            contactsView.hideSearchUX();
        }
    },

    hideSearchUX : function () {
        var dataSource = contactModel.contactListDS;
        dataSource.data([]);
        contactModel.deviceContactsDS.data([]);
        dataSource.data(contactModel.contactsDS.data());
        dataSource.filter([]);
        $('#btnSearchDeviceContacts').addClass('hidden');

    },

    searchDeviceContacts: function (e) {
        if (e !== undefined && e.preventDefault !== undefined) {
            e.preventDefault();
        }

        var query = $('#contactSearchInput').val();

        APP.kendo.navigate("#contactImport?query="+query);

     /*   if (query.length > 2) {
            deviceFindContacts(query, function (array) {

                var name = query.toLowerCase(), nameArray = name.split(' ');

                // Two names?
                if (nameArray.length > 1) {
                    mobileNotify("Unifying " + query + "'s data");
                    unifyContacts(array);
                    contactModel.unifiedDeviceContact = true;
                    contactModel.contactListDS.data([]);
                    contactModel.contactListDS.add(array[0]);
                } else {
                    contactModel.unifiedDeviceContact = false;
                    for (var i = 0; i < array.length; i++) {
                        contactModel.contactListDS.add(array[i]);
                    }
                }

            });
        } else {
            mobileNotify("Please enter contacts first or last name. ")
        }
        */
    },


    doEditContact: function (e) {
        _preventDefault(e);
        var contactId = e.button[0].attributes["data-contact"].value;

        APP.kendo.navigate("#editContact?contact=" + contactId);
    },



    doDeleteContact : function (e) {
        _preventDefault(e);

        var contactId = e.button[0].attributes["data-contact"].value;
        contactModel.deleteContact(contactId);

        var string = "Deleted contact: " + contactModel.currentContact.name + " ("+ contactModel.currentContact.alias + ")" ;
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

var contactImportView = {
    onInit: function (e) {
        if (e !== undefined && e.preventDefault !== undefined) {
            e.preventDefault();
        }

        $("#contactimport-listview").kendoMobileListView({
            dataSource: contactModel.deviceContactsDS,
            template: $("#deviceContactsTemplate").html(),
            headerTemplate: "${value}",
            fixedHeaders: true,
            click: contactImportView.processDeviceContact

        });

        

        $("#addContactPhone").change(function() {
            var phone = $("#addContactPhone").val();
            mobileNotify("Please wait - validating phone...");
            isValidMobileNumber(phone, function(result){
                if (result.status === 'ok') {
                    if (result.valid === false) {
                        mobileNotify(phone + 'is not a valid mobile number');
                    }
                }
            });
        });
        
        $("#contactImportQuery").change(function(e){
        	var query = $('#contactImportQuery').val();
        	if(query.length > 2){
        		$(".enterSearch > span").css("color", "#2E93FD");
        	} else {
        		$(".enterSearch > span").css("color", "#E0E0E0");
        	}
        }).keyup(function(e){
        	if (e.keyCode === 13) {
				contactImportView.searchContacts();
			}
        });
    },

    onShow: function (e) {
        if (e !== undefined && e.preventDefault !== undefined) {
            e.preventDefault();
        }
        var query = e.view.params.query;

        if (query !== undefined) {
            $('#contactImportQuery').val(query);
            deviceFindContacts(query);
        }
    },

    searchContacts: function (e) {
        if (e !== undefined && e.preventDefault !== undefined) {
            e.preventDefault();
        }
        var query = $('#contactImportQuery').val();

        if (query.length > 2) {
            deviceFindContacts(query, function(contacts) {

            });
        }
    },

    resetContactImport: function(e){
    	$("#contactImportQuery").val("");

    },

    processDeviceContact: function (e) {
        if (e !== undefined && e.preventDefault !== undefined) {
            e.preventDefault();
        }

        contactModel.currentDeviceContact = e.dataItem;
        // User has picked a contact from the list --
        // sync data from  any contacts with same name
        mobileNotify("Unifying contact information for " + e.dataItem.name);

        syncContactWithDevice(e.dataItem.name, function (contacts) {

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

            // Open add contact view
            contactImportView.launchAddContact();

        });
    },

    launchAddContact : function () {
        $("#modalview-AddContact").data("kendoMobileModalView").open();
    }
};

var addContactView = {
    doInit: function (e) {
        if (e !== undefined && e.preventDefault !== undefined)
            e.preventDefault();

        $( "#addContactPhone" ).change(function() {
            var phone = $("#addContactPhone").val();

            isValidMobileNumber(phone, function(result){
                if (result.status === 'ok') {
                    if (result.valid === false) {
                        mobileNotify(phone + 'is not a valid mobile number');
                    }
                }
            });
        });
    },

    doShow : function (e) {
        if (e !== undefined && e.preventDefault !== undefined)
            e.preventDefault();

        var data = contactModel.currentDeviceContact;

        // Set name
        var name = data.name;


        $("#addContactName").val(name);


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

        var data = contactModel.currentDeviceContact;

        // Set name
        var name = data.name;
        $("#addContactName").val(name);


        if (data.photo !== null) {
            returnValidPhoto(data.photo, function(validUrl) {
                $("#addContactPhoto").attr("src",validUrl);
            });
        }



    },

    addContact : function (e) {
        _preventDefault(e);

        var Contacts = Parse.Object.extend("contacts");
        var contact = new Contacts();

        var name = $('#addContactName').val(),
            alias = $('#addContactAlias').val(),
            phone = $('#addContactPhone').val(),
            email = $('#addContactEmail').val(),
            photo = $('#addContactPhoto').prop('src'),
            address = $('#addContactAddress').val();
        var guid = uuid.v4();

        contact.setACL(userModel.parseACL);
        contact.set("name", name );
        contact.set("alias", alias);
        contact.set("address", address);
        contact.set("group", '');
        contact.set('category', "new");
        contact.set("priority", 0);
        contact.set("isFavorite", false);
        contact.set("uuid", guid);

        //phone = phone.replace(/\+[0-9]{1-2}/,'');
        phone = phone.replace(/\D+/g, "");
        if (phone[0] !== '1')
            phone = '1' + phone;

        if (contactModel.findContactByPhone(phone) !== undefined) {
            mobileNotify("Existing contact with this phone number");
            $("#modalview-AddContact").data("kendoMobileModalView").close();
            return;
        }

        contact.set("phone", phone);

        // Close modal
        $("#modalview-AddContact").data("kendoMobileModalView").close();

        mobileNotify("Invite sent");

        // Look up this contacts phone number in the gg directory
      findUserByPhone(phone, function (result) {

            if (result.found) {
                var thisContact = result.user;
                contact.set("phoneVerified", thisContact.phoneVerified);
                // Does the contact have a verified email address
                if (thisContact.emailVerified) {
                    // Yes - save the email address the contact verified
                    contact.set("email", thisContact.email);
                    contact.set("emailValidated", true);
                } else {
                    // No - just use the email address the our user selected
                    contact.set("email", email);
                    contact.set("emailValidated", false);
                }
                contact.set('statusMessage', thisContact.statusMessage);
                contact.set('currentPlace', thisContact.currentPlace);
                contact.set('currentPlaceUUID', thisContact.currentPlaceUUID);
                contact.set('contactUUID', thisContact.userUUID);
                contact.set('contactPhone', thisContact.phone);
                contact.set('phoneVerified', thisContact.phoneVerified);
                if (thisContact.phoneVerified) {
                    contact.set('category', 'member');
                }
                contact.set('contactEmail', thisContact.email);
                contact.set('photo', null);
                contact.set('contactPhoto', thisContact.photo);
                contact.set('isAvailable', thisContact.isAvailable);
                contact.set('publicKey', thisContact.publicKey);

            } else {
                // No - just use the email address the our user selected
                contact.set("email", email);
                contactSendEmailInvite(email);
                contact.set("phoneVerified", false);
                contact.set('publicKey',  null);
                contact.set("contactUUID", null);
            }

          contact.save(null, {
              success: function(contact) {
                  // Execute any logic that should take place after the object is saved.
                  mobileNotify('Added contact : ' + contact.get('name'));
                  //var photo = contact.get('photo');
                  var url = contactModel.createIdenticon(guid);
                  contact.attributes.photo = url;
                  contactModel.contactsDS.add(contact.attributes);
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

var editContactView = {

    _activeContact : new kendo.data.ObservableObject(),

    onInit: function (e) {
       _preventDefault(e);

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

    setActiveContact : function (contact) {
        if (contact !== undefined) {
           // editContactView._activeContact.unbind('change' , editContactView.syncActiveContact);
            editContactView._activeContact.set("uuid", contact.uuid);
            editContactView._activeContact.set("name", contact.name);
            editContactView._activeContact.set("alias", contact.alias);
            editContactView._activeContact.set("phone", contact.phone);
            editContactView._activeContact.set("email", contact.email);
            editContactView._activeContact.set("photo", contact.photo);
            editContactView._activeContact.set("address", contact.address);
          //  editContactView._activeContact.bind('change' , editContactView.syncActiveContact);
        }
    },

    updateContact : function () {
        var contact = contactModel.findContactByUUID(editContactView._activeContact.uuid);

        contact.set("name", editContactView._activeContact.name);
        contact.set("alias", editContactView._activeContact.alias);
        contact.set("phone", editContactView._activeContact.phone);
        contact.set("email", editContactView._activeContact.email);
        contact.set("photo", editContactView._activeContact.photo);
        contact.set("address", editContactView._activeContact.address);

        updateParseObject('contacts', 'uuid', editContactView._activeContact.uuid,"name", editContactView._activeContact.name);
        updateParseObject('contacts', 'uuid', editContactView._activeContact.uuid,"alias", editContactView._activeContact.alias);
        updateParseObject('contacts', 'uuid', editContactView._activeContact.uuid,"phone", editContactView._activeContact.phone);
        updateParseObject('contacts', 'uuid', editContactView._activeContact.uuid,"email", editContactView._activeContact.email);
        updateParseObject('contacts', 'uuid', editContactView._activeContact.uuid,"photo", editContactView._activeContact.photo);
        updateParseObject('contacts', 'uuid', editContactView._activeContact.uuid,"address", editContactView._activeContact.address);

        editContactView.onDone();
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
        contactModel.updateContactStatus(contactId, function(contact) {
            editContactView.setActiveContact(contact);
            editContactView.updateVerifiedUX(contact.phoneVerified, contact.emailValidated);
            // Hide the status update div
        });

        //   $("#syncEditList").velocity("slideUp", {duration: 0});

       // $('#contactEditList').removeClass('hidden');




    },

    onDone : function (e) {
       _preventDefault(e);

       // contactModel.currentContact.unbind('change' , syncCurrentContact);
        contactsView.updateContactListDS();
        APP.kendo.navigate("#contacts");
        // reset UI
        $("#contactEditList").velocity("fadeIn");
    },

    syncWithParse: function (e) {
        _preventDefault(e);

        mobileNotify("Getting lastest info for " + contactModel.currentContact.name);
        var contact = contactModel.currentContact;
        if (contact.contactUUID !== undefined) {
            getUserContactInfo(contact.contactUUID, function (result) {
                if (result.found) {
                    var user = result.user, dirty = false;
                    if (contact.email !== user.email) {
                        dirty = true;
                        contact.email = user.email;
                        mobileNotify(contact.name + " has changed their preferred email.")
                    }
                    if (contact.phone !== user.phone) {
                        dirty = true;
                        contact.phone = user.phone;
                        mobileNotify(contact.name + " has changed their preferred phone.")
                    }
                    if (contact.phoneVerified !== user.phoneVerified) {
                        dirty = true;
                        contact.phoneVerified = user.phoneVerified;
                        mobileNotify(contact.name + " has verified their phone.")
                    }
                    if (contact.emailValidated !== user.emailVerified) {
                        dirty = true;
                        contact.set('emailValidated',user.emailVerified);
                        mobileNotify(contact.name + " has verified their email.")
                    }
                    if (contact.publicKey !== user.publicKey) {
                        dirty = true;
                        contact.publicKey = user.publicKey;
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
                        mobileNotify(contact.name + " has changed their preferred email.")
                    }
                    if (contact.phone !== user.phone) {
                        dirty = true;
                        contact.phone = user.phone;
                        mobileNotify(contact.name + " has changed their preferred phone.")
                    }
                    if (contact.phoneVerified !== user.phoneVerified) {
                        dirty = true;
                        contact.phoneVerified = user.phoneVerified;
                        mobileNotify(contact.name + " has verified their phone.")
                    }
                    if (contact.emailValidated !== user.emailVerified) {
                        dirty = true;
                        contact.set('emailValidated',user.emailVerified);
                        mobileNotify(contact.name + " has verified their email.")
                    }
                    if (contact.publicKey !== user.publicKey) {
                        dirty = true;
                        contact.publicKey = user.publicKey;
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
    _activeContact : new kendo.data.ObservableObject(),

    onInit: function (e) {
    	
    },

    openModal : function (contactId) {

        contactActionView.setContact(contactId);

        //Show the status update div

        contactModel.updateContactStatus(contactId, function(contact) {
         
            if (contact === undefined) {
                // This is a new contact.
                contact = contactModel.findContactByUUID(contactId);
            }
            var contactName = contact.name;
            var contactAlias = contact.alias;
            var contactVerified = contact.phoneVerified;
            var contactIsAvailable = contact.isAvailable;
           
            contactActionView._activeContact.set('name', contactName);
            contactActionView._activeContact.set('alias', contactAlias);
            if (contact.contactPhoto !== undefined && contact.contactPhoto !== null) {
                contactActionView._activeContact.set('photo', contact.contactPhoto);
            } else {
                contactActionView._activeContact.set('photo', contact.photo);
            }

            contactActionView._activeContact.set('statusMessage', contact.statusMessage);
            contactActionView._activeContact.set('currentPlace', contact.currentPlace);
            contactActionView._activeContact.set('isAvailable', contact.isAvailable);

            // Set name/alias layout
            ux.formatNameAlias(contactName, contactAlias, "#modalview-contactActions");

            // set verified status
            if(contactVerified){
                $("#currentContactVerified").removeClass("hidden");
            } else {
                $("#currentContactVerified").addClass("hidden");
            }
            // set available 
            if(contactIsAvailable){
            	$(".statusContactCard-icon").attr("src", "images/status-available.svg");
            }
            // set profile img
            $("#contactProfileImg").attr("src", contact.photo);

        });
		
        $("#modalview-contactActions").data("kendoMobileModalView").open();

        $("#contactProfileImg").velocity("fadeIn", {duration: 300, display: "inline-block"});
        $("#contactStatusImg").velocity("fadeIn", {duration: 300, display: "inline-block"});
        
        $("#modalview-contactActions .modal-top h3").velocity({translateY: "20%", opacity: 1}, {delay: 300, duration: 500, display: "inline-block"});
        $("#modalview-contactActions .modal-top p").velocity({translateY: "20%", opacity: 1}, {delay: 600, duration: 500, display: "inline-block"});
        $("#modalview-contactActions .modal-bottom .hasMotion").velocity("fadeIn", {duration: 500, delay: 700});
    },


    closeModal : function () {
        $("#modalview-contactActions").data("kendoMobileModalView").close();

        $("#modalview-contactActions .preMotionUp, #modalview-contactActions .hasMotion").css("display", "none").velocity({translateY: "0%"});
    },



    setContact : function (contactId) {

        contactActionView._activeContactId = contactId;
        contactActionView._activeContact.set('name', '');
        contactActionView._activeContact.set('alias', '');
        contactActionView._activeContact.set('photo', '');
        contactActionView._activeContact.set('statusMessage', '');
        contactActionView._activeContact.set('currentPlace', '');
        contactActionView._activeContact.set('isAvailable', false);
        $("#currentContactVerified").addClass("hidden");
    }

};
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
        if (e.preventDefault !== undefined){
            e.preventDefault();
        }

        // set search bar
        var scroller = e.view.scroller;
        scroller.scrollTo(0,-44);

        contactModel.deviceQueryActive = false;

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
                    $("#modalview-contactActions").data("kendoMobileModalView").open();

                    if (contact.contactUUID !== undefined && contact.contactUUID !== null){
                        $("#contactActionBtns > li:first-child").show();
                    } else {
                        $("#contactActionBtns > li:first-child").hide();
                    }

                }

            },
            dataBound: function(e){
                checkEmptyUIState("#contacts-listview", "#contactListDiv >");
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
                    $(selection).velocity({translateX:"-50%"},{duration: "fast"}).addClass("contact-active");

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
        $("#contacts > div.footerMenu.km-footer > a").attr("href", "#contactImport");
    },

    onHide : function (e) {
        if (e.preventDefault !== undefined)
            e.preventDefault();
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
            deviceFindContacts(query);
        }
    },



    processDeviceContact: function (e) {
        if (e !== undefined && e.preventDefault !== undefined) {
            e.preventDefault();
        }

        contactModel.currentDeviceContact = e.dataItem;
        // User has picked a contact from the list --
        // sync data from  any contacts with same name
        mobileNotify("Unifying contact information for " + e.dataItem.name);

        syncContactWithDevice(e.dataItem.name, function () {

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
                    contactImportView.launchAddContact();
                });
            }

            $( "#addContactPhone" ).change(function() {
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
    },

    addContact : function (e) {
        if (e !== undefined && e.preventDefault !== undefined) {
            e.preventDefault();
        }
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
        contact.set("privateChannel", null);
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
                contact.set("phoneVerified", result.user.phoneVerified);
                // Does the contact have a verified email address
                if (result.user.emailVerified) {
                    // Yes - save the email address the contact verified
                    contact.set("email", result.user.email);
                } else {
                    // No - just use the email address the our user selected
                    contact.set("email", email);
                }
                contact.set('publicKey',  result.user.publicKey);
                contact.set("contactUUID", result.user.userUUID);

            } else {
                contactSendEmailInvite(contact.get('email'));
                contact.set("phoneVerified", false);
                contact.set('publicKey',  null);
                contact.set("contactUUID", null);
            }


            getBase64FromImageUrl(photo, function (fileData) {
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
            });

        });

    }
};

var editContactView = {
    doInit: function (e) {
        if (e.preventDefault !== undefined){
            e.preventDefault();
        }

    },
    doShow: function (e) {
        if (e.preventDefault !== undefined){
            e.preventDefault();
        }

        $("#syncEditList").velocity("slideUp", {duration: 0});

        $('#contactEditList').removeClass('hidden');

        contactModel.syncContactWithParse(contactModel.currentContact);

        // Todo - wire up verified status/read only fields

        var contactVerified = contactModel.currentContact.phoneVerified;
        var contactEmail = contactModel.currentContact.email;

        if (contactVerified){
            $("#edit-verified-phone").removeClass("hidden");
            $("#editContactPhone").prop("readonly", true);
        }
        // Todo - Use to have emailVerified?
        if(contactEmail !== ''){
            $("#edit-verified-email").removeClass("hidden");
            $("#editContactEmail").prop("readonly", true);
        }

    },

    onDone : function (e) {
        if (e.preventDefault !== undefined)
            e.preventDefault();

        contactModel.currentContact.unbind('change' , syncCurrentContact);
        APP.kendo.navigate("#contacts");

        // reset UI
        $("#contactEditList").velocity("fadeIn");
    },

    syncWithParse: function (e) {

    },

    syncWithDevice : function (e) {

    }
};
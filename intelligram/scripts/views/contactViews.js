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
    contactCache: [],
    _activeView: 0,

    onInit : function (e) {
        //_preventDefault(e);

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
            	var contactId = null;

                if (e.touch.currentTarget !== undefined) {
                    // iOS and the previous versions
                    contactId = e.touch.currentTarget.attributes['data-contact'].value
                } else {
                    // Latest kendo versions for android
                    contactId = e.touch.target[0].attributes['data-contact'].value;
                }

            	
                var contact = contactModel.findContactByUUID(contactId);
                if (contact === undefined) {
                    mobileNotify('Contact List: no matching Contact in ContactsDS');
                    var contactList = contactModel.findContactListUUID(contactId);
                    if (contactList !== undefined) {
                        contactModel.contactListDS.remove(contactList);
                    }
                    return;
                }

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
                    	$(selection).velocity({translateX:"-75%"},{duration: "fast"}).addClass("contact-active");
                    } else if($(window).width() < 375) {
        				$(selection).velocity({translateX:"-85%"},{duration: "fast"}).addClass("contact-active");
                    } else {
                    	$(selection).velocity({translateX:"-80%"},{duration: "fast"}).addClass("contact-active");
                    }
                }
                if (e.direction === "right" && $(selection).hasClass("contact-active")){
                    $(selection).velocity({translateX:"0"},{duration: "fast"}).removeClass("contact-active");
                }

            }
        });


        $("#groups-listview").kendoMobileListView({
            dataSource: groupModel.groupsDS,
            template: $("#groupsTemplate").html(),

            dataBound: function(e){
                ux.checkEmptyUIState(groupModel.groupsDS, "#groupListDiv >");
            }
        }).kendoTouch({
            filter: ".groupListBox",
            enableSwipe: true,
            tap: function(e){
                var groupId = null;

                groupId = $(e.touch.target[0]).data("group");

                /*if (e.touch.currentTarget !== undefined) {
                    // iOS and the previous versions
                    groupId = e.touch.currentTarget.attributes['data-group'].value
                } else {
                    // Latest kendo versions for android
                    groupId = e.touch.target[0].attributes['data-group'].value;
                }*/

                var group = groupModel.findGroup(groupId);
                if (group === undefined) {
                    ggError('Group List: no matching Group found!');
                    return;
                }

                // todo: don - wire up groupActionView modal
                groupActionView.openModal(group.uuid);

            },
            swipe: function(e) {
                var selection = e.sender.events.currentTarget;

                if(e.direction === "left" && !$(selection).hasClass("noSlide")){
                    var otherOpenedLi = $(".group-active");
                    $(otherOpenedLi).velocity({translateX:"0"},{duration: "fast"}).removeClass("group-active");

                    if($(window).width() < 375){
                        $(selection).velocity({translateX:"-55%"},{duration: "fast"}).addClass("group-active");
                    } else {
                        $(selection).velocity({translateX:"-45%"},{duration: "fast"}).addClass("group-active");
                    }
                }
                if (e.direction === "right" && $(selection).hasClass("group-active")){
                    $(selection).velocity({translateX:"0"},{duration: "fast"}).removeClass("group-active");
                }

            }
        });


        // Update search UX whenever search input content changes.
       // $("#contactSearchInput" ).on('input', contactsView.updateSearchUX);
    },

    clearSearchFilter : function (e) {
        //
        contactModel.contactListDS.filter([]);
    },

    onShow : function (e) {
      // _preventDefault(e);

        $("#contacts-listview").data("kendoMobileListView").scroller().reset();

        contactsView.clearSearchFilter();

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

                    $('#contactImport .enterSearch').removeClass('hidden');

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


        contactsView.onTabSelect(contactsView._activeView);
      //  $("#contacts .gg_mainSearchInput").attr("placeholder", "Search contacts...");

        contactModel.buildContactList();
        //contactModel.updateContactListStatus(true);
        //contactModel.updateContactListStatus();

        // Update the contact list every 5 minutes while the contact list view is active
        //contactsView.updateInterval = setInterval(function(){ contactModel.updateContactListStatus(true) }, 300000);
        // Reset the filters and ux state on show.
        

        // set action button
    //    ux.setAddTarget(null, "#contactImport", null);
    	//ux.showActionBtn(true, "#contacts", "#contactImport");
    	//ux.showActionBtnText("#contacts", "3em", "New Contact");
    	// Bind contact search
        contactsView.scroller = e.view.scroller;

        contactsView.scroller.setOptions({
            pullToRefresh: true,
            pull: function() {
                contactModel.contactsDS.sync();
                ux.toggleSearch();
                contactsView.scroller.pullHandled();

            }
        });
    },

    onTabSelect : function (e) {
        var tab;
        if(_.isNumber(e)){
            tab = e;
        } else {
            tab = $(e.item[0]).data("tab");
        }

        if(tab == 0){

            $("#contacts-tab-0-img").attr("src", "images/icon-contact-active.png");
            $("#contacts-tab-1-img").attr("src", "images/icon-group.png");

            $("#contacts-contacts").removeClass("hidden");
            $("#contacts-groups").addClass("hidden");

            ux.setSearchPlaceholder("Search Contacts...");
            ux.setAddTarget(null, "#contactImport", null);
        } else {

            $("#contacts-tab-0-img").attr("src", "images/icon-contact-alt.png");
            $("#contacts-tab-1-img").attr("src", "images/icon-group-active.png");

            $("#contacts-contacts").addClass("hidden");
            $("#contacts-groups").removeClass("hidden");

            ux.setSearchPlaceholder("Search Groups...");
            ux.setAddTarget(null, "#groupEditor?returnview=contacts", null);
        }
        contactsView._activeView = tab;
    },

    // All update the ContactListDS item with current changes
    updateContactListDS : function () {
        contactModel.contactListDS.data([]);
        contactModel.contactListDS.data(contactModel.contactsDS.data());
    },

    onHide: function(){
    	//ux.showActionBtn(false, "#contacts");
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

    doEditGroup : function (e) {
        var groupId = e.button[0].attributes["data-group"].value;
        var group = groupModel.findGroup(groupId);

        if (group !== undefined && group !== null) {
            APP.kendo.navigate("#groupEditor?groupid="+groupId+"&returnview=contacts");
        }
        // todo - wire up
    },

    doDeleteGroup : function (e) {
        var groupId = e.button[0].attributes["data-group"].value;
        // todo - wire up
        var group = groupModel.findGroup(groupId);

        if (group !== undefined && group !== null) {
            groupModel.deleteGroup(group);
        }
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
        var contact = contactModel.findContactByUUID(contactId);
        /*var channels = channelModel.findContactChannels(contactId);
        var groups = groupModel._findContactGroups(contactId);*/

        var contactStr = contact.name + " ("+ contact.alias + ")";
        modalView.open("Are you sure?", contactStr + " will be removed from your contacts.   Your private chat with them will also be deleted.", "Delete", function () {
            contactModel.deleteContact(contactId);

            var string = "Deleted contact: " + contactStr ;

            mobileNotify(string);
            APP.kendo.navigate('#contacts');
        }, "Cancel", modalView.close);




    },

     doInviteContact : function (e) {
        _preventDefault(e);

        var contactId = e.button[0].attributes["data-contact"].value;
        var contact = contactModel.findContactByUUID(contactId);


        var email = contact.email, inviteSent = contact.inviteSent;

        if (inviteSent === undefined || inviteSent === false) {
            mobileNotify("Sorry, you can't invite new users to intelligram Alpha");

            /*contactModel.currentContact.set('inviteSent', true);
            contactModel.currentContact.set('lastInvite', ggTime.currentTime());
            updateParseObject('contacts', 'uuid', uuid, 'inviteSent', true );
            updateParseObject('contacts', 'uuid', uuid, 'lastInvite', ggTime.currentTime() );*/
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
       // _preventDefault(e);
        

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
      // _preventDefault(e);
        var query = null;
        query = e.view.params.query;
        
        if (query !== null && query !== undefined) {
            
            deviceContacts.findContacts(query, false, function(contacts) {
                
            });
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
		deviceContacts.findContacts(query, false, function(contacts) {

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

        query  = query.trim();

        mobileNotify("Unifying contact information for " + query);

        deviceContacts.syncContactWithDevice(query, function (contacts) {

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
                deviceContacts.returnValidPhoto(data.photo, function(validUrl) {
                    $("#addContactPhoto").attr("src",validUrl);
                });
            } 

            // Select the contact
            contactModel.deviceContactsDS.data([contacts[0]]);

            var contact = contacts[0];

            contact.name = contact.name.trim();

            addContactView.openModal(contact);

        });
    }
};

/*
 * Add Contact
 */

var addContactView = {
	_closeModal: false,
    _emailValid: false,
    _phoneValid : false,
    _nameValid : false,
    _isMember : false,
    _validPhone : null,
    _hasPhoto : false,
    _showPhoto: false,
    _guid: null,
    _identicon : null,
    _photoUrl : null,
    phoneUtil : null,
    PNF : null,
    
    isValidPhone : function (phone) {
        var phoneNumber = addContactView.phoneUtil.parse(phone, "US");

        if (phoneNumber.length < 10 || phoneNumber.length > 11) {
            return (null);
        }
        if (phoneNumber.length === 10) {
            phoneNumber = '1'+phoneNumber;
        }

        return(phoneNumber);

    },


    // Are name and phone number valid?
    isValidContact : function () {
        var name =  $('#addContactName').val();

        if (name.length > 1) {
            addContactView._nameValid = true;
        } else {
            addContactView._nameValid = false;
        }

        if (addContactView._phoneValid && addContactView._nameValid) {
           return (true);
        }

        return (false);
    },

    doInit: function (e) {
        _preventDefault(e);

        addContactView.PNF = libphonenumber.PhoneNumberFormat;

        addContactView.phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();
        
        $( "#addContactPhone" ).on('input', function() {
            var phone = $("#addContactPhone").val();
            addContactView.isPhoneValid(phone);
        });

        $('#addContact-phoneInput').on('blur', function () {
            var phone = $("#addContactPhone").val();
            if (!addContactView._phoneValid) {
                addContactView.isPhoneValid(phone);
            }
        });

        
        $("#addContactForm").kendoValidator({
        	errorTemplate: '<span class="error-msg">#=message#</span>'
        });
        
        $('#addContact-emailInput').on('blur', function () {
            var email = $('#addContactEmail').val();
            addContactView.isEmailValid(email);
        });

        $('#addContactEmail').on('blur', function () {

            var email = $('#addContactEmail').val();
           addContactView.isEmailValid(email);
        });

        // Generate a contact alias on blur if the user hasn't already added one...
        $('#addContactName').on('blur', function () {
            var alias =  $('#addContactAlias').val();
            var name =  $('#addContactName').val();


            addContactView.isContactValid();

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

    isContactValid : function () {
        var name =  $('#addContactName').val();

        if (name.length > 1) {
            if (addContactView.isValidContact()) {
                $("#addContactView-verifyBtn").addClass('hidden');
                $("#addContactView-addBtn").removeClass('hidden');
            } else {
                $("#addContactView-addBtn").addClass('hidden');
                $("#addContactView-verifyBtn").removeClass('hidden');
            }
        }
    },

    isPhoneValid : function (phone) {
        var validPhone = addContactView.isValidPhone(phone);

        if  (validPhone === null) {
            mobileNotify(phone + " is not valid US phone number");
            $("#vaildMobileNumberError").velocity("slideDown");
            addContactView._phoneValid = false;
            return;
        }

        addContactView._validPhone = phone;
        var contact = contactModel.findContactByPhone(phone);
        if (contact !== undefined) {
            mobileNotify("Contact : " + contact.name + " has phone " + contact.phone);
            $("#vaildMobileNumberError").velocity("slideDown");
            addContactView._phoneValid = false;
            return;
        }
        memberdirectory.findMemberByPhone(phone, function (user) {
            if (user !== null) {
                mobileNotify(user.name + " is a intelligram member!");

                addContactView._phoneValid = true;
                addContactView._isMember = true;
                addContactView._memberData = user;
              //  $('#addContactName').val(user.name);
              //  $('#addContactAlias').val(user.alias);
               addContactView.isContactValid();

            } else {
                addContactView._isMember = false;
                isValidMobileNumber(phone, function (result) {
                    addContactView._phoneValid = true;
                    addContactView.isContactValid();
                    if (result.status === 'ok') {
                        if (result.valid === false) {
                            mobileNotify(phone + ' is not a valid mobile number');
                            $("#vaildMobileNumberError").velocity("slideDown");

                        } else {
                            $("#vaildMobileNumberError").velocity("slideUp");

                        }
                    }
                });
            }
        });
    },

    cycleProfilePhoto : function () {
        if (addContactView._hasPhoto) {
            if (addContactView._showPhoto) {
                addContactView._showPhoto = false;
                $("#addContactPhoto").attr("src", addContactView._identicon);
            } else {
                addContactView._showPhoto = true;
                $("#addContactPhoto").attr("src", addContactView._photoUrl);
            }
        }
    },

    isEmailValid : function (email) {
        if (!addContactView.validateEmail(email)){
            addContactView._emailValid = false;
            mobileNotify(email + " + is not a valid email address");
        } else {

            var contact = contactModel.findContactByEmail(email);
            if (contact !== undefined && contact !== null) {
                mobileNotify("Contact : " + contact.name + " has email " + contact.email);
            } else {
                addContactView.isContactValid();
                addContactView._emailValid = true;
            }

        }
    },

    showPhoneEditor : function () {
        var phone = $('#addContactPhone').data("kendoMobileDropDownList").text();
        $('#addContact-phoneInput').val(phone);
        $('#addContact-phoneSelect').addClass('hidden');
        $('#addContact-phoneEdit').removeClass('hidden');
    },
    
    showEmailEditor : function () {
        var email = $('#addContactEmail').data("kendoMobileDropDownList").text();
        $('#addContact-emailInput').val(email);
        $('#addContact-emailSelect').addClass('hidden');
        $('#addContact-emailEdit').removeClass('hidden');
    },
    
    showAddressEditor : function () {
        var address = $('#addContactAddress').data("kendoMobileDropDownList").text();
        $('#addContact-addressInput').val(address);
        $('#addContact-addressSelect').addClass('hidden');
        $('#addContact-addressEdit').removeClass('hidden');
    },
    
    openModal : function (contact) {

        addContactView._guid = uuid.v4();

        addContactView._identicon = contactModel.createIdenticon(addContactView._guid);
        addContactView._emailValid = false;
        addContactView._phoneValid = false;
        addContactView._nameValid = false;

        // Hide the Add Contact Button until the mobile number is validated...
        $("addContactView-addBtn").addClass('hidden');
        $("addContactView-verifyBtn").removeClass('hidden');

        var data = contact;

        addContactView._isMember = false;
        addContactView._memberData = null;
        // Set name
        var name = data.name;

        $("#addContactAlias").val("");
        
        if(name === '' || name.length < 2){
        	$("#addContactName-blank").removeClass("hidden");
        	$("#addContactName, #addContactName-error").val(name);
            addContactView._nameValid = false;

        } else {
        	$("#addContactName-blank").addClass("hidden");
            addContactView._nameValid = true;
        }

        $("#vaildMobileNumberError").addClass("hidden");

        if (data.photo === null) {
            $("#addContactPhoto").attr("src", addContactView._identicon);
            addContactView._hasPhoto = false;
            addContactView._showPhoto = false;

        } else {
            deviceContacts.returnValidPhoto(data.photo, function(validUrl) {
                addContactView._photoUrl = validUrl;
                $("#addContactPhoto").attr("src",validUrl);
                addContactView._hasPhoto = true;
                addContactView._showPhoto = true;
            });
        }

        // Process phone, email and address.  if there's 0, hide select and show edit,
        // if there's 1 hide select and prefill editor,

        if (contactModel.currentDeviceContact.emails.length  <=1) {
            $('#addContact-emailSelect').addClass('hidden');
            $('#addContact-emailEdit').removeClass('hidden');

            if (contactModel.currentDeviceContact.emails.length  === 1) {
                var emailText = contactModel.currentDeviceContact.emails[0].address;
                $('#addContact-emailInput').val(emailText);
                addContactView.isEmailValid(emailText);
            }

        } else {

            contactModel.emailArray = new Array();
            for (var i = 0; i<contactModel.currentDeviceContact.emails.length; i++) {
                var email = new Object();
                email.name = contactModel.currentDeviceContact.emails[i].name;
                email.address =  contactModel.currentDeviceContact.emails[i].address;

                contactModel.emailArray.push(email);

            }
            contactModel.emailDS.data( contactModel.emailArray);
            $('#addContact-emailSelect').removeClass('hidden');
            $('#addContact-emailEdit').addClass('hidden');
        }

        if (contactModel.currentDeviceContact.phoneNumbers.length <= 1) {
            $('#addContact-phoneSelect').addClass('hidden');
            $('#addContact-phoneEdit').removeClass('hidden');
            if (contactModel.currentDeviceContact.phoneNumbers.length  === 1) {
                var phoneNumber =  contactModel.currentDeviceContact.phoneNumbers[0];
                var phoneText = phoneNumber.number;
                $('#addContact-phoneInput').val(phoneText);
                addContactView.isPhoneValid(phoneText);

            }
        } else {
            contactModel.phoneArray = new Array();
            for (var j = 0; j<contactModel.currentDeviceContact.phoneNumbers.length; j++) {
                var phone = new Object();
                phone.name = contactModel.currentDeviceContact.phoneNumbers[j].name;
                phone.number = contactModel.currentDeviceContact.phoneNumbers[j].number;

                contactModel.phoneArray.push(phone);

            }
            contactModel.phoneDS.data( contactModel.phoneArray);
            $('#addContact-phoneSelect').removeClass('hidden');
            $('#addContact-phoneEdit').addClass('hidden');
        }

        if ( contactModel.currentDeviceContact.addresses.length <= 1) {
            $('#addContact-addressSelect').addClass('hidden');
            $('#addContact-addressEdit').removeClass('hidden');
            if (contactModel.currentDeviceContact.addresses.length  === 1) {
                $('#addContact-addressInput').val(contactModel.currentDeviceContact.addresses[0]);
            }

        } else {
            contactModel.addressArray = new Array();
            for (var a = 0; a<contactModel.currentDeviceContact.addresses.length; a++) {
                var address = new Object();
                address.name = contactModel.currentDeviceContact.addresses[a].name;
                address.address =  contactModel.currentDeviceContact.addresses[a].fullAddress;

                contactModel.addressArray.push(address);
            }
            contactModel.addressDS.data( contactModel.addressArray);
            $('#addContact-addressSelect').removeClass('hidden');
            $('#addContact-addresseEdit').addClass('hidden');
        }


        $("#modalview-AddContact").data("kendoMobileModalView").open();
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

      //  var form = $("#addContactForm").kendoValidator().data("kendoValidator");   Not sure we need this -- we're doing way deeper validation...


        if (addContactView.isValidContact()) {
            $("addContactView-addBtn").removeClass('hidden');
            $("addContactView-verifyBtn").addClass('hidden');
            return;
        }


        if (!addContactView._phoneValid) {
            addContactView.isPhoneValid(phone);
        }


        // Confirm that there not an existing contact with this phone number.
      /*  var contact = contactModel.findContactByPhone(phone);

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
                    //$("#addContactViewAddButton").text("Close");
                    return;

                } else {

                    $("#vaildMobileNumberError").velocity("slideUp");
                    $("#addContactViewAddButton").text("Add Contact");
                    mobileNotify("Mobile phone is valid!");
                    addContactView._phoneValid = true;

                    if (!addContactView._emailValid){
                        isValidEmail(email, function(emailResult) {
                            if (emailResult.status === 'ok' ) {
                                addContactView._emailValid = true;
                                addContactView.addContact();
                            }
                        });
                    } else {

                        addContactView._emailValid = true;
                        addContactView.addContact();
                    }

                }
            }
        });
*/
    },

    processContactPhoto : function (photoId, url, contactId, contactUUID) {
        profilePhotoModel.addProfilePhoto(photoId, url, contactId, contactUUID);
    },

    addContact : function (e) {
        _preventDefault(e);

      /*  var Contacts = Parse.Object.extend("contacts");
        var contact = new Contacts();*/

        var contact = new kendo.data.ObservableObject();

        var name = $('#addContactName').val(),
            alias = $('#addContactAlias').val(),
            phone = $('#addContactPhone').val(),
            email = $('#addContactEmail').val(),
            photo = $('#addContactPhoto').prop('src'),
            group =  $('#addContactGroup').val(),
            address = $('#addContactAddress').val(),
            emailValid = false,
            addressValid = false;

        var contactId = addContactView._guid;


        if (contactId === undefined || contactId === null) {
            contactId = uuid.v4();
        }

        if (phone === null || phone.length < 10) {
            // Todo: need better UX for contacts without phone
            mobileNotify('Contacts must have a valid phone number!');
            return;
        }
        
        phone = phone.replace(/\D+/g, "");
        if (phone[0] !== '1')
            phone = '1' + phone;



       if (email === undefined) {
           email = null;
           emailValid  = false;
       }

        if (address === undefined) {
            address = null;
            addressValid = false;
        }
        var photouuid =  null;



        contact.set('ggType', contactModel._ggClass);
        contact.set("version", contactModel._version );
        contact.set('uuid', contactId);
        contact.set("name", name );
        contact.set("alias", alias);
        contact.set("email", email);
        contact.set("address", address);
        contact.set("group", group);
        contact.set("identicon", contactModel.createIdenticon(contactId));
        contact.set('photoUUID', photouuid);
        contact.set("photo", null);
        contact.set('category', "new");
        contact.set("priority", 0);
        contact.set("isFavorite", false);
        contact.set("isBlocked", false);
        contact.set("inviteSent", false);
        contact.set("lastInvite", 0);
        contact.set('contactUUID', null);
        contact.set('contactPhone', null);
        contact.set('contactEmail', null);
        contact.set('emailValidated', false);
        contact.set('phoneValidated', false);
        contact.set('isValidated', false);
        contact.set('ownerUUID', userModel._user.userUUID);


        contact.set("phone", phone);

        // Close modal
       // addContactView.closeModal();

       // mobileNotify("Invite sent");

        if (addContactView._isMember) {

            // The user is gg member
            var thisContact = addContactView._memberData;
            if (thisContact.phoneValidated === undefined) {
                thisContact.phoneValidated = false;
            }
            if (thisContact.emailValidated === undefined) {
                thisContact.emailValidated = false;
            }
            contact.set("phoneValidated", thisContact.phoneValidated);
            // Does the contact have a verified email address
            contact.set("email", thisContact.email);
            if (thisContact.emailValidated) {
                // Yes - save the email address the contact verified
                contact.set("emailValidated", true);
            } else {
                // No - just use the email address the our user selected
                contact.set("emailValidated", false);
            }
            contact.set('contactUUID', thisContact.userUUID);
            contact.set('contactPhone', thisContact.phone);
            contact.set('phone', thisContact.phone);
            contact.set('category', 'member');
            contact.set('contactEmail', thisContact.email);
            contact.set('photo', null);
            contact.set('contactPhoto', thisContact.photo);
            contact.set('publicKey', thisContact.publicKey);

            if (addContactView._hasPhoto && addContactView._showPhoto) {
                // User wants to override identicon and use contact photo from phone
                photouuid = uuid.v4();
                addContactView.processContactPhoto(photouuid, addContactView._photoUrl, contactId,  thisContact.userUUID);
            }

            appDataChannel.memberAutoConnect(thisContact.userUUID);

        } else {
            // Not a member - just use the email address the our user selected
            contact.set("email", email);
         /*   if (emailValid)
                contactSendEmailInvite(email);*/
            contact.set("phoneValidated", false);
            contact.set('publicKey',  null);
            contact.set("contactUUID", null);
            contact.set("contactPhone", null);
            contact.set("contactEmail", null);


            if (addContactView._hasPhoto && addContactView._showPhoto) {
                // User wants to override identicon and use contact photo from phone
                photouuid = uuid.v4();
                addContactView.processContactPhoto(photouuid, addContactView._photoUrl, contactId,  null);
            }
            var userUUID = userModel._user.userUUID;
            // Has this user already invited this contact?
            invitedirectory.isInvited(phone, userUUID,  function (error, data) {
               if (error === null) {
                   if (data === null) {
                       invitedirectory.create(name, phone, email);
                   }
               }
            });
        }

          contactModel.contactsDS.add(contact);
          contactModel.contactsDS.sync();

          addContactView.closeModal();
          APP.kendo.navigate('#contacts');

          everlive.createOne(contactModel._cloudClass, contact, function (error, data){
              if (error !== null) {
                  mobileNotify ("Error creating Contact " + JSON.stringify(error));
              } else {
                 contactModel._cleanDupContacts(contact.uuid);
              }
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
    _hasPhoto: false,
    _showPhoto : false,

    _activeContact : new kendo.data.ObservableObject({mappedPhoto: null}),

    onInit: function (e) {
      // _preventDefault(e);

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
            contactModel.checkIdenticon(contact);

            var photoUrl = contact.identicon;
            editContactView._hasPhoto = false;
            editContactView._showPhoto = false;
            if (contact.photo !== null) {
                editContactView._hasPhoto = true;
                editContactView._showPhoto = true;
                photoUrl = contact.photo;
            }
            $('#editContactView-profilePhoto').attr('src', photoUrl);
            editContactView._activeContact.set("uuid", contact.uuid);
            editContactView._activeContact.set("name", contact.name);
            editContactView._activeContact.set("alias", contact.alias);
            editContactView._activeContact.set("phone", contact.phone);
            editContactView._activeContact.set("phoneValidated", contact.phoneValidated);
            editContactView._activeContact.set("email", contact.email);
            editContactView._activeContact.set("emailValidated", contact.emailValidated);  // emailValidated is a reserved term on Parse...
            var groups = groupModel.getContactGroups(contact.uuid);
            var groupString = '';

            if (groups !== []) {
                groupString = groupModel.getContactGroupString(contact.uuid);
            }
            editContactView._activeContact.set("groups", groups);
            editContactView._activeContact.set("groupString", groupString);
            editContactView._activeContact.set("isFavorite", contact.isFavorite);

            editContactView._activeContact.set("isBlocked", contact.isBlocked);
            editContactView._activeContact.set("photo", contact.photo);
            editContactView._activeContact.set("identicon", contact.identicon);
            editContactView._activeContact.set("inviteSent", contact.inviteSent);
            editContactView._activeContact.set("connectSent", contact.connectSent);
            editContactView._activeContact.set("connectReceived", contact.connectReceived);

            editContactView._activeContact.set("address", contact.address);
            editContactView._activeContact.set("category", contact.category);
            if (contact.contactUUID !== undefined) {
                editContactView._activeContact.set("category",'member');
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

    changePhoto : function (e) {
        _preventDefault(e);
        if (editContactView._hasPhoto) {
            if (editContactView._showPhoto) {
                $('#editContactView-profilePhoto').attr('src',  editContactView._activeContact.identicon);
                editContactView._showPhoto = false;
            } else {
                $('#editContactView-profilePhoto').attr('src',  editContactView._activeContact.photo);
                editContactView._showPhoto = true;
            }
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
        contact.set("groups", editContactView._activeContact.groups);
        contact.set("groupString", editContactView._activeContact.groupString);

        contact.set("isFavorite", editContactView._activeContact.isFavorite);
        contact.set("isBlocked", editContactView._activeContact.isBlocked);
        if (editContactView._activeContact.contactUUID !== undefined && editContactView._activeContact.contactUUID !== null) {
            contact.set("category", 'member');
            contact.set("contactUUID", editContactView._activeContact.contactUUID);
            contact.set("contactEmail", editContactView._activeContact.contactEmail);
            contact.set("contactPhone", editContactView._activeContact.contactPhone);
            contact.set("contactAddress", editContactView._activeContact.contactAddress);
            contact.set("publicKey", editContactView._activeContact.publicKey);
        }

        //contact.set("group", editContactView._activeContact.group);
        contact.set("address", editContactView._activeContact.address);
        contact.set("category", editContactView._activeContact.category);

        
        contactList.set("name", editContactView._activeContact.name);
        contactList.set("alias", editContactView._activeContact.alias);
        contactList.set("phone", editContactView._activeContact.phone);
        contactList.set("email", editContactView._activeContact.email);
        contactList.set("photo", editContactView._activeContact.photo);
        contactList.set("identicon", editContactView._activeContact.identicon);
        contactList.set("groups", editContactView._activeContact.groups);
        contactList.set("groupString", editContactView._activeContact.groupString);
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


        contactModel.contactsDS.sync();

        // Zero the identicon in the contact so it's pushed to cloud.
        contact.identicon = null;

        everlive.updateOne(contactModel._cloudClass, contact, function (error, data) {
           if (error !== null) {
               ggError("Contact Update Error : " + JSON.stringify(error));
           }
        });
       /* var Id = contact.Id;
        if (Id !== undefined){
            everlive.updateOne(contactModel._cloudClass, contact, function (error, data) {
                //placeNoteModel.notesDS.remove(note);
            });
        }*/

        //$("#contacts-listview").data("kendoMobileListView").refresh();

    },


    onShow: function (e) {

      // _preventDefault(e);

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
            //editContactView.updateVerifiedUX(contact.phoneValidated, contact.emailValidated);
            //editContactView.updateContact();
            // Hide the status update div
        });

        // Set verified inputs
        if(editContactView._activeContact.phoneValidated){
       		$("#contactEdit-phone-read").removeClass("hidden");
            $("#contactEdit-phone-edit").addClass('hidden');
        } else {
       		$("#contactEdit-phone-read").addClass("hidden");
            $("#contactEdit-phone-edit").removeClass('hidden');
        }

        if(editContactView._activeContact.emailValidated){
           $("#editContact-email-edit").addClass("hidden");
           $("#editContact-email-read").removeClass("hidden");
        } else {
           $("#editContact-email-edit").removeClass("hidden");
           $("#editContact-email-read").addClass("hidden");
        }

        if(editContactView._activeContact.address === null){
            $("#editContact-address-btn").removeClass('hidden');
            $("#editContact-address-edit").addClass('hidden');
        } else {
            $("#editContact-address-btn").addClass('hidden');
            $("#editContact-address-edit").removeClass('hidden');
        }

        var phone = editContactView._activeContact.phone;
        if ( phone === undefined || phone === null) {
            phone = "";
            editContactView._activeContact.phone = phone;
            ggError("Null or undefined phone number !");
        }
        var phoneVal = ux.showCleanPhone(phone);
        $('#editContact-phone-input').text(phoneVal);
        $("#editContactPhone").val(phone);
        ux.showFormatedPhone();
        ux.formatPhoneInput();
    },

    toggleAddress: function(){
        var contact = editContactView._activeContact;
        if(contact.address === null){
            $("#editContact-address-btn").addClass('hidden');
            $("#editContact-address-edit").removeClass('hidden');
        }
    },

    validate: function(){
    	var form = $("#editContactForm").kendoValidator().data("kendoValidator");

    	if (form.validate()) {
        	editContactView.updateDone();
    	}

    },


    editGroups : function (e) {
        var groupArray = editContactView._activeContact.groups;

        var testArray = groupModel.groupsDS.data();

        var candidateArray = [];

        for (var i=0; i<testArray.length; i++) {
            var found = false;

            for (var j=0; j<groupArray.length; j++) {
                if (groupArray[j] === testArray[i].uuid) {
                    found = true;
                }
            }

            if (!found) {
                candidateArray.push(testArray[i])
            }

        }

        groupPickerView.openModal(groupArray, candidateArray, function(groups, groupString) {

        });
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

  
    syncWithDevice : function (e) {
        _preventDefault(e);
        // load, search and unify contacts matching this user...
        // Really only want email, address, birthday and photos
        deviceContacts.syncContactWithDevice(editContactView._activeContact.name, function (contacts) {

        });

    },


    deleteContact: function (e) {
        _preventDefault(e);

        contactModel.deleteContact(editContactView._activeContact.uuid);
        mobileNotify("Deleting " + editContactView._activeContact.name);
        editContactView.onDone();
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

        // Custom ux management for contacts - if there's a custom photo for this user, display it, if not fallback to idenitcon
        var photo = contact.identicon;
        if (contact.photo !== null)
            photo = contact.photo;
        $('#contactProfileImg').attr('src',  photo);

        var primaryName = ux.returnUXPrimaryName(contact.name, contact.alias);
        $('#contactPrimaryName').text(primaryName);
    },

    setReturnModal : function (modalId) {
        contactActionView._returnModalId = modalId;
    },

    updateTrackingUX : function () {
        var tracking = contactActionView._activeContact.activeTracking;

        if (tracking) {
            $("#contactActions-track").html('<img src="images/icon-tracking-active.svg" /> Stop Tracking');

        } else {
            $("#contactActions-track").html('<img src="images/icon-tracking-active.svg" /> Start Tracking');
        }
    },

    contactTracking : function () {
        var tracking = contactActionView._activeContact.activeTracking;

        tracking = !tracking;

        contactActionView._activeContact.set('activeTracking', tracking);

        contactActionView.updateTrackingUX();
    },

    openModal : function (contactId) {

        var time = ggTime.currentTimeInSeconds();
        $("#contactActionBtns").removeClass('hidden');
        var thisContact = contactModel.findContactByUUID(contactId);

        contactModel.checkIdenticon(thisContact);
        contactActionView.setContact(thisContact);

        contactActionView.refreshUX(thisContact);

        //Show the status update div
        if (thisContact.contactUUID !== undefined && thisContact.contactUUID !== null && thisContact.category !== 'unknown') {

            var user = userStatusChannel.getStatus(thisContact.contactUUID);
            if (user !== null) {
                var contactIsAvailable = user.isAvailable;
                var contactPlace = user.currentPlace;
                contactActionView._activeContact.set('contactUUID', thisContact.contactUUID);
                contactActionView._activeContact.set('statusMessage', user.statusMessage);
                contactActionView._activeContact.set('currentPlace', user.currentPlace);
                contactActionView._activeContact.set('currentPlaceUUID', user.currentPlaceUUID);
                contactActionView._activeContact.set('googlePlaceId', user.googlePlaceId);
                contactActionView._activeContact.set('lat', user.lat);
                contactActionView._activeContact.set('lng', user.lng);
                contactActionView._activeContact.set('isAvailable', contactIsAvailable);

                if (contactIsAvailable) {
                    $(".statusContactCard-icon").removeClass("status-away").addClass("status-available");
                }

                // Update the contactList object too
                var contactList = contactModel.findContactList(thisContact.contactUUID);
                if (contactList !== undefined) {
                    contactList.set('statusMessage', user.statusMessage);
                    contactList.set('currentPlace', contactPlace);
                    contactList.set('currentPlaceUUID', user.currentPlaceUUID);
                    contactList.set('googlePlaceId', user.googlePlaceId);
                    contactList.set('lat', user.lat);
                    contactList.set('lng', user.lng);
                    contactList.set('isAvailable', contactIsAvailable);

                    contactsView.contactCache[thisContact.contactUUID] = contactList;

                    // set current place
                    if (contactPlace !== ""  && contactPlace !== null && contactPlace !== undefined) {
                        $("#contactCurrentPlace").removeClass('hidden').text("@" + contactPlace);
                    } else {
                        $("#contactCurrentPlace").addClass('hidden').text("");
                    }

                }

            }

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
                var contactGroup = contact.group;

                var contactIsAvailable = contact.isAvailable;
                var contactTracking = contact.activeTracking;
                if (contactTracking === undefined) {
                    contactTracking = false;
                }

                contactActionView.updateTrackingUX();
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
                contactActionView._activeContact.set('email', contact.email);
                contactActionView._activeContact.set('category', contact.category);
                contactActionView._activeContact.set('name', contactName);
                contactActionView._activeContact.set('alias', contactAlias);
                contactActionView._activeContact.set('activeTracking', contactTracking);
                if (contact.photo !== undefined && contact.photo !== null) {
                    contactActionView._activeContact.set('photo', contact.photo);
                } else {
                    contactActionView._activeContact.set('photo', contact.identicon);
                }

                // Set name/alias layout
                ux.formatNameAlias(contactName, contactAlias, "#modalview-contactActions");

                contactActionView.refreshUX(contact);


            });
        }


        $("#modalview-contactActions").data("kendoMobileModalView").open();

        $("#contactProfileImg").velocity("fadeIn", {delay: 150, duration: 300, display: "inline-block"});
        $(".contactStatusImg").velocity("fadeIn", {delay: 150, duration: 300, display: "inline-block"});
        
        $("#modalview-contactActions .modal-top h2").velocity({translateY: "20%", opacity: 1}, {delay: 300, duration: 500, display: "block"});
        $("#modalview-contactActions .modal-top p").velocity({translateY: "20%", opacity: 1}, {delay: 600, duration: 500, display: "block"});
        $("#modalview-contactActions .modal-bottom .hasMotion").velocity("fadeIn", {duration: 500, delay: 700});
    },


    reOpenModal : function () {
        $("#modalview-contactActions").data("kendoMobileModalView").open();
    },

    closeModal : function(){
        $("#modalview-contactActions").data("kendoMobileModalView").close();

        // Clear place
        $("#contactCurrentPlace").html("");

        $("#modalview-contactActions .preMotionUp, #modalview-contactActions .hasMotion").css("display", "none").velocity("fadeOut", {opacity: 0, translateY: "0%"});
    	$("#contactProfileImg, .contactStatusImg").css("opacity", 0);

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

        var navStr = '#channel?channelUUID=';
        if (channel !== undefined) {
            navStr = navStr + channel.channelUUID;
            APP.kendo.navigate(navStr);
        } else {
            mobileNotify("Creating Private Chat with " + contactName);
            channelModel.addPrivateChannel(contactUUID, contactPublicKey, contactName, function (error, data) {
                navStr = navStr + contactUUID;
                APP.kendo.navigate(navStr);
            });
           
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

    sendEmail : function (e) {
        _preventDefault(e);

        var email = contactActionView._activeContact.get('email');
        var properties = {
            to: email
        };
        cordova.plugins.email.open(properties, function () {
            mobileNotify("Email sent...");
        }, this);
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

    showLocation : function () {
        var locObj = {
            lat: contactActionView._activeContact.lat,
            lng: contactActionView._activeContact.lng,
            name : contactActionView._activeContact.currentPlace,
            title: "Contact Action",
            targetName: contactActionView._activeContact.name + ' (' + contactActionView._activeContact.alias + ')',
            placeUUID: contactActionView._activeContact.currentPlaceUUID
        };

        mobileNotify("Mapping place....");
        $("#modalview-contactActions").data("kendoMobileModalView").close();
        mapViewModal.openModal(locObj, function () {
            contactActionView.reOpenModal();
        });
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
       /* if(thisContact.isAvailable){
            $(".statusContactCard-icon").attr("src", "images/status-available.svg");
        }*/

        if (thisContact.phoneValidated) {
            $("#currentContactVerified").removeClass("hidden");
        } else {
            $("#currentContactVerified").addClass("hidden");
        }

    }

};

var groupActionView = {
    _activeGroupId : null,
    _returnModalId : null,
    _activeGroup : new kendo.data.ObservableObject(),

    onInit: function (e) {

    },

    setReturnModal : function (modalId) {
        groupActionView._returnModalId = modalId;
    },

    updateTrackingUX : function () {
        var tracking = groupActionView._activeGroup.activeTracking;
        if (tracking) {
            $("#groupActions-track").html('Stop Tracking');

        } else {
            $("#groupActions-track").html('Start Tracking');
        }
    },

    groupTracking : function () {
        var tracking =  groupActionView._activeGroup.activeTracking;

        tracking = !tracking;

        groupActionView._activeGroup.set('activeTracking', tracking);

        groupActionView.updateTrackingUX();
    },

    openModal : function (groupId) {


        var thisGroup = groupModel.findGroup(groupId);

        groupModel.checkIdenticon(thisGroup);
        groupActionView.setGroup(thisGroup);
        groupActionView.updateTrackingUX();

        //Show the status update div
      /*  if (thisContact.contactUUID !== undefined && thisContact.contactUUID !== null && thisContact.category !== 'unknown') {

            var user = userStatusChannel.getStatus(thisContact.contactUUID);
            if (user !== null) {
                var contactIsAvailable = user.isAvailable;
                var contactPlace = user.currentPlace;
                contactActionView._activeContact.set('contactUUID', thisContact.contactUUID);
                contactActionView._activeContact.set('statusMessage', user.statusMessage);
                contactActionView._activeContact.set('currentPlace', user.currentPlace);
                contactActionView._activeContact.set('currentPlaceUUID', user.currentPlaceUUID);
                contactActionView._activeContact.set('googlePlaceId', user.googlePlaceId);
                contactActionView._activeContact.set('lat', user.lat);
                contactActionView._activeContact.set('lng', user.lng);
                contactActionView._activeContact.set('isAvailable', contactIsAvailable);
                // set available
                if (contactIsAvailable) {
                    $(".statusContactCard-icon").attr("src", "images/status-available.svg");
                }

                // Update the contactList object too
                var contactList = contactModel.findContactList(thisContact.contactUUID);
                if (contactList !== undefined) {
                    contactList.set('statusMessage', user.statusMessage);
                    contactList.set('currentPlace', contactPlace);
                    contactList.set('currentPlaceUUID', user.currentPlaceUUID);
                    contactList.set('googlePlaceId', user.googlePlaceId);
                    contactList.set('lat', user.lat);
                    contactList.set('lng', user.lng);
                    contactList.set('isAvailable', contactIsAvailable);

                    contactsView.contactCache[thisContact.contactUUID] = contactList;

                    // set current place
                    if (contactPlace !== ""  && contactPlace !== null && contactPlace !== undefined) {
                        $("#contactCurrentPlace").removeClass('hidden').text("@" + contactPlace);
                    } else {
                        $("#contactCurrentPlace").addClass('hidden').text("");
                    }

                }

            }

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
                var contactVerified = contact.phoneValidated;
                var contactGroup = contact.group;

                var contactIsAvailable = contact.isAvailable;
                var contactTracking = contact.activeTracking;
                if (contactTracking === undefined) {
                    contactTracking = false;
                }

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
                contactActionView._activeContact.set('activeTracking', contactTracking);
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

                //$("#contactCurrentPlace").addClass('hidden');


                contactActionView.refreshUX(contact);


            });
        }*/


        $("#modalview-groupActions").data("kendoMobileModalView").open();

        $("#groupProfileImg").velocity("fadeIn", {delay: 150, duration: 300, display: "inline-block"});


        $("#modalview-groupActions .modal-top h2").velocity({translateY: "20%", opacity: 1}, {delay: 300, duration: 500, display: "block"});
        $("#modalview-groupActions .modal-top p").velocity({translateY: "20%", opacity: 1}, {delay: 600, duration: 500, display: "block"});
        $("#modalview-groupActions .modal-bottom .hasMotion").velocity("fadeIn", {duration: 500, delay: 700});
    },


    reOpenModal : function () {
        $("#modalview-groupActions").data("kendoMobileModalView").open();
    },

    closeModal : function(){
        $("#modalview-groupActions").data("kendoMobileModalView").close();

        $("#modalview-groupActions .preMotionUp, #modalview-groupActions .hasMotion").css("display", "none").velocity("fadeOut", {opacity: 0, translateY: "0%"});

        if (groupActionView._returnModalId !== null) {
            $(groupActionView._returnModalId).data("kendoMobileModalView").open();
            groupActionView._returnModalId = null;
        }

    },

    restoreModal : function () {
        groupActionView.openModal(groupActionView._activeGroupId);
    },

    showGroupMap : function (e) {
        // todo - wire group chat

        groupMapModal.openModal(groupActionView._activeGroup.title, groupActionView._activeGroup.members, function () {

        });

    },

    groupChat : function (e) {
        _preventDefault(e);

        /*var contact = contactActionView._activeContact;
        var contactUUID = contact.contactUUID, contactName = contact.name, contactPublicKey = contact.publicKey;

        if (contactUUID === undefined || contactUUID === null) {
            mobileNotify(contact.name + " hasn't verified their contact info");
            return;
        }
        // Is there already a private channel provisioned for this user?
        var channel = channelModel.findPrivateChannel(contactUUID);

        var navStr = '#channel?channelUUID=';
        if (channel !== undefined) {
            navStr = navStr + channel.channelUUID;
            APP.kendo.navigate(navStr);
        } else {
            mobileNotify("Creating Private Chat with " + contactName);
            channelModel.addPrivateChannel(contactUUID, contactPublicKey, contactName, function (error, data) {
                navStr = navStr + contactUUID;
                APP.kendo.navigate(navStr);
            });

        }*/

    },

    groupGallery : function (e) {

    },



    groupEmail : function (e) {
        _preventDefault(e);
        var viewId = APP.kendo.view().id;

        //Close contactAction to display ghostEdit
        contactActionView.closeModal();

        APP.kendo.navigate("#ghostEditor?returnview="+viewId+"&callback=contactaction");

    },


    newChat : function (e) {
        // todo - wire group chat
        mobileNotify("Coming soon");
    },

    newGallery : function (e) {
        // todo - wire group gallery
        mobileNotify("Coming soon");
    },

    sendEmail : function (e) {
        _preventDefault(e);
        // todo - wire group email
        mobileNotify("Coming soon");
        /*var email = contactActionView._activeContact.get('email');
        var properties = {
            to: email
        };
        cordova.plugins.email.open(properties, function () {
            mobileNotify("Email sent...");
        }, this);*/
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




    setGroup : function (thisGroup) {
        groupActionView._activeGroupId = thisGroup.uuid;
        groupActionView._activeGroup.set('title', thisGroup.title);
        groupActionView._activeGroup.set('description', thisGroup.description);
        groupActionView._activeGroup.set('photoUrl', thisGroup.photoUrl);
        groupActionView._activeGroup.set('useIdenticon', thisGroup.useIndenticon);
        groupActionView._activeGroup.set('activeTracking', thisGroup.activeTracking);
        groupActionView._activeGroup.set('isICE', thisGroup.isICE);
        groupActionView._activeGroup.set('tags', thisGroup.tags);
        groupActionView._activeGroup.set('tagString',thisGroup.tagString);
        groupActionView._activeGroup.set('isAvailable', thisGroup.isAvailable);
        groupActionView._activeGroup.set('members', thisGroup.members);
        var groupCount = thisGroup.members.length;
        if(groupCount > 1){
            groupActionView._activeGroup.set('ux_membersCount', groupCount + " members");
        } else if(groupCount === 1){
            groupActionView._activeGroup.set('ux_membersCount', groupCount + " member");
        } else {
            groupActionView._activeGroup.set('ux_membersCount', "No members");
        }

    }

};

var galleryMemberView = {
    callback: null,
    memberArray : null,
    _activeView : 0,
    _contacts : 0,
    _groups : 1,
    contactsOnly : false,
    contactsDS : new kendo.data.DataSource({
        sort: {
            field: "name",
            dir: "asc"
        }
    }),

    candidateDS : new kendo.data.DataSource({
        group: 'category',
        sort: {
            field: "name",
            dir: "asc"
        }
    }),

    memberDS : new kendo.data.DataSource(),

    onInit: function () {

        $("#galleryMemberView-grouplistview").kendoMobileListView({
            dataSource: galleryMemberView.candidateDS,
            template: $("#galleryMember-groupTemplate").html(),
            //headerTemplate: $("#contactsHeaderTemplate").html(),
            fixedHeaders: true,
            click: function (e) {
                var target = e.dataItem;
                var objectId = target.channelUUID;

                galleryMemberView.contactsOnly = true;

                if (target.category === "Group") {
                    var group = groupModel.findGroup(objectId);
                    $('#groupMember-contacts-sourceName').text('From group: ' + group.title);
                    var memberList = galleryMemberView.getGroupMembers(group.members);
                    galleryMemberView.mapContactShare(memberList);


                } else if (target.category === 'Chat') {
                    var chat = channelModel.findChannelModel(objectId);
                    galleryMemberView.mapContactShare(chat.members);
                    $('#groupMember-contacts-sourceName').text('From Chat: ' + chat.name);

                } else if (target.category === "Gallery") {

                }

                galleryMemberView.onTabSelect(0);
                galleryMemberView.showSave(true);
                $('#groupMember-contacts-source').removeClass('hidden');
            },
            dataBound: function(e){
                // ux.checkEmptyUIState(contactModel.contactListDS, "#contactListDiv >");
            }

        });

        $("#galleryMemberView-contactlistview").kendoMobileListView({
            dataSource: galleryMemberView.contactsDS,
            template: $("#galleryMember-contactTemplate").html(),
            //headerTemplate: $("#contactsHeaderTemplate").html(),
            //fixedHeaders: true,
            click: function (e) {
                var target = e.dataItem;
                var objectId = target.channelUUID;

                galleryMemberView.showSave(true);

                if (target.isSelected === undefined) {
                    target.isSelected = true;
                } else {
                    target.isSelected = !target.isSelected;
                }
                target.set('isSelected', target.isSelected);

                $("#galleryMemberView-contactlistview").data("kendoMobileListView").refresh();
                galleryMemberView.contactsDS.sync();
                galleryMemberView.contactsOnly = true;

            },
            dataBound: function(e){
                // ux.checkEmptyUIState(contactModel.contactListDS, "#contactListDiv >");
            }

        });

        $("#galleryMemberView-search").on('input', function() {

            var query = this.value;
            if (query.length > 0) {
                if (galleryMemberView._activeView === galleryMemberView._groups ) {
                    galleryMemberView.candidateDS.filter( [{"logic":"or",
                        "filters":[
                            {
                                "field":"name",
                                "operator":"contains",
                                "value":query},
                            {
                                "field":"alias",
                                "operator":"contains",
                                "value":query}
                        ]}

                    ]);
                } else {
                    galleryMemberView.contactsDS.filter( {"logic":"or",
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
                }


            } else {

                galleryMemberView.candidateDS.filter([]);

            }
        });

    },

    getGroupMembers : function (members) {
        var resultList = [];

        for (var i=0; i<members.length; i++) {
            var member = contactModel.findContactByUUID(members[i]);

            resultList.push(member.contactUUID);
        }

        return(resultList);
    },

    initContactShare : function () {

        var memberArray = contactModel.shareDS.data();

        var contactArray = [];

        var candidateArray = [];

        for (var i=0; i<memberArray.length; i++) {
            var member = memberArray[i];
            member.isSelected = false;

            if (member.category === 'Contact') {
                contactArray.push(member);
            } else {
                candidateArray.push(member);
            }
        }
        galleryMemberView.contactsDS.data(contactArray);
        galleryMemberView.candidateDS.data(candidateArray);
        /*var len = contactModel.shareDS.total();

        for (var i=0; i<len; i++) {
            var contact = contactModel.shareDS.at(i);
            contact.isSelected = false;
        }*/
    },

    queryMember : function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource =  galleryMemberView.contactsDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();
        var member = view[0];

        dataSource.filter(cacheFilter);

        return(member);
    },

    queryMembers : function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource =  galleryMemberView.contactsDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();


        dataSource.filter(cacheFilter);

        return(view);
    },

    findMember : function (memberId) {
        var member = galleryMemberView.queryMember({ field: "channelUUID", operator: "eq", value:memberId });
        return (member);
    },


    findMembers : function () {
        var members = galleryMemberView.queryMembers({ field: "isSelected", operator: "eq", value: true });
        return (members);
    },

    mapContactShare : function (members) {
       var that = galleryMemberView;

        if (members === undefined || members === null) {
            ggError("galleryMemberView: null members");
            return;
        }

        for (var i=0; i< members.length; i++) {
            var member = that.findMember(members[i]);

            if (member !== undefined && member !== null) {
                member.isSelected = true;
            }
        }
    },

    onOpen : function () {

    },

    onTabSelect : function (e) {
        var tab;
        if(_.isNumber(e)){
            tab = e;
        } else {
            tab = $(e.item[0]).data("tab");
        }

        $("#galleryMemberView-search").val("");

        if(tab == 0) {

            $("#galleryMember-tab-0-img").attr("src", "images/icon-contact-active.png");
            $("#galleryMember-tab-1-img").attr("src", "images/icon-group.png");

            $("#galleryMember-contacts").removeClass("hidden");
            $("#galleryMember-groups").addClass("hidden");

            $('#galleryMemberView-search').attr('placeholder',"Search Contacts...");
            //ux.setSearchPlaceholder("Search Contacts...");
           // ux.setAddTarget(null, "#contactImport", null);
        } else {

            $("#galleryMember-tab-0-img").attr("src", "images/icon-contact-alt.png");
            $("#galleryMember-tab-1-img").attr("src", "images/icon-group-active.png");

            $("#galleryMember-contacts").addClass("hidden");
            $("#galleryMember-groups").removeClass("hidden");

            $('#galleryMemberView-search').attr('placeholder',"Search Groups...");
            //ux.setSearchPlaceholder("Search Groups...");
          //  ux.setAddTarget(null, "#groupEditor?returnview=contacts", null);
        }

        galleryMemberView._activeView = tab;
    },

    showSave : function (flag) {
        if (flag) {
            $('#galleryMemberView-saveBtn').removeClass('hidden');
        } else {
            $('#galleryMemberView-saveBtn').addClass('hidden');
        }

    },


    openModal : function (members,  callback) {

        galleryMemberView.onTabSelect(galleryMemberView._activeView);

        $('#groupMember-contacts-source').addClass('hidden');

        contactModel.updateAllShares();
        galleryMemberView.contactsDS.data([]);
        galleryMemberView.candidateDS.data([]);
        galleryMemberView.initContactShare();

        if (members === null) {
            galleryMemberView.memberArray = [];

        } else {
            galleryMemberView.memberArray = members;
            galleryMemberView.mapContactShare(members);

        }

        // Reset search...
        $("#galleryMemberView-search").val('');
        contactModel.shareDS.filter([]);

        galleryMemberView.contactsOnly = false;
        galleryMemberView.showSave(false);

        galleryMemberView.callback = null;

        if (callback !== undefined) {
            galleryMemberView.callback = callback;
        }

        $("#galleryMemberView").data("kendoMobileModalView").open();
    },

    buildMemberString : function (members) {

        var memberString = '';
        _.each(members, function(value, key){
            var member = value;
            var contact = contactModel.findContactByUUID(member);

            if (contact !== undefined && contact !== null) {
                memberString += contact.name + ', ';
            }
        });

        memberString = memberString.replace(/,\s*$/, "");
        return memberString;
    },

    onSave : function () {
        var newArray = galleryMemberView.findMembers();


        var newMemberList = [];

        for (var i=0; i<newArray.length; i++) {
            newMemberList.push(newArray[i].channelUUID);
        }

        var memberString = galleryMemberView.buildMemberString(newMemberList);
        galleryMemberView.onDone();
        if (galleryMemberView.callback !== null) {
            galleryMemberView.callback(newMemberList, memberString);
        }

    },

    closeModal : function () {
      //  $("#galleryMemberView").data("kendoMobileModalView").close();

        galleryMemberView.onDone();

        if (galleryMemberView.callback !== null) {
            galleryMemberView.callback(null, null);
        }
       /* galleryMemberView.contactsOnly = false;
        galleryMemberView.candidateDS.filter([]);

        if (galleryMemberView.callback !== null) {
            galleryMemberView.callback(null);
        }*/
    },

    onDone: function () {
        galleryMemberView.contactsOnly = false;
        galleryMemberView.candidateDS.filter([]);
        $("#galleryMemberView").data("kendoMobileModalView").close();
    }

};

var sharePickerView = {
    callback: null,
    _shareObj : null,
    candidateDS : new kendo.data.DataSource(),
    memberDS : new kendo.data.DataSource(),

    onInit: function () {

        $("#sharePickerView-listview").kendoMobileListView({
            dataSource: contactModel.shareDS,
            template: $("#sharePicker-Template").html(),
            //headerTemplate: $("#contactsHeaderTemplate").html(),
            fixedHeaders: true,
            click: function (e) {
                var share = e.dataItem;
                sharePickerView.shareObject(share);
            },
            dataBound: function(e){
               // ux.checkEmptyUIState(contactModel.contactListDS, "#contactListDiv >");
            }

        });


    /*    $("#sharePickerView-search").kendoMultiSelect({
            dataTextField: "name",
            dataValueField: "objectId",
            height: 400,
            dataSource: contactModel.shareDS,
        });*/


        $("#sharePickerView-search").on('input', function() {

            var query = this.value;
            if (query.length > 0) {
                contactModel.shareDS.filter( {"logic":"or",
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

            } else {
                contactModel.shareDS.filter([]);
            }
        });

    },

    onOpen : function () {

    },

    shareObject : function (target) {
        // Is target a group or contact?


        if (sharePickerView.callback !== null ) {
            sharePickerView.onDone();
            sharePickerView.callback(target);
        }


    },


    openModal : function (shareObj, callback) {

        contactModel.updateAllShares();

        sharePickerView._shareObj = shareObj;

        // Reset search...
        $("#sharePickerView-search").val('');
        contactModel.shareDS.filter([]);


        sharePickerView.callback = null;

        if (callback !== undefined) {
            sharePickerView.callback = callback;
        }

        $("#sharePickerView").data("kendoMobileModalView").open();
    },

    closeModal : function () {
        $("#sharePickerView").data("kendoMobileModalView").close();
        if (sharePickerView.callback !== null) {
            sharePickerView.callback(null);
        }
    },

    onDone: function () {
        $("#sharePickerView").data("kendoMobileModalView").close();
    }

};


var contactPickerView = {
    callback: null,
    _inGroup : 'In Group',
    _notInGroup : 'Select',

    contactsDS : new kendo.data.DataSource({
        group: {field: 'state'}
    }),

    onInit: function () {

        $("#contactPickerView-listview").kendoMobileListView({
            dataSource: contactPickerView.contactsDS,
            template: $("#contactPickerView-template").html(),
            headerTemplate : $("#contactPickerView-header-template").html(),
            fixedHeaders: true,
            autoBind: false,
            click: function (e) {
                var contact = e.dataItem;
                if (contact.state === "Select") {
                    contact.set('state', "In Group");
                } else {
                    contact.set('state', "Select");
                }
                $("#contactPickerView-listview").data("kendoMobileListView").refresh()
            }

        });

        $("#contactPickerView-search").on('input', function() {

            var query = this.value;
            if (query.length > 0) {
                contactPickerView.contactsDS.filter( {"logic":"or",
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
                            "field":"groups",
                            "operator":"contains",
                            "value":query}
                    ]});


            } else {
                contactPickerView.contactsDS.filter([]);
            }
        });
    },

    onOpen : function () {

    },

    buildContactsDS : function (members, candidates) {


        for (var i=0; i<members.length; i++) {
            var contact = members[i];
            contact.state = contactPickerView._inGroup;

            contactPickerView.contactsDS.add(contact);

        }

        for (var j=0; j<candidates.length; j++) {
            var candidate = candidates[j];
            candidate.state = contactPickerView._notInGroup;

            contactPickerView.contactsDS.add(candidate);

        }

    },

    queryContacts: function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = contactPickerView.contactsDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();

        dataSource.filter(cacheFilter);

        return(view);
    },

    getAddedContacts : function () {

        var contacts = contactPickerView.queryContacts({field: "state", operator: "eq", value: contactPickerView._inGroup});


        if (contacts!== null && contacts[0].items !== undefined) {
            return (contacts[0].items);
        } else {
            return([]);
        }

    },

    openModal : function (memberArray, candidateArray,  callback) {

        contactPickerView.contactsDS.data([]);

        contactPickerView.buildContactsDS(memberArray, candidateArray);

        contactPickerView.contactsDS.filter([]);
        // Reset search...
        $("#contactPickerView-search").val('');


        contactPickerView.callback = null;

        if (callback !== undefined) {
            contactPickerView.callback = callback;
        }

        $("#contactPickerView").data("kendoMobileModalView").open();
    },

    closeModal : function () {
        $("#contactPickerView").data("kendoMobileModalView").close();
        if (contactPickerView.callback !== null) {
            contactPickerView.callback(null);
        }
    },

    onDone: function () {
        $("#contactPickerView").data("kendoMobileModalView").close();
        var contacts = contactPickerView.getAddedContacts();
        if (contactPickerView.callback !== null) {
            contactPickerView.callback(contacts);
        }
    }


};

var groupEditView = {
    _callback : null,
    _returnview : null,
    _mode : 'create',
    activeObj : new kendo.data.ObservableObject({
        title: '',
        members:[],
        ux_tagsVisible: false,
        ux_totalMembers: 0,
        ux_showTotal: null
    }),
    tags : null,
    tagString: null,
    memberDS:  new kendo.data.DataSource(),   // members of this group
    candidateDS :  new kendo.data.DataSource(),  // All other contacts that aren't in this group

    onInit: function (e) {


        $("#groupEdit-listview").kendoMobileListView({
            dataSource: groupEditView.memberDS,
            template: $("#groupEditor-Template").html(),

            click : function (e) {
                // _preventDefault(e);
                var contact = e.dataItem;
            }

        });


        $('#groupEditor-title').blur(groupEditView.isValid);

    },

    toggleTags: function(){
        if(groupEditView.activeObj.ux_tagsVisible){
            //$("#groupEditView-addTagBtn").addClass("hidden");
            groupEditView.activeObj.set("ux_tagsVisible", false);
        } else {
            groupEditView.activeObj.set("ux_tagsVisible", true);
        }
    },

    isValid : function () {
        var that = groupEditView.activeObj;

        // If there's a name and at least 1 member - enable save
        if (that.title !== "" && that.members.length > 0) {
            $('#groupEditor-saveBtn').removeClass('hidden');

        } else {
            $('#groupEditor-saveBtn').addClass('hidden');
        }
    },


    initGroup: function (group) {
        var that = groupEditView;

        if (group === null) {
            groupEditView._mode = 'create';

            $('#groupEditor-viewtitle').text('Add Group');

            that.activeObj.ggType = groupModel._ggClass;

            var guid = uuid.v4();
            that.activeObj.uuid = guid;
            that.activeObj.Id = guid;
            that.activeObj.set('title', null);
            that.activeObj.set('alias', null);
            that.activeObj.set('description', null);
            that.activeObj.tagString = '';
            that.activeObj.members = [];
            that.activeObj.memberString = null;

            that.activeObj.tags = [];
            that.activeObj.isICE = false;
            that.activeObj.isFamily = false;
            that.activeObj.isNeighbor = false;
            that.activeObj.canAccount = false;
            that.activeObj.canMedical = false;

        } else {
            $('#groupEditor-viewtitle').text('Edit Group');

            that.activeObj.Id = group.Id;
            that.activeObj.uuid = group.uuid;
            that.activeObj.set('title',group.title);
            that.activeObj.set('alias', group.alias);
            that.activeObj.set('description',group.description);
            if (group.members === undefined) {
                group.members = [];
            }
            that.activeObj.members = group.members;
            that.activeObj.set('memberString',group.memberString);
            that.activeObj.set('tagString', group.tagString);
            that.activeObj.tags= group.tags;
            that.activeObj.isICE = group.isICE;
            that.activeObj.isFamily = group.isFamily;
            that.activeObj.isNeighbor = group.isNeighbor;
            that.activeObj.canAccount = group.canAccount;
            that.activeObj.canMedical = group.canMedical;
        }

        that.activeObj.set("ux_tagsVisible", false);
        groupEditView.initData(that.activeObj.members);

        groupEditView.isValid();

    },

    initData : function (members) {

        var contacts = contactModel.contactsDS.data();

        // Assume the candidates are all current
        groupEditView.candidateDS.data([]);
        for (var i=0; i<contacts.length; i++) {
            var conObj = contacts[i];
            var memObj = {uuid : conObj.uuid, name : conObj.name, alias: conObj.alias, description: conObj.description, contactUUID:
            conObj.contactUUID };
            groupEditView.candidateDS.add(memObj);
        }

        groupEditView.memberDS.data([]);
        if (members.length > 0) {

            // There are members in the group, need to add them and then subtract from candidatesDS
            for (var j=0; j<members.length; j++) {
                var contact = contactModel.findContactByUUID(members[j]);

                if (contact !== undefined && contact !== null) {
                    var memberObj = {uuid : contact.uuid, name : contact.name, alias: contact.alias, description: contact.description,
                        contactUUID: contact.contactUUID };

                    groupEditView.memberDS.add(memberObj);
                    groupEditView.candidateDS.remove(memberObj);
                }

            }
        }
    },

    addContacts : function (contactArray) {

    },

    removeContact : function (contact) {

    },

    deleteMember : function (e) {

    },

    onShow : function (e) {
        //_preventDefault(e);


        var group = null;
        if (e.view.params.groupid !== undefined) {
            groupEditView._groupUUID = e.view.params.groupid;
            groupEditView._mode = 'edit';
            group = groupModel.findGroup(groupEditView._groupUUID);
            if (group === null) {
                ggError("Couldn't find group!");
                groupEditView.onDone();
            }


        } else {
            groupEditView._groupUUID = null;
            groupEditView._mode = 'create';
        }


        if (e.view.params.callback !== undefined) {
            groupEditView._callback = e.view.params.callback;
        } else {
            groupEditView._callback = null;
        }

        if (e.view.params.returnview !== undefined) {
            groupEditView._returnview = e.view.params.returnview;
        } else {
            groupEditView._returnview = null;
        }

        groupEditView.initGroup(group);

    },

    onHide: function (e) {


    },

    onDone : function (e) {
        // _preventDefault(e);


        if (groupEditView._returnview !== null) {
            APP.kendo.navigate('#'+groupEditView._returnview);
        } else {
            APP.kendo.navigate('#:back');
        }

    },

    addContact : function (e) {

        var members = groupEditView.memberDS.data(), candidates = groupEditView.candidateDS.data();
        contactPickerView.openModal(members, candidates, function (newMemberArray) {

            if (newMemberArray !== null) {
                groupEditView.memberDS.data([]);

                for (var i=0; i<newMemberArray.length; i++) {
                    var member = newMemberArray[i];
                    delete member.state;
                    groupEditView.memberDS.add(member);
                }

                groupEditView.memberDS.sync();

                groupEditView.updateMemberArray();

                groupEditView.isValid();

            }

        });

    },

    updateMemberArray : function () {
        var len = groupEditView.memberDS.total();

        var members = [], memberString = '';
        if (len > 0) {
            for (var i=0; i<len; i++) {
                var member = groupEditView.memberDS.at(i);
                members.push(member.uuid);
            }
        }
        groupEditView.activeObj.members = members;
    },

    onSave : function (e) {
        var validator = $("#groupEditor-editTitleTag").kendoValidator().data("kendoValidator");

        if (validator.validate()) {
            groupEditView.saveGroup();
            groupEditView.onDone();
        }



    },

    buildMemberString : function () {
        var activeGroup= groupEditView.activeObj;
        var memberString = '';
        _.each(activeGroup.members, function(value, key){
            var member = value;
            var contact = contactModel.findContactByUUID(member);

            if (contact !== undefined && contact !== null) {
                memberString += contact.name + ', ';
            }
        });

        memberString = memberString.replace(/,\s*$/, "");
        return memberString;
    },


    saveGroup: function () {


        var activeGroup = groupEditView.activeObj;

        activeGroup = JSON.stringify(activeGroup);
        activeGroup = JSON.parse(activeGroup);

        if (activeGroup.members === undefined) {
            activeGroup.members = [];
        }
        var memberString = groupEditView.buildMemberString();

        if (galleryEditView._mode === 'edit') {

            var group = groupModel.findGroup(activeGroup.uuid);


            group.set('title', activeGroup.title);
            group.set('tagString', activeGroup.tagString);
            group.set('tags', []); // todo: don integrate tag processing...
            group.set('description', activeGroup.description);
            group.set('members',activeGroup.members);
            group.set ('memberString', memberString);

            groupModel.groupsDS.sync();
            groupModel.updateGroupContacts(group);

        } else {
            groupEditView.activeObj.set('memberString', memberString);
            groupModel.addGroup(activeGroup);
            groupModel.updateGroupContacts(activeGroup);
        }

    }

};


/*
var contactGroupView = {
    _callback : null,
    _returnview : null,
    _mode : 'create',
    activeObj : new kendo.data.ObservableObject({contactId: null, groups:[]}),
    tags : null,
    tagString: null,
    groupDS:  new kendo.data.DataSource(),   // members of this group
    candidateDS :  new kendo.data.DataSource(),  // All other contacts that aren't in this group

    onInit: function (e) {


        $("#contactGroup-listview").kendoMobileListView({
            dataSource: contactGroupView.memberDS,
            template: $("#contactGroup-Template").html(),

            click : function (e) {
                // _preventDefault(e);
                var contact = e.dataItem;
            }

        });

    },


    isValid : function () {
        var that = groupEditView.activeObj;
        // If there's a name and atleast 1 member - enable save
        if (that.title.length > 2 && that.members.length > 0) {
            $('#groupEditor-saveBtn').removeClass('hidden');
        } else {
            $('#groupEditor-saveBtn').addClass('hidden');
        }
    },


    initGroup: function (group) {
        var that = groupEditView;

        if (group === null) {
            groupEditView._mode = 'create';

            that.activeObj.ggType = groupModel._ggClass;

            that.activeObj.uuid = uuid.v4();
            that.activeObj.title = '';
            that.activeObj.description = '';
            that.activeObj.tagString = '';
            that.activeObj.members = [];
            that.activeObj.tags = [];
            that.activeObj.isICE = false;
            that.activeObj.isFamily = false;
            that.activeObj.isNeighbor = false;
            that.activeObj.canAccount = false;
            that.activeObj.canMedical = false;
        } else {
            that.activeObj.uuid = group.uuid;
            that.activeObj.title = group.title;
            that.activeObj.description = group.description;
            that.activeObj.members = group.members;
            that.activeObj.tagString = group.tagString;
            that.activeObj.tags= group.tags;
            that.activeObj.isICE = group.isICE;
            that.activeObj.isFamily = group.isFamily;
            that.activeObj.isNeighbor = group.isNeighbor;
            that.activeObj.canAccount = group.canAccount;
            that.activeObj.canMedical = group.canMedical;
        }

        groupEditView.initData(that.activeObj.members);

        groupEditView.isValid();

    },

    initData : function (members) {

        var contacts = contactModel.contactsDS.data();

        // Assume the candidates are all current contacts
        groupEditView.candidateDS.data (contacts);
        groupEditView.memberDS.data([]);
        if (members.length > 0) {

            // There are members in the group, need to add them and then subtract from candidatesDS
            for (var j=0; j<members.length; j++) {
                var contact = contactModel.findContactByUUID(members[j]);

                if (contact !== undefined && contact !== null) {
                    groupEditView.memberDS.add(contact);
                    groupEditView.candidateDS.remove(contact);
                }

            }
        }
    },

    addContacts : function (contactArray) {

    },

    removeContact : function (contact) {

    },

    deleteMember : function (e) {

    },

    openModal : function (contactId, callback) {
        //_preventDefault(e);


        var contact = null;

        contactGroupView._contactId = contactId;
        contact = contactModel.findContactByUUID();
        if (group === null) {
            ggError("Couldn't find contact!");
            contactGroupView.onDone();
        }
        contactGroupView.activeObj = contact;

        contactGroupView.callback = callback;


        contactGroupView.initContact(contact);

        $("#contactGroupEditor").data("kendoMobileModalView").open();


    },


    onHide: function (e) {


    },


    onClose : function (e) {
        if (contactGroupView.callback !== null) {
            contactGroupView.callback(null);
        }
        contactGroupView.onDone();
    },

    onDone : function (e) {
        // _preventDefault(e);

        $("#contactGroupEditor").data("kendoMobileModalView").close();

    },

    addContact : function (e) {

        var members = groupEditView.memberDS.data(), candidates = groupEditView.candidateDS.data();
        contactPickerView.openModal(members, candidates, function (newMemberArray) {

            if (newMemberArray !== null) {
                groupEditView.memberDS.data([]);
                for (var i=0; i<newMemberArray.length; i++) {
                    var member = newMemberArray[i];
                    delete member.state;
                    groupEditView.memberDS.add(member);
                }

                groupEditView.memberDS.sync();

                groupEditView.updateMemberArray();

                groupEditView.isValid();

            }

        });

    },

    updateMemberArray : function () {
        var len = groupEditView.memberDS.total();

        var members = [];

        if (len > 0) {
            for (var i=0; i<len; i++) {
                var member = groupEditView.memberDS.at(i);
                members.push(member.uuid);
            }
        }
        groupEditView.activeObj.members = members;
    },

    onSave : function (e) {

        contactGroupView.saveContact();
        contactGroupView.onDone();
    },


    saveContact: function () {


        var contactObj= contactGroupView.activeObj;


        var contact = contactModel.findContactByUUID(contactObj.uuid);


        contact.set();
        contact.set();

        contactModel.contactsDS.sync();


    }


};*/


var groupPickerView = {
    callback: null,
    _inGroup : 'In Group',
    _notInGroup : 'Select',

    groupsDS : new kendo.data.DataSource({
        group: {field: 'state'}
    }),

    onInit: function () {

        $("#groupPickerView-listview").kendoMobileListView({
            dataSource: groupPickerView.groupsDS,
            template: $("#groupPickerView-template").html(),
            headerTemplate : '<span style="font-size: 0.9em; "> <strong>#:value# </strong> </span>',
            fixedHeaders: true,
            autoBind: false,
            click: function (e) {
                var group = e.dataItem;
                if (group.state === "Select") {
                    group.set('state', "In Group");
                } else {
                    group.set('state', "Select");
                }
                $("#groupPickerView-listview").data("kendoMobileListView").refresh()
            }

        });

        $("#groupPickerView-search").on('input', function() {

            var query = this.value;
            if (query.length > 0) {
                groupPickerView.groupsDS.filter( {"logic":"or",
                    "filters":[
                        {
                            "field":"title",
                            "operator":"contains",
                            "value":query},
                        {
                            "field":"memberString",
                            "operator":"contains",
                            "value":query}
                    ]});


            } else {
                groupPickerView.groupsDS.filter([]);
            }
        });
    },

    onOpen : function () {

    },

    addGroup : function () {
        APP.kendo.navigate('#groupEditor');
    },

    buildGroupsDS : function (members, candidates) {


        for (var i=0; i<members.length; i++) {
            var group = groupModel.findGroup(members[i]);
            group.state = groupPickerView._inGroup;

            groupPickerView.groupsDS.add(group);

        }

        for (var j=0; j<candidates.length; j++) {
            var candidate = groupModel.findGroup(candidates[j].uuid);
            candidate.state = groupPickerView._notInGroup;

            groupPickerView.groupsDS.add(candidate);

        }

    },

    buildGroupString : function (groups) {
        var str = '';

        for (var i=0; i<groups.length; i++) {
            var group = groupModel.findGroup(groups[i]);
            if (group !== null) {
                str += group.title + ',';
            }
        }

        str.splice(0,-1);

        return(str);

    },

    queryGroups: function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = groupPickerView.contactsDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();

        dataSource.filter(cacheFilter);

        return(view);
    },

    getAddedGroups : function () {

        var groups = groupPickerView.queryContacts({field: "state", operator: "eq", value: groupPickerView._inGroup});


        if (groups!== null && groups[0].items !== undefined) {
            return (groups[0].items);
        } else {
            return([]);
        }

    },

    openModal : function (memberArray, candidateArray,  callback) {

        groupPickerView.groupsDS.data([]);

        groupPickerView.buildGroupsDS(memberArray, candidateArray);

        groupPickerView.groupsDS.filter([]);
        // Reset search...
        $("#groupPickerView-search").val('');


        groupPickerView.callback = null;

        if (callback !== undefined) {
            groupPickerView.callback = callback;
        }

        $("#groupPickerView").data("kendoMobileModalView").open();
    },

    closeModal : function () {
        $("#groupPickerView").data("kendoMobileModalView").close();
        if (groupPickerView.callback !== null) {
            groupPickerView.callback(null);
        }
    },

    onDone: function () {
        $("#groupPickerView").data("kendoMobileModalView").close();
        var groups = groupPickerView.getAddedGroups();
        if (groupPickerView.callback !== null) {
            var groupString = groupPickerView.buildGroupString(groups);
            groupPickerView.callback(groups, groupString);
        }
    }



};
/**
 * Created by donbrad on 8/22/15.
 *
 * The objects / functions behind all channels and channel views
 */


'use strict';


/*
 * Channels
 */

var channelsView = {
    _viewInitialized : false,
    _showDeletedChannels : false,

    _channelListDS : null,


    onInit : function (e) {
        //e.preventDefault();

        
        channelsView._channelListDS =  new kendo.data.DataSource({
           // offlineStorage: "channellist"
        });
        
        //channelsView._channelListDS.online(false);

        $("#channels-listview").kendoMobileListView({
            dataSource: channelsView._channelListDS,
            template: $("#channels-listview-template").html(),
            dataBound: function(e){
                ux.checkEmptyUIState(channelsView._channelListDS, "#channelListDiv");
            }
        }).kendoTouch({
            filter: ".chat-mainBox",
            enableSwipe: true,
            tap: function (e) {
                //var selector = e.target[0].parentElement;
                var selector = $(e.sender.events.currentTarget);
                if(selector.hasClass("chat-mainBox") === true || e.target[0].className === "chat-mainBox"){
                    var channelUUID = selector.context.parentElement.id;
                    var channelUrl = "#channel?channelUUID=" + channelUUID;
                    APP.kendo.navigate(channelUrl);
                }
            },
            swipe: function(e){
                var selection = e.sender.events.currentTarget;

                if(e.direction === "left"){
                    var otherOpenedLi = $(".chat-active");
                    $(otherOpenedLi).velocity({translateX:"0"},{duration: "fast"}).removeClass("chat-active");

                    // if smaller screen and private chat
                    if($(selection).hasClass("private") && $(window).width() < 375){
                        $(selection).velocity({translateX:"-45%"},{duration: "fast"}).addClass("chat-active");
                    // if smaller screen and owner
                    } else if ($(window).width() < 375 && $(selection).hasClass("owner")){
						$(selection).velocity({translateX:"-65%"},{duration: "fast"}).addClass("chat-active");
					// other small screen 
					} else if ($(window).width() < 375){
						$(selection).velocity({translateX:"-45%"},{duration: "fast"}).addClass("chat-active");
                    // if larger screen and private chat
                    } else if ($(selection).hasClass("private")){
                        $(selection).velocity({translateX:"-45%"},{duration: "fast"}).addClass("chat-active");
                    // if larger screen and owner
                	} else if($(selection).hasClass("owner")){
                		$(selection).velocity({translateX:"-65%"},{duration: "fast"}).addClass("chat-active");
                    // if larger screen
                    } else {
                        $(selection).velocity({translateX:"-45%"},{duration: "fast"}).addClass("chat-active");
                    }


                }
                if (e.direction === "right" && $(selection).hasClass("chat-active")){
                    $(selection).velocity({translateX:"0"},{duration: "fast"}).removeClass("chat-active");
                }
            }

        });

		ux.checkEmptyUIState(channelsView._channelListDS, "#channels");
        channelsView.scroller = e.view.scroller;

        channelsView.scroller.setOptions({
            pullToRefresh: true,
            pull: function() {
                channelModel.channelsDS.sync();
                ux.toggleSearch();
                channelsView.scroller.pullHandled();

            }
        });
    },

    // Update channel display list from channel master list
    updateChannelListDS : function () {

        if (channelsView._showDeletedChannels) {
            channelsView._channelListDS.data(channelModel.channelsDS.data());
        } else {

            var dataSource = channelModel.channelsDS;
            var cacheFilter = dataSource.filter();
            if (cacheFilter === undefined) {
                cacheFilter = {};
            }
            dataSource.filter(
                {
                    "field": "isDeleted",
                    "operator": "eq",
                    "value": false
                }
            );
            var view = dataSource.view();
            channelsView._channelListDS.data(view);
            dataSource.filter(cacheFilter);

        }

    },

    // Get the current alias for privateChat contact  
    getPrivateChatAlias: function (contactUUID) {
        var contact = contactModel.findContact(contactUUID);

        if (contact === undefined || contact.alias === undefined)
            return('...');
        
        return(contact.alias);
    },

    onShow : function(e) {
       // _preventDefault(e);

        channelModel.syncMemberChannels();
        channelsView.updateChannelListDS();

        if (!channelsView._viewInitialized) {
            channelsView._viewInitialized = true;

            $('#channels .gg_mainSearchInput').on('input', function (e) {

                var query = this.value;
                if (query.length > 0) {
                    channelsView._channelListDS.filter([
                        {
                            "field": "name",
                            "operator": "contains",
                            "value": query
                        },
                        {
                            "field": "description",
                            "operator": "contains",
                            "value": query
                        }

                    ]);
                    $('#channels .enterSearch').removeClass('hidden');

                } else {
                    channelsView._channelListDS.filter({});
                    $('#channels .enterSearch').addClass('hidden');

                }
            });


			// bind clear search btn
			$("#channels .enterSearch").on("click", function(){
					$("#channels .gg_mainSearchInput").val('');
					
					// reset data filters
                channelsView._channelListDS.filter({});

                    // hide clear btn
                    $(this).addClass('hidden');
			})

        }

        $('#channels .gg_mainSearchInput').attr("placeholder", "Search chats...");

        ux.checkEmptyUIState(channelsView._channelListDS, "#channels");
    	
        // set action button
        ux.setAddTarget(null, "#addChannel", null);
       // ux.showActionBtn(true, "#channels", "#addChannel");
      //  ux.showActionBtnText("#channels", "3em", "New Chat");

    },

    onHide: function(){
    	// set action button
		//ux.showActionBtn(false, "#channels");
        ux.setAddTarget(null);
		ux.hideSearch();
    },

    queryChannel : function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = channelsView._channelListDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();
        var channel = view[0];
        dataSource.filter(cacheFilter);
        return(channel);
    },

    findChannelModel: function (channelUUID) {

        return(channelsView.queryChannel({ field: "channelUUID", operator: "eq", value: channelUUID }));

        /*var dataSource =  channelModel.channelsDS;
         dataSource.filter( { field: "channelUUID", operator: "eq", value: channelUUID });
         var view = dataSource.view();
         var channel = view[0];
         dataSource.filter([]);

         return(channel);*/
    },

    editChannel : function (e) {
        if (e!== undefined && e.preventDefault !== undefined){
            e.preventDefault();
        }
        // Did a quick bind to the button, feel free to change

        var channelUUID = e.button[0].attributes["data-channel"].value;


        APP.kendo.navigate('#editChannel?channel='+channelUUID);

    },

    deleteChannel: function (e) {
        e.preventDefault();

        var channelUUID = e.button[0].attributes["data-channel"].value;

        var channelListModel = channelsView.findChannelModel(channelUUID);
        channelsView._channelListDS.remove(channelListModel);
        channelModel.deleteChannel(channelUUID);

    },

    muteChannel : function (e) {
        e.preventDefault();

        var channelUUID = e.button[0].attributes["data-channel"].value;
        var channel = channelModel.findChannelModel(channelUUID);
        var channelListModel = channelsView.findChannelModel(channelUUID);
        channelListModel.set('isMuted', channel.isMuted);

        if(channel.isMuted){
            channelModel.muteChannel(channelUUID, false);
            mobileNotify(channel.name + " is unmuted");


        } else {
            channelModel.muteChannel(channelUUID, true);
            mobileNotify(channel.name + " is muted");
        }

    }

};

/*
 * AddChannel
 */

var addChannelView = {
   
    onInit : function (e) {
        //_preventDefault(e);
        $("#channels-addChannel-name").keyup(function(){
            if($("#channels-addChannel-name").val !== ""){
                $("#addChat-createBtn").velocity({opacity: 1}, {duration: 500, easing: "spring"});
                $("#channels-addChannel-name").unbind();
            }
            $("#addChat-helper-1").velocity("fadeOut", {duration: 300});
        });
    },

     onShow: function (e) {
      // _preventDefault(e);
       /* currentChannelModel.potentialMembersDS.data([]);
        currentChannelModel.potentialMembersDS.data(contactModel.contactsDS.data());
        currentChannelModel.membersDS.data([]);*/
         if (contactModel.totalContacts() === 0) {
             modalView.open("Here alone?", "Chats are better with friends. Add a contact and create a chat.", "Add Contacts", addChannelView.go2NewContacts, "Cancel", addChannelView.go2Channels);
         } else {
             $("#addChatNoContacts").addClass('hidden');
             $("#addChatHasContacts").removeClass('hidden');
         }
        $('.addChannelEvent').addClass('hidden');

        // hide channel description
        $("#channels-addChannel-description").css("display","none");
        $("#addChat-step2").css("opacity", 0);
    },

    go2NewContacts: function(){
        APP.kendo.navigate('#contactImport');
    },

    go2Channels: function(){
        modalView.close();
        //addChannelView.onHide();

        APP.kendo.navigate('#channels');
    },


    // onHide is the ideal point to reset ux (unless you want to do first in onShow...
    onHide : function (e) {
        _preventDefault(e);
        addChannelView.resetUI();
    },

   addChannel : function (e) {
       _preventDefault(e);

       // make sure chat has a name
       if ($("#channels-addChannel-name").val() !== '') {

           var name = $('#channels-addChannel-name').val(),
               duration = $('#channels-addChannel-archive').val(),
               description = $('#channels-addChannel-description').val();

           if (channelModel.findChannelByName(name)) {
               mobileNotify('There is already a chat named : "' + name + '"');
           } else {
               channelModel.addChannel(name, description);
           }


       } else {
           mobileNotify("Chat name is required");
       }
   },

    showChatDescription : function (e){
        _preventDefault(e);

        $("#channels-addChannel-description").velocity("slideDown",{duration: 1500, easing: "spring", display: "block"});
        $("#addChatDescription").velocity("fadeOut");
    },

    resetUI : function (e){
        _preventDefault(e);

        $("#channels-addChannel-description").css("display","none");
        $("#channels-addChannel-description, #channels-addChannel-name").val("");
        $("#addChatDescription").velocity("fadeIn");
        //$("#addChat-createBtn").velocity({opacity: 0});

        $("#channels-addChannel-name").keyup(function(){
            if($("#channels-addChannel-name").val !== ""){
                $("#addChat-createBtn").velocity({opacity: 1}, {duration: 500, easing: "spring"});
                $("#channels-addChannel-name").unbind();
            }
        });
        addChannelView.addChatStep1();

    },

    addChatStep1: function(e){
        _preventDefault(e);
        // This chat (channel name) is unique for this user
        $("#chat-title-setup").velocity("slideUp", {duration: 300});
        $("#addChat-step2").velocity("fadeOut", {duration: 200});
        $("#addChat-step1").velocity("fadeIn", {duration: 200, delay: 200});
        //$("#addChat-createBtn").velocity("slideUp", {display: "none", duration: 300});

    },



    addChatStep2: function (e) {
        _preventDefault(e);
        if($("#channels-addChannel-name").val() !== ""){
            // Todo - need to add UI cleaners
            var chatTitle = $("#channels-addChannel-name").val();
            $("#chat-title-step1").empty().prepend("+ " + chatTitle);
            $("#chat-title-setup").velocity("slideDown", {display: "block", duration: 500});

            // fade out step 1
            $("#addChat-step1, #addChat-helper1").velocity("fadeOut", {duration: 300});

            $("#addChat-step2").velocity("fadeIn", {duration: 100, delay:300, display: "block"});
        } else {
            mobileNotify("Chat name is required");
        }

    },

    doShowEventInputs : function (e) {
        _preventDefault(e);
        $('.addChannelEvent').removeClass('hidden');
    }

};

/*
 * EditChannel
 */

var editChannelView = {
    _activechannelUUID : null,
    _activeChannel : new kendo.data.ObservableObject(),

    potentialMembersDS: new kendo.data.DataSource({
        //group: 'category',
        sort: {
            field: "name",
            dir: "asc"
        }
    }),

    membersDS: new kendo.data.DataSource({
        sort: {
            field: "name",
            dir: "asc"
        }
    }),

    originalMembers : [],   // Need to keep track of original members (at start of edit sessions).  as user can add and remove same member.

    membersAddedDS : new kendo.data.DataSource(),
    
    membersDeletedDS: new kendo.data.DataSource(),
    
    queryMember : function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = editChannelView.membersDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();
        var contact = view[0];

        dataSource.filter(cacheFilter);

        return(contact);
    },
    
    isMember: function (contactUUID) {
        var member = editChannelView.queryMember({ field: "contactUUID", operator: "eq", value: contactUUID });
        if (member !== undefined)
            return(true);
        
        return(false);
    },
    
    onInit: function (e) {
     //  _preventDefault(e);

        editChannelView.membersDS.data([]);
        editChannelView.potentialMembersDS.data([]);

        $("#editmembers-listview").kendoMobileListView({
            dataSource: editChannelView.membersDS,
            template: $("#editMembersTemplate").html()
        });

        $("#editChannelForm").kendoValidator();


    },

    onShow : function (e) {
      // _preventDefault(e);

        //Simplifying the logic here. If there's a channel passed, load the new channel data,
        //If there's no channel id assume, it's a return from the new add members view and just use the cached data

        if (e.view.params.channel !== undefined) {

            editChannelView._activechannelUUID = e.view.params.channel;

            editChannelView.orginalMembers = [];

            var channel = channelModel.findChannelModel(editChannelView._activechannelUUID);
            editChannelView.setActiveChannel(channel);

            var members = editChannelView._activeChannel.members,  invitedMembers = editChannelView._activeChannel.invitedMembers, thisMember = {};
            var membersArray = [];

            // All (member and new) contacts are potential members  - need to ignore unknown and deleted
            var potentialMembers = contactModel.getPotentialMemberList();
            editChannelView.potentialMembersDS.data(potentialMembers);

            //Zero out current members as we're going rebuild ds and ux
            editChannelView.membersDS.data([]);
            editChannelView.membersAddedDS.data([]);
            editChannelView.membersDeletedDS.data([]);

            $('#editChannelMemberList').empty();

            // Only channel owner can see and edit members and invited members
            if (members.length > 0 ) {
                // Group channel members are referenced indirectly by uuid
                // channel can include invited users who havent signed up yet

                for (var i = 0; i < members.length; i++) {
                    thisMember = contactModel.findContact(members[i]);

                    if (thisMember !== undefined) {
                        editChannelView.membersDS.add(thisMember);
                        editChannelView.potentialMembersDS.remove(thisMember);

                    }
                }

                if (invitedMembers !== undefined && invitedMembers.length > 0) {
                    for (var j = 0; j < invitedMembers.length; j++) {
                        thisMember = contactModel.findContactByUUID(invitedMembers[j]);
                        editChannelView.membersDS.add(thisMember);
                        editChannelView.potentialMembersDS.remove(thisMember);
                    }
                }


            }
        }


        if (editChannelView._activeChannel.members.length > 0) {
            $(".addChatMembersBanner a").text("+ add new members");
        } else {
            $(".addChatMembersBanner a").text("No one is invited. Tap to add members");
        }

        // show action btn text
        var $editChannelP = $("#editChannel > div.footerBk.km-footer > a.actionBtn.secondary-100.km-widget.km-button > span > p")
        $editChannelP.velocity({opacity: 1, right: "4rem"}, {easing: "spring", delay: 500});
    },

    setActiveChannel : function (channel) {

        if (channel.Id !== undefined) {
            editChannelView._activeChannel.set('Id', channel.Id);
        }

        editChannelView._activeChannel.set('name', channel.name);
        editChannelView._activeChannel.set('description', channel.description);
        editChannelView._activeChannel.set('isPlace', channel.isPlace);
        editChannelView._activeChannel.set('placeUUID', channel.placeUUID);
        editChannelView._activeChannel.set('placeName', channel.placeName);

        if (channel.members === undefined)
            channel.members = [];
        editChannelView._activeChannel.set('members', channel.members);
        if (channel.invitedMembers === undefined)
            channel.invitedMembers = [];
        editChannelView._activeChannel.set('invitedMembers', channel.invitedMembers);

    },

    validate: function(){
    	var form = $("#editChannelForm").data("kendoValidator");

    	if(form.validate()){
    		editChannelView.finalizeEdit();
    	}

    },

    finalizeEdit : function (e) {
        _preventDefault(e);

        var memberArray = [], invitedMemberArray = [], invitedPhoneArray = [], inviteArray = [],members = editChannelView.membersDS.data();

        var channelUUID = editChannelView._activechannelUUID;
        // It's a group channel so push this users UUID

        memberArray.push(userModel._user.userUUID);
        for (var i = 0; i < members.length; i++) {
            if (members[i].contactUUID !== null) {
                memberArray.push(members[i].contactUUID);
            } else {
                // No contactUUID so this user hasn't signed up yet - use the owners uuid for the contact
                invitedMemberArray.push(members[i].uuid);

                // User isn't signed up yet, store their phone number in the channel map so we can autoprovision their channels
                // when they do sign up
                invitedPhoneArray.push(members[i].phone);
            }

        }
        editChannelView._activeChannel.members = memberArray;


        var membersDeleted = editChannelView.membersDeletedDS.data();
        //Send Delete messages to users deleted from the channel
        if (membersDeleted !== undefined ) {

            for (var md = 0; md < membersDeleted.length; md++) {
                var contactId = membersDeleted[md].contactUUID;
                if (contactId !== null && ($.inArray(contactId, memberArray) == -1)) {  // if this user is still in the member array don't send a delete
                    // This is a ggMember -- send delete.
                    appDataChannel.groupChannelDelete(contactId, channelUUID, editChannelView._activeChannel.name, editChannelView._activeChannel.name + " has been deleted.");
                } else {
                    // Invited member -- need to look up userId by phone number before sending delete notification
                    var phone = editChannelView.membersDeleted[md].phone;
                    if (phone !== undefined && phone !== null) {
                        memberdirectory.findMemberByPhone(phone, function (user) {
                            if (user !== null) {
                                var contactId = user.userUUID;
                                appDataChannel.groupChannelDelete(contactId, channelUUID, editChannelView._activeChannel.name, editChannelView._activeChannel.name + " has been deleted.");
                            }

                        });
                    }

                }
            }
        }
        
        var membersAdded = editChannelView.membersAddedDS.data();
        //Send Invite messages to users added to channel
        for (var ma = 0; ma <  membersAdded.length; ma++) {
            var options = null;

            // If this is a place chat, send the place data to the members
            if (editChannelView._activeChannel.placeUUID !== null) {
                options = {chatType: "Place"};

                var place = placesModel.getPlaceModel(editChannelView._activeChannel.placeUUID);
                var newPlace = new Object(place);

                options.chatData = newPlace;
            }

            var contactId = membersAdded[ma].contactUUID;
            if (contactId !== undefined && contactId !== null) {
                inviteArray.push(contactId);
                appDataChannel.groupChannelInvite(contactId, channelUUID,  editChannelView._activeChannel.name,  editChannelView._activeChannel.description, memberArray,
                    options);
            } else {
                console.error("Invalid Contact " + contactId);
            }

        }
        

        for (var m=0; m< memberArray.length; m++) {

            var invited = ($.inArray(memberArray[m],inviteArray) !== -1);
            // Only send updates to current members (new members got an invite above)
            if (memberArray[m] !== userModel._user.userUUID &&  invited === false) {
                appDataChannel.groupChannelUpdate(memberArray[m], channelUUID,  editChannelView._activeChannel.name, editChannelView._activeChannel.description, memberArray);
            }
        }



        // Update the kendo object
        var channelObj = channelModel.findChannelModel(channelUUID);

        channelObj.set('name', editChannelView._activeChannel.name);
        channelObj.set('description', editChannelView._activeChannel.description);
        channelObj.set('members', memberArray);
        channelObj.set('inviteMembers', invitedMemberArray);

        //Compute the membercount from both members and invited members
        var memberCount = memberArray.length + invitedMemberArray.length;
        channelObj.set('memberCount', memberCount);


        var Id = channelObj.Id;
        if (Id !== undefined){
            everlive.updateOne(channelModel._cloudClass, channelObj, function (error, data) {
                //placeNoteModel.notesDS.remove(note);
            });
        }
        
        channelModel.updateChannelMap(channelObj);
        
        // Reset UI
        $("#showEditDescriptionBtn").velocity("fadeIn");
    //    $("#channels-editChannel-description").css("display", "none").val("");

        mobileNotify("Updating " + editChannelView._activeChannel.name);

        APP.kendo.navigate('#channels');

        // Reset UI
        $("#channels-addChannel-description, #channels-addChannel-name").val('');
    },

    deleteMemberBtn: function(e){
        _preventDefault(e);
    	var selectorId = e.target[0].dataset["id"];
    	editChannelView.deleteMember(selectorId);
    },

    deleteMember : function (contactId) {
        
        var thisMember = contactModel.findContactByUUID(contactId);

        editChannelView.membersDeletedDS.add(thisMember);
        editChannelView.membersAddedDS.remove(thisMember);
        editChannelView.potentialMembersDS.add(thisMember);
        editChannelView.potentialMembersDS.sync();
        editChannelView.membersDS.remove(thisMember);
        editChannelView.membersDS.sync();
        //	$('#'+contactId).remove();
        mobileNotify("Deleted " + thisMember.name);
        
    },


    showDoneButton: function () {

    },

    clickEdit: function (e) {
        _preventDefault(e);

        $(".listTrash").velocity("fadeIn", {duration: 100});
        $("#editChannel-Trash").velocity("fadeOut", {duration: 100});
        $("#editChannel-Done").velocity("fadeIn", {delay: 100, duration: 100});
        $(".addChatMembersBanner").velocity("slideUp", {duration: 100});
    },

    clickDone : function (e) {
        _preventDefault(e);
        $("#editChannel-Done").velocity("fadeOut", {duration: 100});
        $(".addChatMembersBanner").velocity("slideDown", {duration: 100});
        $(".listTrash").velocity("fadeOut", {duration: 100});
        $("#editChannel-Trash").velocity("fadeIn", {delay: 100, duration: 100});
    }

};


/*
 * ChannelMembers
 */


var channelMembersView = {

    doInit: function (e) {
      _preventDefault(e);


        $("#channelMembers-listview").kendoMobileListView({
            dataSource: editChannelView.potentialMembersDS,
            template: $("#memberTemplate").html(),
         //   headerTemplate: "${value}",
            filterable: {
                field: "name",
                operator: "startswith",
                placeholder: "Search contacts..."
            },
            click: function (e) {
                // Click to potential member list -- add this member to channel
                var thisMember = e.dataItem;

                editChannelView.membersDS.add(thisMember);
                if (thisMember.contactUUID === null) {
                    editChannelView._activeChannel.invitedMembers.push(thisMember.uuid);
                    //appendInvitedMemberToUXList (thisMember);

                } else {
                    editChannelView._activeChannel.members.push(thisMember.contactUUID);
                    //appendMemberToUXList (thisMember);
                }
                editChannelView.membersDS.sync();
                editChannelView.membersAddedDS.add(thisMember);
                editChannelView.membersDeletedDS.remove(thisMember);
                editChannelView.potentialMembersDS.remove(thisMember);
                $(".addedChatMember").text("+ added " + thisMember.name).velocity("slideDown", { duration: 300, display: "block"}).velocity("slideUp", {delay: 1400, duration: 300, display: "none"});
            }

        });
    },

    doShow: function (e) {
        _preventDefault(e);

        if (contactModel.totalContacts() === 0) {
            // Todo:  Jordan -- need a better solution to creating groups (may hide add group until user has contacts...)
            mobileNotify("You don\'t have any contacts yet.  Please add contacts first...");
            APP.kendo.navigate("#contacts");
        }
/*
        var members = editChannelView._activeChannel.members, invitedMembers = editChannelView._activeChannel.invitedMembers;


        // Need to break observable link or contacts get deleted.
        var contactArray = contactModel.contactsDS.data().toJSON();

        // create an easy reference to the potential members data source
        var dataSource = editChannelView.potentialMembersDS;

        // Zero potential members data source so we can add all contacts
        dataSource.data([]);

        // Add current contacts to potential members data source
        // we delete members from potential members as we add them to members data source
        dataSource.data(contactArray);


        // Zero out member datasource so we can rebuild it
        editChannelView.membersDS.data([]);

        // Build members and potential members this based on current channel params
        // members and potential members will be dynamically updated as members
        // are added and deleted from the channel

        //datasource is shortcut to potential members.  as members and invited members are added
        // to channel members, they are deleted from potentialmembers
        if (members.length > 0) {

            for (var i=0; i<members.length; i++) {
                var thisMember = contactModel.findContact(members[i]);
                if (thisMember === undefined)
                    thisMember = contactModel.findContactByUUID(members[i]);
                if (thisMember !== undefined) {

                    editChannelView.membersDS.add(thisMember);
                    dataSource.filter( { field: "uuid", operator: "eq", value: thisMember.uuid});
                    var view = dataSource.view();
                    var contact = view[0];
                    dataSource.filter([]);
                    dataSource.remove(contact.items[0]);  // new object layout for aggregate datasources
                }

            }
           editChannelView.potentialMembersDS.sync();
        }

        if (invitedMembers.length > 0) {
            for (var j=0; j<invitedMembers.length; j++) {
                var invitedMember = contactModel.findContactByUUID(invitedMembers[j]);
                if (invitedMember !== undefined) {

                    editChannelView.membersDS.add(invitedMember);
                    dataSource.filter( { field: "uuid", operator: "eq", value: invitedMember.uuid});
                    var view1 = dataSource.view();
                    var contact1 = view1[0];
                    dataSource.filter([]);
                    dataSource.remove(contact1.items[0]); // new object layout for aggregate datasources
                }


            }

        }*/

    }


};

// ChannelView -- Chat View

var channelView = {
    topOffset: 0,
    _active: false,
    messageLock: false,
    thisUser : null,
    contactData : [],
    messagePhotos: [],
    messageObjects: [],
    privateContactId: null,
    privateContact : null,
    isPrivateChat: false,
    isEmergencyChat: false,
    privacyMode: false,  // Privacy mode - obscure messages after timeout
    currentContact: null,
    activeMessage: {},
    intervalId : null,
    hasRecalled : false,
    recalledMessages: null,
    ghostgramActive : false,
    sendMessageHandler : null,
    _offersLoaded : false,
    _tagActive : false,
    _insertTag: false,
    _tagStart : null,
    _tagEnd: null,
    _emojiStart : null,
    _emojiEnd: null,
    _emojiRange: null,
    _emojiSelection: null,
    _tagRange: null,
    _firstSpace: false,
    _editorActive: false,
    _returnview: null,
    _titleTagActive: false,
    _currentPhoto : 0,

    membersDS: new kendo.data.DataSource({
        sort: {
            field: "name",
            dir: "asc"
        }
    }),

    members : [],

    memberList: [],

    newMembers : [],

    photos : [],

    photosDS: new kendo.data.DataSource({
        sort: {
            field: "timestamp",
            dir: "asc"
        }
    }),

    photoUrlMap: [], // Dynamic map of photos to image urls based on offers

    messagesDS: new kendo.data.DataSource({  // this is the list view data source for chat messages
        schema: {
            model: { id: 'msgID' }
        },
        sort: {
            field: "time",
            dir: "asc"
        }
    }),

    _channel : null,
    _channelName : null,
    _channelUUID : null,
    _showEmoji: true,
    emojiCategories: null,

    queryMember : function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = channelView.membersDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();
        var contact = view[0];

        dataSource.filter(cacheFilter);

        return(contact);
    },

    isMember: function (contactUUID) {
        var member = channelView.queryMember({ field: "contactUUID", operator: "eq", value: contactUUID });
        if (member !== undefined)
            return(true);

        return(false);
    },

    queryMessage: function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = channelView.messagesDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();
        var message = view[0];

        dataSource.filter(cacheFilter);

        return(message);
    },

    queryMessages: function (query) {
        if (query === undefined)
            return(undefined);

        var dataSource = channelView.messagesDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();

        dataSource.filter(cacheFilter);
        return(view);
    },

    isDuplicateMessage : function (msgID) {
        var messages = channelView.queryMessages({ field: "msgID", operator: "eq", value: msgID });

        if (messages === undefined) {
            return (false);
        } else if (messages.length === 0) {
            return (false);
        } else {
            return(true);
        }
    },

    loadMoreMessages : function () {

        groupChannel.getMoreMessages(function (messages){
            if (messages.length === 0) {
                $('#loadMoreMessages').addClass('hidden');
                return;
            }
            var filteredMessages = [];

            for (var i=0; i<messages.length; i++) {
                var message = messages[i];
                if (channelView.hasRecalled) {
                    if (!channelView.isDuplicateMessage(message.msgID) && !channelModel.isMessageRecalled(message.msgID)) {
                        filteredMessages.push(message);
                    }
                } else {
                    if (!channelView.isDuplicateMessage(message.msgID)) {
                        filteredMessages.push(message);
                    }
                }

            }
            channelView.preprocessMessages(filteredMessages);
            channelView.messagesDS.data(filteredMessages);
        });
    },

    findMessageById : function (msgID) {

        return(channelView.queryMessage({ field: "msgID", operator: "eq", value: msgID }));
    },

    queryPhoto: function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = channelView.photosDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();
        var message = view[0];

        dataSource.filter(cacheFilter);

        return(message);
    },

    findPhotoById : function (photoID) {

        return(channelView.queryPhoto({ field: "photoUUID", operator: "eq", value: photoId }));
    },
    
    onInit: function (e) {

       // e.preventDefault();

        channelView.initDataSources();

        //APP.checkPubnub();

       // var width = window.innerWidth - 68;
        //$('#messageTextArea').css("width", width+'px');
        //channelView.topOffset = APP.kendo.scroller().scrollTop;

        
        $("#messages-listview").kendoMobileListView({
            dataSource: channelView.messagesDS,
            template: $("#messagesTemplate").html()

        }).kendoTouch({
            filter: "li",
            enableSwipe: true,
            tap: channelView.tapChannel,
            hold: channelView.holdChannel
        });

        channelView.messagesDS.bind("change", function (e) {
            var changedMessages = e.items;
            var message = e.items[0];
            if (e.action !== undefined) {
                switch (e.action) {
                    case "itemchange" :
                        var field  =  e.field;
                        var messageId = message.msgID;
                        break;

                    case "remove" :
                        // delete from contact list
                        break;

                    case "add" :
                       message = e.items[0];
                        // add to list if it's not a duplicate

                        break;
                }
            }


        });

        // testing emoji icons
        $.getJSON("./bower_components/emojione/emoji.json")
            .done(function(data){
                // Split emojis into categories
                channelView.emojiCategories = _.groupBy(data, function(data){
                    return data.category;
                });

                }).fail(function(){
                // if emojis fail to load
                    mobileNotify("Error loading emojis");
                }

            );

    },

    emojiGetSelection   : function (e) {

        // Get the current insertion point

        /*var isSelected = $('#messageTextArea').redactor('selection.is');
        var currentObject = $('#messageTextArea').redactor('selection.current');

        if (!isSelected) {
            // Nothing is selected
            var offset = $('#messageTextArea').redactor('offset.get');
            channelView._emojiIsSelected = false;
            channelView._emojiStart = offset;
            channelView._emojiEnd = offset;
        } else {
            var selection = $('#messageTextArea').redactor('selection.save');
            var range = $('#messageTextArea').redactor('selection.range', selection);

            channelView._emojiIsSelected = true;
            channelView._emojiRange = range;
            channelView._emojiSelection = selection;
            channelView._emojiStart = range.startOffset;
            channelView._emojiEnd = range.endOffset;
        }*/
        $('#messageTextArea').redactor('selection.save');

    },

    emojiMenuOpen: function(e){
        ux.hideKeyboard();
        // Need to cache the offset
        channelView.emojiGetSelection();
    },

    emojiMenuClose: function(){
        // Handle emoji menu closing
    },

    emojiPasteInEditor: function(e){
        // Close the popover
        $("#emoji-menu").data("kendoMobilePopOver").close();


        var shortname = e.button[0].dataset.shortname;
        var rendered = emojione.shortnameToImage(shortname);
        //var node = $('<span />').html(rendered);
       // var html = JSON.stringify(node);

       /* if (channelView._emojiIsSelected) {
            $('#messageTextArea').redactor('selection.restore', channelView._emojiSelection);
        } else {
            $('#messageTextArea').redactor('offset.set', channelView._emojiStart);
        }*/

        $('#messageTextArea').redactor('selection.restore');
        $('#messageTextArea').redactor('insert.html', rendered);

        // Recompute selection after emoji inserted
       // channelView.emojiGetSelection();

    },

    openEditor : function () {
        if (channelView._editorActive === false) {

            channelView._editorActive = true;

            $('#messageTextArea').redactor({
                minHeight: 36,
                maxHeight: 360,
                focus: false,
                placeholder: 'Message....',
                 callbacks: {

                 // todo - need to support native emoji keyboard

                 },
                buttons: ['bold', 'italic', 'lists', 'horizontalrule'],
                toolbarExternal: '#messageComposeToolbar'
            });
        }

    },


    closeEditor : function () {

        if (channelView._editorActive) {

            channelView._editorActive = false;
            $('#messageTextArea').redactor('core.destroy');
        }

        $("#messageComposeToolbar").addClass('hidden');

    },

    // Initialize the channel specific view data sources.
    initDataSources : function () {
        channelView.messagesDS.data([]);
        channelView.members = [];
        channelView.newMembers = [];
        channelView.memberList = [];
        channelView.membersDS.data([]);
        channelView.photosDS.data([]);
    },

   loadImagesThenScroll : function () {

        var $img = $("#messages-listview img"), n = $img.length;
        if (n > 0) {
            mobileNotify("Loading " + n + " Chat Images...");
            $img.on("load error", function () {
                if(--n === 0 ) {
                    setTimeout( function () {channelView.scrollToBottom();}, 500);
                }
            });
        } else {
            setTimeout( function () {channelView.scrollToBottom();}, 500);
        }

    },

    doTitleClick : function (e) {
        _preventDefault(e);

        if (channelView.isPrivateChat) {
            var contactUUID = channelView._channel.contactUUID;

            var contact = contactModel.findContact(contactUUID);

            contactActionView.openModal(contact.uuid);

        } else if (channelView.isPlaceChat) {
            var placeUUID = channelView._channel.placeUUID;

            var placeUrl = LZString.compressToEncodedURIComponent(placeUUID);

          //  channelView.onHide();
           // setTimeout( function () {APP.kendo.navigate('#placeView?place=' + placeUrl);}, 500);
            APP.kendo.navigate('#placeView?place=' + placeUrl + "&returnview=" + packParameter("channel?channelUUID="+channelView._channelUUID));
        }


    },

    onDone : function (e) {

        if (channelView._returnview === null) {
            //channelView.onHide();
            APP.kendo.navigate('#channels');
        } else {
            APP.kendo.navigate('#'+channelView._returnview);
        }
    },

    onShow : function (e) {
        //_preventDefault(e);

        var name = '';
        ux.hideKeyboard();

        $('#loadMoreMessages').addClass('hidden');
        /* if (window.navigator.simulator === undefined) {
            cordova.plugins.Keyboard.disableScroll(true); // false to enable again
        }
        */

        $("#messages-listview").data("kendoMobileListView").scroller().reset();
        channelView.topOffset = $("#messages-listview").data("kendoMobileListView").scroller().scrollTop;
        channelView._active = true;
        channelView._offersLoaded = false;
        channelView._titleTagActive = false;
        // hide action btn
        //ux.showActionBtn(false, "#channel");


        var channelUUID = e.view.params.channelUUID;
        // This isn't privateNote so handle as private or group channel
        var thisChannel = channelModel.findChannelModel(channelUUID);
        if (thisChannel === undefined || thisChannel === null) {
            mobileNotify("Oops -- chat doesn't exist : " + channelUUID);
            APP.kendo.navigate("#:back");
            return;
        }

        channelView._channelUUID = channelUUID;
        channelView._channel = thisChannel;
        channelView._channelName = thisChannel.name;

        notificationModel.updateUnreadNotification(channelView._channelUUID, channelView._channelName, 0);

        channelView.openEditor();
        channelView.toggleTitleTag();

        if (e.view.params.returnview !== undefined){
            channelView._returnview = unpackParameter(e.view.params.returnview);
        } else {
            channelView._returnview = null;
        }

        channelView._channelUUID = channelUUID;

        var thisUser = userModel._user;

        channelView.initDataSources();
        channelView.messageInit();
        channelView._initMessageTextArea();


        channelView._channel = thisChannel;

        if (thisChannel.isPlace !== undefined && thisChannel.isPlace === true) {
            channelView.isPlaceChat = true;
            $('#channel-titleBtn .icon-header').removeClass('hidden');
        } else {
            channelView.isPlaceChat = false;
            $('#channel-titleBtn .icon-header').addClass('hidden');
        }
        channelModel.zeroUnreadCount(thisChannel.channelUUID);

        name =  thisChannel.name;
        $("#channelName").text(name);

        channelView.members = thisChannel.members;

        var contactUUID = null;

        channelView.privacyMode = false;
        // Privacy UI
        $('#privacyMode').html('<img src="images/privacy-off.svg" />');
        $("#privacyStatus").addClass("hidden");

        $("#messageSend").html('<img src="images/icon-send.svg" class="icon-send" />');

        if (thisChannel.isEmergency === undefined) {
            thisChannel.isEmergency = false;
            channelView.isEmergencyChat = false;
        }

        if (thisChannel.isEmergency || thisChannel.isPrivate) {
            $('#messageAlertLi').removeClass('hidden');
        } else {
            $('#messageAlertLi').addClass('hidden');
        }

        if (thisChannel.isPrivate) {

            channelView.isPrivateChat = true;
            channelView.messageLock = true;
            channelView.setMessageLockIcon(channelView.messageLock);


          $('#messagePresenceButton').hide();


          var userKey = thisUser.publicKey, privateKey = thisUser.privateKey, name = thisUser.name;

          contactUUID = thisChannel.channelUUID;


          channelView.privateContactId = contactUUID;
          var thisContact = contactModel.findContact(contactUUID);
          if (thisContact === undefined) {
              mobileNotify("This member isn't a contact yet...");
              //Todo : don -- need to display the connect dialog here...
              APP.kendo.navigate('#:back');
              return;

              /*mobileNotify("ChannelView : creating Contact for Private Chat");
              contactModel.createChatContact(contactUUID, uuid.v4(), function (result) {
                  //Build the members datasource and quick access list
                  channelView.buildMemberDS();

                  // *** Private Channel ***
                  var contactKey = thisChannel.contactKey;
                  if (contactKey === undefined) {

                      contactKey = thisContact.publicKey;
                      if (contactKey === undefined) {
                          mobileNotify("No public key for " + thisChannel.name);
                          return;
                      }
                  }
                  // Update private Chat name using combination of contact's name and alias.

                  name =  ux.returnUXPrimaryName(thisContact.name, thisContact.alias);
                  $("#channelName").text(name);
                  // Show contact img in header

                  if (thisContact.identicon === undefined || thisContact.identicon === null) {
                      thisContact.identicon = contactModel.createIdenticon(thisContact.uuid);
                  }

                  var photoUrl = thisContact.identicon;
                  if (thisContact.photo !== null) {
                      photoUrl = thisContact.photo;
                  }
                  $('#channelImage').attr('src', photoUrl).removeClass("hidden");

                  privateChannel.open(thisUser.userUUID, thisUser.alias, name, contactUUID, contactKey, channelView.privateContact.name);
                  channelView.messagesDS.data([]);


                  privateChannel.getMessageHistory(function (messages) {

                      channelView.preprocessMessages(messages);

                      thisChannel.messagesArray = messages;

                      channelView.messagesDS.data(messages);

                      channelView.loadImagesThenScroll()
                  });

              });*/

          } else {
              channelView.privateContact = thisContact;

              //Build the members datasource and quick access list
              channelView.buildMemberDS();

              // *** Private Channel ***
              var contactKey = thisChannel.contactKey;
              if (contactKey === undefined) {

                  contactKey = thisContact.publicKey;
                  if (contactKey === undefined) {
                      mobileNotify("No public key for " + thisChannel.name);
                      return;
                  }
              }

              // Update private Chat name using combination of contact's name and alias.

              name = ux.returnUXPrimaryName(thisContact.name, thisContact.alias);
              $("#channelName").text(name);
              // Show contact img in header

              if (thisContact.identicon === undefined || thisContact.identicon === null) {
                  thisContact.identicon = contactModel.createIdenticon(thisContact.uuid);
              }

              var photoUrl = thisContact.identicon;
              if (thisContact.photo !== null) {
                  photoUrl = thisContact.photo;
              }
              $('#channelImage').attr('src', photoUrl).removeClass("hidden");

              privateChannel.open(thisUser.userUUID, thisUser.alias, name, contactUUID, contactKey, channelView.privateContact.name);
              channelView.messagesDS.data([]);


              privateChannel.getMessageHistory(function (messages) {

                  channelView.preprocessMessages(messages);

                  thisChannel.messagesArray = messages;

                  channelView.messagesDS.data(messages);

                  channelView.loadImagesThenScroll()
              });

          }
        } else {

            $("#channelName").text(name);

            channelView.isPrivateChat = false;

            channelView.messageLock = false;
            channelView.setMessageLockIcon(channelView.messageLock);

            // No current contact in group chats...
            channelView.privateContactId = null;
            channelView.privateContact = null;

            //Build the members datasource and quick access list
            channelView.buildMemberDS();
            //*** Group Channel ***
            $('#messagePresenceButton').show();
            // Provision a group channel

            // clear header img
            $('#channelImage').attr('src', '').addClass("hidden");

            groupChannel.open(channelUUID, thisChannel.name, thisUser.userUUID, thisUser.name, thisUser.alias, thisUser.phone);
            // channelView.contactData = channelView.buildContactArray(thisChannel.members);

            mobileNotify("Loading Messages...");
            channelView.messagesDS.data([]);
            channelView.recalledMessages = channelModel.getRecalledMessages(channelUUID);
            channelView.hasRecalled = false;

            if (channelView.recalledMessages.length > 0) {
                channelView.hasRecalled = true;
            }

        //    groupChannel.hereNow();
            groupChannel.getMessageHistory(function (messages) {
                var filteredMessages = [];

                if (groupChannel.moreMessages) {
                    $('#loadMoreMessages').removeClass('hidden');
                } else {
                    $('#loadMoreMessages').addClass('hidden');
                }
                for (var i=0; i<messages.length; i++) {
                    var message = messages[i];
                    if (channelView.hasRecalled) {
                        if (!channelView.isDuplicateMessage(message.msgID) && !channelModel.isMessageRecalled(message.msgID)) {
                            filteredMessages.push(message);
                        }
                    } else {
                        if (!channelView.isDuplicateMessage(message.msgID)) {
                            filteredMessages.push(message);
                        }
                    }

                }
                channelView.preprocessMessages(filteredMessages);
                channelView.messagesDS.data(filteredMessages);
                //channelView.updateMessageTimeStamps();

                channelView.loadImagesThenScroll();

            });

        }

        channelView.updateTimer = setInterval(function(){ channelView.updateTimeStamps();}, 60000);
    },

    preprocessMessages : function (messages) {
        // Process the derived message data on load so
        // 1) we don't recalc on each display
        // 2) kendo refresh just renders the data and doesn't re-execute functions...
        for (var i=0; i<messages.length; i++) {
            var message = messages[i];
            channelView.preprocessMessage(message);
        }
    },

    preprocessMessage : function (message) {
        var contactData = channelView.getContactData(message.sender, message);
        var sender = contactData.uuid;
        var name = contactData.name;
        var alias = contactData.alias;
        var contactPhotoUrl = contactData.photoUrl;
        if (message.sender === userModel._user.userUUID) {
            message.displayName = "Me";
        } else {
            message.displayName = ux.returnUXPrimaryName(name, alias);
        }

        //
        if (message.data.photos !== undefined && message.data.photos.length > 0 ) {
            var photos = message.data.photos;

            for (var i=0; i<photos.length; i++) {
                var photo = photos[i];

                var url = photo.imageUrl;
                if (url === null || !channelView.isAvailable(url)) {
                    photoModel.findCloudinaryPhoto(photo.photoUUID, function (result) {
                        if (result.found) {
                            var updatePhoto =  channelView.photos[result.photoId];
                            updatePhoto.imageUrl = result.url;
                            var channelPhotoUpdate = channelModel.findChannelPhoto(channelView._channelUUID, result.photoId);
                            if (channelPhotoUpdate !== null)
                                channelPhotoUpdate.set('imageUrl',result.url);

                        }
                    })
                }
                if (photo.photoUUID !== undefined && photo.photoUUID !== null) {
                    var photoItem = channelView.photos[photo.photoUUID];

                    var channelPhoto = channelModel.findChannelPhoto(channelView._channelUUID, photo.photoUUID);
                    if (photoItem === undefined) {
                        // Photo isn't in the channel cache
                          channelView.photos[photo.photoUUID] = photo;
                          channelView.photosDS.add(photo);
                    }
                    if (channelPhoto === null) {
                        var photoObj  = {
                            uuid: uuid.v4(),
                            photoUUID: photo.photoUUID,
                            channelUUID: channelView._channelUUID,
                            isPrivateChat: channelView.isPrivateChat,
                            thumbnailUrl: null,
                            imageUrl: photo.imageUrl,
                            canCopy: photo.canCopy,
                            isRecalled: false,
                            ownerUUID: photo.senderUUID,
                            ownerName: photo.senderName,
                            timestamp: ggTime.currentTime()
                        };

                        // Photos isn't in the the channel photo data source
                        channelModel.addPhoto(photoObj);

                    }

                }
            }
        }
    },

    updateTimeStamps: function () {
        $("#messages-listview").data("kendoMobileListView").refresh();
        $("#messages-listview").data("kendoMobileListView").scroller().reset();
        channelView.scrollToBottom();

    },

    onHide : function (e) {

        channelView._channelUUID = null;
        channelView._channel = null;
        channelView._active  = false;
        if (channelView.updateTimer !== undefined) {
            clearInterval(channelView.updateTimer);
            channelView.updateTimer = undefined;
        }

        channelView.initDataSources();
        channelView.messageInit();
        if (!channelView.isPrivateChat) {
            groupChannel.close();
        }
        channelView.closeEditor();


    },

    // find photo offer in the list of photo offers
    findPhoto : function (photoId) {

        var dataSource = channelView.photosDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter({ field: "photoUUID", operator: "eq", value: photoId });
        var view = dataSource.view();
        var photo = view[0];
        dataSource.filter(cacheFilter);

        return(photo);

    },

    // return the index of the photo in the datasource
    // -- required to set the page for gallery / scrollview
    getPhotoIndex : function (photoId) {

        var index = -1;
        var dataSource = channelView.photosDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter({ field: "photoUUID", operator: "eq", value: photoId });
        var view = dataSource.view();
        var photo = view[0];
        dataSource.filter(cacheFilter);

        if (photo !== undefined) {
            index = dataSource.indexOf(photo);
        }
        
        return(index);

    },


/*
    mapPhotoUrl : function (msgID, photo) {

        if (photo === undefined || photo.photoId === undefined) {
            return('images/missing-image.jpg');
        }
        var photoObj = photoModel.findPhotoById(photo.photoId);
        if (photoObj !== undefined) {
            // This is the senders photo  -- it's the in the gallery so just return the thumbnail
            return(photoObj.thumbnailUrl);
        } else {
            // This is a recieved photo -- need to look up current offer
            var offer = channelView.findPhotoOffer(photo.photoId);
            if (offer === undefined) {

            } else {
                return(photo.thumbnailUrl);
            }
            return('images/missing-image.jpg');
        }
    },*/

    // Quick access to contact data for display.
    getContactData : function (contactUUID, message) {
       /* var contact = {isContact: true};

       if (contactUUID === userModel._user.userUUID) {
           contact.isContact = false;
           contact.contactUUID = userModel._user.userUUID;
           contact.uuid = null;
           contact.alias = userModel._user.alias;
           contact.name = userModel._user.name;
           contact.photoUrl = userModel._user.photo;
           if (contact.photoUrl === undefined || contact.photoUrl === null || contact.photoUrl === '') {
               contact.photoUrl = userModel.identiconUrl;
           }
           contact.publicKey = userModel._user.publicKey;
           contact.isPresent = true;

           return (contact);
       }

        var data = contactModel.findContact(contactUUID);

        if (data === undefined) {
            contact.contactUUID = contactUUID;
            contact.alias = null;
            contact.name = message.senderName;
            contact.uuid = uuid.v4();
            contact.photoUrl = contactModel.createIdenticon(contact.contactId);

            channelView.membersDS.add(contact);
            channelView.membersDS.sync();

            if (channelView.memberList[contactUUID] === undefined) {
                channelView.memberList[contactUUID] = contact;
                mobileNotify("New Chat Member - Looking Up Info...");
                contactModel.createChatContact(uuid, contact.contactUUID, function (contactIn) {
                    if (contactIn !== null) {
                        mobileNotify(contactIn.name + " Added -- Refreshing Chat...");
                        var updateContact =  channelView.memberList[contactIn.contactUUID];
                        updateContact.name = contactIn.name;
                        updateContact.alias = contactIn.alias;
                        $("#messages-listview").data("kendoMobileListView").refresh();                    }
                   
                });
            }

        } else {
            contact.contactUUID = data.contactUUID;
            contact.uuid = data.uuid;
            contact.alias = data.alias;
            contact.name = data.name;
            contact.photoUrl = data.identicon;
            if (data.photo !== null) {
                contact.photoUrl = contact.photo;
            }
        }
*/

        var contact = channelView.memberList[contactUUID];
        
        if (contact === undefined) {
            contact = {isContact: true};
            contact.name = message.senderName;
            contact.contactUUID = contactUUID;
            contact.uuid = uuid.v4();
            contact.photoUrl = contactModel.createIdenticon(contactUUID);
        }

        return(contact);
    },

    getContactPhotoUrl : function (contactUUID) {
        var contact = channelView.memberList[contactUUID];
        if (contact === undefined) {
           ggError("Contact Undefined!!!");
            debugger;
        }
        var photoUrl = null;
        if (contact !== undefined) {
            photoUrl = contact.photo;
            if (photoUrl === null) {
                photoUrl = contact.identicon;
            }
        }
        return (photoUrl);
    },

    //build a cache of photos indexed by photoId
    buildPhotoList : function () {

        channelView.photos = [];
        channelView._currentPhoto = 0;
        var photos = channelModel.getChannelPhotos(channelView._channelUUID);

        channelView.photosDS.data(photos);
        for (var i=0; i<photos.length; i++) {
            channelView.photos[photos[i].photoId] = photos[i];
        }
    },


    // Build a member list for this channel
    buildMemberDS : function () {

       channelView.memberList = [];
       channelView.membersDS.data([]);

        var contactArray = channelView.members;

        if (contactArray === undefined || contactArray === null)
            return;

        var userId = userModel._user.userUUID;


        for (var i=0; i< contactArray.length; i++) {
            var contact = {};

            var contactIndex = contactArray[i];

            if (contactIndex === userId) {
                // This is our user
                contact.isContact = false;
                contact.uuid = null;    // The user isn't in the contactList
                contact.contactUUID = userId;
                contact.alias = userModel._user.alias;
                contact.name = userModel._user.name;
                contact.photo = userModel._user.photo;
                contact.identicon = userModel.identiconUrl;
                contact.publicKey = userModel._user.publicKey;
                contact.isPresent = true;
                contact.isNew = false;

            } else {
                // Not our user - must be a contact
                var thisContact = contactModel.findContact(contactArray[i]);

                if (thisContact === undefined) {
                    // No contact entry for this contact...
                    // Need to create a contact and then add to channels member list
                    contact.isContact = true;
                    contact.uuid = uuid.v4();
                    contact.contactUUID = contactIndex;
                    contact.alias = "New";
                    contact.name = "New Contact...";
                    contact.identicon = contactModel.createIdenticon(contact.uuid);
                    contact.photo =  contact.identicon;
                    contact.publicKey = null;
                    contact.isPresent = false;
                    contact.isNew = true;
                    contactModel.createChatContact(contactIndex, 'Anonymous...', contact.uuid,  function (newContact) {

                    });
                } else {
                    // Found a matching contact
                    contact.isContact = true;
                    contact.uuid = thisContact.uuid;
                    contact.contactUUID = thisContact.contactUUID;
                    contact.alias = thisContact.alias;
                    contact.name = thisContact.name;
                    contact.photo = thisContact.photo;
                    contact.isNew = false;
                    if (thisContact.identicon === null) {
                        thisContact.identicon = contactModel.createIdenticon(thisContact.uuid);
                    }
                    if (thisContact.photo === null) {
                        contact.photo = thisContact.identicon;
                    }
                    contact.publicKey = thisContact.publicKey;
                    contact.isPresent = false;
                }

                if (contact.contactUUID !== null && !channelView.isMember(contact.contactUUID)) {
                    channelView.membersDS.add(contact);
                    channelView.membersDS.sync();
                }
            }

            channelView.memberList[contactIndex] = contact;

           
        }
    },

    getUserType: function (uuid) {
        var userType = { isContact: true, alias : '', profileUrl: ''};

    },

    formatName : function (name) {
        if (name.length < 16) {
            return(name);
        } else {
            return(name.substring(0,13) + "...");
        }
    },

    archiveMessage : function (e) {
        _preventDefault(e);

        mobileNotify("Archive is under development...");
      /*  // close out li
        $(".selectedLI").velocity("slideUp", {delay: 150});

        //mobileNotify("message archived");
        var message = channelView.currentMessage;

        // ToDo - wire up archive
        if (message === null) {
            mobileNotify("No active message!!!");
           // askRequestModal.close();
        }

        var contact = contactModel.findContact(message.sender);

        var contactName = contact.name + " (" + contact.alias + ")";
        $('#askRequest-contactName').text(contactName);

        // ToDo - wire up requests
        //APP.kendo.navigate("#modalview-requestContent");
        $("#modalview-requestContent").data("kendoMobileModalView").open();*/
    },

    findChatMember: function (contactUUID) {
        var dataSource = channelView.membersDS;
        var queryCache = dataSource.filter();
        if (queryCache === undefined)
            queryCache = {};
        dataSource.filter( { field: "contactUUID", operator: "eq", value: contactUUID });
        var view = dataSource.view();
        var contact = view[0];
        dataSource.filter(queryCache);

        return(contact);
    },

    onChannelPresence : function () {
        //var users = currentChannelModel.handler.listUsers();

    },

    setPresence: function (userId, isPresent) {
        // Don't set presence for the current user -- they already know they're in the channel
        if (userId === userModel._user.userUUID || channelView.isPrivateChat) {
            return;
        }

        channelView.setMemberPresence(userId, isPresent);
    },

    setMemberPresence : function (memberId, isPresent) {

       var member = channelView.findChatMember(memberId);

        if (member !== undefined) {
            member.set('isPresent', isPresent);
        }

    },

    updatePresence : function (members, occupancyCount) {

      //  $('#occupancyCount').text(occupancyCount + 1);

        var length = Object.keys(members).length;

        if (length === 0)
            return;

        for (var member in members) {
            var userId = member.username;

            if (userId !== userModel._user.userUUID) {
                var member = channelView.findChatMember(userId);
                if (member === undefined || member === null) {
                    channelView.setPresence(userId, true);
                }
            }

        }

    },



    activateEditor : function () {

        $("#messageComposeToolbar").removeClass('hidden');
        $("#chat-editorBtnImg").attr("src","images/icon-editor-active.svg");

    },

    deactivateEditor : function () {

        $("#messageComposeToolbar").addClass('hidden');
        $("#chat-editorBtnImg").attr("src","images/icon-editor.svg");
    },

    toggleTitleTag : function () {

        if (channelView._titleTagActive)
            $('#messageComposeTitleTag').removeClass('hidden');
        else
            $('#messageComposeTitleTag').addClass('hidden');
    },

    messageTitleTag : function (e) {
        _preventDefault(e);

        channelView._titleTagActive = !channelView._titleTagActive;
        channelView.toggleTitleTag();
    },

    ghostgram: function (e) {
        _preventDefault(e);
        channelView.ghostgramActive = !channelView.ghostgramActive;
        if (channelView.ghostgramActive){
          channelView.activateEditor();

        } else {
            channelView.deactivateEditor();
        }
    },

    messageInit : function () {
        channelView.activeMessage = {canCopy: !channelView.messageLock, photos: [], objects: []};
        channelView.messagePhotos = [];
        channelView.messageObjects = [];
        photoModel.initOffer();

    },

    messageAddLocation : function  () {
        channelView.activeMessage.geo= {lat: mapModel.lat, lng: mapModel.lng};
        channelView.activeMessage.address = mapModel.currentAddress;
        if (userModel._user.currentPlaceUUID !== null) {
            channelView.activeMessage.place = {name: userModel._user.currentPlace, uuid: userModel._user.currentPlaceUUID};
        }
    },


    messageAddSmartEvent : function (smartObj) {
        smartObj.channelUUID = channelView._channelUUID;

        smartEvent.smartAddEvent(smartObj);

        channelView.messageObjects.push(smartObj);

    },

    messageAddSmartMovie : function (smartObj) {
        smartObj.channelUUID = channelView._channelUUID;

        smartMovie.smartAddMovie(smartObj);

        channelView.messageObjects.push(smartObj);

    },

    isAvailable : function (url) {
        if (url === undefined || url === null) {
            return (false);
        }
        if (url.indexOf('cloudinary') !== -1) {
            return (true);
        }
        return (false);
    },

    messageAddSharedPhoto : function (photoId, shareId, canCopy) {

        var photo = photoModel.findPhotoById(photoId);

        if (photo === undefined) {
            ggError("Can't find this photo !!!");
            return;
        }

        var photoObj  = {
            uuid: shareId,
            photoUUID: photoId,
            channelUUID: channelView._channelUUID,
            thumbnailUrl: null,
            imageUrl: null,
            canCopy: canCopy,
            isPrivateChat: channelView.isPrivateChat,
            isRecalled: false,
            ownerUUID: photo.senderUUID,
            ownerName: photo.senderName,
            timestamp: ggTime.currentTime()
        };

        if (channelView.isAvailable(photo.thumbnailUrl))
            photoObj.thumbnailUrl = photo.thumbnailUrl;

        if (channelView.isAvailable(photo.imageUrl))
            photoObj.imageUrl = photo.imageUrl;

        // Add the photo to the current message
        channelView.activeMessage.photos.push(photoObj);

        //Push the photo to the channel photo cache
        channelView.photos[photoObj.photoUUID] = photoObj;

        // Push the photo to the channel photo store
        channelModel.addPhoto(photoObj);
        
        // Add the photo to users shared photo list
        sharedPhotoModel.addSharedPhoto(shareId, photoObj.photoUUID, photoObj.channelUUID, canCopy);

  
    },

    messageAddRichText : function (text) {
        channelView.activeMessage.html = text;
    },


    messageSend : function (e) {
        _preventDefault(e);
        var validMessage = false; // If message is valid, send is enabled
        channelView.activeMessage = {canCopy: !channelView.messageLock, photos: [], objects: []};


        //var text = $('#messageTextArea').val();
        //var text = $('#messageTextArea').data("kendoEditor").value();
        var text = $('#messageTextArea').redactor('code.get');

        if (text.length > 0) {
            var newText = emojione.toImage(text);
            text = newText;
        }

        $('#messageTextArea').redactor('code.set', text);


        if (text.length > 0) {
            validMessage = true;
        }

        channelView.messageAddLocation();

        // Are there any photos in the current message
        if (channelView.messagePhotos.length > 0) {
            validMessage = true;

            //Need to make sure the user didn't delete the photo reference in the html...
            channelView.validateMessagePhotos();
        }

        if (channelView.messageObjects.length > 0) {
            validMessage = true;

            var smartObject = channelView.messageObjects[0];
            if (smartObject.ggType === 'Event') {
                text = channelView.addSmartEventToMessage(smartObject, text);
            } else if (smartObject.ggType === 'Movie') {
                text = channelView.addSmartMovieToMessage(smartObject, text);
            } else if (smartObject.ggType === 'Place') {
                text = channelView.addSmartPlaceToMessage(smartObject, text);
            } else if (smartObject.ggType === 'Trip') {
                text = channelView.addSmartTripToMessage(smartObject, text);
            } else if (smartObject.ggType === 'Flight') {
                text = channelView.addSmartFlightToMessage(smartObject, text);
            }

        }

        if (validMessage === true ) {
            channelView._initMessageTextArea();

           if (channelView.isPrivateChat) {
                privateChannel.sendMessage(channelView.privateContactId, text, channelView.activeMessage, 86400);
            } else {
                groupChannel.sendMessage(text, channelView.activeMessage, 86400);
            }
            channelView.messageInit();
        }

    },

    // Parse message text to make user didn't delete object anchor in text
  /*  validateMessageObjects : function () {
        var validObject = [];
        //var messageText = $('#messageTextArea').data("kendoEditor").value();
        var messageText = $('#messageTextArea').redactor('code.get');

        for (var i=0; i< channelView.messageObjects.length; i++) {
            var objectId = channelView.messageObjects[i].uuid;

            if (messageText.indexOf(objectId) !== -1) {

                channelView.messageAddSmartObject(channelView.messageObjects[i]);
                //the photoId is in the current message text
               // channelView.messageAddPhotoOffer(photoId, !channelView.messageLock);
            }
        }
    },*/

    // Need to make sure all the photos in activeMessage.photos still exist in the editor
    validateMessagePhotos : function () {
        var validPhotos = [];
       // var messageText = $('#messageTextArea').data("kendoEditor").value();
        var messageText = $('#messageTextArea').redactor('code.get');

        for (var i=0; i< channelView.messagePhotos.length; i++) {
            var photoId = channelView.messagePhotos[i].photoUUID, shareId = channelView.messagePhotos[i].shareUUID;

            // Set the src attribute to null
           $('#chatphoto_' + shareId).attr('src', null);

            if (messageText.indexOf(photoId) !== -1) {
                //the photoId is in the current message text
                channelView.messageAddSharedPhoto(photoId, shareId, !channelView.messageLock);
            }
        }

    },

    _checkMessageTextFocus: function () {
        var focused = $('#messageTextArea').redactor('focus.is');
        if (!focused) {
           // $('#messageTextArea').focus();
            $('#messageTextArea').redactor('focus.start');
        }

    },

     _initMessageTextArea : function () {

         $('#messageTextArea').val('');
         $('#messageTextArea').redactor('code.set', "");

        if (channelView.ghostgramActive) {
            channelView.ghostgramActive = false;
            channelView.deactivateEditor();
        }

         ux.hideKeyboard();
    },


    // Handle a click on a smart object
    onObjectClick : function (e) {
        _preventDefault(e);
        var uuid = e.sender.element[0].attributes['data-objectid'].value, id = e.sender.element[0].id;
        var chatmessage = $('#'+id).closest('.chat-message');
        var messageId = chatmessage[0].attributes.id.value;

        if (messageId === null) {
            mobileNotify("Sender deleted this IntelliObject!");
            return;
        }

        var message = channelView.findMessageById(messageId);

        if (message !== undefined) {

            if (message.data.objects !== undefined && message.data.objects.length > 0) {
                var objectList = message.data.objects,object = null;

                for (var i=0; i<objectList.length; i++ ) {
                    if (objectList[i].uuid === uuid) {
                        object = objectList[i];
                    }
                }

                if (object !== null) {
                    // User is interacting with the object so add it, if it doesn't already exist
                    if (object.ggType === 'Event') {
                        smartEvent.smartAddEvent(object);
                        smartEventView.openModal(object);
                    } else if (object.ggType === 'Movie') {
                        smartMovie.smartAddMovie(object);
                        smartMovieView.openModal(object);
                    } else if (object.ggType === 'Place') {
                        var locObj = {placeId: null, lat: object.lat, lng: object.lng, title: "IntelliPlace", name: null,  targetName: object.name};
                        mapViewModal.openModal(locObj, function () {

                        });
                    } else if (object.ggType === "Trip") {
                        smartTripView.openModal(object, function () {

                        });

                    } else if (object.ggType === "Flight") {
                        smartFlightView.openModal(object, function () {

                        });
                    }

                }

            } else {
                mobileNotify("Sender deleted this Smart Event!");
            }
        }

    },

    addSmartEventToMessage: function (smartEvent, message) {

      //  var editor = $("#messageTextArea").data("kendoEditor");
        var date = moment(smartEvent.date).format("ddd MMM Do YYYY h:mm A"), objectId = smartEvent.uuid;

        /*var dateStr = moment(date).format('ddd MMM Do');
        var localTime = moment(date).format("LT");*/

        var placeName = smartEvent.placeName;
        if(placeName === null){
            placeName = "";
        }


        var template = kendo.template($("#intelliEvent-chat").html());
        var dataObj = {
            ggType: "Event",
            title : smartEvent.title,
            date : date,
            placeName: placeName,
            objectId : objectId
        };


       var objectUrl = template(dataObj);

        var fullMessage = message + objectUrl;

        channelView.activeMessage.objects.push(smartEvent);

        return (fullMessage);

    },

    addSmartMovieToMessage: function (smartMovie, message) {

        //  var editor = $("#messageTextArea").data("kendoEditor");
        var date = smartMovie.showtime, objectId = smartMovie.uuid;

        var dateStr = moment(date).format('ddd MMM Do YYYY h:mm A');


        var template = kendo.template($("#intelliMovie-chat").html());
        var dataObj = {
            ggType: "Movie",
            imageUrl: smartMovie.imageUrl,
            movieTitle : smartMovie.movieTitle,
            dateStr : dateStr,
            theatreName: smartMovie.theatreName,
            objectId : objectId,
            rating: smartMovie.rating,
            runtime: smartMovie.runtime
        };

        var objectUrl = template(dataObj);

        var fullMessage = message + objectUrl;

        channelView.activeMessage.objects.push(smartMovie);

        return (fullMessage);

    },


    addSmartPlaceToMessage: function (smartPlace, message) {

        //  var editor = $("#messageTextArea").data("kendoEditor");
        var  objectId = smartPlace.uuid;



       /* var objectUrl = '<div><span class="btnSmart-place" data-role="button" data-objectid="' + objectId +
            '" id="placeobject_' + objectId + '"'+
            'data-click="channelView.onObjectClick" >' +
            '<div class="btnSmart-content">' +
            '<p class="btnSmart-title">' + smartPlace.name + ' </p> ' +
            '<p class="btnSmart-date textClamp">' + smartPlace.address + '</p> ' +
            '</div>' +
            '</span></div>';
*/

        var template = kendo.template($("#intelliPlace-chat").html());
        var dataObj = {
            ggType : "Place",
            name: smartPlace.name,
            address: smartPlace.address,
            objectId : objectId
        };

        var objectUrl = template(dataObj);
        var fullMessage = message + objectUrl;

        channelView.activeMessage.objects.push(smartPlace);

        return (fullMessage);

    },


    addSmartTripToMessage: function (smartTrip, message) {
        var  objectId = smartTrip.uuid;

        var template = kendo.template($("#intelliTrip-chat").html());

        var dest = smartTrip.destination.address;
        var orig = smartTrip.origin.address;


        if (smartTrip.destination.name !== null) {
            dest = smartTrip.destination.name;
        }

        if (smartTrip.origin.name !== null) {
            orig = smartTrip.origin.name;
        }

        var dataObj = {
            ggType: "Trip",
            name: smartTrip.name,
            origin: orig,
            destination: dest,
            departure: moment(smartTrip.departure).format ("ddd, MMM Do, YYYY @ h:mm a"),
            arrival: moment(smartTrip.arrival).format ("ddd, MMM Do, YYYY @ h:mm a"),
            durationString: smartTrip.durationString,
            distanceString: smartTrip.distanceString,
            objectId : objectId
        };

        var objectUrl = template(dataObj);
        var fullMessage = message + objectUrl;

        channelView.activeMessage.objects.push(smartTrip);

        return (fullMessage);

    },


    addSmartFlightToMessage: function (smartFlight, message) {
        var  objectId = smartFlight.uuid;

        var template = kendo.template($("#intelliFlight-chat").html());
        var dataObj = {
            ggType : "Flight",
            objectId : objectId,
            name: smartFlight.name,
            departureAirport : smartFlight.departureAirport,
            departureCity : smartFlight.departureCity,
            arrivalAirport : smartFlight.arrivalAirport,
            arrivalCity : smartFlight.arrivalCity,
            estimatedDeparture : smartFlight.estimatedDeparture,
            estimatedArrival : smartFlight.estimatedArrival,
            durationString : smartFlight.durationString

        };

        var objectUrl = template(dataObj);
        var fullMessage = message + objectUrl;

        channelView.activeMessage.objects.push(smartFlight);

        return (fullMessage);

    },

    resolveChatPhoto : function (message) {
        // Resolve the photo in the chat: 1) is it uploaded yet? 2) is it recalled?
        var photoId = null, shareId = null, url = null;

        shareId = message.id.replace('chatphoto_', '');
        photoId = message.attributes['data-photoid'].value;
        if (channelModel.isPhotoRecalled(photoId, channelView._channelUUID)) {
            return (null);
        }

        if (photoId !== undefined && photoId !== null) {
            var photo = channelView.photos[photoId];

            if (photo !== undefined)
                url = photo.imageUrl;
        }

        return(url);

    },

    addImageToMessage: function (photoId, displayUrl) {

      //  var editor = $("#messageTextArea").data("kendoEditor");
        var photoObj = photoModel.findPhotoById(photoId);

       
        if (photoObj !== undefined) {
            var shareUUID = uuid.v4(), shareObj = {photoUUID : photoId, shareUUID: shareUUID};
            var thumbUrl = photoObj.thumbnailUrl;
            if (thumbUrl === null) {
                thumbUrl = "images/missing-image.jpg";
            }

            var imgUrl = '<img src="images/icon-lock-photo.svg" class="photo-chat-lock"/>' +
                '<img class="photo-chat" alt="Processing Photo...." data-photoid="'+ photoId + '" id="chatphoto_' + shareUUID + '" src="'+ displayUrl + '"' +
               +  'onload="this.onload=null; this.src=channelView.resolveChatPhoto(this);"' +  ' onerror="this.onerror = null; this.src=channelView.resolveChatPhoto(this);" />';

            $('#messageTextArea').redactor('insert.node', $('<div />').html(imgUrl));
           /* editor.paste(imgUrl);
            editor.update();*/

            channelView.messagePhotos.push(shareObj);
        }

      

       /* $('#chatImage').attr('src', displayUrl);
        $('#chatImagePreview').show();*/
    },

    togglePrivacyMode :function (e) {
        _preventDefault(e);
        channelView.privacyMode = ! channelView.privacyMode;
        if (channelView.privacyMode) {
            $('#privacyMode').html('<img src="images/privacy-on.svg" />');
            $( ".chat-message" ).addClass('privateMode').removeClass('publicMode');
            $("#privacyStatus").removeClass("hidden");
            kendo.fx($("#privacyStatus")).expand("vertical").play();
        } else {
            $('#privacyMode').html('<img src="images/privacy-off.svg" />');
            $( ".chat-message" ).removeClass('privateMode').addClass('publicMode');
            $("#privacyStatus").addClass("hidden");
        }

    },

    scrollToBottom : function () {
    // topOffset set when the view loads like the following
        var topOffset = channelView.topOffset;

        if (topOffset === undefined)
            topOffset = APP.kendo.scroller().scrollTop;

        var position = 0;
        var scrollerHeight =  APP.kendo.scroller().scrollHeight();
        var viewportHeight =  APP.kendo.scroller().height();

        if (scrollerHeight > viewportHeight) {
             position = -1 * (scrollerHeight - viewportHeight - topOffset);
           	// APP.kendo.scroller().animatedScrollTo(0, position);
        } //else {
        	APP.kendo.scroller().scrollTo(0, position);
       // }

    },

    updateMessageTimeStamps : function () {
        var dataSource = channelView.messagesDS, length = dataSource.total();
        var formattedTime = '';

        for (var i=0; i<length; i++) {
            var msg = dataSource.at(i);
            formattedTime = timeSince(msg.time);
            if(formattedTime === "0 seconds"){
                formattedTime = "Just now";
            } else {
                formattedTime = formattedTime + " ago"
            }
            msg.set('formattedTime', formattedTime);
        }

    },


    tapChannel : function (e) {
        e.preventDefault();

        var $target = $(e.touch.initialTouch);
        var dataSource = channelView.messagesDS;
        var messageId = null;
        var objectType = null;

        // User has clicked in message area, so hide the keyboard
        ux.hideKeyboard();

        if (e.touch.currentTarget !== undefined) {
            // Legacy IOS
            messageId =  $(e.touch.currentTarget).data("uid");

        } else {
            // New Android
            messageId =   e.touch.target[0].attributes['data-uid'].value;

        }

        if (messageId === undefined || messageId === null) {
            mobileNotify("No message content to display...");
        }

        var message = dataSource.getByUid(messageId);

        if (message.data.objects.length > 0) {
            var object = message.data.objects[0];
            var objType = object.ggType;

            if (objType !== undefined && objType !== null) {
                if (object.ggType === 'Event') {
                    smartEvent.smartAddEvent(object);
                    smartEventView.openModal(object);
                } else if (object.ggType === 'Movie') {
                    smartMovie.smartAddMovie(object);
                    smartMovieView.openModal(object);
                } else if (object.ggType === 'Place') {
                    var locObj = {placeId: null, lat: object.lat, lng: object.lng, title: "IntelliPlace", name: null,  targetName: object.name};
                    mapViewModal.openModal(locObj, function () {

                    });
                } else if (object.ggType === "Trip") {

                    smartTripView.openModal(object, function () {

                    });

                } else if (object.ggType === "Flight") {
                    smartFlightView.openModal(object, function () {

                    });
                }
            }


        }


        // User actually clicked on the photo so show the open the photo viewer
        if ($target.hasClass('photo-chat')) {

        	var photoId = $target.attr('data-photoId');

            // todo Don - review photos source
            if (message.data !== undefined && message.data.photos !== undefined) {
                var photoList = message.data.photos;

                for (var i=0; i< photoList.length; i++) {
                    var photoObj = photoList[i];

                    if (photoObj.photoUUID === photoId) {
                        var galleryMode = true;
                        modalChatPhotoView.openModal(photoObj, galleryMode);
                        return;
                    }
                }
            }


          /*  var photoUrl = message.data.photo.photo;
            $('#modalPhotoViewImage').attr('src', photoUrl);*/

        }

        if (channelView.privacyMode) {
            $('#'+message.msgID).removeClass('privateMode');
            $.when(kendo.fx($("#"+message.msgID)).fade("out").endValue(0.3).duration(3000).play()).then(function () {
                $("#"+message.msgID).css("opacity", "1.0");
                $("#"+message.msgID).addClass('privateMode');
            });
        }
    },

    swipeChannel : function (e) {
        e.preventDefault();
        var dataSource = channelView.messagesDS;
        var messageUID = $(e.touch.currentTarget).data("uid");
        var message = dataSource.getByUid(messageUID);

        if (channelView.privacyMode) {
            $('#'+message.msgID).removeClass('privateMode');
        }

        var selection = e.sender.events.currentTarget;
        var selectionListItem = $(selection).closest("div");
        var selectionInnerDiv = $(selectionListItem);

        if (channelView.privacyMode) {
            $('#'+message.msgID).removeClass('privateMode');
        }

        if(e.direction === "left"){
            var otherOpenedLi = $(".message-active");
            $(otherOpenedLi).velocity({translateX:"0"},{duration: "fast"}).removeClass("message-active");

            if($(window).width() < 375){
                $(selectionInnerDiv).velocity({translateX:"-80%"},{duration: "fast"}).addClass("message-active");
            } else {
                $(selectionInnerDiv).velocity({translateX:"-70%"},{duration: "fast"}).addClass("message-active");
            }


        }
        
        if (e.direction === 'right' && $(selection).hasClass("message-active") ) {

            $(selection).velocity({translateX:"0"},{duration: "fast"}).removeClass("message-active");
        }

    },

    holdChannel : function (e) {
        e.preventDefault();
        var dataSource = channelView.messagesDS;
        var messageUID = $(e.touch.currentTarget).data("uid");
        var message = dataSource.getByUid(messageUID);
        channelView.activeMessage = message;

        if (channelView.privacyMode) {
            $('#'+message.msgID).removeClass('privateMode');
            $.when(kendo.fx($("#"+message.msgID)).fade("out").endValue(0.3).duration(3000).play()).then(function () {
                $("#"+message.msgID).css("opacity", "1.0");
                $("#"+message.msgID).addClass('privateMode');
            });
        }

        if (message.sender === userModel._user.userUUID) {
            $("#messageActionsSender").data("kendoMobileActionSheet").open();
        } else {
            if (message.data.canCopy) {
                $("#messageActions").data("kendoMobileActionSheet").open();

            } else {
                mobileNotify("This Message was locked by Sender");
            }

        }

    },


    // Process a tag recognized by the editor
    processTag : function (tagString) {
        var tagTokens = tagString.split(' ');

        var tagList = smartEvent.findTerm(tagTokens[0]);
        if (tagList !== undefined) {
            switch (tagList[0].category) {

                case 'photo' :
                    channelView.processPhotoTag(tagTokens);
                    break;
                case 'action' :
                    channelView.processActionTag(tagTokens, tagList);
                    break;
                case 'calendar' :
                    channelView.processCalendarTag(tagTokens, tagList);
                    break;

            }
        }

    },

    processPhotoTag : function (tagArray, tagList) {

        var photoTag = tagArray[0].toLowerCase();

        switch (tagArray[0]) {
            case  'title' :
                    var titleArray = tagArray.shift(), titleString = titleArray.join(' ');
                break;

            case  'description' :
                var descArray = tagArray.shift(), descString = descArray.join(' ');
                break;

            case  'tags' :
                var tagArray = tagArray.shift(), tagString = tagArray.join(' ');
                break;

        }

    },

    processActionTag : function (tagArray, tagList) {
        var actionTag = tagArray[0].toLowerCase();
        switch (tagList[0].type) {
            case 'activity':
                break;
            case 'meeting':
                break;
            case 'flight' :
                break;
            case 'event' :
                break;
            case 'datejs' :
                break;
            case 'day' :
                break;
            case 'month' :
                break;
            case 'movie' :
                break;
            case 'movies' :
                break;
            case 'time' :
                break;
            case 'tvshow' :
                break;
            case 'tvmovie' :
                break;

        }

    },

    processCalendarTag : function (tagArray, tagList) {
        var calendarTag = tagArray[0].toLowerCase();
        var regexTime = /^([0]\d|[1][0-2]):([0-5]\d)\s?(?:AM|PM)$/i;



    },


    messageRecall: function (e) {
        _preventDefault(e);
        var message = channelView.activeMessage;
        var memberList = channelView.memberList, members = Object.keys(memberList);
        var thisUser = userModel._user.userUUID;

        var recallMessage = channelView.findMessageById(message.msgID);
        if (recallMessage !== undefined) {

            for (var i=0; i< members.length; i++) {
                var member = members[i];

                if (member !== thisUser)
                    appDataChannel.recallMessage(member, channelView._channelUUID, message.msgID, thisUser, channelView.isPrivateChat);

            }

            mobileNotify("Recalling message " + message.msgID);
            // Add the recall Message for this user (as the message is still in the respective channel
            // until it ages out...
            channelModel.addMessageRecall(channelView._channelUUID, message.msgID, thisUser,  channelView.isPrivateChat)

        }



    },

    setMessageLockIcon : function (locked) {
        if (locked) {
            $('#messageLockButtonIcon').attr('src', 'images/icon-lock.svg');
        } else {
            $('#messageLockButtonIcon').attr('src', 'images/icon-unlock.svg');
        }
    },

    messageLockButton : function (e) {
        e.preventDefault();
        channelView.messageLock = !channelView.messageLock;
        channelView.setMessageLockIcon(channelView.messageLock);
    },


   getSelectionText: function (event){
        var selectedText = "";
        if (window.getSelection){ // all modern browsers and IE9+
            selectedText = window.getSelection().toString();
        }
        return selectedText;
    },

    messageSearchLoad : function (event) {
		channelView.searchUrl =  event.url;
    },

    messageSearchError : function (event) {
		mobileNotify('error: ' + event.message);
    },

    messageSearchEnd : function (event) {
        var exitUrl = event.url;

        if (channelView.winRef !== undefined && channelView.winRef !== null) {
            channelView.winRef.removeEventListener("loadstop", channelView.messageSearchLoad);
            channelView.winRef.removeEventListener("exit", channelView.messageSearchEnd);
            channelView.winRef = null;
        }

    },

    messageSearch : function (e) {
        _preventDefault(e);


        var searchUrl =  'http://www.google.com/search';
        var query = channelView.getSelectionText();

        if (query !== '') {
            searchUrl += '?q='+query;
        }
        channelView.searchUrl = searchUrl;
        channelView.winQuery = '?q='+query;
        channelView.winRef =  window.open(encodeURI(searchUrl), '_blank', 'location=yes');
        channelView.winRef.addEventListener("exit", channelView.messageSearchEnd);
        channelView.winRef.addEventListener("loadstop", channelView.messageSearchLoad);
        /* channelView.winRef.addEventListener('loaderror', channelView.messageSearchError); */


    },

    messageAlert : function (e) {
        _preventDefault(e);

        smartAlertView.openModal(channelView._channelUUID, channelView._channelName, function(alert) {
            if (alert !== undefined && alert !== null) {

            }
        });

    },

    messageCamera : function (e) {
       _preventDefault(e);

        devicePhoto.deviceCamera(
            devicePhoto._resolution, // max resolution in pixels
            75,  // quality: 1-99.
            true,  // isChat -- generate thumbnails and autostore in gallery.  photos imported in gallery are treated like chat photos
            channelView._channelUUID,  // Current channel Id for offers
            channelView.addImageToMessage  // Optional preview callback
        );
    },

    messagePhoto : function (e) {
        _preventDefault(e);
        // Call the device gallery function to get a photo and get it scaled to gg resolution
        devicePhoto.deviceGallery(
            devicePhoto._resolution, // max resolution in pixels
            75,  // quality: 1-99.
            true,  // isChat -- generate thumbnails and autostore in gallery.  photos imported in gallery are treated like chat photos
            channelView._channelUUID,  // Current channel Id for offers
            channelView.addImageToMessage  // Optional preview callback
        );
    },

     messageGallery : function (e) {
        _preventDefault(e);

         galleryPicker.openModal(function (photo) {

            // photoModel.addPhotoOffer(photo.photoId, channelView._channelUUID,  photo.thumbnailUrl, photo.imageUrl, true);

             var url = photo.thumbnailUrl;
             if (photo.imageUrl !== undefined && photo.imageUrl !== null)
                url = photo.imageUrl;

             channelView.addImageToMessage(photo.photoId, url);
         });
      //  APP.kendo.navigate("views/gallery.html#gallery?mode=picker");

    },

    messageAudio : function(e) {
        _preventDefault(e);
        navigator.device.capture.captureAudio(
            function (mediaFiles) {
                var mediaUrl = mediaFiles[0].fullPath;
            },
            function(error) {
                mobileNotify("Audio capture error " + JSON.stringify(error));
            },
            {limit:1, duration: 5}
        );
    },



    messageMenuTag : function (e) {

        // Get the current insertion point

        var isSelected = $('#messageTextArea').redactor('selection.is');

        if (!isSelected) {
            // Nothing is selected
            channelView._tagStart = $('#messageTextArea').redactor('offset.get');
            channelView._tagEnd = channelView._tagStart;
        } else {
            var selection = $('#messageTextArea').redactor('selection.save');
            var range = $('#messageTextArea').redactor('selection.range', selection);

            channelView._tagRange = range;
            channelView._tagStart = range.startOffset;
            channelView._tagEnd = range.endOffset;
        }


    },

    messageInsertTag : function (e) {
        _preventDefault(e);

        var editor = $("#messageTextArea").data("kendoEditor");
        var range = editor.getRange();

        if (channelView._insertTag) {
            $("#chatSmartTagBtn").attr('src','images/icon-smart.svg');
            channelView._tagActive = false;

            channelView._tagEnd = range.endOffset;
            var text = editor.value();
            var tagString = text.substring(channelView._tagStart+1, channelView._tagEnd);
            mobileNotify("Smart Object: will process " + tagString);
            channelView.processTag(tagString);
            channelView._insertTag = false;

        } else {
            editor.paste("@");
            editor.update();
            channelView._tagActive = true;
            channelView._tagRange = range;
            channelView._tagStart = range.startOffset;
            channelView._insertTag = true;
            $("#chatSmartTagBtn").attr('src','images/icon-smart-active.svg');
        }


    },


    smartScanMessage: function (e) {
        _preventDefault(e);
        mobileNotify("Smart Scan isn't wired up yet");
    },

    messageLocation : function (e) {
        _preventDefault(e);
        mobileNotify("Chat location isn't wired up yet");
    },


    messageCalendar : function (e) {
        _preventDefault(e);
        channelView.messageMenuTag();
        smartEventView.openModal(null, function (event) {

            channelView.messageAddSmartEvent(event);
            mobileNotify("Sending IntelliEvent...");
            channelView.messageSend();
        });
    },


    messageMovie : function (e) {
        _preventDefault(e);
        movieListView.openModal( null, function (movie) {
            if (movie !== null) {
                channelView.messageAddSmartMovie(movie);
                mobileNotify("Sending IntelliMovie...");
                channelView.messageSend();
            }
        });
    },

    messageEvent : function (e) {
        _preventDefault(e);
        mobileNotify("Chat Event isn't wired up yet");
    },

    messageFlight : function (e) {
        _preventDefault(e);
        //channelView.messageMenuTag();

        smartFlightView.openModal(null,function (flight) {
            if (flight !== undefined && flight !== null) {
                smartFlight.smartAddFlight(flight, function (flightObj) {
                    channelView.messageObjects.push(flightObj);
                    mobileNotify("Sending IntelliFlight...");
                    channelView.messageSend();
                });

            }
        });
    },

    messageTrip: function (e) {
        _preventDefault(e);
        smartTripView.openModal(null, function (trip) {
            if (trip !== undefined && trip !== null) {
                smartTrip.smartAddTrip(trip, function (tripObj) {
                    channelView.messageObjects.push(tripObj);
                    mobileNotify("Sending IntelliTrip...");
                    channelView.messageSend();
                });

            }
        });
    },


    messagePlace : function (e) {
        _preventDefault(e);

        smartEventPlacesView.openModal("", "IntelliPlace", function (placeObj) {
            if (placeObj !== undefined && placeObj !== null) {
                var place = {ggType: 'Place', uuid: uuid.v4(), senderUUID: userModel._user.userUUID, senderName: userModel._user.name};

                place.lat = placeObj.lat;
                place.lng = placeObj.lng;
                place.name  = placeObj.name;
                place.address = placeObj.address;
                place.googleId = placeObj.googleId;
                place.placeUUID = null;

                channelView.messageObjects.push(place);
                mobileNotify("Sending IntelliPlace...");
                channelView.messageSend();
            }
        });
    },


    messageMusic : function (e) {
        _preventDefault(e);

    }


};


var askRequestModal = {
    close: function () {
        $("#modalview-requestContent").data("kendoMobileModalView").close();
    },

   onSend: function () {
        askRequestModal.close();
        // Todo - wire sending request
    },

    onInit: function () {

        $("#modalview-requestContent").kendoTouch({
            enableSwipe: true,
            swipe: function(e) {
                e.preventDefault();
                $("#modalview-requestContent").data("kendoMobileModalView").close();
            }
        });
    },

    onOpen: function () {
        var message = channelView.activeMessage;

        if (message === null) {
            mobileNotify("No active message!!!");
            askRequestModal.close();
        }

        var contact = contactModel.findContact(message.sender);

        var contactName = contact.name + " (" + contact.alias + ")";
        $('#askRequest-contactName').text(contactName);
    }
};


var channelPresence = {
    _channelUUID : null,
    _channelModel : null,

    onInit: function (e) {
        $("#channelPresence-listview").kendoMobileListView({
            dataSource: channelView.membersDS,
            template: $("#chatMemberTemplate").html(),
            autobind: false,
            dataBinding: function(e){
                ux.checkEmptyUIState(channelView.membersDS, "#channelPresence");
            },
            click: function (e) {
                // Click to potential member list -- add this member to channel
                var thisMember = e.dataItem;
                if (thisMember !== undefined && thisMember.uuid !== null) {
                    contactActionView.setReturnModal("#channelPresence");
                    channelPresence.closeModal();
                    contactActionView.openModal(thisMember.uuid);
                }


            }

        });


    },

    onShow: function (e) {
        // Update presence count and members present
      //  groupChannel.hereNow();

    },

    openModal: function () {
        $("#channelPresence").data("kendoMobileModalView").open();
    },

    closeModal : function () {
        $("#channelPresence").data("kendoMobileModalView").close();
    },

    onDone: function (e) {
        $("#channelPresence").data("kendoMobileModalView").close();
    },

    onClose : function (e) {

    }
};

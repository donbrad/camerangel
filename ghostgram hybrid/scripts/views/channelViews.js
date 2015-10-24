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

    onInit : function (e) {
        e.preventDefault();

        $('#channelsSearchQuery').clearSearch({
	        callback: function() {
	        	// todo - wire search
	        }
	    });

        $("#channels-listview").kendoMobileListView({
            dataSource: channelModel.channelsDS,
            template: $("#channels-listview-template").html(),
            dataBound: function(e){
                ux.checkEmptyUIState(channelModel.channelsDS, "#channelListDiv");
            }
        }).kendoTouch({
            filter: ".chat-mainBox",
            enableSwipe: true,
            tap: function (e) {
                //var selector = e.target[0].parentElement;
                var selector = $(e.sender.events.currentTarget);
                if(selector.hasClass("chat-mainBox") === true || e.target[0].className === "chat-mainBox"){
                    var channelId = selector.context.parentElement.id;
                    var channelUrl = "#channel?channel=" + channelId;
                    APP.kendo.navigate(channelUrl);
                }
            },
            swipe: function(e){
                var selection = e.sender.events.currentTarget;

                if(e.direction === "left"){
                    var otherOpenedLi = $(".chat-active");
                    $(otherOpenedLi).velocity({translateX:"0"},{duration: "fast"}).removeClass("chat-active");

                    if($(selection).hasClass("private") !== true && $(window).width() < 375){
                        $(selection).velocity({translateX:"-80%"},{duration: "fast"}).addClass("chat-active");
                    } else if ($(selection).hasClass("private")){
                        $(selection).velocity({translateX:"-40%"},{duration: "fast"}).addClass("chat-active");
                    } else {
                        $(selection).velocity({translateX:"-70%"},{duration: "fast"}).addClass("chat-active");
                    }


                }
                if (e.direction === "right" && $(selection).hasClass("chat-active")){
                    $(selection).velocity({translateX:"0"},{duration: "fast"}).removeClass("chat-active");
                }
            }

        });


    },

    onShow : function(e) {

        ux.checkEmptyUIState(channelModel.channelsDS, "#channels");
    	//scroll up search 
    	ux.scrollUpSearch(e);
        // set action button
        ux.showActionBtn(true, "#channels", "#addChannel")
        ux.checkEmptyUIState(channelModel.channelsDS, "#channels");
    },

    onBeforeHide: function(){
    	// set action button
		ux.showActionBtn(false, "#channels")
    },

    editChannel : function (e) {
        if (e!== undefined && e.preventDefault !== undefined){
            e.preventDefault();
        }
        // Did a quick bind to the button, feel free to change

        var channelId = e.button[0].attributes["data-channel"].value;
        var dataSource = channelModel.channelsDS;

        dataSource.filter( { field: "channelId", operator: "eq", value: channelId });
        var view = dataSource.view();
        var channel = view[0];
        dataSource.filter([]);

        // Kendo Observable doesnt have unbind so bind to dummy change function
        currentChannelModel.currentChannel.bind('change', function() {});
        currentChannelModel.currentChannel = channel;

        currentChannelModel.currentChannel.set('channelId', channel.channelId);
        currentChannelModel.currentChannel.set('name', channel.name);
        currentChannelModel.currentChannel.set('description', channel.description);
        currentChannelModel.currentChannel.set('media', channel.media);
        if (channel.invitedMembers === undefined) {
            channel.invitedMembers = [];
        }
        currentChannelModel.currentChannel.set('invitedMembers', channel.invitedMembers);
        currentChannelModel.currentChannel.set('members', channel.members);
        currentChannelModel.currentChannel.set('isPrivate', channel.isPrivate);
        currentChannelModel.currentChannel.set('isOwner', channel.isOwner);
        currentChannelModel.currentChannel.set('archive', channel.archive);
        currentChannelModel.currentChannel.bind('change', syncCurrentChannel);

        APP.kendo.navigate('#editChannel');

    }
};

/*
 * AddChannel
 */

var addChannelView = {
     onShow: function (e) {
        e.preventDefault();
        currentChannelModel.potentialMembersDS.data([]);
        currentChannelModel.potentialMembersDS.data(contactModel.contactsDS.data());
        currentChannelModel.membersDS.data([]);

        $('.addChannelEvent').addClass('hidden');

        // hide channel description
        $("#channels-addChannel-description").css("display","none");

        $("#channels-addChannel-name").keyup(function(){
            if($("#channels-addChannel-name").val !== ""){
                $("#addChat-createBtn").velocity({opacity: 1}, {duration: 500, easing: "spring"});
                $("#channels-addChannel-name").unbind();
            }
            $("#addChat-helper-1").velocity("fadeOut", {duration: 300});
        });

        $("#addChat-step2").css("opacity", 0);


    },

   addChannel : function (e) {
       e.preventDefault();

       // make sure chat has a name
       if ($("#channels-addChannel-name").val() !== '') {

           var name = $('#channels-addChannel-name').val(),
               duration = $('#channels-addChannel-archive').val(),
               description = $('#channels-addChannel-description').val();

           if (channelModel.findChannelByName(name)) {
               mobileNotify('There is already a chat named : "' + name + '"');
           } else {
               channelModel.addChannel(name, description, true, duration);
           }


       } else {
           mobileNotify("Chat name is required");
       }
   },

    showChatDescription : function (e){
        if (e !== undefined && e.preventDefault !== undefined)
            e.preventDefault();
        $("#channels-addChannel-description").velocity("slideDown",{duration: 1500, easing: "spring", display: "block"});
        $("#addChatDescription").velocity("fadeOut");
    },

    resetUI : function (e){
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

        // This chat (channel name) is unique for this user
        $("#chat-title-setup").velocity("slideUp", {duration: 300});
        $("#addChat-step2").velocity("fadeOut", {duration: 200});
        $("#addChat-step1").velocity("fadeIn", {duration: 200, delay: 200});
        //$("#addChat-createBtn").velocity("slideUp", {display: "none", duration: 300});

    },



    addChatStep2: function (e) {
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
        if (e.preventDefault !== undefined)
            e.preventDefault();
        $('.addChannelEvent').removeClass('hidden');
    }

};

/*
 * EditChannel
 */

var editChannelView = {


    onInit: function (e) {
        if (e.preventDefault !== undefined)
            e.preventDefault();

        currentChannelModel.membersDS.data([]);

        $("#editmembers-listview").kendoMobileListView({
            dataSource: currentChannelModel.membersDS,
            template: $("#editMembersTemplate").html()
        });
        //$('#editChannelMemberList li').remove();
    },

    onShow : function (e) {
        if (e.preventDefault !== undefined)
            e.preventDefault();

        // channelMembers view calls this view with updateMembers=true to prevent initializing all the data
        if (e.view.params.updateMembers === undefined) {

            var currentChannel = currentChannelModel.currentChannel;
            var members = currentChannel.members, thisMember = {};
            var membersArray = new Array();

            //Zero out current members as we're going rebuild ds and ux
            currentChannelModel.membersDS.data([]);
            currentChannelModel.membersAdded = [];
            currentChannelModel.membersDeleted = [];

            $('#editChannelMemberList').empty();

            // Only channel owner can see and edit members and invited members
            if (members.length > 0 && currentChannel.isOwner) {

                // Group channel members are referenced indirectly by uuid
                // channel can include invited users who havent signed up yet

                for (var i = 0; i < members.length; i++) {
                    thisMember = contactModel.findContact(members[i]);

                    // Current user will be undefined in contact list.
                    if (thisMember !== undefined) {
                        currentChannelModel.membersDS.add(thisMember);
                        //appendMemberToUXList(thisMember);
                    }
                }

                if (currentChannelModel.invitedMembers !== undefined) {
                    members = currentChannelModel.invitedMembers;
                    for (var j = 0; j < members.length; j++) {
                        thisMember = contactModel.findContactByUUID(members[j]);
                        currentChannelModel.membersDS.add(thisMember);
                        //appendInvitedMemberToUXList(thisMember);
                    }
                }

            } else {
                $(".addChatMembersBanner a").text("No one is invited. Tap to send invites");

            }

            
        } else {
            // channelMembers is returning to this view so update ux to reflect memberstate
            if (currentChannelModel.currentChannel.members.length > 0) {
                $(".addChatMembersBanner a").text("+ add new members");
            } else {
                $(".addChatMembersBanner a").text("No one is invited. Tap to send invites");
            }
        }

        // show action btn text
        var $editChannelP = $("#editChannel > div.footerBk.km-footer > a.actionBtn.secondary-100.km-widget.km-button > span > p")
        $editChannelP.velocity({opacity: 1, right: "3rem"}, {easing: "spring", delay: 500});
    },

    finalizeEdit : function (e) {
        e.preventDefault();

        var memberArray = new Array(), invitedMemberArray = new Array(), invitedPhoneArray = new Array(), members = currentChannelModel.membersDS.data();

        var channelId = currentChannelModel.currentChannel.channelId;
        // It's a group channel so push this users UUID

        memberArray.push(userModel.currentUser.userUUID);
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
        currentChannelModel.currentChannel.members = memberArray;
        currentChannelModel.currentChannel.unbind('change', syncCurrentChannel);

        //Send Invite messages to users added to channel
        for (var ma = 0; ma < currentChannelModel.membersAdded.length; ma++) {
            appDataChannel.groupChannelInvite(currentChannelModel.membersAdded[ma].contactUUID, channelId,  currentChannelModel.currentChannel.name, "You've been invited to " + currentChannelModel.currentChannel.name);
        }

        
        //Send Delete messages to users deleted from the channel
        for (var md = 0; md < currentChannelModel.membersDeleted.length; md++) {
            appDataChannel.groupChannelDelete(currentChannelModel.membersDeleted[md].contactUUID, channelId, currentChannelModel.currentChannel.name + "has been deleted.");
        }

        for (var m=0; m< memberArray.length; m++) {
            //Todo: don -- add channel update messages for other users.
        }
		
        updateParseObject('channels', 'channelId', channelId, 'members', memberArray);
        updateParseObject('channels', 'channelId', channelId, 'invitedMembers', invitedMemberArray);

       /* // Update the channelmap entry so members can update or create the channel
        updateParseObject('channelmap', 'channelId', channelId, 'members', memberArray);
        // Add new members phone numbers to the channel map
        updateParseObject('channelmap', 'channelId', channelId, 'invitedMembers', invitedPhoneArray);*/

        // Reset UI
        $("#showEditDescriptionBtn").velocity("fadeIn");
    //    $("#channels-editChannel-description").css("display", "none").val("");

        mobileNotify("Updating " + currentChannelModel.currentChannel.name);

        APP.kendo.navigate('#channels');

        // Reset UI
        $("#channels-addChannel-description, #channels-addChannel-name").val('');
    },

    deleteMemberBtn: function(e){
    	var selectorId = e.target[0].dataset["id"];
    	editChannelView.deleteMember(selectorId);
    },

    deleteMember : function (contactId) {
        
        var thisMember = contactModel.findContactByUUID(contactId);

        currentChannelModel.membersDeleted.push(thisMember);
        currentChannelModel.potentialMembersDS.add(thisMember);
        currentChannelModel.potentialMembersDS.sync();
        currentChannelModel.membersDS.remove(thisMember);
        currentChannelModel.membersDS.sync();
        //	$('#'+contactId).remove();
        mobileNotify("Deleted " + thisMember.name);
        
    },

    memberEnter : function (contactUUID) {

    },

    memberLeave : function (contactUUID) {

    },

    showDoneButton: function () {

    },

    clickEdit: function () {
        $(".listTrash").velocity("fadeIn", {duration: 100});
        $("#editChannel-Trash").velocity("fadeOut", {duration: 100});
        $("#editChannel-Done").velocity("fadeIn", {delay: 100, duration: 100});
        $(".addChatMembersBanner").velocity("slideUp", {duration: 100});
    },

    clickDone : function () {
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
        if (e.preventDefault !== undefined)
            e.preventDefault();

        currentChannelModel.potentialMembersDS.data([]);
        $("#channelMembers-listview").kendoMobileListView({
            dataSource: currentChannelModel.potentialMembersDS,
            template: $("#memberTemplate").html(),
            headerTemplate: "${value}",
            filterable: {
                field: "name",
                operator: "startswith",
                placeholder: "Search contacts..."
            },
            click: function (e) {
                // Click to potential member list -- add this member to channel
                var thisMember = e.dataItem;

                currentChannelModel.membersDS.add(thisMember);
                if (thisMember.contactUUID === null) {
                    currentChannelModel.currentChannel.invitedMembers.push(thisMember.uuid);
                    //appendInvitedMemberToUXList (thisMember);

                } else {
                    currentChannelModel.currentChannel.members.push(thisMember.contactUUID);
                    //appendMemberToUXList (thisMember);
                }
                currentChannelModel.membersDS.sync();

                currentChannelModel.membersAdded.push(thisMember);
                currentChannelModel.potentialMembersDS.remove(thisMember);
                $(".addedChatMember").text("+ added " + thisMember.name).velocity("slideDown", { duration: 300, display: "block"}).velocity("slideUp", {delay: 1400, duration: 300, display: "none"});
            }

        });
    },

    doShow: function (e) {
        if (e.preventDefault !== undefined)
            e.preventDefault();

        var members = currentChannelModel.currentChannel.members, invitedMembers = currentChannelModel.currentChannel.invitedMembers;


        // Need to break observable link or contacts get deleted.
        var contactArray = contactModel.contactsDS.data().toJSON();

        // create an easy reference to the potential members data source
        var dataSource = currentChannelModel.potentialMembersDS;

        // Zero potential members data source so we can add all contacts
        dataSource.data([]);

        // Add current contacts to potential members data source
        // we delete members from potential members as we add them to members data source
        dataSource.data(contactArray);


        // Zero out member datasource so we can rebuild it
        currentChannelModel.membersDS.data([]);

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

                    currentChannelModel.membersDS.add(thisMember);
                    dataSource.filter( { field: "uuid", operator: "eq", value: thisMember.uuid});
                    var view = dataSource.view();
                    var contact = view[0];
                    dataSource.filter([]);
                    dataSource.remove(contact.items[0]);  // new object layout for aggregate datasources
                }

            }
            currentChannelModel.potentialMembersDS.sync();
        }

        if (invitedMembers.length > 0) {
            for (var j=0; j<invitedMembers.length; j++) {
                var invitedMember = contactModel.findContactByUUID(invitedMembers[j]);
                if (invitedMember !== undefined) {

                    currentChannelModel.membersDS.add(invitedMember);
                    dataSource.filter( { field: "uuid", operator: "eq", value: invitedMember.uuid});
                    var view1 = dataSource.view();
                    var contact1 = view1[0];
                    dataSource.filter([]);
                    dataSource.remove(contact1.items[0]); // new object layout for aggregate datasources
                }


            }

        }

    }


};

// ChannelView -- Chat View

var channelView = {
    topOffset: 0,
    messageLock: false,
    thisUser : null,
    contactData : [],
    currentContactId: null,
    isPrivateChat: false,
    privacyMode: false,  // Privacy mode - obscure messages after timeout
    currentContact: null,
    activeMessage: null,
    intervalId : null,
    sendMessageHandler : null,
    messagesDS: new kendo.data.DataSource({  // this is the list view data source for chat messages
        sort: {
            field: "time",
            dir: "asc"
        }
    }),

    _timeStampUpdateInterval: 1000 * 60 * 5, // update every 5 minutes...
    _channel : null,
    _channelId : null,


    onInit: function (e) {

        e.preventDefault();

        channelView.initDataSources();

        //APP.checkPubnub();

        var width = window.innerWidth - 68;
        $('#messageTextArea').css("width", width+'px');
        currentChannelModel.topOffset = APP.kendo.scroller().scrollTop;
        autosize($('#messageTextArea'));
        
        $("#messages-listview").kendoMobileListView({
            dataSource: channelView.messagesDS,
            template: $("#messagesTemplate").html()

        }).kendoTouch({
            filter: "li",
            enableSwipe: true,
            tap: channelView.tapChannel,
            /*swipe: channelView.swipeChannel,*/
            hold: channelView.holdChannel
        });
  	
  		
        /*$("#channelMembers-listview").kendoMobileListView({
            dataSource: currentChannelModel.membersDS,
            template: $("#membersTemplate").html(),
            click: function (e) {
                var member = e.dataItem;
                currentChannelModel.currentMember = member;
                // display message actionsheet
                $("#memberActions").data("kendoMobileActionSheet").open();
            }
        });*/
    },

    // Initialize the channel specific view data sources.
    initDataSources : function () {
        channelView.messagesDS.data([]);

    },

    onShow : function (e) {
        _preventDefault(e);
        
        // hide action btn
        ux.showActionBtn(false, "#channel");

        var channelUUID = e.view.params.channel;

        channelView._channelId = channelUUID;

        var thisUser = userModel.currentUser;

        channelView.initDataSources();

        var thisChannel =  currentChannelModel.setCurrentChannel(channelUUID);
        if (thisChannel === null) {
            mobileNotify("ChatView -- chat doesn't exist : " + channelUUID);
            return;
        }

        channelView._channel = thisChannel;

        var contactUUID = null;
        var thisChannelHandler = null;
        channelView.activeMessage = null;
        var name = channelView.formatName(thisChannel.name);
        channelView.isPrivateChat = thisChannel.isPrivate;

        // Hide the image preview div
        channelView.hideChatImagePreview();

        channelModel.updateUnreadCount(channelUUID, 0);

        //default private mode off for now. Todo: don and jordan fix privacy mode
        channelView.privacyMode = false;
        // Privacy UI
        $('#privacyMode').html('<img src="images/privacy-off.svg" />');
        $("#privacyStatus").addClass("hidden");

        $("#channelNavBar").data('kendoMobileNavBar').title(name);

        if (thisChannel.isPrivate) {
            // *** Private Channel ***
            var contactKey = thisChannel.contactKey;
            if (contactKey === undefined) {
              mobileNotify("No public key for " + thisChannel.name);
              return;
            }

          $('#messagePresenceButton').hide();


          var userKey = thisUser.publicKey, privateKey = thisUser.privateKey, name = thisUser.name;

          contactUUID = thisChannel.channelId;


          channelView.currentContactId = contactUUID;
          var thisContact = contactModel.findContact(contactUUID);
          if (thisContact === undefined) {
              mobileNotify("ChannelView : Undefined contact for " + contactUUID);
              return;
          }
          channelView.currentContact = thisContact;
          //channelView.contactData = channelView.buildContactArray(thisChannel.members);
          //Todo: remove currentContactModel
          currentChannelModel.currentContactModel = thisContact;
          
          // Show contact img in header
          $('#channelImage').attr('src', thisContact.photo).removeClass("hidden");

          privateChannel.open(channelUUID, thisUser.userUUID, thisUser.alias, name, userKey, privateKey, contactUUID, contactKey, thisContact.name);
            /*  thisChannelHandler.onMessage(channelView.onChannelRead);
              thisChannelHandler.onPresence(channelView.onChannelPresence);
              mobileNotify("Getting Previous Messages...");
              currentChannelModel.openChannel(thisChannelHandler);*/
            channelView.messagesDS.data([]);

            channelView.sendMessageHandler = privateChannel.sendMessage;

            if (thisChannel.messagesArray == undefined) {
                privateChannel.getMessageHistory(function (messages) {
                    for (var i=0; i<messages.length; i++){
                        var message = messages[i];
                        var formattedContent = '';
                        if (message.content !== null) {
                            formattedContent = formatMessage(message.content);
                        }
                        message.formattedContent = formattedContent;
                        message.fromHistory = true;
                    }

                    thisChannel.messagesArray = messages;
                    channelView.messagesDS.data(messages);

                    //channelView.updateMessageTimeStamps();

                    /*if (channelView.intervalId === null) {
                     channelView.intervalId = window.setInterval(channelView.updateMessageTimeStamps, 60 * 5000);
                     }*/

                    channelView.scrollToBottom();
                });
            }


        } else {

          //*** Group Channel ***
          $('#messagePresenceButton').show();
          // Provision a group channel

          // clear header img
          $('#channelImage').attr('src', '').addClass("hidden");

          groupChannel.open(channelUUID, thisUser.userUUID, thisUser.name, thisUser.alias, thisUser.phone);
          channelView.sendMessageHandler = groupChannel.sendMessage;
         // channelView.contactData = channelView.buildContactArray(thisChannel.members);

            mobileNotify("Loading Messages...");

          groupChannel.getMessageHistory(function (messages) {
              channelView.messagesDS.data([]);
              for (var i=0; i<messages.length; i++){
                  var message = messages[i];
                  var formattedContent = '';
                  if (message.content !== null) {
                      formattedContent = formatMessage(message.content);
                  }
                  message.formattedContent = formattedContent;
              }

              channelView.messagesDS.data(messages);
              //channelView.updateMessageTimeStamps();

             /* if (channelView.intervalId === null) {
                  channelView.intervalId = window.setInterval(channelView.updateMessageTimeStamps, 60 * 5000);
              }*/
              channelView.scrollToBottom();
          });

        }

    },

    onHide : function (e) {

        // If this isn't a privateChat the close the channel (unsubscribe)
        // All private chat messages go through userdatachannel which is always subscribed
        if (!channelView.isPrivateChat) {
            groupChannel.close();
        }

        /*if (currentChannelModel.currentChannel !== undefined && currentChannelModel.handler !== null) {
            currentChannelModel.handler.closeChannel();

        }
*/
        if (channelView.intervalId !== undefined && channelView.intervalId !== null) {
            clearInterval(channelView.intervalId);
            channelView = null;
        }

    },

    // Quick access to contact data for display.
    getContactData : function (uuid) {
        var contact = {isContact: true};
        //var data = channelView.contactData[uuid];

       if (uuid === userModel.currentUser.userUUID) {
           contact.isContact = false;
           contact.uuid = userModel.currentUser.userUUID;
           contact.alias = userModel.currentUser.alias;
           contact.name = userModel.currentUser.name;
           contact.photoUrl = userModel.currentUser.photo;
           contact.publicKey = userModel.currentUser.publicKey;
           contact.isPresent = true;

           return (contact);
       }

        var data = contactModel.inContactList(uuid);

        if (data === undefined) {
            mobileNotify("ChatView Unknown Contact : " + uuid);
            contact.uuid = 0;
            contact.alias = 'unknown';
            contact.name = 'Unknown User';
            contact.photoUrl = 'images/ghost-blue.svg';
        }

        contact.uuid = data.userUUID;
        contact.alias = data.alias;
        contact.name = data.name;
        contact.photoUrl = data.photo;

        return(contact);
    },


  /*  // Create an array of channel/chat members.  Needs to be all members as this is used for message display.
    buildContactArray : function (contactArray) {
       if (contactArray === undefined || contactArray.length === 0) {
           return ([]);
       }
        var contactInfoArray = [], userId = userModel.currentUser.userUUID;

        for (var i=0; i< contactArray.length; i++) {
            var contact = new Object();

            if (contactArray[i] === userId) {
                contact.isContact = false;
                contact.uuid = userId;
                contact.alias = userModel.currentUser.alias;
                contact.name = userModel.currentUser.name;
                contact.photoUrl = userModel.currentUser.photo;
                contact.publicKey = userModel.currentUser.publicKey;
                contact.isPresent = true;
                contactInfoArray[contact.uuid] = contact;
                // this is our user.
            } else {
                var thisContact = contactModel.findContact(contactArray[i]);
                if (thisContact === undefined) {
                    mobileNotify("buildContactArray - undefined contact!!!");
                    return(contactInfoArray);
                }
                contact.isContact = true;
                contact.uuid = contactArray[i];
                contact.alias = thisContact.alias;
                contact.name = thisContact.name;
                contact.photoUrl = thisContact.photo;
                contact.publicKey = thisContact.publicKey;
                contact.isPresent = false;
                contactInfoArray[contact.uuid] = contact;
            }
        }

        return (contactInfoArray)
    },*/

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

        // close out li
        $(".selectedLI").velocity("slideUp", {delay: 150});

        //mobileNotify("message archived");
        var message = channelView.activeMessage;

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
        $("#modalview-requestContent").data("kendoMobileModalView").open();
    },

    findChatMember: function (contactUUID) {
        var dataSource = currentChannelModel.membersDS;
        dataSource.filter( { field: "contactUUID", operator: "eq", value: contactUUID });
        var view = dataSource.view();
        var contact = view[0];
        dataSource.filter([]);

        return(contact);
    },

    onChannelPresence : function () {
        var users = currentChannelModel.handler.listUsers();

    },

    setPresence: function (userId, isPresent) {
        // Don't set presence for the current user -- they already know they're in the channel
        if (userId === userModel.currentUser.userUUID) {
            return;
        }

        //var member = currentChannelModel.memberList[userId];
       // contact.isPresent = isPresent;
        currentChannelModel.setMemberPresence(userId, isPresent);
    },

    updatePresence : function (members, occupancyCount) {

        $('#occupancyCount').text(occupancyCount + 1);

        for (var i=0; i<members.length; i++) {
            var userId = members.username;

            if (userId !== userModel.currentUser.userUUID) {
                var member = channelView.findChatMember(userId);
                if (member === undefined || member === null) {
                    channelView.setPresence(userId, true);
                }
            }

        }

    },

    onChannelRead : function (message) {

        if (message.content !== null) {
            message.formattedContent = formatMessage(message.content);
        } else {
            message.formattedContent = '';
        }

        // Ensure that new messages get the timer
        if (message.fromHistory === undefined) {
            message.fromHistory = false;
        }

        $("#messages-listview").data("kendoMobileListView").refresh();

        channelView.messagesDS.add(message);

        currentChannelModel.updateLastAccess();

        channelView.scrollToBottom();

        if (channelView.privacyMode) {
            kendo.fx($("#"+message.msgID)).fade("out").endValue(0.05).duration(9000).play();
        }
    },

    messageSend : function (e) {
        _preventDefault(e);
        var validMessage = false; // If message is valid, send is enabled

        var text = $('#messageTextArea').val();
        if (text.length > 0) {
            validMessage = true;
        }

        // Add current location information to message
        var messageData = {geo: {lat: mapModel.lat, lng: mapModel.lng} , address: mapModel.currentAddress};

        if (userModel.currentUser.currentPlaceUUID !== null) {
            messageData.place = {name: userModel.currentUser.currentPlace, uuid: userModel.currentUser.currentPlaceUUID};
        }

        if (currentChannelModel.currentMessage.photo !== undefined && currentChannelModel.currentMessage.photo !== null) {
            validMessage = true;
            messageData.photo = currentChannelModel.currentMessage.photo;
        }

        if (validMessage === true ) {
            channelView.sendMessageHandler(channelView.currentContactId, text, messageData, 86400);
            channelView.hideChatImagePreview();
            channelView._initMessageTextArea();
            currentChannelModel.currentMessage = {};
        }

    },

     _initMessageTextArea : function () {

        $('#messageTextArea').val('');
        autosize.update($('#messageTextArea'));
    },

    showChatImagePreview: function (displayUrl) {
        $('#chatImage').attr('src', displayUrl);
        $('#chatImagePreview').show();
    },

    hideChatImagePreview : function () {
        $('#chatImagePreview').hide();
        $('#chatImage').attr('src', null);
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
        var scroller = APP.kendo.scroller;

        var scrollerHeight =  APP.kendo.scroller().scrollHeight();
        var viewportHeight =  APP.kendo.scroller().height();

        if ((scrollerHeight + channelView.topOffset) > viewportHeight) {
            var position = -1 * (scrollerHeight - viewportHeight - channelView.topOffset);
            APP.kendo.scroller().animatedScrollTo(0, position);
        }

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
        
        var target = $(e.touch.initialTouch);
        var dataSource = channelView.messagesDS;
        var messageUID = $(e.touch.currentTarget).data("uid");
        var message = dataSource.getByUid(messageUID);
        //$('.delete').css('display', 'none');
        //$('.archive').css('display', 'none');
        
        // Scale down the other photos in this chat...
        $('.chat-photo-box-zoom').removeClass('chat-photo-box-zoom').addClass("chat-photo-box");

        // If the photo is minimized and the user just clicked in the message zoom the photo in place
        $('#'+message.msgID + ' .chat-photo-box').removeClass('chat-photo-box').addClass('chat-photo-box-zoom');
        
        // User actually clicked on the photo so show the open the photo viewer
        if (target.hasClass('chat-message-photo')) {
        	// Open this img full screen
            var photoUrl = message.data.photo.photo;
            $('#modalPhotoViewImage').attr('src', photoUrl);
            modalPhotoView.openModal(photoUrl);
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

        if (currentChannelModel.privacyMode) {
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
        $("#messageActions").data("kendoMobileActionSheet").open();
    },

    messageEraser: function (e) {
        _preventDefault(e);
        channelView._initMessageTextArea();
    },

    messageLockButton : function (e) {
        e.preventDefault();
        channelView.messageLock = !channelView.messageLock;
        if (channelView.messageLock) {
            $('#messageLockButton').html('<i class="fa fa-lock"></i>');
        } else {
            $('#messageLockButton').html('<i class="fa fa-unlock"></i>');
        }
    },

    messageCamera : function (e) {
       _preventDefault(e);
        deviceCamera(
            1600, // max resolution in pixels
            75,  // quality: 1-99.
            true,  // isChat -- generate thumbnails and autostore in gallery.  photos imported in gallery are treated like chat photos
            channelView.showChatImagePreview  // Optional preview callback
        );
    },

    messagePhoto : function (e) {
        _preventDefault(e);
        // Call the device gallery function to get a photo and get it scaled to gg resolution
        deviceGallery(
            1600, // max resolution in pixels
            75,  // quality: 1-99.
            true,  // isChat -- generate thumbnails and autostore in gallery.  photos imported in gallery are treated like chat photos
            channelView.showChatImagePreview  // Optional preview callback
        );
    },

     messageGallery : function (e) {
        _preventDefault(e);

         modalGalleryView.openModal(channelView.showChatImagePreview);
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
        mobileNotify("Chat Calendar isn't wired up yet");
    },

    messageEvent : function (e) {
        _preventDefault(e);
        mobileNotify("Chat Event isn't wired up yet");
    },


    messageMusic : function (e) {
        _preventDefault(e);
        mobileNotify("Chat Music isn't wired up yet");
    },

    messageMovie : function (e) {
        _preventDefault(e);
        mobileNotify("Chat Movie isn't wired up yet");
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
    _channelId : null,
    _channelModel : null,

    onInit: function (e) {
        $("#channelPresence-listview").kendoMobileListView({
            dataSource: currentChannelModel.membersDS,
            template: $("#chatMemberTemplate").html(),
            autobind: false,
           /* filterable: {
                field: "name",
                operator: "startswith",
                placeholder: "Search Members..."
            },*/
            click: function (e) {
                // Click to potential member list -- add this member to channel
                var thisMember = e.dataItem;
                if (thisMember !== undefined && thisMember.contactId !== null)
                    contactActionView.openModal(thisMember.contactId);

            }

        });
    },

    onShow: function (e) {

        currentChannelModel.buildMembersDS();

       /// var channelTitle = currentChannelModel.currentChannel.get('name');

       // $('#channelPresenceTitle').text(channelTitle + ' Members');

       // $("#channelPresence").data("kendoMobileDrawer").show();
    },

    onDone: function (e) {
        $("#channelPresence").data("kendoMobileDrawer").hide();
    },

    onClose : function (e) {

    }
};
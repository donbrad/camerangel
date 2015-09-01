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

        // set search bar
        var scroller = e.view.scroller;
        scroller.scrollTo(0,-44);


        $("#channels-listview").kendoMobileListView({
            dataSource: channelModel.channelsDS,
            template: $("#channels-listview-template").html(),
            click: function(e) {
                var selector = e.target[0].parentElement;
                if($(selector).hasClass("chat-mainBox") === true || e.target[0].className === "chat-mainBox"){
                    var channelUrl = "#channel?channel=" + e.dataItem.channelId;
                    APP.kendo.navigate(channelUrl);
                }
            },
            dataBound: function(e){
                checkEmptyUIState("#channels-listview", "#channelListDiv");
            }
        }).kendoTouch({
            filter: ".chat-mainBox",
            enableSwipe: true,
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

    checkEmpty : function () {
        if (channelModel.channelsDS.total() > 0) {
            $('#channel-listview .emptyState').addClass('hidden');
        } else {
            $('#channel-listview .emptyState').removeClass('hidden');
        }
    },

    onShow : function(){
        // set action button
        $("#channels > div.footerMenu.km-footer > a").attr("href", "#addChannel").css("display","inline-block");

        channelsView.checkEmpty();
    },

    onBeforeHide: function(){
    	// set action button
		$("#channels > div.footerMenu.km-footer > a").css("display","none");
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
               mobileNotify('There is already a channel named : "' + name + '"');
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
        $("#chat-title-setup").velocity("slideUp", {duration: 300});
        $("#addChat-step2").velocity("fadeOut", {duration: 200});
        $("#addChat-step1").velocity("fadeIn", {duration: 200, delay:200});
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
            template: $("#editMembersTemplate").html(),
            //headerTemplate: $("#editMembersHeaderTemplate").html(),
            ///fixedHeaders: true,
            click: function (e) {
            	
            }
        }).kendoTouch({
        	filter: "li",
        	enableSwipe: false,
        	dragstart: function(e){
		 		var selection = e.touch.currentTarget;
		 		var selectionListItem = $(selection);
		 		
		 		// add moving classes
		 		$(selection).addClass("selectedLI");
		 		$(".selectedLI > div").first().addClass("movingContact");

		 		$(".selectedLI").css("background", "#E57373");
		 		
		 	},
		 	drag: function(e){
		 		var currentX = e.touch.x.location;
		 		var windowWidth = $(window).width();
		 		
		 		var windowPerc = 1 - (currentX / windowWidth);
		 		windowPerc = (windowPerc * 100).toFixed(0);

		 		var fadePerc = (windowPerc * 4) / 100;
		 		var trailingPerc = windowPerc - 20;

		 		$(".selectedLI > .deleteMemberText").css("opacity", fadePerc+"%");
		 		
		 		$(".movingContact").css("right", windowPerc+"%");
		 		//
		 		if(windowPerc > 25){
		 			$(".selectedLI > .deleteMemberText").css("right", trailingPerc+"%");
		 		}

		 	},
		 	dragend: function(e){
		 		// get current position
		 		var currentX = e.touch.x.location;
		 		var windowWidth = $(window).width();
		 		var widthPerc = currentX  / windowWidth;
		 		var contactId = $(".movingContact").attr("data-id");
		 		
		 		//if drag is far enough, set action
		 		if (widthPerc < 0.75) {
					$(".movingContact").velocity({translateX:"-100%"},{duration: 600, easing: "spring"});
					$(".selectedLI").velocity("slideUp", {duration: 600});
					

					// Todo - need to revisit to fix errors
		 			// editChannelView.deleteMember(contactId);
				} else {
		 			$(".movingContact").velocity({right:"0"},{duration: 600, easing: "spring"});
		
		 		}

		 		$(".selectedLI").css("background", "#fff");
		 		// remove moving class
		 		$(".selectedLI > div").removeClass("movingContact");
		 		$("#editmembers-listview > .selectedLI").removeClass("selectedLI");
		 		
		 	}


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
                    thisMember = contactModel.getContactModel(members[i]);

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
        
        showActionBtnText("#editChannel > div.footerBk.km-footer > a.actionBtn.secondary-100.km-widget.km-button > span > p");

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
            userDataChannel.groupChannelInvite(currentChannelModel.membersAdded[ma].contactUUID, channelId, currentChannelModel.currentChannel.name, "You've been invited to " + currentChannelModel.currentChannel.name);
        }

        
        //Send Delete messages to users deleted from the channel
        for (var md = 0; md < currentChannelModel.membersDeleted.length; md++) {
            userDataChannel.groupChannelDelete(currentChannelModel.membersDeleted[md].contactUUID, channelId, currentChannelModel.currentChannel.name + "has been deleted.");
        }
		
        updateParseObject('channels', 'channelId', channelId, 'members', memberArray);
        updateParseObject('channels', 'channelId', channelId, 'invitedMembers', invitedMemberArray);

        // Update the channelmap entry so members can update or create the channel
        updateParseObject('channelmap', 'channelId', channelId, 'members', memberArray);
        // Add new members phone numbers to the channel map
        updateParseObject('channelmap', 'channelId', channelId, 'invitedMembers', invitedPhoneArray);

        // Reset UI
        $("#showEditDescriptionBtn").velocity("fadeIn");
    //    $("#channels-editChannel-description").css("display", "none").val("");

        mobileNotify("Updating " + currentChannelModel.currentChannel.name);

        APP.kendo.navigate('#channels');

        // Reset UI
        $("#channels-addChannel-description, #channels-addChannel-name").val('');
    },

    deleteMember : function (contactId) {
        
        var thisMember = contactModel.findContactByUUID(contactId);

        currentChannelModel.membersDeleted.push(thisMember);
        currentChannelModel.potentialMembersDS.add(thisMember);
        currentChannelModel.potentialMembersDS.sync();
        currentChannelModel.membersDS.remove(thisMember);
        currentChannelModel.membersDS.sync();
        //	$('#'+contactId).remove();
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
                var thisMember = contactModel.getContactModel(members[i]);
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

var channelView = {
    topOffset: 0,

    onInit: function (e) {

        e.preventDefault();

        currentChannelModel.messagesDS.data([]);
        currentChannelModel.membersDS.data([]);
        //APP.checkPubnub();

        $("#messageSend").kendoTouch({

            tap: function(e) {
                channelView.messageSend();
            },
            hold: function(e) {
                $("#sendMessageActions").data("kendoMobileActionSheet").open();
            }
        });

        var width = window.innerWidth - 68;
        $('#messageTextArea').css("width", width+'px');
        currentChannelModel.topOffset = APP.kendo.scroller().scrollTop;
        autosize($('#messageTextArea'));
        $("#messages-listview").kendoMobileListView({
            dataSource: currentChannelModel.messagesDS,
            template: $("#messagesTemplate").html() /*,
             click: function (e) {
             var message = e.dataItem;

             APP.models.channel.currentMessage = message;
             if (APP.models.channel.currentModel.isPrivate) {
             $('#'+message.msgID).removeClass('privateMode');
             kendo.fx($("#"+message.msgID)).fade("out").endValue(0.1).duration(6000).play();
             } else {
             // display message actionsheet for group messages
             $("#messageActions").data("kendoMobileActionSheet").open();
             }

             } */
        }).kendoTouch({
            filter: "li",
            //enableSwipe: true,
            tap: channelView.tapChannel,
            //swipe: swipeChannel,
            hold: channelView.holdChannel,

            dragstart: function(e){

                var selection = e.touch.currentTarget;
                var selectionListItem = $(selection)

                // add moving classes
                $(selection).addClass("selectedLI");
                $(".selectedLI > div").first().addClass("movingChat");

                // remove chat time
                $(".movingChat > .chat-time").velocity({opacity: 0, translateY: "5%"}, {duration: 200});

                $(".movingChat > .chat-message-user-content").velocity({scale: "1.01"}, {duration: 300});

            },

            drag: function(e){
                var currentX = e.touch.x.location;
                var windowWidth = $(window).width();
                var messageWidth = $(".movingChat > .chat-message-user-content").width();
                var widthPerc = (messageWidth + currentX)  / (windowWidth + messageWidth);

                // drag chat
                diffMovingChat(widthPerc);


                var accelWidthPerc = widthPerc * 2;
                var percentWindow = currentX / windowWidth

                //
                if(percentWindow < 0.75 && percentWindow > 0.35){

                    $(".selectedLI > .message-slideOptions").css("opacity", accelWidthPerc);
                    $(".selectedLI").removeClass("selectedLI-delete").addClass("selectedLI-archive");
                    // change color to highlighted
                    $(".movingChat > .chat-message-user-content").css("background-color", "#9E788F");
                    $(".selectedLI > .message-slideOptions > .archive").css("display", "inline-block");
                    $(".selectedLI > .message-slideOptions > .delete").css("display", "none");
                } else if(percentWindow <= 0.35){
                    // change color to delete
                    $(".selectedLI").addClass("selectedLI-delete").removeClass("selectedLI-archive");
                    $(".movingChat > .chat-message-user-content").css("background-color", "#EA6262");
                    $(".selectedLI > .message-slideOptions > .delete").css("display", "inline-block");
                    $(".selectedLI > .message-slideOptions > .archive").css("display", "none");

                } else {
                    // change color to default
                    $(".movingChat > .chat-message-user-content").css("background-color", "#2D93FF");
                    $(".selectedLI > .message-slideOptions > .delete .archive").css("display", "none");
                    $(".selectedLI").removeClass("selectedLI-delete, selectedLI-archive");
                }




            },

            dragend: function(e){
                // get current position
                var currentX = e.touch.x.location;
                var windowWidth = $(window).width();
                var widthPerc = currentX  / windowWidth;


                //if drag is far enough, set action
                if (widthPerc < 0.75) {
                    $(".movingChat").velocity({translateX:"-100%", opacity: 0},{duration: "fast"});
                    $(".selectedLI > .message-slideOptions").velocity({right:"100%"},{duration: "fast"});

                    if (widthPerc < 0.35){
                        // delete message
                        deleteMessage();
                    } else {
                        // archive message
                        archiveMessage();
                    }

                } else {
                    $(".movingChat").velocity({right:"1rem"},{duration: 600, easing: "spring"});
                    $(".selectedLI > .message-slideOptions").css("opacity", "0");

                    // show chat time
                    $(".movingChat > .chat-time").velocity({opacity: 1, translateY: "0"}, {duration: 200});

                    // reset color and size
                    $(".movingChat > .chat-message-user-content").css("background", "#2D93FF");
                    $(".movingChat > .chat-message-user-content").velocity({scale: "1"}, {duration: 300});
                }

                // remove moving class
                $(".selectedLI > div").removeClass("movingChat");
                $("#messages-listview > .selectedLI").removeClass("selectedLI");

            }

        });

        $("#channelMembers-listview").kendoMobileListView({
            dataSource: currentChannelModel.membersDS,
            template: $("#membersTemplate").html(),
            click: function (e) {
                var member = e.dataItem;
                currentChannelModel.currentMember = member;
                // display message actionsheet
                $("#memberActions").data("kendoMobileActionSheet").open();
            }
        });
    },

    onShow : function (e) {
      e.preventDefault();
      // hide action btn
      $("#channels > div.footerMenu.km-footer > a").css("display","none");


      var channelUUID = e.view.params.channel;
      var thisChannelModel = channelModel.findChannelModel(channelUUID);
      var thisUser = userModel.currentUser;
      var thisChannel = {};
      var contactUUID = null;
      currentChannelModel.currentChannel = thisChannelModel;
      var name = thisChannelModel.name;

      // Hide the image preview div
      channelView.hideChatImagePreview();
      APP.updateGeoLocation();

      if (name.length > 13) {
          name = name.substring(0,13)+"...";
      }
      currentChannelModel.privacyMode = false;
      // Privacy UI
      $('#privacyMode').html('<img src="images/privacy-off.svg" />');
      $("#privacyStatus").addClass("hidden");
      $("#channelNavBar").data('kendoMobileNavBar').title(name);

      if (thisChannelModel.isPrivate) {
          $('#messagePresenceButton').hide();
          currentChannelModel.privacyMode = true;
          // Privacy UI
          $('#privacyMode').html('<img src="images/privacy-on.svg" />');
          $("#privacyStatus").removeClass("hidden");
          var userKey = thisUser.publicKey, privateKey = thisUser.privateKey;
          if (thisChannelModel.members[0] === thisUser.userUUID)
              contactUUID = thisChannelModel.members[1];
          else
              contactUUID = thisChannelModel.members[0];

          currentChannelModel.currentContactUUID = contactUUID;
          var thisContact = contactModel.getContactModel(contactUUID);
          if (thisChannelModel.isPrivate) {
              $('#channelImage').attr('src', thisContact.photo);
          }

          currentChannelModel.currentContactModel = thisContact;
          var contactKey = thisContact.publicKey;
          if (contactKey === undefined) {
              getUserPublicKey(contactUUID, function (result, error) {
                  if (result.found) {
                      contactKey = result.publicKey;
                      thisContact.publicKey = contactKey;
                      updateParseObject('contacts', 'contactUUID', contactUUID, 'publicKey', contactKey);
                      thisChannel = new secureChannel(channelUUID, thisUser.userUUID, thisUser.alias, userKey, privateKey, contactUUID, contactKey);
                      thisChannel.onMessage(channelView.onChannelRead);
                      thisChannel.onPresence(channelView.onChannelPresence);
                      currentChannelModel.openChannel(thisChannel);
                      mobileNotify("Getting Previous Messages...");
                      var sentMessages = channelModel.getChannelArchive(currentChannelModel.currentChannel.channelId);
                      thisChannel.getMessageHistory(function (messages) {
                          currentChannelModel.messagesDS.data([]);

                          for (var i=0; i<messages.length; i++){
                              var message = messages[i];
                              var formattedContent = '';
                              if (message.content !== null) {
                                  formattedContent = formatMessage(message.content);
                              }
                              message.formattedContent = formattedContent;
                              // this is a private channel to activate the message timer
                              message.fromHistory = true;
                          }

                          currentChannelModel.messagesDS.data(messages);
                          currentChannelModel.messagesDS.pushCreate(sentMessages);

                          channelView.scrollToBottom();
                      });
                  } else {
                      mobileNotify('No secure connect for ' + thisContact.alias + ' ' + thisContact.name);
                  }



              });
          } else {
              currentChannelModel.currentChannel = thisChannelModel;
              thisChannel = new secureChannel(channelUUID, thisUser.userUUID, thisUser.alias, userKey, privateKey, contactUUID, contactKey);
              thisChannel.onMessage(channelView.onChannelRead);
              thisChannel.onPresence(channelView.onChannelPresence);
              mobileNotify("Getting Previous Messages...");
              currentChannelModel.openChannel(thisChannel);
              var sentMessages = channelModel.getChannelArchive(currentChannelModel.currentChannel.channelId);
              thisChannel.getMessageHistory(function (messages) {
                  currentChannelModel.messagesDS.data([]);
                  for (var i=0; i<messages.length; i++){
                      var message = messages[i];
                      var formattedContent = '';
                      if (message.content !== null) {
                          formattedContent = formatMessage(message.content);
                      }
                      message.formattedContent = formattedContent;
                      message.fromHistory = true;
                  }

                  currentChannelModel.messagesDS.data(messages);
                  currentChannelModel.messagesDS.pushCreate(sentMessages);
                  channelView.scrollToBottom();
              });

          }


      } else {
          $('#messagePresenceButton').show();
          // Provision a group channel
          thisChannel = new groupChannel(channelUUID, thisUser.userUUID, thisUser.alias, userKey);
          thisChannel.onMessage(channelView.onChannelRead);
          thisChannel.onPresence(channelView.onChannelPresence);
          mobileNotify("Getting Previous Messages...");
          thisChannel.getMessageHistory(function (messages) {
              APP.models.channel.messagesDS.data([]);
              for (var i=0; i<messages.length; i++){
                  var message = messages[i];
                  var formattedContent = '';
                  if (message.content !== null) {
                      formattedContent = formatMessage(message.content);
                  }
                  message.formattedContent = formattedContent;
              }

              currentChannelModel.messagesDS.data(messages);
              channelView.scrollToBottom();
          });
          currentChannelModel.openChannel(thisChannel);
      }

    },

    onHide : function (e) {
        e.preventDefault();
        if (currentChannelModel.currentChannel !== undefined) {
            currentChannelModel.handler.closeChannel();  

        }
    },

    archiveMessage : function (e){
        if (e !== undefined && e.preventDefault !== undefined) {
            e.preventDefault();
        }
        // close out li
        $(".selectedLI").velocity("slideUp", {delay: 150});

        //mobileNotify("message archived");

        // ToDo - wire up archive

        // ToDo - wire up requests
        $("#modalview-requestContent").data("kendoMobileModalView").open();
    },

    onChannelPresence : function () {
        var users = currentChannelModel.handler.listUsers();
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

        currentChannelModel.messagesDS.add(message);

        currentChannelModel.updateLastAccess();

        scrollToBottom();

        if (currentChannelModel.privacyMode) {
            kendo.fx($("#"+message.msgID)).fade("out").endValue(0.05).duration(9000).play();
        }
    },

    messageSend : function (e) {
        _preventDefault(e);

        var text = $('#messageTextArea').val();
        if (text.length === 0)
            return;
        var messageData = {geo: APP.location.position};
        if (currentChannelModel.currentMessage.photo !== null) {
            messageData.photo = currentChannelModel.currentMessage.photo;
        }
        currentChannelModel.handler.sendMessage(currentChannelModel.currentContactUUID, text, messageData, 86400);
        channelView.hideChatImagePreview();
        channelView._initMessageTextArea();
        currentChannelModel.currentMessage = {};

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
        currentChannelModel.privacyMode = ! currentChannelModel.privacyMode;
        if (currentChannelModel.privacyMode) {
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

        if ((scrollerHeight + currentChannelModel.topOffset) > viewportHeight) {
            var position = -1 * (scrollerHeight - viewportHeight - currentChannelModel.topOffset);
            APP.kendo.scroller().animatedScrollTo(0, position);
        }

    },

    tapChannel : function (e) {
        e.preventDefault();
        var target = $(e.touch.initialTouch);
        var dataSource = currentChannelModel.messagesDS;
        var messageUID = $(e.touch.currentTarget).data("uid");
        var message = dataSource.getByUid(messageUID);
        //$('.delete').css('display', 'none');
        //$('.archive').css('display', 'none');

        // Scale down the other photos in this chat...
        $('.chat-message-photo').removeClass('chat-message-photo').addClass('chat-message-photo-small');

        // If the photo is minimized and the user just clicked in the message zoom the photo in place
        $('#'+message.msgID + ' .chat-message-photo-small').removeClass('chat-message-photo-small').addClass('chat-message-photo');

        // User actually clicked on the photo so show the open the photo viewer
        if (target[0].className === 'chat-message-photo' || target[0].className === 'chat-message-photo-small') {
            var photoUrl = message.data.photo.photo;
            $('#modalPhotoViewImage').attr('src', photoUrl);

            $('#modalPhotoView').kendoMobileModalView("open");
        }

        if (currentChannelModel.privacyMode) {
            $('#'+message.msgID).removeClass('privateMode');
            $.when(kendo.fx($("#"+message.msgID)).fade("out").endValue(0.3).duration(3000).play()).then(function () {
                $("#"+message.msgID).css("opacity", "1.0");
                $("#"+message.msgID).addClass('privateMode');
            });
        }
    },

    swipeChannel : function (e) {
        e.preventDefault();
        var dataSource = currentChannelModel.messagesDS;
        var messageUID = $(e.touch.currentTarget).data("uid");
        var message = dataSource.getByUid(messageUID);

        if (currentChannelModel.privacyMode) {
            $('#'+message.msgID).removeClass('privateMode');
        }
        var selection = e.sender.events.currentTarget;
        var selectionListItem = $(selection).closest("div");
        var selectionInnerDiv = $(selectionListItem);

        console.log(selectionInnerDiv);

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
            /*
             // display the archive button
             var button = kendo.fx($(e.touch.currentTarget).find(".archive"));
             button.expand().duration(200).play();
             */

            $(selection).velocity({translateX:"0"},{duration: "fast"}).removeClass("message-active");


            console.log("right");
        }

    },

    holdChannel : function (e) {
        e.preventDefault();
        var dataSource = currentChannelModel.messagesDS;
        var messageUID = $(e.touch.currentTarget).data("uid");
        var message = dataSource.getByUid(messageUID);
        if (currentChannelModel.privacyMode) {
            $('#'+message.msgID).removeClass('privateMode');
            $.when(kendo.fx($("#"+message.msgID)).fade("out").endValue(0.3).duration(3000).play()).then(function () {
                $("#"+message.msgID).css("opacity", "1.0");
                $("#"+message.msgID).addClass('privateMode');
            });
        }
        $("#messageActions").data("kendoMobileActionSheet").open();
    }

};
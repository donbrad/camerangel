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


        // ToDo: Initialize list view

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
            filter: "div",
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

    onShow : function(){
        // set action button
        $("#channels > div.footerMenu.km-footer > a").attr("href", "#addChannel").css("display","inline-block");
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

        currentChannelModel.currentChannel.unbind('change', syncCurrentChannel);
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
               description = $('#channels-addChannel-description').val();

           channelModel.addChannel(name, description, true);

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
        this.addChatStep1();

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

            // hide trash cans
            $(".listTrash, #editChannel-Done").css("display", "none");
        } else {
            // channelMembers is returning to this view so update ux to reflect memberstate
            if (currentChannelModel.currentChannel.members.length > 0) {
                $(".addChatMembersBanner a").text("+ add new members");
            } else {
                $(".addChatMembersBanner a").text("No one is invited. Tap to send invites");
            }
        }

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
            userDataChannel.groupChannelInvite(currentChannelModel.membersAdded[ma], channelId, "You've been invited to " + currentChannelModel.currentChannel.name);
        }


        //Send Delete messages to users deleted from the channel
        for (var md = 0; md < currentChannelModel.membersDeleted.length; md++) {
            userDataChannel.groupChannelDelete(currentChannelModel.membersDeleted[md], channelId, currentChannelModel.currentChannel.name + "has been deleted.");
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

    deleteMember : function (e) {
        if (e.preventDefault !== undefined)
            e.preventDefault();

        var contactId = e.attributes['data-param'].value;
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

    doInit: function () {
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

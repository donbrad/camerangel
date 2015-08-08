function addChannel(e) {
	e.preventDefault();
	
	// make sure chat has a name
	if($("#channels-addChannel-name").val() !== ''){

	    var Channels = Parse.Object.extend("channels");
	    var channel = new Channels();
		
		var ChannelMap = Parse.Object.extend('channelmap');
		var channelMap = new ChannelMap();
	    
	    var name = $('#channels-addChannel-name').val(),
	        description = $('#channels-addChannel-description').val(), 
	        channelId = uuid.v4();
	        
	    channel.set("name", name );
	    channel.set("isOwner", true);
		channel.set('isPrivate', false);
	    channel.set("media",   true);
	    channel.set("archive", true);
	  
	    channel.set("description", description);
		channel.set("members", [APP.models.profile.currentUser.userUUID]);
		channel.set("invitedMembers", []);
	    channel.set("channelId", channelId);
	    
	    channel.setACL(APP.models.profile.parseACL);
		channel.save(null, {
	      success: function(channel) {
	        // Execute any logic that should take place after the object is saved.
	         
	          APP.models.channels.channelsDS.add(channel.attributes);
	          mobileNotify('Added channel : ' + channel.get('name'));
			  
			  APP.models.channels.currentModel = findChannelModel(channelId);
			  APP.models.channels.currentChannel = APP.models.channels.currentModel;
			  APP.kendo.navigate('#editChannel');
	      },
	      error: function(channel, error) {
	        // Execute any logic that should take place if the save fails.
	        // error is a Parse.Error with an error code and message.
	        mobileNotify('Error creating channel: ' + error.message);
	        handleParseError(error);
	      }
	    });
		
		channelMap.set("name", name);
		channelMap.set("channelId", channelId);
		channelMap.set("channelOwner", APP.models.profile.currentUser.userUUID);
		channelMap.set("members", [APP.models.profile.currentUser.userUUID]);
		
		 channelMap.save(null, {
	      success: function(channel) {
	        // Execute any logic that should take place after the object is saved.
	         
	         
	      },
	      error: function(channel, error) {
	        // Execute any logic that should take place if the save fails.
	        // error is a Parse.Error with an error code and message.
	        mobileNotify('Error creating channelMap: ' + error.message);
	        handleParseError(error);
	      }
	    });	
	} else {
		mobileNotify("Chat name is required");
	}
}

function onShowChannels(){
	// set action button
	$("#channels > div.footerMenu.km-footer > a").attr("href", "#addChannel");
    
}

function findChannelModel(channelId) {
	 var dataSource = APP.models.channels.channelsDS;
    dataSource.filter( { field: "channelId", operator: "eq", value: channelId });
    var view = dataSource.view();
    var channel = view[0];
	dataSource.filter([]);
	
	return(channel);
}


function addPrivateChannel (contactUUID, contactAlias, channelUUID) {
    var Channels = Parse.Object.extend("channels");
    var channel = new Channels();
	var publicKey = APP.models.profile.currentUser.get('publicKey');
    var guid = uuid.v4();
	
    channel.set("name", contactAlias);
    channel.set("isOwner", true);
	channel.set('isPrivate', true);
    channel.set("media",  true);
    channel.set("archive",  false);
    channel.set("description", "Private: " + contactAlias);
    channel.set("channelId", channelUUID);
	channel.set('userKey',  publicKey);
	channel.set('contactKey', null);
    channel.set("members", [APP.models.profile.currentUser.userUUID, contactUUID]);
    
    channel.setACL(APP.models.profile.parseACL);
    channel.save(null, {
      success: function(channel) {     
          APP.models.channels.channelsDS.add(channel.attributes);
          //closeModalViewAddChannel();
          mobileNotify('Added private channel : ' + channel.get('name'));
      },
      error: function(channel, error) {
        // Execute any logic that should take place if the save fails.
        // error is a Parse.Error with an error code and message.
        mobileNotify('Error creating channel: ' + error.message);
        handleParseError(error);
      }
    });
 
}
    
function syncCurrentChannel(e) {
	if (e.preventDefault !== undefined)
		e.preventDefault();
   updateParseObject('channels','channelId', APP.models.channels.currentChannel.channelId, e.field, this[e.field]); 
   APP.models.channels.currentModel.set(e.field, this[e.field]);
}
    
function editChannel(e) {
	if (e.preventDefault !== undefined)
		e.preventDefault();

	// Did a quick bind to the button, feel free to change 
   var channelId = e.button[0].attributes["data-channel"].value; 
   var dataSource = APP.models.channels.channelsDS;
    dataSource.filter( { field: "channelId", operator: "eq", value: channelId });
    var view = dataSource.view();
    var channel = view[0];
    dataSource.filter([]);
    
    APP.models.channels.currentModel = channel;
    APP.models.channels.currentChannel.unbind('change', syncCurrentChannel);
    APP.models.channels.currentChannel.set('channelId', channel.channelId);
    APP.models.channels.currentChannel.set('name', channel.name);
    APP.models.channels.currentChannel.set('description', channel.description);
    APP.models.channels.currentChannel.set('media', channel.media);
	if (channel.invitedMembers === undefined) {
		channel.invitedMembers = [];
	}
	APP.models.channels.currentChannel.set('invitedMembers', channel.invitedMembers);
	APP.models.channels.currentChannel.set('members', channel.members);
	APP.models.channels.currentChannel.set('isPrivate', channel.isPrivate);
	APP.models.channels.currentChannel.set('isOwner', channel.isOwner);
    APP.models.channels.currentChannel.set('archive', channel.archive);
    APP.models.channels.currentChannel.bind('change', syncCurrentChannel);
    
    APP.kendo.navigate('#editChannel');

}
    
function eraseChannel(e) {
	e.preventDefault();
    var channelId = e.context;
    mobileNotify("Clearing channel");
}

function archiveChannel(e) {
	e.preventDefault();
    var channelId = e.context;
    mobileNotify("Archiving channel"); 
}
    
function deleteChannel(e) {
	e.preventDefault();
	
    var channelId = e.button[0].attributes["data-channel"].value;  
    var dataSource = APP.models.channels.channelsDS;
    dataSource.filter( { field: "channelId", operator: "eq", value: channelId });
    var view = dataSource.view();
    var channel = view[0];
	 dataSource.filter([]);
	if (channel.isOwner) {
		// If this user is the owner -- delete the channel map
		deleteParseObject("channelmap", 'channelId', channelId);
	}
    dataSource.remove(channel); 
    deleteParseObject("channels", 'channelId', channelId); 
    mobileNotify("Removed channel : " + channel.get('name'));

}
    
function onChannelsClick(e) {
	e.preventDefault();
	var channel = e.dataItem;	
	var target = e.closest('a');
	APP.kendo.navigate('#channel?channel='+channel.channelId);
}

function gotoChannel(channelId) {
	APP.kendo.navigate('#channel?channel='+channelId);
}

function onInitChannels (e) {
    e.preventDefault();
    
    // set search bar 
    var scroller = e.view.scroller;
	scroller.scrollTo(0,-44);

	
    // ToDo: Initialize list view
	
     $("#channels-listview").kendoMobileListView({
        dataSource: APP.models.channels.channelsDS,
        template: $("#channels-listview-template").html(),
        click: function(e){
        	var selector = e.target[0].parentElement
        	if($(selector).hasClass("chat-mainBox") === true || e.target[0].className === "chat-mainBox"){
        		var channelUrl = "#channel?channel=" + e.dataItem.channelId;
        		APP.kendo.navigate(channelUrl);
        	} 
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
   
}

function listViewClick(e){
    
}
function doShowEventInputs(e) {
	if (e.preventDefault !== undefined)
		e.preventDefault();
	$('.addChannelEvent').removeClass('hidden');
}

function onShowAddChannel (e) {
	e.preventDefault();
	APP.models.channel.potentialMembersDS.data([]);
	APP.models.channel.potentialMembersDS.data(APP.models.contacts.contactsDS.data());
	APP.models.channel.membersDS.data([]);

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


}

function finalizeEditChannel(e) {
	e.preventDefault();
	
	var memberArray = new Array(), invitedMemberArray = new Array(), invitedPhoneArray = new Array(), members = APP.models.channel.membersDS.data();
	
	var channelId = APP.models.channels.currentModel.channelId;
	// It's a group channel so push this users UUID
	
	memberArray.push(APP.models.profile.currentUser.userUUID);
	for (var i=0; i<members.length; i++) {
		if(members[i].contactUUID !== null) {
			memberArray.push(members[i].contactUUID);
		} else {
			// No contactUUID so this user hasn't signed up yet - use the owners uuid for the contact
			invitedMemberArray.push(members[i].uuid);
			
			// User isn't signed up yet, store their phone number in the channel map so we can autoprovision their channels
			// when they do sign up
			invitedPhoneArray.push(members[i].phone);
		}
		
	}
	APP.models.channel.currentModel.members = memberArray;
	APP.models.channels.currentChannel.unbind('change', syncCurrentChannel);
	
	updateParseObject('channels', 'channelId', channelId, 'members', memberArray);
	updateParseObject('channels', 'channelId', channelId, 'invitedMembers', invitedMemberArray);
	
	// Update the channelmap entry so members can update or create the channel
	updateParseObject('channelmap', 'channelId', channelId, 'members', memberArray);
	// Add new members phone numbers to the channel map
	updateParseObject('channelmap', 'channelId', channelId, 'invitedMembers', invitedPhoneArray);

	// Reset UI
	$("#showEditDescriptionBtn").velocity("fadeIn");
	$("#channels-editChannel-description").css("display","none").val("");

	mobileNotify("Updating " + APP.models.channels.currentModel.name);
	
	APP.kendo.navigate('#channels');

	// Reset UI
	$("#channels-addChannel-description, #channels-addChannel-name").val('');
}

function onInitEditChannel (e) {
	if (e.preventDefault !== undefined)
		e.preventDefault();
	APP.models.channel.membersDS.data([]);
	$('#editChannelMemberList li').remove();
}

function deleteMember (e) {
	if (e.preventDefault !== undefined)
		e.preventDefault();
	var contactId = e.attributes['data-param'].value;
	var thisMember = findContactByUUID(contactId);
	APP.models.channel.potentialMembersDS.add(thisMember);
	APP.models.channel.potentialMembersDS.sync();
	APP.models.channel.membersDS.remove(thisMember);
	APP.models.channel.membersDS.sync();
	$('#'+contactId).remove();
	
}


function onShowEditChannel (e) {
	if (e.preventDefault !== undefined)
		e.preventDefault();
	
	var currentChannelModel = APP.models.channels.currentModel;
	var members = currentChannelModel.members, thisMember = {};
	var membersArray = new Array();
	
	//Zero out current members as we're going rebuild ds and ux
	APP.models.channel.membersDS.data([]);
	$('#editChannelMemberList').empty();

	if (members.length > 0) {

		// Group channel members are referenced indirectly by uuid 
		// channel can include invited users who havent signed up yet

		for (var i=0; i<members.length; i++) {
			thisMember = getContactModel(members[i]);

			// Current user will be undefined in contact list.
			if (thisMember !== undefined) {
				APP.models.channel.membersDS.add(thisMember);
				
				// Display the right data for name
				var name = thisMember.name; 
				var alias = thisMember.alias;
				var mainName, smallName = null;
				if (alias !== ''){
					mainName = alias;
					smallName = name;
				} else {
					mainName = name;
					smallName = alias;
				}
				$("#editChannelMemberList").append('<li id="'+thisMember.uuid+
					'">'+
					'<div class="left"><img class="circle-img-md editChatImg" src="'+ thisMember.photo +'"/></div>' + 
					'<h4>'+ mainName + ' <img class="user-status-icon" src="images/user-verified.svg" />'+
					'<span class="contacts-alias-sm"> '+ smallName +'</span>' +
					'<span class="right">' +
					'<a class="listTrash" data-param="' + thisMember.uuid +
					'" data-role="button" class="clearBtn" data-click="deleteMember" onclick="deleteMember(this)" ><img src="images/trash.svg" /></a></span>' +
					'</h4><p class="helper">Status</p>' + 
					'<div class="clearfix"></div></li>');	
			}
		}

		if (currentChannelModel.isOwner && currentChannelModel.invitedMembers !== undefined) {
			members = currentChannelModel.invitedMembers;
			for (var j=0; j<members.length; j++) {
				thisMember = findContactByUUID(members[j]);
				APP.models.channel.membersDS.add(thisMember);
				// Display the right data for name
				var name = thisMember.name; 
				var alias = thisMember.alias;
				var mainName, smallName = "";
				if (alias !== '' && name === alias){
					mainName = alias;
				} else if (alias !== ''){
					mainName = alias;
					smallName = name;
				} else {
					mainName = name;
					smallName = alias;
				}
				$("#editChannelMemberList").append('<li id="'+thisMember.uuid+'">' +
					'<div class="left"><img class="circle-img-md editChatImg" src="'+ thisMember.photo +'"/></div>' +
					'<h4>'+ mainName + 
					'<span class="contacts-alias-sm"> '+ smallName +'</span>' +
					'<a class="right listTrash" data-param="' + thisMember.uuid + '" data-role="button" class="km-button" data-click="deleteMember" onclick="deleteMember(this)"><img src="images/trash.svg" /></a>' +
					'</h4><p class="helper">Unverified • Status</p><div class="clearfix"></div></li>');	
			}
		}	
		
	} else {
		$(".addChatMembersBanner a").text("No one is invited. Tap to send invites");
		
	}

	// hide trash cans
	$(".listTrash, #listDone").css("display", "none");
		
}

function doShowChannelMembers (e) {
	if (e.preventDefault !== undefined)
		e.preventDefault();
	
	var currentChannelModel = APP.models.channels.currentChannel;
    APP.models.channel.currentModel = currentChannelModel;
	var members = currentChannelModel.members, invitedMembers = currentChannelModel.invitedMembers;


	// Need to break observable link or contacts get deleted.
	var contactArray = APP.models.contacts.contactsDS.data().toJSON();

	// create an easy reference to the potential members data source
	var dataSource = APP.models.channel.potentialMembersDS;

	// Zero potential members data source so we can add all contacts
	dataSource.data([]);

	// Add current contacts to potential members data source
	// we delete members from potential members as we add them to members data source
	dataSource.data(contactArray);


	// Zero out member datasource so we can rebuild it
	APP.models.channel.membersDS.data([]);

	if (members.length > 0) {

		for (var i=0; i<members.length; i++) {
			var thisMember = getContactModel(members[i]);
			if (thisMember === undefined)
				thisMember = findContactByUUID(members[i]);
			if (thisMember !== undefined) {

				APP.models.channel.membersDS.add(thisMember);
				dataSource.filter( { field: "uuid", operator: "eq", value: thisMember.uuid});
				var view = dataSource.view();
				var contact = view[0];
				dataSource.filter([]);
				dataSource.remove(contact.items[0]);  // new object layout for aggregate datasources
			}

		}
		APP.models.channel.potentialMembersDS.sync();
	}

	if (invitedMembers.length > 0) {
		for (var j=0; j<invitedMembers.length; j++) {
			var invitedMember = findContactByUUID(invitedMembers[j]);
			if (invitedMember !== undefined) {

				APP.models.channel.membersDS.add(invitedMember);
				dataSource.filter( { field: "uuid", operator: "eq", value: invitedMember.uuid});
				var view1 = dataSource.view();
				var contact1 = view1[0];
				dataSource.filter([]);
				dataSource.remove(contact1.items[0]); // new object layout for aggregate datasources
			}


		}

	}
	
}

function doInitChannelMembers (e) {
	if (e.preventDefault !== undefined)
		e.preventDefault();

	APP.models.channel.potentialMembersDS.data([]);
	$("#channelMembers-listview").kendoMobileListView({
        dataSource: APP.models.channel.potentialMembersDS,
        template: $("#memberTemplate").html(),
		headerTemplate: "${value}",
		filterable: {
                field: "name",
                operator: "startswith",
                placeholder: "Search contacts..."
            },
		click: function (e) {
			var thisMember = e.dataItem;
			
			APP.models.channel.membersDS.add(thisMember);
			if (thisMember.contactUUID === null) {
				APP.models.channels.currentChannel.invitedMembers.push(thisMember.uuid);

			} else {
				APP.models.channels.currentChannel.members.push(thisMember.contactUUID);
			}
			APP.models.channel.membersDS.sync();

			APP.models.channel.potentialMembersDS.remove(thisMember);
			$(".addedChatMember").text("+ added " + thisMember.name).velocity("slideDown", { duration: 300, display: "block"}).velocity("slideUp", {delay: 1400, duration: 300, display: "none"});
		}
		
    });
}

function doInitChannelPresence (e) {
	if (e.preventDefault !== undefined){
		e.preventDefault();
	}
	$("#channelPresence-listview").kendoMobileListView({
        dataSource: APP.models.channel.membersDS,
        template: $("#memberTemplate").html(),

		click: function (e) {
			var thisMember = e.dataItem;
			// ToDo: enable private message and private package for this memeber
			
		}
		
    });
}

function doShowChannelPresence (e) {
	if (e.preventDefault !== undefined)
		e.preventDefault();
		var currentChannelModel = APP.models.channels.currentChannel;
	APP.models.channel.currentModel = currentChannelModel;
	APP.models.channel.membersDS.data([]);
	var members = currentChannelModel.members;
	if (currentChannelModel.isPrivate) {
		var privateContact = ''
		if (members[0] === APP.models.profile.currentUser.userUUID) {
			privateContact = getContactModel(members[1]);
		} else {
			privateContact = getContactModel(members[0]);
		}
		APP.models.channel.membersDS.add(privateContact);
	} 
  
}

// Get message count for this Chat
function getMessageCount(callback) {

}

function showChatDescription(e){
	$("#channels-addChannel-description").velocity("slideDown",{duration: 1500, easing: "spring", display: "block"});
	$("#addChatDescription").velocity("fadeOut");
}

function resetAddChatUI(e){
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
	addChatStep1();
	
}
function addChatStep1(e){
	$("#chat-title-setup").velocity("slideUp", {duration: 300});
	$("#addChat-step2").velocity("fadeOut", {duration: 200});
	$("#addChat-step1").velocity("fadeIn", {duration: 200, delay:200});
	//$("#addChat-createBtn").velocity("slideUp", {display: "none", duration: 300});
}


function addChatStep2(e) {
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

}

function sendGhostChat(e) {
	if (e !== undefined && e.preventDefault !== undefined) {
		e.preventDefault();
	}


	APP.kendo.navigate('#:back');
}

function doOpenGhostChat(e) {
	if (e !== undefined && e.preventDefault !== undefined) {
		e.preventDefault();
	}

	APP.views.ghostEditor.title="ghostChat";
	APP.views.ghostEditor.sendAction = sendGhostChat;

	$("#ghostChatEditor").kendoEditor({
		tools: [
			"bold",
			"italic",
			"underline",
			"justifyLeft",
			"justifyCenter",
			"justifyRight",
			"insertUnorderedList",
			"insertOrderedList",
			"indent",
			"outdent"

		]
	});

}


function onOpenGhostChat(e) {
	if (e !== undefined && e.preventDefault !== undefined) {
		e.preventDefault();
	}
}

function toggleListTrash() {
	$(".listTrash").velocity("fadeIn", {duration: 100});
	$("#listTrash").velocity("fadeOut", {duration: 100});
	$("#listDone").velocity("fadeIn", {delay: 100, duration: 100});
	$(".addChatMembersBanner").velocity("slideUp", {duration: 100});
}

function toggleListDone(){
	$("#listDone").velocity("fadeOut", {duration: 100});
	$(".addChatMembersBanner").velocity("slideDown", {duration: 100});
	$(".listTrash").velocity("fadeOut", {duration: 100});
	$("#listTrash").velocity("fadeIn", {delay: 100, duration: 100});
}

function showEditDescription(){
	$("#channels-editChannel-description").velocity("slideDown",{duration: 1500, easing: "spring", display: "block"});
	$("#showEditDescriptionBtn").velocity("fadeOut");
}

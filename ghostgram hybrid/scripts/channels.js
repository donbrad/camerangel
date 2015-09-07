

function onShowChannels(){
	// set action button
	$("#channels > div.footerMenu.km-footer > a").attr("href", "#addChannel").css("display","inline-block");

}

function onBeforeHideChannels(){
	// set action button
	$("#channels > div.footerMenu.km-footer > a").css("display","none");

}

function syncCurrentChannel(e) {
	if (e.preventDefault !== undefined)
		e.preventDefault();

	updateParseObject('channels','channelId', currentChannelModel.currentChannel.channelId, e.field, this[e.field]);
	currentChannelModel.currentChannel.set(e.field, this[e.field]);
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

	channelModel.deleteChannel(channelId);

}
    
/*
function onChannelsClick(e) {
	e.preventDefault();
	var channel = e.dataItem;	
	var target = e.closest('a');
	APP.kendo.navigate('#channel?channel='+channel.channelId);
}


function gotoChannel(channelId) {
	APP.kendo.navigate('#channel?channel='+channelId);
}
*/


function onInitChannels (e) {
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
        	checkEmptyUIState(channelModel.channelsDS, "#channelListDiv");
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
    			$(selection).velocity({translateX:"0"},{duration: 150}).removeClass("chat-active");
    		}
    	}
    	
    });
    
   	
}

function cancelEditChat(e){

}


function doShowEventInputs(e) {
	if (e.preventDefault !== undefined)
		e.preventDefault();
	$('.addChannelEvent').removeClass('hidden');
}

function onShowAddChannel (e) {
	e.preventDefault();
	currentChannelModel.potentialMembersDS.data([]);
	currentChannelModel.potentialMembersDS.data(contactModel.contactsDS.data());
	currentChannelModel.membersDS.data([]);

	$('.addChannelEvent').addClass('hidden');

	// hide channel description
	$("#channels-addChannel-description").css("display","none");
}


/*

function appendMemberToUXList (thisMember) {
	// Display the right data for name
	var name = thisMember.name;
	var alias = thisMember.alias;
	var mainName, smallName = null;
	if (alias !== ''){
		mainName = alias;
		smallName = name;
	} else {
<<<<<<< HEAD
		$(".addChatMembersBanner a").text("No one is invited. Tap to send invites");
		
	}
	
	// hide trash cans
	$(".listTrash, #listDone").css("display", "none");
		
}

function doShowChannelMembers (e) {
	if (e.preventDefault !== undefined)
		e.preventDefault();

	var members = currentChannelModel.members, invitedMembers = currentChannelModel.invitedMembers;


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
=======
		mainName = name;
		smallName = alias;
>>>>>>> master
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

function appendInvitedMemberToUXList (thisMember) {
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

*/




function doInitChannelPresence (e) {
	if (e.preventDefault !== undefined){
		e.preventDefault();
	}
	$("#channelPresence-listview").kendoMobileListView({
        dataSource: currentChannelModel.membersDS,
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
		var currentChannel = APP.models.channels.currentChannel;
	currentChannelModel.currentChannel = currentChannel;
	currentChannelModel.membersDS.data([]);
	var members = currentChannelModel.currentChannel.members;
	if (currentChannelModel.isPrivate) {
		var privateContact = '';
		if (members[0] === userModel.currentUser.userUUID) {
			privateContact = contactModel.getContactModel(members[1]);
		} else {
			privateContact = contactModel.getContactModel(members[0]);
		}
		currentChannelModel.membersDS.add(privateContact);
	} 
  
}

// Get message count for this Chat
function getMessageCount(callback) {

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

}

function showEditDescription(){
	$("#channels-editChannel-description").velocity("slideDown",{duration: 1500, easing: "spring", display: "block"});
	$("#showEditDescriptionBtn").velocity("fadeOut");
}

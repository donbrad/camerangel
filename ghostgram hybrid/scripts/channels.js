



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
*


function listViewClick(e){
    
}

*/


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

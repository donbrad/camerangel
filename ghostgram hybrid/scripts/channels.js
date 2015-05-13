function addChannel(e) {
    e.preventDefault();

    var Channels = Parse.Object.extend("channels");
    var channel = new Channels();
    
    var name = $('#channels-addChannel-name').val(),
        media = $('#channels-addChannel-media').val(),
        archive = $('#channels-addChannel-archive').val(),
        description = $('#channels-addChannel-description').val(), 
        guid = uuid.v4()
        
    channel.set("name", name );
    channel.set("isOwner", true);
	channel.set('isPrivate', false);
    channel.set("media",  media === "true" ? true : false);
    channel.set("archive",  archive === "true" ? true : false);
  
    channel.set("description", description);
	channel.set("members", []),
    channel.set("channelId", guid);
    
    channel.setACL(APP.models.profile.parseACL);
    channel.save(null, {
      success: function(channel) {
        // Execute any logic that should take place after the object is saved.
         
          APP.models.channels.channelsDS.add(channel.attributes);
          mobileNotify('Added channel : ' + channel.get('name'));
		  APP.models.channels.currentModel = findChannelModel(guid);
		  APP.kendo.navigate('#editChannel');
      },
      error: function(channel, error) {
        // Execute any logic that should take place if the save fails.
        // error is a Parse.Error with an error code and message.
        mobileNotify('Error creating channel: ' + error.message);
        handleParseError(error);
      }
    });
 
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
    
    var guid = uuid.v4();
    var RSAkey = cryptico.generateRSAKey(1024);
	var publicKey = cryptico.publicKeyString(RSAkey);
	var privateKey = cryptico.privateKeyString(RSAkey);
	
    channel.set("name", contactAlias);
    channel.set("isOwner", true);
	channel.set('isPrivate', true);
    channel.set("media",  true);
    channel.set("archive",  false);
    channel.set("description", "P2P : " + contactAlias);
    channel.set("channelId", channelUUID);
	channel.set('userKey',  publicKey);
	channel.set('userPrivateKey', privateKey);
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
    
function syncCurrentChannel(e)
{
   updateParseObject('channels','channelId', APP.models.channels.currentChannel.channelId, e.field, this[e.field]); 
   APP.models.channels.currentModel.set(e.field, this[e.field]);
}
    
function editChannel(e) {
   var channelId = e.context; 
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
	APP.models.channels.currentChannel.set('members', channel.members);
	APP.models.channels.currentChannel.set('isPrivate', channel.isPrivate);
    APP.models.channels.currentChannel.set('archive', channel.archive);
    APP.models.channels.currentChannel.bind('change', syncCurrentChannel);
    
    APP.kendo.navigate('#editChannel');
}
    
function eraseChannel(e) {
    var channelId = e.context;  
}

function archiveChannel(e) {
    var channelId = e.context; 
}
    
function deleteChannel (e) {
   var channelId = e.context;  
    var dataSource = APP.models.channels.channelsDS;
    dataSource.filter( { field: "channelId", operator: "eq", value: channelId });
    var view = dataSource.view();
    var channel = view[0];
	 dataSource.filter([]);
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
    // ToDo: Initialize list view
	
     $("#channels-listview").kendoMobileListView({
        dataSource: APP.models.channels.channelsDS,
        template: $("#channels-listview-template").html()
		
    });
}

function onShowAddChannel (e) {
	e.preventDefault();
	APP.models.channel.potentialMembersDS.data([]);
	APP.models.channel.potentialMembersDS.data(APP.models.contacts.contactsDS.data());
	APP.models.channel.membersDS.data([]);
}

function finalizeEditChannel(e) {
	e.preventDefault();
	var memberArray = new Array(), members = APP.models.channel.membersDS.data();
	var channelId = APP.models.channels.currentModel.channelId;
	
	for (var i=0; i<members.length; i++) {
		memberArray.push(members[i].uuid);
	}
	
	APP.models.channel.currentModel.members = memberArray;
	
	updateParseObject('channels', 'channelId', channelId, 'members', memberArray);
	
	APP.kendo.navigate('#:back');
}

function onInitEditChannel (e) {
	e.preventDefault();
	APP.models.channel.membersDS.data([]);
	$('#editChannelMemberList li').remove(); 
	
}

function deleteMember (e) {
	var contactId = e.attributes['data-param'].value;
	var thisMember = findContactByUUID(contactId);
	APP.models.channel.potentialMembersDS.add(thisMember);
	APP.models.channel.potentialMembersDS.sync();
	APP.models.channel.membersDS.remove(thisMember);
	APP.models.channel.membersDS.sync();
	$('#'+contactId).remove();
	
}

function onShowEditChannel (e) {
	var currentChannelModel = APP.models.channels.currentModel;
	var members = currentChannelModel.members;
	var membersArray = new Array();
	
	
	if (members.length > 0) {
		if (currentChannelModel.isPrivate) {
			// Private channel members are referenced by contactUUID -- users official id 
			// as private channels are only between verified members
			//
			var privateContact = ''
			if (members[0] === APP.models.profile.currentUser.userUUID) {
				privateContact = getContactModel(members[1]);
			} else {
				privateContact = getContactModel(members[0]);
			}
			
			APP.models.channel.membersDS.add(privateContact);
		} else {
			// Group channel members are referenced indirectly by uuid 
			// channel can include invited users who havent signed up yet
			
			for (var i=0; i<members.length; i++) {
				var thisMember = findContactByUUID(members[i]);
				APP.models.channel.membersDS.add(thisMember);
				
				$("#editChannelMemberList").append('<li id="'+thisMember.uuid+'" class="ghostMemberLi"> <span class="ghostMemberName">'+ thisMember.name + ' (' + thisMember.alias + ')' + '</span><span style="float:right; font-size: 10px;"> <a data-param="' + thisMember.uuid + '" data-role="button" class="km-button" data-click="deleteMember" onclick="deleteMember(this)" ><i class="ghostIconNavbar fa fa-trash"></i></a></span></li>');
				
			}
		}		
		
	}
		
}

function doShowChannelMembers (e) {
	e.preventDefault();
	
	var currentChannelModel = APP.models.channels.currentChannel;
	if (currentChannelModel.isPrivate) {
		mobileNotify("Sorry, you cannot change members in a Private Channel");
		APP.kendo.navigate('#:back');
	}
    APP.models.channel.currentModel = currentChannelModel;
	var members = currentChannelModel.members;
	APP.models.channel.potentialMembersDS.data([]);
	APP.models.channel.potentialMembersDS.data(APP.models.contacts.contactsDS.data());
	if (currentChannelModel.isPrivate) {
		
		var privateContact = ''
		if (members[0] === APP.models.profile.currentUser.userUUID) {
			privateContact = getContactModel(members[1]);
		} else {
			privateContact = getContactModel(members[0]);
		}
		APP.models.channel.membersDS.data([]);
		APP.models.channel.membersDS.add(privateContact);
		APP.models.channel.potentialMembersDS.data([]);
		
	} else {
		
		if (members.length > 0) {
			APP.models.channel.membersDS.data([]);
			for (var i=0; i<members.length; i++) {
				var thisMember = findContactByUUID(members[i]);
				APP.models.channel.membersDS.add(thisMember);
				APP.models.channel.potentialMembersDS.remove(thisMember);
			}
		}		
	}	
}

function doInitChannelMembers (e) {
	e.preventDefault(); 

	$("#channelMembers-listview").kendoMobileListView({
        dataSource: APP.models.channel.potentialMembersDS,
        template: $("#memberTemplate").html(),
		filterable: {
                field: "name",
                operator: "startswith"
            },
		click: function (e) {
			var thisMember = e.dataItem;
			APP.models.channel.membersDS.add(thisMember);
			APP.models.channel.membersDS.sync();
			var memberString = $('#editChannelMembers').val();
			memberString += thisMember.name + ' (' + thisMember.alias + ')\r';
			 $('#editChannelMembers').val(memberString);
			$("#editChannelMemberList").append('<li id="'+thisMember.uuid+'" style="clear:both; font-size: 13px;">'+ thisMember.name + ' (' + thisMember.alias + ')' + '<span style="float:right; padding-right: 12px; font-size: 10px;"> <a data-param="' + thisMember.uuid + '" data-role="button" class="km-button" data-click="deleteMember" onclick="deleteMember(this)" ><i class="ghostIconNavbar fa fa-trash"></i></a></span></li>');
			APP.models.channel.potentialMembersDS.remove(thisMember);
			APP.models.channel.potentialMembersDS.sync();
			
		}
		
    });
}

function onInitChannel(e) {
	e.preventDefault();
	
	APP.models.channel.messagesDS.data([]);
	APP.models.channel.membersDS.data([]);
	
	 $("#messages-listview").kendoMobileListView({
        dataSource: APP.models.channel.messagesDS,
        template: $("#messagesTemplate").html(),
        click: function (e) {
            var message = e.dataItem;
			APP.models.channel.currentModel = message;
            // display message actionsheet    
			$("#messageActions").data("kendoMobileActionSheet").open();
        }
     });
	
		$("#channelMembers-listview").kendoMobileListView({
        dataSource: APP.models.channel.membersDS,
        template: $("#membersTemplate").html(),
        click: function (e) {
            var member = e.dataItem;
			APP.models.channel.currentMember = member;
            // display message actionsheet    
			$("#memberActions").data("kendoMobileActionSheet").open();
        }
     });
}	

function onChannelPresence () {
	var users = APP.models.channel.currentChannel.listUsers();
}

function onChannelRead(message) {
	APP.models.channel.messagesDS.add(message);	
}

function timeSince(date) {
	var seconds = Math.floor(((new Date().getTime()/1000) - date)),
	interval = Math.floor(seconds / 31536000);

	if (interval > 1) return interval + "y";

	interval = Math.floor(seconds / 2592000);
	if (interval > 1) return interval + "m";

	interval = Math.floor(seconds / 86400);
	if (interval >= 1) return interval + "d";

	interval = Math.floor(seconds / 3600);
	if (interval >= 1) return interval + "h";

	interval = Math.floor(seconds / 60);
	if (interval > 1) return interval + "m ";

	return Math.floor(seconds) + "s";
}

function onHideChannel(e) {
	e.preventDefault();
	if (APP.models.channel.currentChannel !== undefined)
		APP.models.channel.currentChannel.quit();   // Unsubscribe on current channel.
}

function onShowChannel(e) {
	e.preventDefault();
	var channelUUID = e.view.params.channel;
	var thisChannelModel = findChannelModel(channelUUID);
	var thisUser = APP.models.profile.currentUser;
	
	var contactUUID = null;
	
 
	if (thisChannelModel.isPrivate) {
		
		var userKey = thisUser.publicKey, privateKey = thisUser.privateKey;
		if (thisChannelModel.members[0] === thisUser.userUUID)
			contactUUID = thisChannelModel.members[1];
		else 
			contactUUID = thisChannelModel.members[0];	
		
		APP.models.channel.currentContactUUID = contactUUID;
		var thisContact = getContactModel(contactUUID);
		APP.models.channel.currentContactModel = thisContact;
		var contactKey = thisContact.publicKey;
		if (contactKey === undefined) {
			getUserPublicKey(contactUUID, function (result, error) {
				if (result.found) {
					contactKey = result.publicKey;
					thisContact.publicKey = contactKey;
					updateParseObject('contacts', 'contactUUID', contactUUID, 'publicKey', contactKey);
					var thisChannel = new secureChannel(thisUser.userUUID, channelUUID, userKey, privateKey, contactKey);
					thisChannel.onMessage(onChannelRead);
					thisChannel.onPresence(onChannelPresence);
					mobileNotify("Getting Previous Messages...");
					thisChannel.getMessageHistory(function (messages) {
						APP.models.channel.messagesDS.data([]);
						APP.models.channel.messagesDS.data(messages);		
					});
				} else {
					mobileNotify('No secure connect for ' + thisContact.alias + ' ' + thisContact.name);
				}
				APP.models.channel.currentChannel = thisChannel;
				APP.models.channel.currentModel = thisChannelModel;
				var name = thisChannelModel.name;

				if (thisChannelModel.isPrivate) {
					name = '{' + name + '}';
					if (name.length > 16)
					 name = name.substring(0,15)+ '...}';
				} else {
					if (name.length > 17)
					name = name.substring(0,17)+"...";
				}

				$("#channelNavBar").data('kendoMobileNavBar').title(name);	
			});
		} else {
			var thisChannel = new secureChannel(channelUUID, thisUser.userUUID, thisUser.alias, userKey, privateKey, contactUUID, contactKey);
			thisChannel.onMessage(onChannelRead);
			thisChannel.onPresence(onChannelPresence);
			mobileNotify("Getting Previous Messages...");
			thisChannel.getMessageHistory(function (messages) {
				APP.models.channel.messagesDS.data([]);
				APP.models.channel.messagesDS.data(messages);		
			});
			APP.models.channel.currentChannel = thisChannel;
			APP.models.channel.currentModel = thisChannelModel;
			var name = thisChannelModel.name;

			if (thisChannelModel.isPrivate) {
				name = '{' + name + '}';
				if (name.length > 16)
				 name = name.substring(0,15)+ '...}';
			} else {
				if (name.length > 17)
				name = name.substring(0,17)+"...";
			}

			$("#channelNavBar").data('kendoMobileNavBar').title(name);
		}
		
		
	} else {
		// Provision a group channel
	}
	

	
	
}

function messageSend(e) {
	e.preventDefault();
	var text = $('#messageTextArea').val();
	APP.models.channel.currentChannel.sendMessage(APP.models.channel.currentContactUUID, text, 86400);
	_initMessageTextArea();
}

function _initMessageTextArea() {
	
	$('#messageTextArea').val('');
	$('#messageTextArea').attr("rows", "2");
	
}

function messageEraser (e) {
	e.preventDefault();
	_initMessageTextArea();	
}

function messageLockButton (e) {
	e.preventDefault();
	APP.models.channel.messageLock = !APP.models.channel.messageLock;
	if (APP.models.channel.messageLock) {
		$('#messageLockButton').html('<i class="fa fa-lock"></i>');
	} else {
		$('#messageLockButton').html('<i class="fa fa-unlock"></i>');
	}
}

function AutoGrowTextArea(textField)
{
  if (textField.clientHeight < textField.scrollHeight)
  {
    textField.style.height = textField.scrollHeight + "px";
    if (textField.clientHeight < textField.scrollHeight)
    {
      textField.style.height = 
        (textField.scrollHeight * 2 - textField.clientHeight) + "px";
    }
  }
}
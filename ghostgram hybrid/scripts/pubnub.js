function dataChannelRead (m, envelope, channel) {
    switch(m.type) {
		case 'privateInvite' : {
				
		} break;
			
		case 'privateInitiate' : {
			APP.models.privateChannel.contactUUID = m.senderUUID;
			APP.models.privateChannel.contactAlias = m.senderAlias;	
			APP.models.privateChannel.channelUUID = m.channelUUID;	
		} break;
	}
}

// Send the invite through the data channel
function privateChannelInvite(contactUUID, message) {
	 var msg = new Object();

	msg.type = 'privateinvite';
	msg.senderUUID = APP.models.profile.currentUser.get('userUUID');
	msg.senderName = APP.models.profile.currentUser.get('alias');
	msg.content  = {type: 'text', message : message};
	msg.time = new Date().getTime();


	APP.pubnub.publish({
		 channel: contactUUID,        
		 message: msg,
		 success: channelSuccess,
		 error: channelError,
	 });
}


// Initial a privateChannel (Person2Person messaging)
function privateChannelInititate (contactUUID) {
	// create a unique channel id;
	pcUUID = uuid.v4();
	
	App.pubnub.privateChannel = pcUUID;
	var msg = new Object();
	msg.type = 'privateinit';
	msg.senderUUID = APP.models.profile.currentUser.get('uuid');
	msg.senderName = APP.models.profile.currentUser.get('alias');
	msg.time = new Date().getTime();
	msg.channelUUID = pcUUID;
	APP.pubnub.publish({
		 channel: contactUUID,        
		 message: msg,
		 success: channelSuccess,
		 error: channelError,
	 });
}

function channelSuccess(status) {
	
}

function channelError(error) {
	notifyMobile('Channel Error : ' + error)
}
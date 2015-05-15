

function dataChannelRead (m) {
    switch(m.type) {
			
			//  { type: 'privateInvite',  channelId: <channelUUID>,  owner: <ownerUUID>, message: <text>, time: current time}
		case 'privateInvite' : {
			
				// Todo:  Does private channel exist?  If not create,  if so notify user of request
		} break;
			
			//  { type: 'channelInvite',  channelId: <channelUUID>, owner: <ownerUUID>}
		case 'channelInvite' : {
			// Todo:  Does private channel exist?  If not create,  if so notify user of request
		} break;
			
			//  { type: 'packageOffer',  channelId: <channelUUID>, owner: <ownerUUID>, packageId: <packageUUID>, private: true|false, type: 'text'|'pdf'|'image'|'video', title: <text>, message: <text>}
		case 'packageOffer' : {
			
		} break;
			
				//  { type: 'packageRequest',  channelId: <channelUUID>, owner: <ownerUUID>, packageId: <packageUUID>, private: true|false, message: <text>}
		case 'packageRequest' : {
			
		} break;

			
	}
}


// Send the invite through the data channel
function privateChannelInvite(contactUUID, channelUUID, message) {
	 var msg = new Object();

	msg.type = 'privateInvite';
	msg.owner = APP.models.profile.currentUser.get('userUUID');
	msg.channel = channelUUID;
	msg.message  = message;
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
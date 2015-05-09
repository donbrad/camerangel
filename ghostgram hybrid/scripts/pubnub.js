

function dataChannelRead (m, envelope, channel) {
    switch(m.type) {
			//  { type: 'privateInvite',  channelId: <channelUUID>,  owner: <ownerUUID>}
		case 'privateInvite' : {
				
		} break;
			
			//  { type: 'channelInvite',  channelId: <channelUUID>, owner: <ownerUUID>}
		case 'channelInvite' : {
			
		} break;
			//  { type: 'packageOffer',  channelId: <channelUUID>, owner: <ownerUUID>, type: 'text'|'pdf'|'image'|'video', title: <text>, message: <text>}
		case 'packageOffer' : {
			
		} break;
			
	}
}

function appChannelRead (m, envelope, channel) {
    switch(m.type) {		
			//  { type: 'newUser',  userID: <userUUID>,  phone: <phone>, email: <email>}
			// New user joined service -- enables users to update contact info
		case 'newUser' : {
			
		} break;
			
			//  { type: 'userValidated',  userID: <userUUID>,  phone: <phone>, email: <email>}
			// User has validated phone and email -- enables users to update contact info
		case 'userValidated' : {
			
		} break;
			//  { type: 'userBlock',  userID: <userUUID>,  phone: <phone>, email: <email>}
		case 'userBlock' : {
			
		} break;
			//  { type: 'appInfo',  level: 'info'|'update'|issue', id: <id>  message: <text>, url: <url>}
		case 'appInfo' : {
			
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
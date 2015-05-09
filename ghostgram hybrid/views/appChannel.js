function appNewUser(userUUID, phone, email) {
		 var msg = new Object();

	msg.type = 'newUser';
	msg.userUUID = userUUID;
	msg.phone = phone;
	msg.email = email;
	msg.time = new Date().getTime();


	APP.pubnub.publish({
		 channel: 'ghostgrams129195720',        
		 message: msg,
		 success: channelSuccess,
		 error: channelError,
	 });
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
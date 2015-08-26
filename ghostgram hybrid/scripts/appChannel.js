function appNewUser(userUUID, phone, email) {
	 var msg = {};

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

function appUserValidated(userUUID, phone, email, publicKey) {
	 var msg = {};

	msg.type = 'userValidated';
	msg.userUUID = userUUID;
	msg.phone = phone;
	msg.email = email;
	msg.publicKey = publicKey;
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
			//  { type: 'newUser',  userId: <userUUID>,  phone: <phone>, email: <email>}
			// New user joined service -- enables users to update contact info
		case 'newUser' : {
			// Todo:  Scan contact list to see if this new user is a contact.   haven't seen userid so scan by phone.
			var contact = findContactByPhone(m.phone);
			if (contact !== undefined) {
				contact.set('contactUUID', m.userId);
				contact.set('contactEmail', m.email);
				updateParseObject('contacts', 'uuid', contact.uuid, 'contactUUID', m.userId);
				updateParseObject('contacts', 'uuid', contact.uuid, 'contactEmail', m.email);
			}
		} break;
			
			//  { type: 'userValidated',  userId: <userUUID>,  phone: <phone>, email: <email>, publicKey: <publicKey>}
			// User has validated phone and email -- enables users to update contact info and get private key for P2P and Secure Package
		case 'userValidated' : {
			// Todo: Scan contact list for useruuid and then by phone.
			var contact = findContactModel(m.userId);
			if (contact === undefined) {
				contact = findContactByPhone(m.phone);
			}
			if (contact === undefined) {
				return;
			}
			contact.set('contactUUID', m.userId);
			contact.set('contactEmail', m.email);
			contact.set('publicKey', m.publicKey);
			
			updateParseObject('contacts', 'uuid', contact.uuid, 'contactUUID', m.userId);
			updateParseObject('contacts', 'uuid', contact.uuid, 'contactEmail', m.email);
			updateParseObject('contacts', 'uuid', contact.uuid, 'publicKey', m.publicKey);
		} break;
	
			
			//  { type: 'userBlock',  userID: <userUUID>,  phone: <phone>, email: <email>}
		case 'userBlock' : {
			// Todo:  user has violated terms of service or is spamming.  notify all contacts
		} break;
			
			
			//  { type: 'appInfo',  level: 'info'|'update'|issue', id: <id>  message: <text>, url: <url>}
		case 'appInfo' : {
			
		} break;
	}
}
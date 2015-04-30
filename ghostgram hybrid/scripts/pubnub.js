function dataChannelRead (m, envelope, channel) {
            
}

// Send the invite through the data channel
function privateChannelInvite(contactUUID, message) {
	 var msg = new Object();

	msg.type = 'privateinvite';
	msg.sender = APP.models.profile.currentUser.get('uuid');
	msg.senderName = APP.models.profile.currentUser.get('alias');
	msg.content  = {type: 'text', message : message};
	msg.time = new Date().getTime();


	APP.pubnub.publish({
		 channel: contactUUID,        
		 message: msg,
		 success: function (status) {notifyMobile('Private message invite sent');},
		 error: function (error) {notifyMobile('Error sending Private message invite: ' + error);},
	 });
}

function privateChannelInvite (contactUUID) {

}
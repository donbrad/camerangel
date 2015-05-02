

function p2pObject(user, contact, channel) {
	var obj = new Object();
	obj.contact1 = user;
	obj.contact2 = contact;
	obj.channel = channel;
	
	return(obj);
}

//check the p2p map 
function processPrivateInvite(contactUUID, message){
	var userUUID = APP.models.profile.currentUser.get('userUUID'),
		contact = getContactData(contactUUID),
		privateChannelUUID = contact.privateChannelUUID;
	
	if (privateChannelUUID === undefined || privateChannelUUID === null) {
		queryP2Pmap(contactUUID, userUUID, function(channel) {
			privateChannelUUID = channel;
			updateParseObject('contacts', 'uuid', contactUUID, 'privateChannelUUID', privateChannelUUID);
		});
	}
	
	privateChannelInvite(contactUUID,message);
}


// search the p2pmap for an existing mapping between user and contact
function queryP2Pmap(contactUUID, userUUID, callBack) {
	var user = APP.models.profile.currentContact.get('userUUID');
	var contactQ = new Parse.Query("p2pmap");
	contactQ.equalTo("contact1", contactUUID);

	var contact2Q = new Parse.Query("p2pmap");
	contact2Q.equalTo("contact2", contactUUID);

		// Search the p2pMap for instances of contact
	var mainQuery = Parse.Query.or(contactQ, contact2Q);
	mainQuery.find({
	  success: function(results) {
		 // results contains p2p entries that include contact
		  for (var i=0; i<results.length; i++) {
			  if (results[i].get('contact1') === user || results[i].get('contact1')){
				  callBack (results[i].get('contact1'));
			  }
		  }
		  callBack(null);
	  },
	  error: function(error) {
		// There was an error.
	  }
	});
	}
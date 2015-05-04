

function p2pObject(user, contact, channel) {
	var obj = new Object();
	obj.members = [user, contact];
	obj.channel = channel;
	
	return(obj);
}

function newP2PEntry(user, contact, channel, callback) {
	var P2PObject = Parse.Object.extend('p2pmap');
	p2p = new P2PObject();
	p2p.set('members', [user, contact]);
	p2p.set('channel', channel);
	p2p.save(null, {
		success: function (channel) {
			if (callback) {
				callback(channel, null);
			}
			
		},
		error: function(channel, error){
			if (callback) {
				callback(null, err);
			}
		}
	})
}

//check the p2p map 
function processPrivateInvite(contactUUID, message) {
	var userUUID = APP.models.profile.currentUser.get('userUUID'),
		contact = getContactData(contactUUID),
		privateChannelUUID = contact.privateChannelUUID;
	
	if (privateChannelUUID === undefined || privateChannelUUID === null) {
		queryP2Pmap(contactUUID, userUUID, function(results) {
			
			if (results.length === 0) {
				// No p2pmap entry
				privateChannelUUID = uuid.v4();
				newP2PEntry(userUUID, contactUUID, privateChannelUUID, function (result, error) {
					  if (error === null) {
						addPrivateChannel(contactUUID, contact.alias, privateChannelUUID);
						updateParseObject('contacts', 'uuid', contactUUID, 'privateChannelUUID', privateChannelUUID);
					  } else {
						 mobileNotify("newP2PEntry - error: " + error); 
					  }
				});
			} else {
				// Process p2p map
				var entry = results[0];
				privateChannelUUID = entry.get('channel');
				// Does this user have an existing privateChannel with this contact?
				var channelModel = findChannelModel(privateChannelUUID);
				
				if (channelModel === undefined) {
					// No existing private channel need to create one
					var contactModel = getContactData(contactUUID);
					if (contactModel !== undefined) {
						var contactAlias = contactModel.get('alias');
						addPrivateChannel(contactUUID, contactAlias, privateChannelUUID);
						
					} else {
						mobileNotify("Null contact in processPrivateInvite!!");
					}
													  
				}
				
			}
			
			privateChannelInvite(contactUUID, message);
		});
	} else {
		privateChannelInvite(contactUUID, message);
	}
	
	
}


// search the p2pmap for an existing mapping between user and contact
function queryP2Pmap(contactUUID, userUUID, callBack) {
	var user = APP.models.profile.currentUser.get('userUUID');
	var contactQuery = new Parse.Query("p2pmap");
	contactQuery.containsAll("members", [contactUUID]);

	contactQuery.find({
	  success: function(results) {
		  callBack(results, null);
	  },
	  error: function(results, error) {
		// There was an error.
		 callBack(null, error);
	  }
	});
}
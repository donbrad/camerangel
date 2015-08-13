

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
		contact = contactModel.getContactModel(contactUUID),
		privateChannelId = contact.privateChannelId;   // Is the already a private channel allocated for this contact

	// No private channel in contact entry is there a p2p entry on parse?
	if (privateChannelId === undefined || privateChannelId === null) {
		queryP2Pmap(contactUUID, userUUID, function(results) {
			
			if (results.length === 0) {
				// No p2pmap entry on parse -- need to create one
				privateChannelId = uuid.v4();
				newP2PEntry(userUUID, contactUUID, privateChannelId, function (result, error) {
					  if (error === null) {
						  // Create a channnel for this user
						channelModel.addPrivateChannel(contactUUID, contact.alias, privateChannelId);
						  // Update the private channel for this contact
						updateParseObject('contacts', 'uuid', contactUUID, 'privateChannelId', privateChannelId);
					  } else {
						 mobileNotify("newP2PEntry - error: " + error); 
					  }
				});
			} else {
				// Yes - there's a p2pmap on parse. Process p2p map
				var entry = results[0];
				privateChannelId = entry.get('channel');
				// Does this user have an existing privateChannel with this contact?
				var channelModel = findChannelModel(privateChannelId);
				
				if (channelModel === undefined) {
					// No existing private channel need to create one
					var contactModel = getContactModel(contactUUID);
					if (contactModel !== undefined) {
						var contactAlias = contactModel.get('alias');
						addPrivateChannel(contactUUID, contactAlias, privateChannelId);
						
					} else {
						mobileNotify("Null contact in processPrivateInvite!!");
					}
													  
				}
				
			}

			privateChannelInvite(contactUUID, privateChannelId, message);
		});
	} else {
		privateChannelInvite(contactUUID, privateChannelId, message);
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
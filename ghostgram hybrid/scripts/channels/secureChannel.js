// Setup
// ---
function secureChannel( channelUUID, userUUID, alias, publicKey, privateKey, contactUUID, contactKey) {
    var channel = channelUUID;
    
	var RSAkey = cryptico.privateKeyFromString(privateKey);
    // An object userUUID and publicKey. It will be given 
    // to other users.
	
    var thisUser = {
		alias: alias,
        username: userUUID,
        publicKey: publicKey
    };

    // A mapping of all currently connected users' usernames userUUID's to their public keys.
    var users = new Array();
	users[userUUID] = publicKey;     


    // `receiveMessage` and `presenceChange` are called when a message 
    // intended for the user is received and when someone connects to 
    // or leaves the PubNub channel respectively. Both methods can be changed 
    // by the publicly accessible methods `onMessage` and `onPresence`.
    var receiveMessage = function(){};
    var presenceChange = function(){};
 

    // messageHandler
    // ---
    // `messageHandler` is called whenever a message is received.
    // If the recipient of the message is this user, it will decrypt
    // and store the message inside the messages object,
    //  then call `receiveMessage` with the decrypted message.
    var messageHandler = function (msg) {
        if (msg.recipient === userUUID) {
			var data = null;
            var content = cryptico.decrypt(msg.content.cipher, RSAkey).plaintext;
			if (msg.data !== undefined && msg.data !== null) {
				data = cryptico.decrypt(msg.data.cipher, RSAkey).plaintext;
				data = JSON.parse(data);
			}
				
            var parsedMsg = {
                msgID: msg.msgID,
                channelUUID: channelUUID,
                content: content,
				data: data,
                TTL: msg.ttl,
				time: msg.time,
                sender: msg.sender,
                recipient: msg.recipient
            };

            if (messages[msg.sender] === undefined) {
                messages[msg.sender] = [parsedMsg];
            } else {
                messages[msg.sender].push(parsedMsg);
            }
            receiveMessage(parsedMsg);
            deleteMessage(msg.sender, msg.msgID, msg.ttl);
        }
    };

    // presenceHandler
    // ---
    // `presenceHandler` is called whenever a user leaves, joins, or
    // times out of Babel. After updating our `users` object, it calls
    // `presenceChange()`.
    var presenceHandler = function (msg) {
        // A user has joined Babel, so we add them to our users object.
        if (msg.action === "join" || msg.action === "state-change") {
            // If the presence message contains data aka *state*, add this to our users object. 
            if ("data" in msg) { 
                users[msg.data.username] = msg.data.publicKey;
            } 
            // Otherwise, we have to call `here_now` to get the state of the new subscriber to the channel.
            else {
                APP.pubnub.here_now({
                    channel: channel,
                    state: true,
                    callback: herenowUpdate
                });
            }
            presenceChange();
        } 
        // A user has left or timed out of Babel so we remove them from our users object.
        else if (msg.action === "timeout" || msg.action === "leave") {
            delete users[msg.uuid];
            presenceChange();
        } 
    };






 

    // secureChannel Private Methods
    // ---
    // `herenowUpdate` is only called as a callback to 'here_now'. 
    // It does a complete update of our `users` object and then
    // calls `presenceChange()`.
    var herenowUpdate = function (msg) {
       users[userUUID] = publicKey;
        for (var i = 0; i < msg.uuids.length; i++) {
            if ("state" in msg.uuids[i]) {
                users[msg.uuids[i].state.username] = msg.uuids[i].state.publicKey;
            }
        }
        presenceChange();
    };

    var archiveMessage = function (msg) {
        channelModel.archiveMessage(msg.time, JSON.stringify(msg));
    };

    // Delete a message from the `messages` object, after `TTL` seconds.
    // (If you *sent* the message, `username` is the username of the recipient.
    // If you *received* the message, `username` is the username of the sender.)
    var deleteMessage = function (username, msgID, TTL) {
        var z = setInterval(function() {
            for (var i = 0; i < messages[username].length; i++) {
                if (messages[username][i].msgID === msgID) {
                    if (messages[username][i].TTL === 0) {
                        messages[username].splice(i, 1);
                        clearInterval(z);
                        break;
                    }
                    messages[username][i].TTL--;
                }
            }
        }, 1000);
    };

    // secureChannel public methods
    // ---
    return {
        // Sends `message` to `recipient`. After `ttl` seconds, the message
        // will self-destruct, and neither you or the recipient will be able 
        // to retrieve the message from your `messages` object.
        sendMessage: function (recipient, message, data, ttl) {
            if (ttl === undefined || ttl < 60)
                ttl = 86400;  // 24 hours
           // if (recipient in users) {
                var content = message;
				var contentData = data;
                var encryptMessage = '', encryptData = '';
				var currentTime =  ggTime.currentTime();
                encryptMessage = cryptico.encrypt(message, contactKey);
			    if (data !== undefined && data !== null)
					encryptData = cryptico.encrypt(JSON.stringify(data), contactKey);
				else
					encryptData = null;

            APP.pubnub.uuid(function (msgID) {
                APP.pubnub.publish({
                        channel: channel,
                        message: {
                            recipient: recipient,
                            msgID: msgID,
                            sender: userUUID,
                            content: encryptMessage,  // publish the encryptedMessage
							data: encryptData,        // publish the encryptedData.
							time: currentTime,
							fromHistory: false,
                            ttl: ttl
                        },
                        callback: function () {
                            var parsedMsg = {
                                msgID: msgID,
                                channelUUID: channelUUID,
                                content: content,
								data: contentData,
                                TTL: ttl,
								time: currentTime,
                                sender: userUUID,
								fromHistory: false,
                                recipient: recipient
                            };

                            // add the message to the sentMessageDataSource
                            archiveMessage(parsedMsg);
                            receiveMessage(parsedMsg);
                            //deleteMessage(recipient, msgID, ttl);
                        }
                    });
                });
          //  }
        },
        // Changes the function that is called when you are sent a message or
        // when you send a message.
        //
        // An argument of this form is passed to the callback.
        //
        //      {msgID: "487f703e-3189-4f66-87a1-62cb0ffb52fd",
        //      content: "very example message", TTL: 86400, sender: "foobar",
        //      recipient: "barfoo"}
        onMessage: function (callback) {
            receiveMessage = callback;
        },
        // Change the function that is called when a user joins, leaves, or
        // times out of Babel. No arguments are passed to the callback.
        onPresence: function (callback) {
            presenceChange = callback;
        },
        // Returns a mapping of all usernames and their respective public keys.
        listUsers: function () {
            return users;
        },
		
		// Get any messages that are in the channel from the past 24 hours

		getMessageHistory: function (callBack) {
            var timeStamp = ggTime.toPubNubTime((ggTime.lastDay()));
            APP.pubnub.history({
				channel: channel,
				end: timeStamp,
				callback: function (messages) {
					var clearMessageArray = [];
					messages = messages[0];
					messages = messages || [];
					
					for(var i = 0; i < messages.length; i++) {
						var msg = messages[i];
						var content = '';
						if (msg.recipient === userUUID)  {
							// Just process messages from other user
								var data = null;
							var content = cryptico.decrypt(msg.content.cipher, RSAkey).plaintext;
							if (msg.data !== undefined && msg.data !== null) {
								data = cryptico.decrypt(msg.data.cipher, RSAkey).plaintext;
								data = JSON.parse(data);
							}
							 var parsedMsg = {
								msgID: msg.msgID,
								content: content,
								data: data,
								TTL: msg.ttl,
								time: msg.time,
								sender: msg.sender,
								fromHistory: true,
								recipient: msg.recipient
							};

							clearMessageArray.push(parsedMsg);
						}
					}
					
					if(callBack)
						callBack(clearMessageArray);
				}

			});
		},
		
        // Returns your [Cryptico](https://github.com/wwwtyro/cryptico) RSAkey.
        myKey: function () {
            return RSAkey;
        },

        // Quits groupChannel. Other users will no longer be able to retrieve your
        closeChannel: function () {
            APP.pubnub.unsubscribe({
                channel: channel
            });
        },
        // Starting up PubNub
        // ---

        openChannel : function () {
            // Subscribe to our PubNub channel.
            APP.pubnub.subscribe({
                channel: channel,
                windowing: 50000,
                restore: true,
                callback: messageHandler,
                presence: presenceHandler,
                // Set our state to our user object, which contains our username and public key.
                state: thisUser
            });
        }
    };
}

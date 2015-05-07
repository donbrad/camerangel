// Setup
// ---
function person2person(userUUID, channelUUID) {
    var channel = channelUUID;
    
    // Generate an RSA key and grab the public key.
    var RSAkey = cryptico.generateRSAKey(1024);
    var publicKey = cryptico.publicKeyString(RSAkey);
    
    // An object userUUID and publicKey. It will be given 
    // to other users.
    var thisUser = {
        username: userUUID,
        publicKey: publicKey
    };

    // A mapping of all currently connected users' usernames to their public keys.
    var users = {ggp2p: publicKey};
    
    // A mapping of usernames and the messages they've sent.
    // (Messages you've sent are mapped by the the username of the reciever)
    var messages = {};

    // `receiveMessage` and `presenceChange` are called when a message 
    // intended for the user is received and when someone connects to 
    // or leaves the PubNub channel respectively. Both methods can be changed 
    // by the publicly accessible methods `onMessage` and `onPresence`.
    var receiveMessage = function(){};
    var presenceChange = function(){};
    var messageHistory = function(){};

    // messageHandler
    // ---
    // `messageHandler` is called whenever a message is received.
    // If the recipient of the message is this user, it will decrypt
    // and store the message inside the messages object,
    //  then call `receiveMessage` with the decrypted message.
    var messageHandler = function (msg) {
        if (msg.recipient === userUUID) {
            var content = cryptico.decrypt(msg.message.cipher, RSAkey).content;
            parsedMsg = {
                msgID: msg.msgID,
                contentType: msg.contentType,
                content: content,
                TTL: msg.ttl,
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
                users[msg.data.userUUID] = msg.data.publicKey;
            } 
            // Otherwise, we have to call `here_now` to get the state of the new subscriber to the channel.
            else { 
                pubnub.here_now({
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

    // Starting up PubNub
    // ---
    // Initialize PubNub.
    var pubnub = PUBNUB.init({
        // You can replace `demo` with your own PubNub publish and subscribe keys.
        publish_key: 'ggp2p',
        subscribe_key: 'gg2p2',

        uuid: userUUID,
        ssl: true
    });

    // Subscribe to our PubNub channel.
    pubnub.subscribe({
        channel: channel,
        callback: messageHandler,
        presence: presenceHandler,
        // Set our state to our user object, which contains our username and public key.
        state: thisUser
    });

    pubnub.history({
        channel: channel,
        limit: 100,
        callback: function (messages) {
            messages = messages[0];
            messages = messages || [];
            for(var i = 0; i < messages.length; i++) {
                messageHandler(messages[i]);
            }
        }

    });

    // person2person Private Methods
    // ---
    // `herenowUpdate` is only called as a callback to 'here_now'. 
    // It does a complete update of our `users` object and then
    // calls `presenceChange()`.
    var herenowUpdate = function (msg) {
        users = {demo : publicKey};
        for (var i = 0; i < msg.uuids.length; i++) {
            if ("state" in msg.uuids[i]) {
                users[msg.uuids[i].state.userUUID] = msg.uuids[i].state.publicKey;
            }
        }
        presenceChange();
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

    // person2person public methods
    // ---
    return {
        // Sends `message` to `recipient`. After `ttl` seconds, the message
        // will self-destruct, and neither you or the recipient will be able 
        // to retrieve the message from your `messages` object.
        sendMessage: function (recipient, message, ttl) {
            if (ttl === undefined || ttl < 60)
                ttl = 86400;  // 24 hours
            if (recipient in users) {
                var content = message;
                var recipient_key = users[recipient];
                message = cryptico.encrypt(message, recipient_key);

                pubnub.uuid(function (msgID) {
                    pubnub.publish({
                        channel: channel,
                        message: {
                            recipient: recipient,
                            msgID: msgID,
                            sender: userUUID,
                            message: message,
                            ttl: ttl
                        },
                        callback: function () {
                            parsedMsg = {
                                msgID: msgID,
                                contentType: 'text',
                                content: content,
                                TTL: ttl,
                                sender: userUUID,
                                recipient: recipient
                            };
                            if (messages[recipient] === undefined) {
                                messages[recipient] = [parsedMsg];
                            } else {
                                messages[recipient].push(parsedMsg);
                            }
                            receiveMessage(parsedMsg);
                            deleteMessage(recipient, msgID, ttl);
                        }
                    });
                });
            }
        },
        // Changes the function that is called when you are sent a message or
        // when you send a message.
        //
        // An argument of this form is passed to the callback.
        //
        //      {msgID: "487f703e-3189-4f66-87a1-62cb0ffb52fd", contentType: 'text' | 'image'
        //      content: "very example message", TTL: 5, sender: "foobar",
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
        // Returns a mapping of usernames and the messages they've sent.
        // (Messages you've sent are mapped by the the username of the reciever)
        returnMessages: function () {
            return messages;
        },
        // Returns your [Cryptico](https://github.com/wwwtyro/cryptico) RSAkey.
        myKey: function () {
            return RSAkey;
        },
        // Quits person2person. Other users will no longer be able to retrieve your
        // public key or send messages to you.
        quit: function () {
            pubnub.unsubscribe({
                channel: channel
            });
        }
    };
}

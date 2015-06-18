Description
===========
Enables PhoneGap apps on the iPhone and Android platforms
to dial a phone number without requireing additional user
interaction (such as the 'Call / Cancel' popup that ordinarilly 
would occur when using window.location.href = "tel:2125551212".


Usage
=====

```javascript

Error return by the plugin : ["feature","empty"]

phonedialer.dial(
  "2125551212", 
  function(err) {
    if (err == "empty") alert("Unknown phone number");
    else alert("Dialer Error:" + err);    
  },
  function(success) { alert('Dialing succeeded'); }
 );

```

Installation
============
phonegap local plugin add "current repo"


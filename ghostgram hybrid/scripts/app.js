
(function () {

    // store a reference to the application object that will be created
    // later on so that we can use it if need be
    var app;

    // create an object to store the models for each view
    window.APP = {
      models: {
       
        home: {
          title: 'ghostgrams',
          privateMode: false
          
        },
          
        profile: {
          title: 'Profile',
          currentUser: '',
          username: '',
          email: '',
          phone: '',
          emaiVerified: false,
        },
          
       channels: {
          title: 'Channels'
        },
          
        gallery: {
          title: 'gallery'
        },
          
        contacts: {
          title: 'Contacts'
            
        }
      },
       kendo: ''
    };



    // this function is called by Cordova when the application is loaded by the device
    document.addEventListener('deviceready', function () {  
      var initialView = '#newuserhome';
        
      // hide the splash screen as soon as the app is ready. otherwise
      // Cordova will wait 5 very long seconds to do it for you.
      navigator.splashscreen.hide();

        Parse.initialize("lbIysFqoATM1uTxebFf5s8teshcznua2GQLsx22F", "MmrJS8jR0QpKxbhS2cPjjxsLQKAuGuUHKtVPfVj5");

        Parse.User.enableRevocableSession();
        APP.models.profile.currentUser = Parse.User.current();
        
        if (APP.models.profile.currentUser)
            initialView = '#home';
            
      APP.kendo = new kendo.mobile.Application(document.body, {
        
        // comment out the following line to get a UI which matches the look
        // and feel of the operating system
        skin: 'flat',

        // the application needs to know which view to load first
        initial: initialView
      });
        
        
        

    }, false);


}());
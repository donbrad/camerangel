
(function () {

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
          alias: '',
          emaiVerified: false,
        },
          
       channels: {
          title: 'Channels'
          //Todo: Add channel data source and sync if user is signed in
        },
          
        gallery: {
          title: 'gallery'
          //Todo: Add photo gallery data source and sync if user is signed in
        },
          
        contacts: {
          title: 'Contacts'
           //Todo: Add contacts cache data source and sync if user is signed in
            
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
        
        if (APP.models.profile.currentUser) {
             initialView = '#home';
            APP.models.profile.username =  APP.models.profile.currentUser.attributes.username;
            APP.models.profile.email =  APP.models.profile.currentUser.attributes.email;
            APP.models.profile.phone =  APP.models.profile.currentUser.attributes.phone;
            APP.models.profile.alias =  APP.models.profile.currentUser.attributes.alias;
        }
           
            
      APP.kendo = new kendo.mobile.Application(document.body, {
        
        // comment out the following line to get a UI which matches the look
        // and feel of the operating system
        skin: 'flat',

        // the application needs to know which view to load first
        initial: initialView
      });


    }, false);


}());
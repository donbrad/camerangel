/**
 * Created by donbrad on 7/19/2016.
 * personalSafetyViews.js
 */

'use strict';

/*
 * emergencyView
 */
var emergencyView = {
    address : null,
    lat : 0,
    lng: 0,
    
    onInit: function () {

    },

    onOpen: function () {

    },

    getAddress : function () {
        mobileNotify("Looking up location!");
        mapModel.getCurrentAddress(function (status, address) {
            emergencyView.address = address;
           $('#emergencyView-address').val(address);
            $("#modalview-Emergency").data("kendoMobileModalView").open();
        });

    },

    openModal : function (emergencyType) {
        $("#hotButtonModal").data("kendoMobileModalView").close();
        emergencyView.getAddress();

    },
    
    openModalPolice : function () {
        $("#hotButtonModal").data("kendoMobileModalView").close();
        
        $('#emergencyView-icon').attr('src', "images/gg-police.svg");
        $('#emergencyView-title').text("Police Emergency");
        emergencyView.getAddress();
    },

    openModalMedical : function () {
        $("#hotButtonModal").data("kendoMobileModalView").close();
        
        $('#emergencyView-icon').attr('src', "images/gg-medical.svg");
        $('#emergencyView-title').text("Medical Emergency");
        emergencyView.getAddress();
    },

    openModalFire : function () {
        $("#hotButtonModal").data("kendoMobileModalView").close();
        
        $('#emergencyView-icon').attr('src', "images/gg-fire.svg");
        $('#emergencyView-title').text("Fire Emergency");
        emergencyView.getAddress();
    },

    closeModal : function ()  {
        $("#modalview-Emergency").data("kendoMobileModalView").close();
    },

    onDone : function () {
        $("#modalview-Emergency").data("kendoMobileModalView").close();
    },

    onCall : function () {

    }

};

/*
 * roadsideView
 */
var roadsideView = {

    onInit: function () {

    },

    onOpen: function () {

    },

    openModal : function () {
        $("#hotButtonModal").data("kendoMobileModalView").close();
        
        $("#modalview-roadside").data("kendoMobileModalView").open();
    },

    closeModal : function ()  {

    },

    onDone : function () {
        $("#modalview-roadside").data("kendoMobileModalView").close();
    },

    onCall : function () {

    }

};



/*
 * familyAlertView
 */
var familyAlertView = {

    onInit: function () {

    },

    onOpen: function () {

    },

    openModal : function () {
        $("#hotButtonModal").data("kendoMobileModalView").close();
        $("#modalview-familyAlert").data("kendoMobileModalView").open();
    },

    closeModal : function ()  {
        $("#modalview-familyAlert").data("kendoMobileModalView").close();
    },

    onDone : function () {
        $("#modalview-familyAlert").data("kendoMobileModalView").close();
    },

    onCall : function () {

    }

};



/*
 * localAlertView
 */
var localAlertView = {

    onInit: function () {

    },

    onOpen: function () {

    },

    openModal : function () {
        $("#hotButtonModal").data("kendoMobileModalView").close();
        $("#modalview-localAlert").data("kendoMobileModalView").open();
    },

    closeModal : function ()  {
        $("#modalview-localAlert").data("kendoMobileModalView").close();
    },

    onDone : function () {
        $("#modalview-localAlert").data("kendoMobileModalView").close();
    },

    onCall : function () {

    }

};
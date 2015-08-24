/**
 *
 * Created by donbrad on 8/22/15.
 *
 * The objects / functions behind all contacts and contact views
 */


'use strict';


/*
 * Contacts
 */

var contactsView = {
    onInit : function (e) {
        if (e.preventDefault !== undefined){
            e.preventDefault();
        }

        // set search bar
        var scroller = e.view.scroller;
        scroller.scrollTo(0,-44);

        contactModel.deviceQueryActive = false;

        var dataSource = contactModel.contactListDS;

       /* // Activate clearsearch and zero the filter when it's called
        $('#contactSearchInput').clearSearch({
            callback: function() {
                dataSource.data([]);
                dataSource.data(contactModel.contactsDS.data());
                dataSource.filter([]);
                contactModel.deviceContactsDS.data([]);
                $('#btnSearchDeviceContacts').addClass('hidden');
            }
        });*/

        // Filter current contacts and query device contacts on keyup
        // Todo: cache local contacts on first call and then just filter that list
        $('#contactSearchInput').on('input', function() {
            var query = this.value;
            if (query.length > 0) {
                dataSource.filter( {"logic":"or",
                    "filters":[
                        {
                            "field":"name",
                            "operator":"contains",
                            "value":query},
                        {
                            "field":"alias",
                            "operator":"contains",
                            "value":query}
                    ]});
                if (query.length > 2) {
                    $('#btnSearchDeviceContacts').removeClass('hidden');
                }
                $("#btnSearchDeviceName").text(query);

            } else {
                contactsView.hideSearchUX();
            }
        });

        $("#contacts-listview").kendoMobileListView({
            dataSource: contactModel.contactListDS,
            template: $("#contactsTemplate").html(),
            headerTemplate: $("#contactsHeaderTemplate").html(),
            fixedHeaders: true,
            click: function (e) {
                var contact = e.dataItem;

                updateCurrentContact(contact);

                if (contact.category === 'phone') {
                    if (contactModel.unifiedDeviceContact) {
                        // Have a unified device contact -- just to add contact
                        launchAddContact({dataItem : contact});
                    } else {
                        // Still have multiple contacts
                        APP.kendo.navigate('#contactImport?query=' + contact.name);
                    }

                } else {
                    // If we know the contacts uuid enable the full feature set
                    $("#modalview-contactActions").data("kendoMobileModalView").open();

                    if (contact.contactUUID !== undefined && contact.contactUUID !== null){
                        $("#contactActionBtns > li:first-child").show();
                    } else {
                        $("#contactActionBtns > li:first-child").hide();
                    }

                }

            },
            dataBound: function(e){
                checkEmptyUIState("#contacts-listview", "#contactListDiv >");
            }
        }).kendoTouch({
            filter: ".contactListBox",
            // filter: "div",
            enableSwipe: true,
            swipe: function(e) {
                // Need to set current contact before exposing editing ux!
                var selection = e.sender.events.currentTarget;
                if(e.direction === "left"){
                    var otherOpenedLi = $(".contact-active");
                    $(otherOpenedLi).velocity({translateX:"0"},{duration: "fast"}).removeClass("contact-active");
                    $(selection).velocity({translateX:"-50%"},{duration: "fast"}).addClass("contact-active");

                }
                if (e.direction === "right" && $(selection).hasClass("contact-active")){
                    $(selection).velocity({translateX:"0"},{duration: "fast"}).removeClass("contact-active");
                }

            }
        });

        // Update search UX whenever search input content changes.
       // $("#contactSearchInput" ).on('input', contactsView.updateSearchUX);
    },

    onShow : function (e) {
        if (e.preventDefault !== undefined)
            e.preventDefault();

        contactModel.contactListDS.data(contactModel.contactsDS.data());
        //APP.models.contacts.contactListDS.data(APP.models.contacts.deviceContactsDS.data());


        // set action button
        $("#contacts > div.footerMenu.km-footer > a").attr("href", "#contactImport");
    },

    onHide : function (e) {
        if (e.preventDefault !== undefined)
            e.preventDefault();
    },

    updateSearchUX: function (event) {
        var query = $('#contactSearchInput').val();

        if (query.length > 2) {
            $("#btnSearchDeviceName").text(query);
            $('#btnSearchDeviceContacts').removeClass('hidden');
        } else {
            contactsView.hideSearchUX();
        }
    },

    hideSearchUX : function () {
        var dataSource = contactModel.contactListDS;
        dataSource.data([]);
        contactModel.deviceContactsDS.data([]);
        dataSource.data(contactModel.contactsDS.data());
        dataSource.filter([]);
        $('#btnSearchDeviceContacts').addClass('hidden');

    }

};


var contactImportView = {
    onInit: function (e) {
        if (e !== undefined && e.preventDefault !== undefined) {
            e.preventDefault();
        }

        $("#contactimport-listview").kendoMobileListView({
            dataSource: contactModel.deviceContactsDS,
            template: $("#deviceContactsTemplate").html(),
            headerTemplate: "${value}",
            fixedHeaders: true,
            click: launchAddContact


        });
    },

    onShow: function (e) {
        if (e !== undefined && e.preventDefault !== undefined) {
            e.preventDefault();
        }
        var query = e.view.params.query;
        //contactsFindContacts(query);

    }
};
/**
 * Created by donbrad on 3/8/16.
 */

'use strict';

var monkeyLearn = {

    _token: '9314320fdd512056310b11e88a5f0482a1fd28d8',

    classify : function (text, callback) {
        $.ajax({
            url : "https://api.monkeylearn.com/api/v1/categorizer/cl_oJNMkt2V/classify_text/",
            type : "POST",
            headers: {
                "Authorization": "token " + monkeyLearn._token
            },
            data : {
                text: text
            },
            success : function(result) {
                callback(result);
            },
            error : function(e) {
                mobileNotify('Error: ' + e);
            }
        });
    },

    extract : function (text, callback) {
        $.ajax({
            url : "https://api.monkeylearn.com/v2/extractors/ex_dqRio5sG/extract/",
            type : "POST",
            headers: {
                "Authorization": "token " + monkeyLearn._token
            },
            data : {
                text: text
            },
            success : function(result) {
                callback(result);
            },
            error : function(e) {
                mobileNotify('Error: ' + e);
            }
        });
    },

    extractEntities : function (text, callback) {
        $.ajax({
            url : "https://api.monkeylearn.com/v2/extractors/ex_isnnZRbS/extract/",
            type : "POST",
            headers: {
                "Authorization": "token " + monkeyLearn._token
            },
            data : {
                text: text
            },
            success : function(result) {
                callback(result);
            },
            error : function(e) {
                mobileNotify('Error: ' + e);
            }
        });
    },
    extractTextFromHtml : function (text, callback) {
        $.ajax({
            url : "https://api.monkeylearn.com/v2/extractors/ex_RK5ApHnN/extract/",
            type : "POST",
            headers: {
                "Authorization": "token " + monkeyLearn._token
            },
            data : {
                text: text
            },
            success : function(result) {
                callback(result);
            },
            error : function(e) {
                mobileNotify('Error: ' + e);
            }
        });
    }



};
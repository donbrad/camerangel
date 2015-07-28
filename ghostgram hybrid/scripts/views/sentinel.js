'use strict';

var Sentinel = function ($input) {
	this.initialize($input);
}

Sentinel.prototype = {

	KEYWORDS_TO_CATEGORIES: {
		in: 'Chats',
		at: 'Places',
		from: 'Contacts'
	},

	filters: [],

	initialize: function ($input) {
		$input.kendoAutoComplete({
			separator: ' ',
			filter: 'startswith',
			dataSource: window.semanticDSs.master,
			dataTextField: 'value'
		});

		$input.on('keypress', function () {
			// Gotta defer to make sure the latest keystroke is in the $input.val()
			_.defer( function () {
				var inputVal = $input.val();
				var split = inputVal.split(' ');
				var keyword;
				var matched = false;
				for (keyword in this.KEYWORDS_TO_CATEGORIES) {
					if (split[split.length-2] === keyword) {
						window.semanticDSs.master.filter({ field: 'category', operator: 'eq', value: this.KEYWORDS_TO_CATEGORIES[keyword]});
						matched = true;
					}
				}
				if (matched === false) {
					window.semanticDSs.master.filter({});
					// Fix a bug in kendo that repeats the last selected autocomplete value in the $input
					// after switching datasources
					$input.val(inputVal);
				}
			}.bind(this));
		}.bind(this));
	}
}
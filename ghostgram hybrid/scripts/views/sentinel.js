/* global EventEmitter */

'use strict';

var Sentinel = function ($input) {
	this.initialize($input);
};

Sentinel.prototype = _.assign({

	KEYWORDS_TO_CATEGORIES: {
		in: 'Chats',
		at: 'Places',
		from: 'Contacts'
	},

	filters: [],

	initialize: function ($div) {
		$div.addClass('sentinel');

		var $input = $div.find('input');
		var $list = $div.find('ul');
		var $tags = $div.find('.tags');

		$list.data('kendoMobileButtonGroup').bind('select', function () {
			var currentButton = currentButton;
			if (currentButton.hasClass('contacts')) {
				
			} else if (currentButton.hasClass('chats')) {

			} else if (currentButton.hasClass('date')) {

			} else if (currentButton.hasClass('place')) {

			}
		});

		$tags.on('click', 'button', function (e) {
			$(e.target).parent().fadeOut(100, function () {
				$(e.target).parent().remove();
				this.emitEvent('remove');
			}.bind(this));
		}.bind(this));

		$input.kendoAutoComplete({
			separator: ' ',
			filter: 'startswith',
			dataSource: window.semanticDSs.master,
			dataTextField: 'value',
			select: function (e) {

				$tags.append(
					'<li>' +
						'<img src="images/sentinel-'+e.sender.dataItem(e.item.index()).category.toLowerCase()+'.svg" />'+
						e.item.text() +
						'<button />' +
					'</li>'
				);

				this.emitEvent('add');

				var words = $input.val().split(' ');
				var keyword = words[words.length - 2];
				var newValue;

				if (this.KEYWORDS_TO_CATEGORIES[keyword] !== undefined) {
					newValue = $input.val().split(keyword)[0];
				} else {
					newValue = $input.val().split(words[words.length - 1])[0];
				}
				// We deferred the input.on function below, so gotta defer
				// this one as well, or this input.val will happen before
				// the input.val below
				_.defer( function () {
					$input.val(newValue);
				});
			}.bind(this)
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
}, EventEmitter.prototype);
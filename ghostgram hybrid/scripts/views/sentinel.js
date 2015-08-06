/* global EventEmitter */

'use strict';

var Sentinel = function ($input) {
	this.initialize($input);
};

Sentinel.prototype = _.assign({

	KEYWORDS_TO_CATEGORIES: {
		in: 'chats',
		at: 'places',
		from: 'contacts'
	},

	filters: {},

	initialize: function ($div) {
		$div.addClass('sentinel');

		var $input = $div.find('input');
		var $filters = $div.find('.filters');
		var $tags = $div.find('.tags');

		$filters.on('click', '.km-button', function (e) {
			if ($(e.currentTarget).hasClass('date')) {
				var $date = $('<input type="date" />')
					.on('click', function (e) {
						e.stopPropagation();
					})
					.appendTo($div)
					.slideDown(200);
				// Gotta defer or the original click event triggers this one
				// as well
				_.defer( function () {
					$('body').one('click', function (e) {
						$date.slideUp(200, function () {
							$date.remove();
						});
					});
				});

				return;
			}

			for (var keyword in this.KEYWORDS_TO_CATEGORIES) {
				if ($(e.currentTarget).hasClass(this.KEYWORDS_TO_CATEGORIES[keyword])) {
					window.semanticDSs.master.filter({ field: 'category', operator: 'eq', value: this.KEYWORDS_TO_CATEGORIES[keyword]});
					$input.data('kendoAutoComplete').search();

					break;
				}
			}
		}.bind(this));
gs.on('click', 'button', function (e) {
			$(e.target).parent().fadeOut(100, function () {
				$(e.target).parent().remove();
				this.emitEvent('remove');

				var category = $(e.target).parent().data('category');
				$filters.find('.'+category).removeClass('pressed');
			}.bind(this));
		}.bind(this));

		$input.kendoAutoComplete({
			separator: ' ',
			filter: 'startswith',
			dataSource: window.semanticDSs.master,
			dataTextField: 'value',
			select: function (e) {
				var dataItem = e.sender.dataItem(e.item.index());

				// Remove existing tag if there is one in the same category
				$tags.find('li').each( function () {
					if ($(this).data('category') === dataItem.category) {
						$(this).remove();
					}
				});

				$tags.append(
					'<li data-category="'+dataItem.category+'">' +
						'<img src="images/sentinel-'+dataItem.category.toLowerCase()+'.svg" />'+
						e.item.text() +
						'<button />' +
					'</li>'
				);

				$filters
					.find('.'+dataItem.category.toLowerCase())
					.addClass('pressed');

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
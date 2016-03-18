/* global EventEmitter */

'use strict';

var Sentinel = function ($input) {
	this.initialize($input);
};

Sentinel.prototype = _.assign({

	KEYWORDS_TO_CATEGORIES: {
		in: 'chats',
		at: 'places',
		from: 'contacts',

		before: 'date',
		since: 'date',
		on: 'date'
	},

	/**
	 * The category is the key and the value is the value :P, for example,
	 * "place": 12345
	 * where 12345 is the placeUUID
	 * @type {Object}
	 */
	filters: {},

	$div: undefined,
	$input: undefined,
	$filters: undefined,
	$tags: undefined,
	$date: undefined,

	initialize: function ($div) {

		this.$div = $div;
		this.$div.addClass('sentinel');

		this.$input = this.$div.find('input');
		this.$filters = this.$div.find('.filters');
		this.$tags = this.$div.find('.tags');

		this.$filters.on('click', '.km-button', function (e) {
			if ($(e.currentTarget).hasClass('date')) {
				e.stopPropagation();

				if (this.$date !== undefined) {
					$('body').click();
					return;
				}

				this.showDate(true);

				return;
			}

			if ($(e.currentTarget).hasClass('all')) {
				window.semanticDSs.master.filter({});
				this.$input.data('kendoAutoComplete').search();

				return;
			}

			for (var keyword in this.KEYWORDS_TO_CATEGORIES) {
				if ($(e.currentTarget).hasClass(this.KEYWORDS_TO_CATEGORIES[keyword])) {
					window.semanticDSs.master.filter({ field: 'category', operator: 'eq', value: this.KEYWORDS_TO_CATEGORIES[keyword]});
					this.$input.data('kendoAutoComplete').search();

					break;
				}
			}
		}.bind(this));

		this.$tags.on('click', 'button', function (e) {
			$(e.target).parent().fadeOut(100, function () {
				$(e.target).parent().remove();

				var category = $(e.target).parent().data('category');
				this.$filters.find('.'+category).removeClass('pressed');
				delete this.filters[category];

				this.emitEvent('remove');
			}.bind(this));
		}.bind(this));

		this.$input.kendoAutoComplete({
			separator: ' ',
			filter: 'startswith',
			dataSource: window.semanticDSs.master,
			dataTextField: 'value',
			select: function (e) {
				var category = e.sender.dataItem(e.item.index()).category;

				this.filters[category] = e.sender.dataItem(e.item.index()).id;
				this.addTag(category, e.item.text());
			}.bind(this)
		});

		this.$input.on('keypress', function () {
			// Gotta defer to make sure the latest keystroke is in the $input.val()
			_.defer( function () {
				var inputVal = this.$input.val();
				var split = inputVal.split(' ');
				var keyword;
				var matched = false;
				for (keyword in this.KEYWORDS_TO_CATEGORIES) {
					if (this.KEYWORDS_TO_CATEGORIES.hasOwnProperty(keyword)) {
						if (split[split.length-2] !== keyword) {
							continue;
						}
						if (this.KEYWORDS_TO_CATEGORIES[keyword] !== 'date') {
							window.semanticDSs.master.filter({ field: 'category', operator: 'eq', value: this.KEYWORDS_TO_CATEGORIES[keyword]});

						}
						matched = true;
					}
				}
				if (matched === false) {
					window.semanticDSs.master.filter({});
					// Fix a bug in kendo that repeats the last selected autocomplete value in the $input
					// after switching datasources
					this.$input.val(inputVal);
				}
			}.bind(this));
		}.bind(this));
	},

	addTag: function (category, text) {
		// Remove existing tag if there is one in the same category
		this.$tags.find('li').each( function () {
			if ($(this).data('category') === category) {
				$(this).remove();
			}
		});

		this.$tags.append(
			'<li data-category="'+category+'">' +
				'<img src="images/sentinel-'+category.toLowerCase()+'.svg" />'+
				text +
				'<button />' +
			'</li>'
		);

		this.$filters
			.find('.'+category.toLowerCase())
			.addClass('pressed');

		var words = this.$input.val().split(' ');
		var keyword = words[words.length - 2];
		var newValue;

		if (this.KEYWORDS_TO_CATEGORIES[keyword] !== undefined) {
			newValue = this.$input.val().split(keyword)[0];
		} else {
			newValue = this.$input.val().split(words[words.length - 1])[0];
		}

		// We deferred the input.on function below, so gotta defer
		// this one as well, or this input.val will happen before
		// the input.val below
		_.defer( function () {
			this.$input.val(newValue);

			this.emitEvent('add');
		}.bind(this));
	},

	showDate: function (showButtons) {
		var dateHTML = '<form class="sentinel-date"><input type="date" required />';
		if (showButtons) {
			dateHTML += '<br /><button class="before">Before</button><button class="since">Since</button>';
		}
		dateHTML += '</form>';

		this.$date = $(dateHTML)
			.css({
				top: this.$input.height() + 8
			})
			.on('click', function (e) {
				e.stopPropagation();
			})
			.on('submit', function (e) {
				e.preventDefault();
				if (showButtons) {
					var clickedButton = this.$date.find('button:focus').first();

					if (clickedButton.hasClass('before')) {
						this.addTag('date', 'before '+moment(this.$date.find('input').val()).format('MM-DD-YYYY'));
						this.filters.date = { operator: 'lt', value: this.$date.find('input').val() };
					} else if (clickedButton.hasClass('since')) {
						this.addTag('date', 'since '+moment(this.$date.find('input').val()).format('MM-DD-YYYY'));
						this.filters.date = { operator: 'lt', value: this.$date.find('input').val() };
					}
				}

				this.hideDate();
			}.bind(this))
			.insertAfter(this.$input)
			.slideDown(200);
		// Gotta defer or the original click event triggers this one
		// as well
		_.defer( function () {
			$('body').one('click', this.hideDate.bind(this));
		}.bind(this));
	},

	hideDate: function () {
		if (this.$date === undefined) {
			return;
		}

		this.$date.slideUp(200, function () {
			this.$date.remove();
			delete this.$date;
		}.bind(this));
	},

	clearFilters: function () {
		this.$tags.empty();
		this.$filters.children().removeClass('pressed');
		this.filters = {};
	}

}, EventEmitter.prototype);
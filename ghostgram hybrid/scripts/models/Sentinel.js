'use strict';



var Sentinel = function (input, dataSource, filters) {
	this.initialize(input, dataSource, filters);
}

Sentinel.prototype = {
	$input: undefined,
	dataSource: undefined,
	filters: undefined,

	initialize: function (input, dataSource, filters) {
		this.$input = $(input);
		this.dataSource = dataSource;
		this.filters = filters;

		// Add the sentinel class, add the filterList below the input, listen on keypress
		this.$input
			.addClass('sentinel')
			.on('keypress', this.listen.bind(this));

		// When you click a delete button in the list of filters, run the removal instructions
		$('<ul />')
			.insertAfter(this.$input)
			.on('click', 'button', function (e) {
				$(e.target).parent().data('remove')();
				$(e.target).parent().remove();
			});
	},

	listen: function () {
		// Defer because if we don't, the $input.val() will be missing the just-pressed key
		_.defer( function () {
			this.filters.forEach( function (filter) {

				var inputSplit = this.$input.val().split(' ');
				var lastWord = inputSplit[inputSplit.length-1];

				// If we're less than 50% of the filter pattern length
				if (lastWord.length <= filter.pattern.length / 2) {
					filter.$element.remove();
					return;
				}

				// If we're past the length of the filter pattern
				if (lastWord.length > filter.pattern.length) {
					filter.$element.remove();
					return;
				}


				var trimmedPattern = filter.pattern.substr(0, lastWord.length);

				// If the input doesn't match the pattern
				if (lastWord !== trimmedPattern ) {
					filter.$element.remove();
					return;
				}

				filter.addElement(this.$input);

				filter.action(this.dataSource).then( function (actionResponse) {
					// Remove last word from input
					inputSplit.pop();
					this.$input.val(inputSplit.join(' '));

					// Look for and remove any duplicate filters
					$('.sentinel + ul li').each( function () {
						if ($(this).data('pattern') === filter.pattern) {
							$(this).find('button').click();
						}
					});

					// Create the filter pill, attach the removal instructions, and append to the filterlist
					$('<li>'+actionResponse.pillText+' <button></button></li>')
						.data('remove', actionResponse.remove)
						.data('pattern', filter.pattern)
						.appendTo(this.$input.next('ul'));

					// Remove the filter's element
					filter.$element.remove();
				}.bind(this));
			}.bind(this));
		}.bind(this));
	}
}



var Filter = function (pattern, action) {
	this.initialize(pattern, action)
}

Filter.prototype = {
	pattern: undefined,
	action: undefined,
	$element: undefined,

	initialize: function (pattern, action) {
		this.pattern = pattern;
		this.action = action;

		this.$element = $('<form class="filter-element" />');
	},

	addElement: function($input) {
		if ($.contains(document.documentElement, this.$element.get(0)) === true) {
			return;
		}
		
		this.$element
			.html('<form class="filter-element" />')
			.appendTo(document.body);

		// Add the element below the input
		var offset = $input.offset();
		this.$element.css({
			left: offset.left + 40 + 'px',
			top: offset.top + 40 + 'px'
		});

		// When the user clicks away, remove the element
		$('body *:not(.filter-element)').one('click', function () {
			this.$element.remove();
		}.bind(this));
	}
}



var onDateFilter = new Filter('on', function (dataSource) {
	var deferred = Q.defer();

	// Set up the element
	this.$element.append('<h1>Select date</h1>');
	var $date = $('<input type="date" required />').appendTo(this.$element);
	this.$element.append('<input type="submit" value="Ok" />');

	this.$element.on('submit', function (e) {
		e.preventDefault();

		var start = moment($date.val()).startOf('day');
		var end = moment($date.val()).endOf('day');

		var filterToAdd = {
			logic: 'and',
			filters: [
				{ field: 'date', operator: 'gt', value: start.toDate() },
				{ field: 'date', operator: 'lt', value: end.toDate() }
			]
		};
		var newFilter = dataSource.filter();
		newFilter.filters.push(filterToAdd);
		dataSource.filter(newFilter);

		deferred.resolve({
			pillText: 'on <strong>'+moment($date.val()).format('MMM D, YYYY')+'</strong>',
			remove: function () {
				var newFilter = dataSource.filter();
				var index = newFilter.filters.indexOf(filterToAdd);
				newFilter.filters.splice(index, 1);
				dataSource.filter(newFilter);
			}
		});
	}.bind(this));

	return deferred.promise;
});

var inChatFilter = new Filter('in', function (dataSource) {
	var deferred = Q.defer();

	// Set up the element
	this.$element.append('<h1>Select chat</h1>');
	var $chats = $('<select></select>').appendTo(this.$element);
	this.$element.append('<input type="submit" value="Ok" />');

	var data = dataSource.data();
	var chats = [];
	data.forEach( function (archiveEntry) {
		chats.push({
			channelId: archiveEntry.message.channelId,
			channelName: archiveEntry.message.channelName
		});
	});

	// Gotta stringify because uniq doesn't register objects as the same unless their reference is the same
	chats = _.uniq(chats, function (item) {
		return JSON.stringify(item);
	});

	chats.forEach ( function (chat) {
		$chats.append('<option value="'+chat.channelId+'">'+chat.channelName+'</option>');
	});

	this.$element.on('submit', function (e) {
		e.preventDefault();

		var filterToAdd = { field: 'message.channelId', operator: 'eq', value: $chats.val() };
		var newFilter = dataSource.filter();
		newFilter.filters.push(filterToAdd);
		dataSource.filter(newFilter);

		deferred.resolve({
			pillText: 'in <strong>'+$chats.find('option:selected').text()+'</strong>',
			remove: function () {
				var newFilter = dataSource.filter();
				var index = newFilter.filters.indexOf(filterToAdd);
				newFilter.filters.splice(index, 1);
				dataSource.filter(newFilter);
			}
		});
	}.bind(this));

	return deferred.promise;
});
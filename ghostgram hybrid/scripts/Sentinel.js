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
			});
	},

	listen: function () {
		// Defer because if we don't, the $input.val() will be missing the just-pressed key
		_.defer( function () {
			this.filters.forEach( function (filter) {

				// If we're less than 50% of the filter pattern length
				if (this.$input.val().length <= filter.pattern.length / 2) {
					return;
				}

				// If we're past the length of the filter pattern
				if (this.$input.val().length > filter.pattern.length) {
					filter.$element.remove();
					return;
				}


				var trimmedPattern = filter.pattern.substr(0, this.$input.val().length);

				// If the input doesn't match the pattern
				if (this.$input.val() !== trimmedPattern ) {
					return;
				}

				filter.addElement(this.$input);

				filter.action(this.dataSource).then( function (filterText, remove) {
					// Create the filter pill, attach the removal instructions, and append to the filterlist
					$('<li>'+filterText+' <button></button></li>')
						.data('remove', remove)
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
		
		this.$element.appendTo(document.body);

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

	// When the date is changed, resolve the promise
	this.$element.on('submit', function (e) {
		e.preventDefault();

		console.log(dataSource.filter());

		var filterToAdd = dataSource.filter();
		filterToAdd.filters.push({ field: 'date', operator: 'eq', value: new Date($date.val()) });
		dataSource.filter(filterToAdd);

		deferred.resolve('on <strong>'+moment($date.val()).format('MMM do YYYY')+'</strong>', function (dataSource) {
			var filterToClean = dataSource.filter();
			var index = filterToClean.filters.indexOf(filterToAdd);
			filterToClean.splice(index, 1);
			dataSource.filter(filterToClean);
		});
	}.bind(this));

	return deferred.promise;
});

var inChatFilter = new Filter(/in/, function (dataSource) {
	var deferred = Q.defer();

	// Set up the element
	this.$element.append('<h1>Select chat</h1>');
	$chats = $('<select></select>').appendTo(this.$element);

	var chats = APP.channels.channelsDS.data();
	chats.forEach( function () {
		$chats.append('<option value="'+chat.id+'">'+chat.name+'</option>');
	});

	// When the date is changed, resolve the promise
	$chats.on('change', function () {
		var filterToAdd = dataSource.filter();
		filterToAdd.filters.push({ field: 'channel.id', operator: 'eq', value: $chats.val() });
		dataSource.filter(filterToAdd);

		var chatName = $chats.find('option[value="'+$chats.val()+'"]').text();

		deferred.resolve('in <strong>'+chatName+'</strong>', function (dataSource) {
			var filterToClean = dataSource.filter();
			var index = filterToClean.filters.indexOf(filterToAdd);
			filterToClean.splice(index, 1);
			dataSource.filter(filterToClean);
		});
	}.bind(this));

	return deferred.promise;
});
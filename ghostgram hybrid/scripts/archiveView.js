'use strict';

var archiveView = {
	init: function () {
		
		if (archives.areEmpty() === true) {
			$('#archive .nothing-found').show();
			$('#archive main > *:not(.nothing-found)').hide();
			return;
		}
		
	}
};
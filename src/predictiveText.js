(function($) {
    $.fn.caretPosition = function() {
        var input = this.get(0);
        if (!input) return; // No (input) element found
        if ('selectionStart' in input) {
            return input.selectionStart;
        } 
        else if (document.selection) {
            // IE
            input.focus();
            var sel = document.selection.createRange();
            var selLen = document.selection.createRange().text.length;
            sel.moveStart('character', -input.value.length);
            return sel.text.length - selLen;
        }
    }
})(jQuery);



String.prototype.reverseFind = function (find, start) {
    if (start === undefined || start === null)
    	start = this.length-1;

	for(var i = start; i >= 0; i--) {
		if (this[i] === find)
			return i;
	}

	return -1;
};

String.prototype.format = function () {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] != 'undefined' ? args[number] : match;
    });
};

Array.prototype.where = function (fun) {
    if (this === undefined || this.length === 0)
        return null;

    var results = [];
    for (var i = 0; i < this.length; i++) {
        if (fun(this[i]))
            results.push(this[i]);
    }

    return results;
};


(function($){
	$.fn.predictiveText = function(options) {

		var defaults = {
			selector: null,
			seperator: "{",
			terminator: "}",
			topOffset: 5,
			leftOffset: 5,
			debug: false,
			inputBox: null,
			caretPosition: 0
		};
		var options = $.extend(defaults, options);

		if (options.selector === undefined || options.selector === null)
			options.selector = $(this).selector;


		// track which input boxes have the focus
		$('input').on('focus', function() {
			options.inputBox = $(this);
		});
		

		var queryData = function (query) {
			var results = options.data.where(function(item) {
				return item.text.toLowerCase().indexOf(query.toLowerCase()) > -1;
			});

			return results;
		}

		var removePredictions = function () {
			var parent = $(options.selector).parent();
			var predictivetextDiv = parent.find("#predictivetext");

			predictivetextDiv.remove();
		}

		var elementSelected = function (item) {
			if (options.inputBox === null || options.inputBox === undefined)
				return;

			var text = options.inputBox.val();
			if (text === undefined) {
				removePredictions();
				return;
			}

			var position = text.reverseFind(options.seperator);
			var start = text.substring(0, position);
			var end = text.substring(options.caretPosition, text.length);

			options.inputBox.val("{0}{1}{2}".format(start, item.attr("data"), end));
			removePredictions();
		}


		var handleKeyPress = function handleKeyPress(e) {
			switch(e.keyCode) {
				case 27: // esc
					removePredictions();
					return true;

				case 38: // up
					var index = $('#predictivetext ul li.selected').index();
					if (index >= 1)
					{
						// nth-child is 1 based index, not 0 based index
						$('#predictivetext ul li.selected').removeClass();
						$('#predictivetext ul li:nth-child({0})'.format(index)).addClass('selected');
					}
					
					$('#predictivetext ul li.selected').scrollintoview();

					return true;

				case 40: // down
					var index = $('#predictivetext ul li.selected').index();
					if (index+1 < $('#predictivetext ul li').length)
					{
						// nth-child has 1 based index, not 0 based index
						$('#predictivetext ul li.selected').removeClass();
						$('#predictivetext ul li:nth-child({0})'.format(index + 2)).addClass('selected');
					}

					$('#predictivetext ul li.selected').scrollintoview();

					return true;

				case 13:
					elementSelected($('#predictivetext ul li.selected'));
					return true;
			}
			return false;
		}

		var delay;
	
		this.each(function() {
			var item = $(this);
			item.attr("autocomplete","off"); // turn off the inputs autocomplete

			// will only work with textboxes or textareas
			if (item.is('input:text') || item.is('textarea')) {
				$(item).on('blur', function() {
					if (!options.debug)
					 	setTimeout(removePredictions, 850); // make sure that we don't kill the list before a click event on a list item fires.
				});

				$(item).on('keyup', function(e) {
					if (handleKeyPress(e))
						return false; // we've handled the key press, so quit out

					var text = item.val();
					options.caretPosition = item.caretPosition();

					// is one of the previous characters a seperator?
					var lead = text.reverseFind(options.seperator);
					if (lead > text.reverseFind(options.terminator)) {
						// we have a seperator (which hasn't been terminated yet) before the carot, so we can display our list of data
						var query = text.substring(lead+1, options.caretPosition);
						var results = query === "" || query === undefined ? options.data : queryData(query); // use the text between the seperator and carot as the query

						if (results === undefined || results === null || results.length === 0)
							return; // we have nothing to display

						// display the results...
						clearTimeout(delay);
						delay = setTimeout(function() {
							removePredictions();

							// create the list to hold our predictive items
							item.parent().append("<div id='predictivetext'></div>")
							$("#predictivetext").html("<ul></ul>");

							for(var i = 0; i < results.length; i++) {
								if (i === 0)
									$("#predictivetext ul").append("<li data='{1}' class='selected'>{0}</li>".format(results[i].text, results[i].data ? results[i].data : results[i].text));
								else
									$("#predictivetext ul").append("<li data='{1}'>{0}</li>".format(results[i].text, results[i].data ? results[i].data : results[i].text));
							}

							// place the list under the textbox/area
							var poistion = item.position();
							$("#predictivetext").attr("style", "top: {0}px; left: {1}px; width: {2}px;".format(poistion.top + item.height() + options.topOffset, poistion.left + options.leftOffset, 
								item.width() > $("#predictivetext").width() ? item.width() : $("#predictivetext").width()));


							// fires the events when someone clicks on an item
							$("#predictivetext ul li").on('click', function() {
								elementSelected($(this));
							});

						}, 800);
					}
				});
			}
		});

		return true;
	};
})(jQuery);
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
			terminator: "}"
		};
		var options = $.extend(defaults, options);

		if (options.selector === undefined || options.selector === null)
			options.selector = $(this).selector;


		// fires we someone clicks on an item
		$("#predictivetext ul li").live('click', function() {
			var text     = $(options.selector).val();
			var carot    = $(options.selector).caretPosition();
			var position = text.reverseFind(options.seperator);

			var start = text.substring(0, position);
			var end = text.substring(carot, text.length);

			$(options.selector).val("{0}{{1}}{2}".format(start, $(this).attr("data"), end));

			removePredictions();
		});

		function queryData(query) {
			var results = options.data.where(function(item) {
				return item.text.indexOf(query) > -1;
			});

			return results;
		}

		function removePredictions() {
			var parent = $(options.selector).parent();
			var predictivetextDiv = parent.find("#predictivetext");

			predictivetextDiv.remove();
		}


		var delay;
	
		this.each(function() {
			var item = $(this);
			item.attr("autocomplete","off"); // turn off the inputs autocomplete

			// will only work with textboxes or textareas
			if (item.is('input:text') || item.is('textarea')) {
				$(item).on('keyup', function(e) {
					if (e.keyCode === 27) {
						removePredictions();
						return;
					}

					var text = item.val();
					var caret = item.caretPosition();

					// is one of the previous characters a seperator?
					var lead = text.reverseFind(options.seperator);
					if (lead > text.reverseFind(options.terminator)) {
						// we have a seperator (which hasn't been terminated yet) before the carot, so we can display our list of data
						var query = text.substring(lead+1, caret);
						var results = query === "" || query === undefined ? options.data : queryData(query); // use the text between the seperator and carot as the query

						// display the results...
						clearTimeout(delay);
						delay = setTimeout(function() {
							removePredictions();

							$(options.selector).parent().append("<div id='predictivetext'></div>")
							$("#predictivetext").html("<ul></ul>");

							for(var i = 0; i < results.length; i++) {
								$("#predictivetext ul").append("<li data='{1}'>{0}</li>".format(results[i].text, results[i].data ? results[i].data : results[i].text));
							}

						}, 800);
						
					}
				});
			}
		});

		return true;
	};
})(jQuery);
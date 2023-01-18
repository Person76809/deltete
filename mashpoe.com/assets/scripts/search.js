// Search takes control over an input element in order to make it function like a search bar.
// It can switch between different input elements, and behave like it's still controlling the same one.
// This makes it easier to have a searchbar appear in different places while behaving like a single input element.
function Search(inputElem) {

	this.typed = "";
	this.selectedResult = -1;
	this.suggestions = [];

	this.inputElem = null;

	// handles the input for an input element. Assumes that input's parent is a div with the class "search-container"
	this.setInputElem = function (inputElem) {

		if (this.inputElem === inputElem) {
			return; // don't make changes if we are handling the same input elem
		}

		// remove old eventListeners by replacing the input element
		if (this.inputElem !== null && this.inputElem !== inputElem) {
			// make sure the inputs have the same values
			inputElem.value = this.inputElem.value;

			// select the new input element if the previous element was selected
			if (this.inputElem === document.activeElement) {
				inputElem.focus();
			}

			// remove the suggestions while preserving the suggestion selector int
			var tempSelected = this.selectedResult;
			this.removeSuggestions();
			this.selectedResult = tempSelected;

			// clear out the value of the previous input element
			this.inputElem.value = "";

			// delete the previous input element and replace it with a copy to remove event listeners
			var parent = this.inputElem.parentNode;
			var clone = this.inputElem.cloneNode(true);
			parent.removeChild(this.inputElem);
			parent.appendChild(clone);
		}

		this.inputElem = inputElem;
		if (this.suggestions.length > 0) {
			this.showSuggestions();
		}
		//alert(this.suggestions);

		var _this = this;

		this.inputElem.onsubmit = function () {
			_this.submit();
		}

		this.inputElem.onkeydown = function (e) {
			e = e || window.event;
			_this.handleKeyDown(e);
		}

		this.inputElem.onkeyup = function (e) {
			e = e || window.event;
			_this.handleKeyUp(e);
		}
	}

	if (inputElem) {
		this.setInputElem(inputElem);
	}

	// loads suggestions from the database based on the value of the input element
	// then it calls showSuggestions
	this.loadSuggestions = function () {

		var _this = this;

		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function () {
			if (this.readyState == 4 && this.status == 200) {
				_this.suggestions = JSON.parse(this.responseText);
				_this.showSuggestions();
			}
		}
		var searchURI = encodeURIComponent(this.inputElem.value);
		var postURL = window.location.protocol + "//" +
			window.location.hostname +
			"/assets/scripts/pages.php?command=search&search=" + searchURI + "&limit=4";

		xhr.open("POST", postURL, true);
		xhr.send();

	}

	// loads suggestions from the database based on the value of the input element
	this.showSuggestions = function () {

		this.removeSuggestionElems();

		var suggestionList = document.createElement("UL");
		suggestionList.className = "suggestion-list";

		if (this.suggestions.length) {

			for (var i = 0; i < this.suggestions.length; i++) {

				var listItem = document.createElement("LI");

				var suggestionLink = document.createElement("A");
				suggestionLink.setAttribute("click", "storeLinkClick(event)");
				suggestionLink.innerHTML = this.suggestions[i];
				suggestionLink.href = window.location.protocol + "//" + window.location.hostname +
					"/" + this.suggestions[i];

				if (i == this.selectedResult) {
					suggestionLink.style.backgroundColor = "#aff";
				}

				listItem.appendChild(suggestionLink);
				suggestionList.appendChild(listItem);
			}

		} else {
			var listItem = document.createElement("LI");

			var itemContent = document.createElement("SPAN");
			itemContent.innerHTML = "No results...";

			listItem.appendChild(itemContent);
			suggestionList.appendChild(listItem);
		}

		var suggestionContainer = document.createElement("DIV");
		suggestionContainer.className = "suggestion-container";

		suggestionContainer.appendChild(suggestionList);

		this.inputElem.parentNode.appendChild(suggestionContainer);

	}

	this.removeSuggestionElems = function () {

		var inputParent = this.inputElem.parentNode;
		//console.log(this.inputParent);

		var suggestionElems;
		if (ie8) {
			inputSiblings = inputParent.children;
			suggestionElems = [];
			for (var i = 0; i < inputSiblings.length; i++) {
				if (inputSiblings[i].className == "suggestion-container") {
					suggestionElems.push(inputSiblings[i]);
				}
			}
		} else {
			suggestionElems = inputParent.getElementsByClassName("suggestion-container");
		}

		for (var i = 0; i < suggestionElems.length; i++) {
			inputParent.removeChild(suggestionElems[i]);
		}

	}

	this.removeSuggestions = function () {

		this.removeSuggestionElems();

		this.suggestions = [];

	}

	this.handleKeyDown = function (e) {
		var charCode = e.keyCode || e.which;

		if (charCode == 13) { // enter key
			this.submit();
		} else if (charCode == 40 || charCode == 38) { // up or down key
			e.preventDefault(); // stop the up/down arrows from moving the cursor

			// find the current selected result
			var suggestionList = this.inputElem.parentNode.getElementsByClassName("suggestion-list")[0];
			var suggestionLinks = suggestionList.getElementsByTagName("A");
			if (this.selectedResult > -1) { // remove the selection from the current result
				suggestionLinks[this.selectedResult].style.backgroundColor = "";
			}

			if (charCode == 38) { // up
				if (this.selectedResult == -1) {
					this.selectedResult = suggestionLinks.length - 1;
				} else {
					this.selectedResult--;
				}
			} else { // down
				if (this.selectedResult == suggestionLinks.length - 1) {
					this.selectedResult = -1;
				} else {
					this.selectedResult++;
				}
			}

			// update the current selection
			if (this.selectedResult != -1) {
				//console.log(this.selectedResult);
				suggestionLinks[this.selectedResult].style.backgroundColor = "#aff";
				this.inputElem.value = suggestionLinks[this.selectedResult].innerHTML;
			} else {
				this.inputElem.value = this.typed;
			}
		}
	}

	this.handleKeyUp = function (e) {
		var charCode = e.keyCode || e.which;
		//alert(this.verifyCharacter(charCode));

		if (this.inputElem.value == "") {
			this.removeSuggestionElems();
		} else if (this.verifyCharacter(charCode)) {
			//alert(charCode);
			this.selectedResult = -1;
			this.typed = this.inputElem.value;
			this.loadSuggestions();
		}
	}

	this.submit = function () {
		this.suggestions = [];
		this.removeSuggestions();
		setURL(window.location.protocol + "//" + window.location.hostname +
			"/search/?value=" + encodeURIComponent(this.inputElem.value));
	}

	// don't use this, it breaks mobile
	this.verifyCharacter = function (keycode) {
		/*
		var valid = 
			(keycode > 47 && keycode < 58)   || // number keys
			keycode == 32 ||// keycode == 13   || // spacebar & return key(s) (if you want to allow carriage returns)
			keycode == 8 ||						// backspace
			(keycode > 64 && keycode < 91)   || // letter keys
			(keycode > 95 && keycode < 112)  || // numpad keys
			(keycode > 185 && keycode < 193) || // ;=,-./` (in order)
			(keycode > 218 && keycode < 223);   // [\]' (in order)*/

		// just heckin ignore arrow keys
		var valid =
			(keycode < 37 || keycode > 40) && // ignore the arrow keys
			keycode != 13; // ignore enter

		return valid;
	}

	// loads a page with search results from the database
	this.search = function (searchVal) {
		document.getElementById("search").value = searchVal;

		var contentFrame = document.getElementById("contentFrame");
		var content;
		if (contentFrame) {
			var content = (contentFrame.contentWindow || contentFrame.contentDocument);
			if (content.document) { content = content.document; }

			content = content.body;
		} else {
			return;
		}

		var resultContainer = document.createElement("DIV");
		resultContainer.style.textAlign = "center";
		resultContainer.style.margin = "20px";
		content.appendChild(resultContainer);

		var _this = this;
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function () {
			if (this.readyState == 4 && this.status == 200) {
				//alert(this.responseText);
				_this.removeSuggestions();

				var pages = JSON.parse(this.responseText);

				var searchTitle = document.createElement("DIV");
				searchTitle.innerHTML = "Search results for \"" + searchVal + "\":";
				searchTitle.style.fontSize = "25px";
				searchTitle.style.display = "inline-block";
				searchTitle.style.maxWidth = "1000px";
				resultContainer.appendChild(searchTitle);

				resultContainer.appendChild(document.createElement("BR"));

				if (pages.length) {

					for (var i = 0; i < pages.length; i++) {

						var result = document.createElement("A");
						result.innerHTML = pages[i];
						result.href = window.location.protocol + "//" + window.location.hostname +
							"/" + pages[i];

						resultContainer.appendChild(result);
						resultContainer.appendChild(document.createElement("BR"));
					}
				} else {

					var resultText = document.createElement("SPAN");
					resultText.innerHTML = "No results...";
					resultContainer.appendChild(resultText);

				}
			}
		}
		var searchURI = encodeURIComponent(searchVal);
		var postURL = window.location.protocol + "//" +
			window.location.hostname +
			"/assets/scripts/pages.php?command=search&search=" + searchURI + "&limit=20";

		xhr.open("POST", postURL, true);
		xhr.send();
	}

	// handle clicking on the window
	this.handleWindowClick = function (elem) {
		if (elem !== this.inputElem) {
			this.removeSuggestions();
		}
	}

	var _this = this;
	var windowClickCallback = function (e) {
		e = e || window.event;
		var target = e.target || e.srcElement;

		_this.handleWindowClick(target);

	}
	if (ie8) {
		window.attachEvent("onclick", windowClickCallback);
	} else {
		window.addEventListener("click", windowClickCallback, false);
	}

}
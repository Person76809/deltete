// keep track of the page URL in case we have to simulate the history api
var pageURL = window.location.href;

// the iframe where the content is displayed
var frameContainer = document.getElementById("frameContainer");

// searchbar
var searchBar = new Search(document.getElementById("search"));

function handleParentLink(e) {
	e = e || window.event;
	var target = e.target || e.srcElement;

	(e.preventDefault) ? e.preventDefault() : e.returnValue = false;

	setURL(target.href);
}

function getQueryString(url) {
	var qIndex = url.indexOf("?");
	if (qIndex > -1) {
		return url.substr(qIndex + 1, url.length);
	} else {
		return false;
	}
}

// get the value of a query variable
function getQueryVariable(queryString, variable) {

	if (queryString) {
		var vars = queryString.split("&");
		for (var i = 0; i < vars.length; i++) {
			var pair = vars[i].split("=");
			if (pair[0] == variable) { return pair[1]; }
		}
	}
	return (false);
}

function handlePathname(pathname) {
	//// alert("query string: " + queryString);

	//var page = getQueryVariable(queryString, "page");
	// alert(page);
	var page = "";
	if (pathname) {
		page = pathname.substring(1);
		let pageNameEnd = page.indexOf("/");
		page = pageNameEnd == -1 ? page : page.substring(0, pageNameEnd);
	}

	switch (page) {
		case "search":
			createFrame(window.location.protocol + "//" + window.location.hostname +
				"/assets/special/search.html",
				function () {
					searchBar.search(getQueryVariable(getQueryString(window.location.href),
						"value"));
				});
			break;
		case "error":
			createFrame(window.location.protocol + "//" + window.location.hostname +
				"/assets/special/error.html");
			break;
		case "success":
			createFrame(window.location.protocol + "//" + window.location.hostname +
				"/assets/special/success.html");
			break;
		case "":
			createFrame(window.location.protocol + "//" + window.location.hostname +
				"/assets/special/home.html");
			break;
		default:
			createFrame(window.location.protocol + "//" + window.location.hostname +
				"/assets/pages/" + page + ".html");
	}
}

function loadPage() {

	var pathname = new URL(window.location.href).pathname;
	handlePathname(pathname);

}

// set the url and load contents without reloading
function setURL(url) {
	if (historyIsSupported) {

		history.pushState(null, null, url);

		/* load the new page because pushstate will
		not trigger the onpopstate eventlistener */
		loadPage();

	} else {
		window.location.replace(url);
	}

}


// this function handles all link clicks in the iframe window
// URLs beginning with "#" that are relative to the iframe src are allowed
// URLs beginning with "?" that are relative to the iframe src are handled by the parent window
// everything else opens in a new window/tab
function frameClickCallback(e) {

	e = e || window.event;
	var target = e.target || e.srcElement;

	var elemIsLink = false;
	do {
		if (target.tagName == "A") {
			elemIsLink = true;
			break;
		}
		target = target.parentNode;
	} while (target);

	if (elemIsLink) {

		var currentHost = window.location.hostname;

		var external = false;

		if (target.hostname == currentHost) {	// handle internal links

			setURL(target.href);

		} else {	// if the link is external
			external = true;
		}

		if (external) {	// handle external links
			(e.preventDefault) ? e.preventDefault() : e.returnValue = false;
			window.open(target.href, '_blank');
		}

	}

	searchBar.removeSuggestions();
	document.getElementById("navbar").classList.remove("responsive");
}

function createFrame(src, callback) {
	// alert("creating new frame");

	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function () {
		if (this.readyState == 4) {
			if (this.status == 200) {

				// delete all child elements of frameContainer (there should only be 0-1)
				while (frameContainer.firstChild) {
					frameContainer.removeChild(frameContainer.firstChild);
				}

				// create a new frame with the new src
				var frame = document.createElement("IFRAME");
				frame.setAttribute("id", "contentFrame");
				frameContainer.appendChild(frame);

				// ie does not support transparency by default
				frame.setAttribute("allowTransparency", "true");
				frame.setAttribute("frameborder", "0");

				var content = (frame.contentWindow || frame.contentDocument);
				if (content.document) { content = content.document; }

				content.write(this.responseText);

				if (ie8) {
					content.attachEvent("onclick", frameClickCallback);
				} else {
					content.addEventListener("click", frameClickCallback, false);
				}

				// add global css
				var contentHead = content.getElementsByTagName('head')[0];

				var globalCSS = document.createElement("LINK");
				globalCSS.setAttribute("href", "https://mashpoe.com/assets/stylesheets/global.css");
				globalCSS.setAttribute("rel", "stylesheet");

				contentHead.appendChild(globalCSS);

				typeof callback === "function" && callback();

			} else { // error
				createFrame("https://mashpoe.com/assets/special/error.html");
			}

		}
	}
	xmlhttp.open("GET", src, true);
	xmlhttp.send();
}

document.body.onload = function () {
	loadPage();
	if (historyIsSupported) {

		window.onpopstate = function () {
			loadPage();
		}

	}
};
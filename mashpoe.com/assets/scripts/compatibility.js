// boolean value that determines wether or not the browser is ie8
var ie8 = document.documentElement.className == "ie8";

// is history api supported?
var historyIsSupported = (window.history && window.history.pushState);
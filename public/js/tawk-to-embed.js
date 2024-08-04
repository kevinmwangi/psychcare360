/**
 * Start of Tawk.to Script
 */

var Tawk_API = Tawk_API || {};
var Tawk_LoadStart = new Date();

(function () {
    var errorCooldown = {};
    var reconnectAttempts = 0;
    var maxReconnectAttempts = 3;

    function handleTawkError(error) {
        var errorMessage = typeof error === 'string' ? error : error.toString();
        var now = Date.now();

        // Check if we've logged this error recently
        if (errorCooldown[errorMessage] && now - errorCooldown[errorMessage] < 60000) {
            return; // Don't log if it's been less than a minute
        }

        // console.error('Tawk.to error:', errorMessage);
        errorCooldown[errorMessage] = now;

        var logData = {
            message: 'Tawk.to error: ' + errorMessage,
            stack: error instanceof Error ? error.stack : 'No stack trace available',
            url: window.location.href,
            timestamp: now,
            userAgent: navigator.userAgent,
            connectionType: navigator.connection ? navigator.connection.effectiveType : 'unknown',
            source: 'Tawk.to script',
            lineno: error.lineNumber,
            colno: error.columnNumber
        };

        fetch('/log-error', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(logData),
        }).catch(function(fetchError) {
            console.error('Error sending log to server:', fetchError);
        });

        function checkOnline() {
            return navigator.onLine;
        }

        // Attempt to reconnect
        if (reconnectAttempts < maxReconnectAttempts && checkOnline()) {
            setTimeout(function() {
                reconnectAttempts++;
                console.log('Attempting to reconnect... (Attempt ' + reconnectAttempts + ')');
                loadTawkScript();
            }, 5000 * Math.pow(2, reconnectAttempts)); // Exponential backoff
        } else {
            console.error('Max reconnect attempts reached or offline. Please refresh the page or check your internet connection.');
        }
    }

    // Intercept WebSocket constructor
    var OriginalWebSocket = window.WebSocket;
    window.WebSocket = function(url, protocols) {
        var ws = new OriginalWebSocket(url, protocols);

        ws.addEventListener('error', function(event) {
            handleTawkError('WebSocket error for URL: ' + url + '. ReadyState: ' + ws.readyState);
        });

        return ws;
    };

    function loadTawkScript() {
        try {
            var s1 = document.createElement("script");
            var s0 = document.getElementsByTagName("script")[0];
            s1.async = true;
            s1.src = 'https://embed.tawk.to/65935b1b0ff6374032bb00b6/1hj3pnpmu';
            s1.charset = 'UTF-8';
            s1.setAttribute('crossorigin', '*');

            s1.onerror = function(error) {
                handleTawkError('Script loading error: ' + error);
            };

            var timeout = setTimeout(function() {
                handleTawkError('Tawk.to script load timeout');
            }, 10000); // 10 second timeout

            s1.onload = function() {
                clearTimeout(timeout);
            };

            s0.parentNode.insertBefore(s1, s0);
        } catch (error) {
            handleTawkError('Error in loading Tawk.to Script: ' + error);
        }
    }

    loadTawkScript();

    // Set up a global error handler for Tawk_API
    var originalTawkAPI = window.Tawk_API;
    window.Tawk_API = new Proxy(originalTawkAPI || {}, {
        get: function(target, prop) {
            if (typeof target[prop] === 'function') {
                return function() {
                    try {
                        return target[prop].apply(target, arguments);
                    } catch (error) {
                        handleTawkError('Error in Tawk_API.' + prop + ': ' + error);
                    }
                };
            }

            return target[prop];
        },
        set: function(target, prop, value) {
            try {
                target[prop] = value;
                return true;
            } catch (error) {
                handleTawkError('Error setting Tawk_API.' + prop + ': ' + error);
                return false;
            }
        }
    });

})();
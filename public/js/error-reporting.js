window.onerror = function (message, source, lineno, colno, error) {
    var logData = {
        message: message,
        stack: error ? error.stack : null,
        url: window.location.href,
        source: source,
        lineno: lineno,
        colno: colno,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        connectionType: navigator.connection ? navigator.connection.effectiveType : 'unknown'
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
};

// Catch unhandled promise rejections
window.addEventListener('unhandledrejection', function (event) {
    var logData = {
        message: 'Unhandled Promise Rejection: ' + (event.reason ? event.reason.toString() : 'Unknown reason'),
        stack: event.reason && event.reason.stack ? event.reason.stack : 'No stack trace available',
        url: window.location.href,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        connectionType: navigator.connection ? navigator.connection.effectiveType : 'unknown'
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
});
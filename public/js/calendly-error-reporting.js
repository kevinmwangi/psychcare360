// Calendly Error Logger

function isCalendlyEvent(e) {
    return e.origin === "https://calendly.com" && e.data.event && e.data.event.indexOf("calendly.") === 0;
}

function logCalendlyError(error, eventName, payload) {
    console.error("Calendly Error:", error);

    // Send error to server
    fetch('/log-error', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            source: 'Calendly',
            message: error.message || 'Unknown Calendly error',
            stack: error.stack,
            eventName: eventName,
            payload: payload,
            url: window.location.href,
            timestamp: new Date().toISOString()
        }),
    }).catch(fetchError => {
        console.error("Failed to log Calendly error:", fetchError);
    });
}

window.addEventListener("message", function(e) {
    if (isCalendlyEvent(e)) {
        try {
            const eventName = e.data.event;
            const payload = e.data.payload;

            console.log("Calendly Event:", eventName);
            console.log("Event details:", payload);

            // Handle specific Calendly events
            switch (eventName) {
                case 'calendly.event_scheduled':
                    // Handle successful scheduling
                    console.log("Event scheduled successfully");
                    break;
                case 'calendly.date_and_time_selected':
                    // Handle date and time selection
                    console.log("Date and time selected");
                    break;
                case 'calendly.profile_page_viewed':
                    // Handle profile page view
                    console.log("Profile page viewed");
                    break;
                // Add more cases as needed
            }

        } catch (error) {
            logCalendlyError(error, e.data.event, e.data.payload);
        }
    }
});

// Global error handler for Calendly-related errors
window.onerror = function(message, source, lineno, colno, error) {
    if (source.includes('calendly')) {
        logCalendlyError(error || new Error(message), 'global_error', { lineno, colno });
    }
};
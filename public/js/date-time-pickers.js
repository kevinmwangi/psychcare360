function logError(message, stack) {
    fetch('/log-error', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: message,
            stack: stack,
            url: window.location.href
        }),
    }).catch(error => console.error('Error logging failed:', error));
}

document.addEventListener('DOMContentLoaded', function initializeDateTimePickers() {
    const date = document.querySelector('.date');
    const time = document.querySelector('.time');

    if (typeof window.tempusDominus.TempusDominus === 'undefined') {
        logError('TempusDominus is not defined', new Error().stack);
        console.error('TempusDominus is not defined. Make sure the library is properly loaded.');
        return;
    }

    try {
        if (date) {
            new window.tempusDominus.TempusDominus(date, {
                display: {
                    icons: {
                        type: 'icons',
                        time: 'bi bi-clock',
                        date: 'bi bi-calendar3',
                        up: 'bi bi-arrow-up-short',
                        down: 'bi bi-arrow-down-short',
                        previous: 'bi bi-chevron-left',
                        next: 'bi bi-chevron-right',
                        today: 'bi bi-calendar-check',
                        clear: 'bi bi-trash',
                        close: 'bi bi-x'
                    },
                    components: {
                        clock: false,
                        hours: false,
                        minutes: false,
                        seconds: false
                    }
                },
                localization: {
                    format: 'L'
                }
            });
        }

        if (time) {
            new window.tempusDominus.TempusDominus(time, {
                display: {
                    viewMode: 'clock',
                    components: {
                        decades: false,
                        year: false,
                        month: false,
                        date: false,
                        hours: true,
                        minutes: true,
                        seconds: false
                    }
                },
                localization: {
                    format: 'hh:mm A'
                }
            });
        }
    } catch (error) {
        let errorMessage = 'An unexpected error occurred while initializing date/time pickers';

        if (error instanceof window.tempusDominus.TempusDominus.Namespace.ErrorMessages.FailedToParseInput) {
            errorMessage = 'Failed to parse input date/time';
        } else if (error instanceof window.tempusDominus.TempusDominus.Namespace.ErrorMessages.FailedToSetDate) {
            errorMessage = 'Failed to set date';
        } else if (error instanceof window.tempusDominus.TempusDominus.Namespace.ErrorMessages.FailedToSetTime) {
            errorMessage = 'Failed to set time';
        } else if (error instanceof window.tempusDominus.TempusDominus.Namespace.ErrorMessages.InvalidDateTimeFormat) {
            errorMessage = 'Invalid date/time format';
        } else if (error instanceof window.tempusDominus.TempusDominus.Namespace.ErrorMessages.InvalidDate) {
            errorMessage = 'Invalid date';
        } else if (error instanceof window.tempusDominus.TempusDominus.Namespace.ErrorMessages.InvalidTimeFormat) {
            errorMessage = 'Invalid time format';
        } else if (error instanceof window.tempusDominus.TempusDominus.Namespace.ErrorMessages.InvalidTimeValue) {
            errorMessage = 'Invalid time value';
        }

        console.error(errorMessage, error);
        logError(errorMessage, error.stack);

        // You might want to add some user-friendly error handling here,
        // such as displaying an error message to the user
    }
});
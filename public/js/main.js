(function (jQuery) {
    "use strict";

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

    jQuery(document).ready(function ($) {
        try {
            // Spinner
            var spinner = function () {
                setTimeout(function () {
                    if ($("#spinner").length > 0) {
                        $('#spinner').removeClass('show');
                    }
                }, 1);
            };
            spinner();

            if ($("#year").length > 0) {
                const currentYear = new Date().getFullYear().toString();
                $("#year").append(currentYear);
            }

            // Initiate the wowjs
            if (typeof WOW === 'function') {
                new WOW().init();
            } else {
                throw new Error('WOW is not defined. Make sure the WOW library is loaded.');
            }

            // Sticky Navbar
            $(window).on('scroll', function () {
                if ($(this).scrollTop() > 40) {
                    $('.navbar').addClass('sticky-top');
                } else {
                    $('.navbar').removeClass('sticky-top');
                }
            });

            // Dropdown on mouse hover
            const $dropdown = $(".dropdown");
            const $dropdownToggle = $(".dropdown-toggle");
            const $dropdownMenu = $(".dropdown-menu");
            const showClass = "show";

            $(window).on("load resize", function () {
                if (window.matchMedia("(min-width: 992px)").matches) {
                    $dropdown.hover(
                        function () {
                            const $this = $(this);
                            $this.addClass(showClass);
                            $this.find($dropdownToggle).attr("aria-expanded", "true");
                            $this.find($dropdownMenu).addClass(showClass);
                        },
                        function () {
                            const $this = $(this);
                            $this.removeClass(showClass);
                            $this.find($dropdownToggle).attr("aria-expanded", "false");
                            $this.find($dropdownMenu).removeClass(showClass);
                        }
                    );
                } else {
                    $dropdown.off("mouseenter mouseleave");
                }
            });

            // Back to top button
            // Flag to track button visibility
            let isButtonVisible = false;

            // Function to update button visibility
            function updateButtonVisibility() {
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const shouldBeVisible = scrollTop > 50;

                if (shouldBeVisible !== isButtonVisible) {
                    isButtonVisible = shouldBeVisible;
                    if (shouldBeVisible) {
                        $('.back-to-top').stop(true, true).fadeIn(300);
                    } else {
                        $('.back-to-top').stop(true, true).fadeOut(300);
                    }
                }
            }

            // Throttle function
            function throttle(func, limit) {
                let lastFunc;
                let lastRan;
                return function () {
                    const context = this;
                    const args = arguments;
                    if (!lastRan) {
                        func.apply(context, args);
                        lastRan = Date.now();
                    } else {
                        clearTimeout(lastFunc);
                        lastFunc = setTimeout(function () {
                            if ((Date.now() - lastRan) >= limit) {
                                func.apply(context, args);
                                lastRan = Date.now();
                            }
                        }, limit - (Date.now() - lastRan));
                    }
                }
            }

            // Throttled scroll event handler
            const throttledScrollHandler = throttle(function () {
                requestAnimationFrame(updateButtonVisibility);
            }, 100);

            // Attach scroll event listener
            window.addEventListener('scroll', throttledScrollHandler);

            // Back to top button click event
            if ($('.back-to-top').length > 0) {
                $('.back-to-top').on('click', function (e) {
                    e.preventDefault();
                    $('html, body').animate({scrollTop: 0}, 300, 'easeOutQuad');
                });
            }

            // Custom easing function
            $.easing.easeOutQuad = function (x, t, b, c, d) {
                return -c * (t /= d) * (t - 2) + b;
            };

            // Image comparison
            if ($(".twentytwenty-container").length > 0) {
                if ($.fn.twentytwenty) {
                    $(".twentytwenty-container").twentytwenty({});
                } else {
                    throw new Error('twentytwenty is not defined. Make sure the twentytwenty library is loaded.');
                }
            }

            if ($(".price-carousel").length > 0) {
                if ($.fn.owlCarousel) {
                    // Price carousel
                    $(".price-carousel").owlCarousel({
                        autoplay: true,
                        smartSpeed: 1500,
                        margin: 45,
                        dots: false,
                        loop: true,
                        nav: true,
                        navText: [
                            '<i class="bi bi-arrow-left"></i>',
                            '<i class="bi bi-arrow-right"></i>'
                        ],
                        responsive: {
                            0: {
                                items: 1
                            },
                            768: {
                                items: 2
                            }
                        }
                    });
                } else {
                    throw new Error('owlCarousel is not defined. Make sure the Owl Carousel library is loaded.');
                }
            }

            if ($(".testimonial-carousel").length > 0) {
                if ($.fn.owlCarousel) {

                    // Testimonials carousel
                    $(".testimonial-carousel").owlCarousel({
                        autoplay: true,
                        smartSpeed: 1000,
                        items: 1,
                        dots: false,
                        loop: true,
                        nav: true,
                        navText: [
                            '<i class="bi bi-arrow-left"></i>',
                            '<i class="bi bi-arrow-right"></i>'
                        ],
                    });
                } else {
                    throw new Error('owlCarousel is not defined. Make sure the Owl Carousel library is loaded.');
                }
            }

            /**
             * Preloader
             */
            let preloader = $('#preloader');
            if (preloader) {
                window.addEventListener('load', () => {
                    preloader.remove()
                });
            }

        } catch (error) {
            // console.error('An error occurred:', error);
            logError(error.message, error.stack);
        }
    });

    // document.addEventListener('DOMContentLoaded', function() {
    //     const form = document.querySelector('form');
    //     const modal = new bootstrap.Modal(document.getElementById('successModal'));
    //     let modalHideTimer;
    //
    //     form.addEventListener('submit', function(e) {
    //         e.preventDefault();
    //
    //         console.log('----- e ---', e.target.action)
    //
    //         let endpoint = e.target.action; //'/contact-form'; // Default endpoint
    //         let formData = {};
    //
    //         if (form.id === 'subscribe-newsletter') {
    //             // endpoint = '/subscribe-newsletter';
    //             formData = {
    //                 email_address: form.querySelector('input[name="email_address"]').value
    //             };
    //         } else if (form.id === 'submit-appointment') {
    //             // endpoint = '/submit-appointment';
    //             formData = {
    //                 primary_condition: form.querySelector('select[name="primary_condition"]').value,
    //                 secondary_condition: form.querySelector('select[name="secondary_condition"]').value,
    //                 f_name: form.querySelector('input[name="f_name"]').value,
    //                 l_name: form.querySelector('input[name="l_name"]').value,
    //                 address: form.querySelector('input[name="address"]').value,
    //                 gender: form.querySelector('select[name="gender"]').value,
    //                 email: form.querySelector('input[name="email"]').value,
    //                 phone: form.querySelector('input[name="phone"]').value,
    //                 dob: form.querySelector('input[name="dob"]').value,
    //                 zip_code: form.querySelector('input[name="zip_code"]').value,
    //                 insurance: form.querySelector('select[name="insurance"]').value,
    //                 where_about: form.querySelector('select[name="where_about"]').value
    //             };
    //         } else {
    //             // Contact form
    //             formData = {
    //                 name: form.querySelector('input[name="name"]').value,
    //                 email: form.querySelector('input[name="email"]').value,
    //                 message: form.querySelector('textarea[name="message"]').value
    //             };
    //         }
    //
    //         fetch(endpoint, {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify(formData)
    //         })
    //             .then(response => response.json())
    //             .then(data => {
    //                 document.getElementById('status').textContent = data.success ? 'Success' : 'Error';
    //                 document.getElementById('message').textContent = data.message;
    //
    //                 if (data.success) {
    //                     // Clear the form if submission was successful
    //                     form.reset();
    //                 }
    //
    //                 showModalWithAutoHide();
    //             })
    //             .catch(error => {
    //                 // console.error('Error:', error);
    //                 // Log the error
    //                 logError('Form submission error', error.stack);
    //                 document.getElementById('status').textContent = 'Error';
    //                 document.getElementById('message').textContent = 'An unexpected error occurred. Please try again later.';
    //                 showModalWithAutoHide();
    //             });
    //     });
    //
    //     function showModalWithAutoHide() {
    //         modal.show();
    //         if (modalHideTimer) {
    //             clearTimeout(modalHideTimer);
    //         }
    //         modalHideTimer = setTimeout(() => {
    //             modal.hide();
    //         }, 2500);
    //     }
    //
    //     document.getElementById('successModal').addEventListener('click', function() {
    //         if (modalHideTimer) {
    //             clearTimeout(modalHideTimer);
    //         }
    //     });
    // });
    document.addEventListener('DOMContentLoaded', function() {
        const forms = document.querySelectorAll('form');
        const modal = new bootstrap.Modal(document.getElementById('successModal'));
        let modalHideTimer;

        forms.forEach(form => {
            form.addEventListener('submit', function(e) {
                e.preventDefault();

                let endpoint = e.target.action;
                let formData = new FormData(form);
                let jsonData = {};

                formData.forEach((value, key) => {
                    jsonData[key] = value;
                });

                fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': jsonData.length
                    },
                    body: JSON.stringify(jsonData)
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.json();
                    })
                    .then(data => {
                        document.getElementById('status').textContent = data.success ? 'Success' : 'Error';
                        document.getElementById('message').textContent = data.message;

                        if (data.success) {
                            form.reset();

                            // Reset TempusDominus date/time pickers if they exist
                            // form.querySelectorAll('.datetimepicker-input').forEach(input => {
                            //     const picker = TempusDominus.getInstance(input);
                            //     if (picker) {
                            //         picker.clear();
                            //     }
                            // });
                        }

                        showModalWithAutoHide();
                    })
                    .catch(error => {
                        logError('Form submission error', error.stack);
                        document.getElementById('status').textContent = 'Error';
                        document.getElementById('message').textContent = 'An unexpected error occurred. Please try again later.';
                        showModalWithAutoHide();
                    });
            });
        });

        function showModalWithAutoHide() {
            modal.show();
            if (modalHideTimer) {
                clearTimeout(modalHideTimer);
            }
            modalHideTimer = setTimeout(() => {
                modal.hide();
            }, 2500);
        }

        document.getElementById('successModal').addEventListener('click', function() {
            if (modalHideTimer) {
                clearTimeout(modalHideTimer);
            }
        });
    });

    // Global error handler
    window.onerror = function (message, source, lineno, colno, error) {
        logError(message, error ? error.stack : null);
    };

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', function (event) {
        logError(event.reason.message, event.reason.stack);
    });

})(jQuery);
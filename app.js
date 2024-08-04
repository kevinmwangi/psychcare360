const env = require('dotenv').config();
const express = require("express");
// const multer = require('multer');
// const upload = multer();
const https = require("https");
const cors = require("cors");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const {SitemapStream} = require('sitemap');
const {createGzip} = require('zlib');
const winston = require('winston');
const debug = require('debug')(env.parsed.DEBUG);
const debugAppointment = require('debug')(env.parsed.DEBUG_APPOINTMENT);
const fs = require('fs').promises;
const path = require('path');

const app = express();

const serverTiming = (req, res, next) => {
    const start = process.hrtime();

    res.on('finish', () => {
        const end = process.hrtime(start);
        const duration = end[0] * 1000 + end[1] / 1e6; // Convert to milliseconds
        res.locals.serverTiming = `total;dur=${duration}`;
    });

    next();
};

const setServerTiming = (res, timings) => {
    if (!res.headersSent) {
        const serverTiming = res.locals && res.locals.serverTiming ?
            `${res.locals.serverTiming}, ${timings}` :
            timings;
        res.setHeader('Server-Timing', serverTiming);
    }
};

const getDuration = (start) => {
    const end = process.hrtime(start);
    return end[0] * 1000 + end[1] / 1e6; // Convert to milliseconds
};

// Logger configuration
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({filename: 'error.log', level: 'error'}),
        new winston.transports.File({filename: 'combined.log'}),
    ],
});

// Email transporter
const transporter = nodemailer.createTransport({
    host: env.parsed.EMAIL_HOST,
    port: env.parsed.EMAIL_PORT,
    auth: {
        user: env.parsed.EMAIL_USER,
        pass: env.parsed.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Helper function for serving static HTML files
const serveHTMLFile = (filePath, debugMessage) => async (req, res) => {
    const start = process.hrtime();
    debug(debugMessage);
    try {
        await fs.access(path.join(__dirname, filePath));
        const accessDuration = getDuration(start);

        res.sendFile(path.join(__dirname, filePath), {}, (err) => {
            if (err) {
                debug(`Error in ${filePath}: %O`, err);
                logger.error(`Error serving ${filePath}:`, err);
                setServerTiming(res, `access;dur=${accessDuration}, error;dur=${getDuration(start)}`);
                res.status(500).send('An error occurred');
            } else {
                const totalDuration = getDuration(start);
                setServerTiming(res, `access;dur=${accessDuration}, total;dur=${totalDuration}`);
            }
        });
    } catch (error) {
        debug(`Error in ${filePath}: %O`, error);
        logger.error(`Error serving ${filePath}:`, error);
        setServerTiming(res, `error;dur=${getDuration(start)}`);
        res.status(500).send('An error occurred');
    }
};

// Verify email transporter
transporter.verify((error) => {
    if (error) {
        logger.error('Email transporter error:', error);
    } else {
        logger.info("Email transporter is ready");
    }
});

if (env.parsed.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
    }));
}

const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Middleware
app.use(cors({origin: "*"}));
app.use(express.static("public"));
app.use('/uploads', express.static('uploads'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(serverTiming);

// Sitemap configuration
app.get('/sitemap.xml', async (req, res) => {
    const routeStart = process.hrtime();
    debug('Sitemap requested');
    try {
        const sitemapPath = path.join(__dirname, 'sitemap.xml');
        const readStart = process.hrtime();
        const sitemapContent = await fs.readFile(sitemapPath, 'utf8');
        const readEnd = process.hrtime(readStart);
        const readDuration = readEnd[0] * 1000 + readEnd[1] / 1e6;

        res.header('Content-Type', 'application/xml');
        const totalEnd = process.hrtime(routeStart);
        const totalDuration = totalEnd[0] * 1000 + totalEnd[1] / 1e6;
        setServerTiming(res, `read;dur=${readDuration}, total;dur=${totalDuration}`);
        res.send(sitemapContent);
    } catch (error) {
        debug('Error serving sitemap: %O', error);
        logger.error('Error serving sitemap:', error);
        const errorEnd = process.hrtime(routeStart);
        const errorDuration = errorEnd[0] * 1000 + errorEnd[1] / 1e6;
        setServerTiming(res, `error;dur=${errorDuration}`);
        res.status(500).send('An error occurred while serving the sitemap');
    }
});

// Routes
app.get('/sitemap.xml', async (req, res) => {
    const routeStart = process.hrtime();
    debug('Sitemap requested');
    try {
        const smStream = new SitemapStream({hostname: 'https://psychcare360.com'});
        const pipeline = smStream.pipe(createGzip());

        res.header('Content-Type', 'application/xml');
        res.header('Content-Encoding', 'gzip');

        const writeStart = process.hrtime();
        smStream.write(urls);
        smStream.end();
        const writeEnd = process.hrtime(writeStart);
        const writeDuration = writeEnd[0] * 1000 + writeEnd[1] / 1e6;

        pipeline.pipe(res).on('error', (e) => {
            throw e;
        }).on('finish', () => {
            const totalEnd = process.hrtime(routeStart);
            const totalDuration = totalEnd[0] * 1000 + totalEnd[1] / 1e6;
            setServerTiming(res, `write;dur=${writeDuration}, total;dur=${totalDuration}`);
        });
    } catch (error) {
        debug('Error in /sitemap: %O', error);
        logger.error('Error in /sitemap.xml:', error);
        const errorEnd = process.hrtime(routeStart);
        const errorDuration = errorEnd[0] * 1000 + errorEnd[1] / 1e6;
        setServerTiming(res, `error;dur=${errorDuration}`);
        res.status(500).send('An error occurred');
    }
});

// Define routes using the helper function
app.get("/", serveHTMLFile("index.html", 'Homepage requested'));
app.get("/robots.txt", serveHTMLFile("robots.txt", 'Robots requested'));
app.get("/contact", serveHTMLFile("contact.html", 'Contact requested'));
app.get("/about", serveHTMLFile("about.html", 'About requested'));
app.get("/adhd", serveHTMLFile("adhd.html", 'ADHD requested'));
app.get("/anxiety", serveHTMLFile("anxiety.html", 'Anxiety requested'));
app.get("/appointment", serveHTMLFile("appointment.html", 'Appointment requested'));
app.get("/bipolar", serveHTMLFile("bipolar.html", 'Bipolar requested'));
app.get("/cost-of-care", serveHTMLFile("cost-of-care.html", 'Cost of care requested'));
app.get("/depression", serveHTMLFile("depression.html", 'Depression requested'));
app.get("/gender-identity", serveHTMLFile("gender-identity.html", 'Gender identity requested'));
app.get("/insurance", serveHTMLFile("insurance.html", 'Insurance requested'));
app.get("/medication", serveHTMLFile("medication.html", 'Medication requested'));
app.get("/mood-disorder", serveHTMLFile("mood-disorder.html", 'Mood disorder requested'));
app.get("/new-patient-paperwork", serveHTMLFile("new-patient-paperwork.html", 'New patient paperwork requested'));
app.get("/ocd", serveHTMLFile("ocd.html", 'OCD requested'));
app.get("/patient-portal", serveHTMLFile("patient-portal.html", 'Patient portal requested'));
app.get("/ptsd", serveHTMLFile("ptsd.html", 'PTSD requested'));
app.get("/schizophrenia", serveHTMLFile("schizophrenia.html", 'Schizophrenia requested'));
app.get("/service", serveHTMLFile("service.html", 'Service requested'));
app.get("/team", serveHTMLFile("team.html", 'Team requested'));
app.get("/therapy", serveHTMLFile("therapy.html", 'Therapy requested'));
app.get("/trauma", serveHTMLFile("trauma.html", 'Trauma requested'));
app.get("/frequently-asked-questions", serveHTMLFile("faq.html", 'FAQ requested'));
app.get("/blog", serveHTMLFile("blog.html", 'Blog requested'));
app.get("/mental-illness", serveHTMLFile("mental-illness.html", 'Mental illness requested'));
app.get("/loneliness", serveHTMLFile("loneliness.html", 'Loneliness requested'));

app.post("/subscribe-newsletter", express.json(), (req, res) => {
    const start = process.hrtime();
    debug('Newsletter subscription request received');
    const email = req.body.email_address;

    if (!email || !isValidEmail(email)) {
        return res.status(400).json({ success: false, message: "Please provide a valid email address." });
    }

    const data = {
        members: [
            {
                email_address: email,
                status: "subscribed"
            }
        ]
    };
    const jsonData = JSON.stringify(data);
    const url = `https://${env.parsed.MAILCHIMP_SERVER}.api.mailchimp.com/3.0/lists/${env.parsed.MAILCHIMP_LIST_ID}`;
    const options = {
        method: "POST",
        auth: `${env.parsed.MAILCHIMP_NEWS_LETTER}:${env.parsed.MAILCHIMP_API_KEY}`,
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': jsonData.length
        }
    };

    const request = https.request(url, options, (response) => {
        let responseData = "";
        response.on("data", (chunk) => {
            responseData += chunk;
        });

        response.on("end", () => {
            const duration = getDuration(start);
            setServerTiming(res, `mailchimp;dur=${duration}`);

            debug(`Mailchimp API response status: ${response.statusCode}`);
            const parsedResponse = JSON.parse(responseData);
            if (response.statusCode === 200) {
                return res.json({ success: true, message: "Congratulations on your successful subscription to 360 Psychiatry Associates! We are delighted to inform you that you will start receiving regular email updates from us." });
            } else {
                logger.error('Mailchimp API error:', parsedResponse);
                return res.json({ success: false, message: "Oops! Something went wrong. Please try again later." });
            }
        });
    });

    request.on("error", (error) => {
        logger.error('Error in newsletter subscription:', error);
        const duration = getDuration(start);
        setServerTiming(res, `error;dur=${duration}`);
        return res.json({ success: false, message: "An error occurred while processing your request." });
    });

    request.write(jsonData);
    request.end();
});

app.post("/submit-appointment", express.json(), (req, res) => {
    const routeStart = process.hrtime();
    debugAppointment('Appointment request received');

    const {
        primary_condition, secondary_condition, f_name, l_name,
        address, gender, email, phone, dob, zip_code, insurance, where_about
    } = req.body;

    // Validate input
    if (!f_name || !l_name || !email || !phone || !isValidEmail(email) || !phone || !gender || !primary_condition || !zip_code || !dob) {
        debugAppointment('Invalid input: %O', req.body);
        return res.status(400).json({ success: false, message: "Required fields are missing." });
    }

    const mail = {
        from: 'info@psychcare360.com',
        to: 'info@psychcare360.com',
        subject: `New Appointment Request From ${f_name} ${l_name}`,
        text: `
            Primary Condition: ${primary_condition || 'N/A'}
            Secondary Condition: ${secondary_condition || 'N/A'}
            First Name: ${f_name}
            Last Name: ${l_name}
            Address: ${address || 'N/A'}
            Gender: ${gender || 'N/A'}
            Email: ${email}
            Phone: ${phone}
            Date Of Birth: ${dob || 'N/A'}
            Zip Code: ${zip_code || 'N/A'}
            Insurance: ${insurance || 'N/A'}
            Where About: ${where_about || 'N/A'}
        `,
    };

    debugAppointment('Preparing email with data: %O', mail);
    const emailStart = process.hrtime();
    transporter.sendMail(mail, (err, info) => {
        const emailDuration = getDuration(emailStart);
        const totalDuration = getDuration(routeStart);

        if (err) {
            debugAppointment('Error sending email: %O', err);
            logger.error('Error sending appointment email:', err);
            setServerTiming(res, `error;dur=${emailDuration}, total;dur=${totalDuration}`);
            res.status(500).json({ success: false, message: "An error occurred while processing your appointment request." });
        } else {
            debugAppointment('Email sent successfully: %O', info);
            setServerTiming(res, `email;dur=${emailDuration}, total;dur=${totalDuration}`);
            res.status(200).json({ success: true, message: "Your appointment request has been received successfully." });
        }
    });
});

app.post("/contact-form", express.json(), (req, res) => {
    const start = process.hrtime();
    debug('Contact form submission received');

    const { name, email, message } = req.body;

    if (!name || !email || !message || !email || !isValidEmail(email)) {
        return res.status(400).json({
            success: false,
            message: "Please provide all required fields with valid data."
        });
    }

    const mail = {
        from: 'info@psychcare360.com',
        to: 'info@psychcare360.com',
        subject: `New Contact Form Submission from ${name}`,
        text: `
            Name: ${name}
            Email: ${email}
            Message: ${message}
        `,
    };

    debug('Preparing email with data: %O', mail);
    const emailStart = process.hrtime();
    transporter.sendMail(mail, (err, info) => {
        const emailDuration = getDuration(emailStart);
        const totalDuration = getDuration(start);

        if (err) {
            debug('Error sending email: %O', err);
            logger.error('Error sending contact form email:', err);
            setServerTiming(res, `error;dur=${emailDuration}, total;dur=${totalDuration}`);
            res.status(500).json({ success: false, message: "An error occurred while processing your contact form submission." });
        } else {
            debug('Email sent successfully: %O', info);
            setServerTiming(res, `email;dur=${emailDuration}, total;dur=${totalDuration}`);
            res.status(200).json({ success: true, message: "Your message has been sent successfully. We'll get back to you soon." });
        }
    });
});

app.post("/log-error", (req, res) => {
    const start = process.hrtime();
    const {message, stack, url, source, lineno, colno, timestamp, userAgent, connectionType} = req.body;
    logger.error('Client-side error:', {
        message,
        stack,
        url,
        source,
        lineno,
        colno,
        timestamp: new Date(timestamp),
        userAgent,
        connectionType
    });
    const duration = getDuration(start);
    setServerTiming(res, `log-error;dur=${duration}`);
    res.status(200).send('Error logged');
});

// Error handling middleware
app.use((err, req, res, next) => {
    const start = process.hrtime();
    logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    const duration = getDuration(start);

    // Ensure res.locals exists
    res.locals = res.locals || {};

    setServerTiming(res, `error-handling;dur=${duration}`);
    res.status(500).json({ success: false, message: 'Something went wrong' });
});

// Start the server
const PORT = env.parsed.PORT || 3000;
const server = app.listen(PORT, () => {
    const startupTime = process.uptime() * 1000; // Convert to milliseconds
    console.log(`Server is running on port ${PORT}`);
    debug(`Server started on port ${PORT} in ${startupTime.toFixed(2)}ms`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    debug('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        debug('HTTP server closed');
    });
});

module.exports = app;
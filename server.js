import express from 'express';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bcrypt from 'bcrypt';
import session from 'express-session';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';

dotenv.config();  

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const master_user = process.env.MASTER_USERNAME;
const master_password = process.env.MASTER_HASHED_PASSWORD;

const app = new express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new sqlite3.Database('./userData.db');

// Content Security Policy
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self';");
    next();
});

// Middleware to sanitize input
app.use((req, res, next) => {
    // Sanitize all query params
    if (req.query) {
        for (let key in req.query) {
            req.query[key] = DOMPurify.sanitize(req.query[key]);
        }
    }
    // Sanitize all body params
    if (req.body) {
        for (let key in req.body) {
            req.body[key] = DOMPurify.sanitize(req.body[key]);
        }
    }
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


// Middleware to protect from clickjacking
app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    next();
});

app.use(
    session({
        secret:process.env.SESSION_SECRET,
        resave:false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            maxAge: 1000 * 60 * 15,
            // sameSite: strict
        },
    })
);

// if (process.env.NODE_ENV === 'production') {
//     app.use((req, res, next) => {
//         if (req.protocol === 'http') {
//             return res.redirect(301, `https://${req.get('host')}${req.url}`);
//         }
//         next();
//     });
// }

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS user (
            name TEXT NOT NULL,
            password TEXT NOT NULL
        )
    `, (err) => {
        if (err) {
            console.error("Error creating 'students' table:", err.message);
        } else {
            console.log("'students' table is ready.");
        }
    })
});

const loginLimiter = rateLimit({
    windowMs: 30 * 60 * 1000,
    max: 5,
    message: "Too many login attempts, please try again after 15 minutes."
});

function isAuthenticated(req, res, next) {
    if (req.session.isAuth) {
        return next();
    }
    return res.redirect('/');
}

app.post('/login', loginLimiter,async(req,res) => {
    const { email, password } = req.body;

    console.log("Master User: ", master_user);
    console.log("Master Hashed Password: ", master_password);
    console.log(email)
    console.log(password)


    if(email === master_user) {
        const match = await bcrypt.compare(password, master_password);
        console.log(match);

        if(match) {
            req.session.isAuth = true;
            return res.redirect('/dashboard');
        }
        else {
            return res.status(401).send('Invalid Username or password.');
        }
    }
});

app.get('/dashboard', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
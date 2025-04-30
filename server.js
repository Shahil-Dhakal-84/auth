import express from 'express';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bcrypt from 'bcrypt';
import session from 'express-session';
import dotenv from 'dotenv';

dotenv.config();

const master_user = process.env.MASTER_USERNAME;
const master_password = process.env.MASTER_HASHED_PASSWORD;

const app = new express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new sqlite3.Database('./userData.db');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

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

app.post('/logIn',async(req,res) => {
    const { email, password } = req.body;

    console.log("Master User: ", master_user);
    console.log("Master Hashed Password: ", master_password);
    console.log(email)
    console.log(password)


    if(email === master_user) {
        const match = await bcrypt.compare(password, master_password);
        console.log(match);

        if(match) {
            // req.session.isAuth = true;
            return res.status(200).send('Logged in Successfull!!');
        }
    }

    return res.status(401).send('Invalid Username or password.')
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
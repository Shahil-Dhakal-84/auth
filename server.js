import express from 'express';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bcrypt from 'bcrypt';
import session from 'express-session';

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


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
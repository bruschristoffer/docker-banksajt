import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import db from './db.js';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());



// Generera engångslösenord
function generateOTP() {
    // Generera en sexsiffrig numerisk OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp.toString();
}



// Din kod här. Skriv dina routes:


//tar emot användarnamn och lösenord, skapar en ny användare och ett konto med saldo 0.
app.post('/users', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Användarnamn och lösenord krävs' });
    }

    try {
        const insertUser = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
        const userResult = insertUser.run(username, password);
        const userId = Number(userResult.lastInsertRowid);

        const insertAccount = db.prepare('INSERT INTO accounts (userId, amount) VALUES (?, 0)');
        insertAccount.run(userId);

        return res.status(201).json({ message: 'Användare skapad', userId });
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(400).json({ message: 'Användarnamnet är redan taget' });
        }
        res.status(500).json({ message: 'Ett fel uppstod vid skapandet av användaren' });
    }
});


//kontrollerar om användaren finns och lösenordet är korrekt och genererar en OTP-token om det är korrekt.
app.post('/sessions', (req, res) => {
    const { username, password } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);

    if (!user) {
        return res.status(401).json({ message: 'Felaktigt användare eller lösenord' });
    }

    const token = generateOTP();
    db.prepare('INSERT INTO sessions (token, userId) VALUES (?, ?)').run(token, user.id);

    res.status(200).json({ token });
});


//kontrollerar om token är giltig och returnerar kontoinformationen för den användaren.
app.post('/me/accounts', (req, res) => {
    const { token } = req.body;

    const session = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
    if (!session) {
        return res.status(401).json({ message: 'Ogiltig token' });
    }

    const accont = db.prepare('SELECT * FROM accounts WHERE userId = ?').get(session.userId);
    if (!accont) {
        return res.status(404).json({ message: 'Konto hittades inte' });
    }

    res.status(200).json({ amount: accont.amount });
});

//kontrollerar om token är giltig och uppdaterar kontots saldo med det angivna beloppet.
app.post('/me/accounts/transactions', (req, res) => {
    const { token, amount } = req.body;
    const nrAmount = parseFloat(amount);

    if (isNaN(nrAmount) || nrAmount <= 0) {
        return res.status(400).json({ message: 'Ogiltigt belopp' });
    }

    const session = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
    if (!session) {
        return res.status(401).json({ message: 'Ogiltig token' });
    }

    const account = db.prepare('SELECT * FROM accounts WHERE userId = ?').get(session.userId);
    if (!account) {
        return res.status(404).json({ message: 'Konto hittades inte' });
    }
    
    const newAmount = account.amount + nrAmount;
    db.prepare('UPDATE accounts SET amount = ? WHERE userId = ?').run(newAmount, session.userId);
    res.status(200).json({amount: newAmount});
});

// Starta servern
app.listen(port, () => {
    console.log(`Bankens backend körs på http://localhost:${port}`);
});
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'bank_app',
    password: process.env.DB_PASSWORD || 'bank_password',
    database: process.env.DB_NAME || 'bank',
    port: Number(process.env.DB_PORT) || 3306
});

async function query(sql, params) {
    const [results] = await pool.execute(sql, params);
    return results;
}

// Generera engångslösenord
function generateOTP() {
    // Generera en sexsiffrig numerisk OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp.toString();
}



// Din kod här. Skriv dina routes:


//tar emot användarnamn och lösenord, skapar en ny användare och ett konto med saldo 0.
app.post('/users', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Användarnamn och lösenord krävs' });
    }

    /*try {
        const insertUser = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
        const userResult = insertUser.run(username, password);
        const userId = Number(userResult.lastInsertRowid);

        const insertAccount = db.prepare('INSERT INTO accounts (userId, amount) VALUES (?, 0)');
        insertAccount.run(userId);

        return res.status(201).json({ message: 'Användare skapad', userId });
    }*/try {
        const userResult= await query('INSERT INTO users (username, password) VALUES (?, ?)', [username, password]);
        const userId = userResult.insertId;

        await query(
            'INSERT INTO accounts (userId, amount) VALUES(?,0)',
            [userId]
        );

        return res.status(201).json({message: 'Användare skapad', userId});
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Användarnamnet är redan taget' });
        }
        return res.status(500).json({ message: 'Ett fel uppstod vid skapandet av användaren' });
    }
});


//kontrollerar om användaren finns och lösenordet är korrekt och genererar en OTP-token om det är korrekt.
app.post('/sessions', async(req, res) => {

    const { username, password } = req.body;

    try {
        const users = await query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);

        if (users.length === 0) {
            return res.status(401).json({ message: 'Felaktigt användare eller lösenord' });
        }

        const user = users[0];
        const token = generateOTP();
        await query('INSERT INTO sessions (token, userId) VALUES (?, ?)', [token, user.id]);

        return res.status(200).json({ token });
    } catch (error) {
        return res.status(500).json({ message: 'Ett fel uppstod vid inloggningen' });
    }
/*
    const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);

    if (!user) {
        return res.status(401).json({ message: 'Felaktigt användare eller lösenord' });
    }

    const token = generateOTP();
    db.prepare('INSERT INTO sessions (token, userId) VALUES (?, ?)').run(token, user.id);

    res.status(200).json({ token });*/
});


//kontrollerar om token är giltig och returnerar kontoinformationen för den användaren.
app.post('/me/accounts', async (req, res) => {
    const { token } = req.body;

    try {
        const sessions = await query('SELECT * FROM sessions WHERE token = ?', [token]);

        if (sessions.length === 0) {
            return res.status(401).json({ message: 'Ogiltig token' });
        }

        const session = sessions[0];
        const accounts = await query(
            'SELECT * FROM accounts WHERE userID = ?',
            [session.userId]
        );

        if (accounts.length === 0){
            return res.status(404).json({ message: 'Konto hittades inte'});
    }
    return res.status(200).json({amount: Number(accounts[0].amount)});
}catch (error){
    return res.status(500).json({message: 'Internt serverfel'});
    }


    /*const session = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
    if (!session) {
        return res.status(401).json({ message: 'Ogiltig token' });
    }

    const accont = db.prepare('SELECT * FROM accounts WHERE userId = ?').get(session.userId);
    if (!accont) {
        return res.status(404).json({ message: 'Konto hittades inte' });
    }

    res.status(200).json({ amount: accont.amount });*/
});

//kontrollerar om token är giltig och uppdaterar kontots saldo med det angivna beloppet.
app.post('/me/accounts/transactions', async(req, res) => {
    const { token, amount } = req.body;
    const nrAmount = parseFloat(amount);

    if (isNaN(nrAmount) || nrAmount <= 0) {
        return res.status(400).json({ message: 'Ogiltigt belopp' });
    }

    try {
        const sessions = await query(
            'SELECT * FROM sessions WHERE token = ?',
            [token]
        );

        if (sessions.length === 0){
            return res.status(401).json({message: 'Ogiltig token'});
        }

        const session = sessions[0];
        const accounts = await query(
            'SELECT * FROM accounts WHERE userId = ?',
            [session.userId]
        );

        if (accounts.length === 0){
            return res.status(404).json({message: 'Konto hittades inte'});
        }

        const newAmount = Number(accounts[0].amount)+nrAmount;

        await query(
            'UPDATE accounts SET amount = ? WHERE userID = ?',
            [newAmount,session.userId]
        );
        return res.status(200).json({amount: newAmount});
    }catch(error){
        return res.status(500).json({message: 'Internt se3rverfel'});
    }
/*
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
    res.status(200).json({amount: newAmount});*/
});

// Starta servern
app.listen(port, () => {
    console.log(`Bankens backend körs på http://localhost:${port}`);
});
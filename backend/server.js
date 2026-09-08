import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

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

// Din kod här. Skriv dina arrayer
const users = []; // Array för att lagra användare
const accounts = []; // Array för att lagra konton
const sessions = []; // Array för att lagra sessioner

// Din kod här. Skriv dina routes:


//tar emot användarnamn och lösenord, skapar en ny användare och ett konto med saldo 0.
app.post('/users', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Användarnamn och lösenord krävs' });
    }

    const userId = Date.now();
    users.push({ id: userId, username, password });
    accounts.push({id: accounts.length +1, userId, amount: 0}); // Skapa ett konto med saldo 0 för den nya användaren

    res.status(201).json({ message: 'Användare skapad', userId });
});


//kontrollerar om användaren finns och lösenordet är korrekt och genererar en OTP-token om det är korrekt.
app.post('/sessions', (req, res) => {
    const { username, password } = req.body;

    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        return res.status(401).json({ message: 'Felaktigt användare eller lösenord' });
    }

    const token = generateOTP();
    sessions.push({ token, userId: user.id });

    res.status(200).json({ token });
});


//kontrollerar om token är giltig och returnerar kontoinformationen för den användaren.
app.post('/me/accounts', (req, res) => {
    const { token } = req.body;

    const session = sessions.find(s => s.token === token);
    if (!session) {
        return res.status(401).json({ message: 'Ogiltig token' });
    }

    const accont = accounts.find(a => a.userId === session.userId);
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

    const session = sessions.find(s => s.token === token);
    if (!session) {
        return res.status(401).json({ message: 'Ogiltig token' });
    }

    const account = accounts.find(a => a.userId === session.userId);
    if (!account) {
        return res.status(404).json({ message: 'Konto hittades inte' });
    }

    account.amount += nrAmount;
    res.status(200).json({amount: account.amount});
});

// Starta servern
app.listen(port, () => {
    console.log(`Bankens backend körs på http://localhost:${port}`);
});
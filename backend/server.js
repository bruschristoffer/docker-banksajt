import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import mysql from "mysql2/promise";
import { validateAmount } from "./src/validateAmount.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const app = express();
const port = process.env.PORT || 3001;

const secret = process.env.JWT_SECRET;
if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
  throw new Error("JWT_SECRET måste vara minst 32 bytes");
}

// Middleware
app.use(cors());
app.use(bodyParser.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "bank_app",
  password: process.env.DB_PASSWORD || "bank_password",
  database: process.env.DB_NAME || "bank",
  port: Number(process.env.DB_PORT) || 3306,
});

async function query(sql, params) {
  const [results] = await pool.execute(sql, params);
  return results;
}

function requireAuth(req, res, next) {
  const authHeader = req.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Authorization header saknas eller är ogiltig" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, secret, {
      algorithms: ["HS256"],
      issuer: "banken",
      audience: "banken-api",
    });

    if (
      !payload ||
      typeof payload !== "object" ||
      typeof payload.sub !== "string"
    ) {
      return res.status(401).json({ message: "Ogiltig token" });
    }

    const userId = Number(payload.sub);
    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return res.status(401).json({ message: "Ogiltig avnändar-id i token" });
    }

    req.userId = userId;
    next();
  } catch {
    return res.status(401).json({ message: "Ogiltig token eller utgått" });
  }
}

// Din kod här. Skriv dina routes:

//tar emot användarnamn och lösenord, skapar en ny användare och ett konto med saldo 0.
app.post("/users", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Användarnamn och lösenord krävs" });
  }

  if (password.length < 8) {
    return res
      .status(400)
      .json({ message: "Lösenordet måste vara minst 8 tecken" });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const userResult = await query(
      "INSERT INTO users (username, password_hash) VALUES (?, ?)",
      [username, passwordHash],
    );
    const userId = userResult.insertId;

    await query("INSERT INTO accounts (userId, amount) VALUES(?,0)", [userId]);

    return res.status(201).json({ message: "Användare skapad", userId });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Användarnamnet är redan taget" });
    }
    return res
      .status(500)
      .json({ message: "Ett fel uppstod vid skapandet av användaren" });
  }
});

//kontrollerar om användaren finns och lösenordet är korrekt och genererar en OTP-token om det är korrekt.
app.post("/sessions", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(401)
      .json({ message: "Felaktigt användare eller lösenord" });
  }

  try {
    const users = await query(
      "SELECT id, password_hash FROM users WHERE username = ?",
      [username],
    );

    if (users.length === 0) {
      return res
        .status(401)
        .json({ error: "Felaktigt användare eller lösenord" });
    }

    const user = users[0];
    const passwordIsCorrect = await bcrypt.compare(
      password,
      user.password_hash,
    );

    if (!passwordIsCorrect) {
      return res
        .status(401)
        .json({ error: "Felaktigt användare eller lösenord" });
    }
    const token = jwt.sign({ sub: String(user.id) }, secret, {
      algorithm: "HS256",
      issuer: "banken",
      audience: "banken-api",
      expiresIn: "15m",
    });

    return res.status(200).json({ token });
  } catch {
    return res.status(500).json({ error: "Ett fel uppstod vid inloggningen" });
  }
});

//kontrollerar om token är giltig och returnerar kontoinformationen för den användaren.
app.post("/me/accounts", requireAuth, async (req, res) => {
  try {
    const accounts = await query("SELECT * FROM accounts WHERE userId = ?", [
      req.userId,
    ]);
    if (accounts.length === 0) {
      return res.status(404).json({ message: "Konto hittades inte" });
    }
    return res.status(200).json({ amount: Number(accounts[0].amount) });
  } catch {
    return res.status(500).json({ message: "Internt serverfel" });
  }
});

//kontrollerar om token är giltig och uppdaterar kontots saldo med det angivna beloppet.
app.post("/me/accounts/transactions", requireAuth, async (req, res) => {
  const { amount } = req.body;

  const validation = validateAmount(amount);
  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }
  const nrAmount = validation.value;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [accounts] = await connection.execute(
      "SELECT * FROM accounts WHERE userId = ?",
      [req.userId],
    );

    if (accounts.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Konto hittades inte" });
    }

    const newAmount = Number(accounts[0].amount) + nrAmount;

    await connection.execute(
      "UPDATE accounts SET amount = ? WHERE userId = ?",
      [newAmount, req.userId],
    );

    await connection.execute(
      "INSERT INTO transactions (userId, amount) VALUES (?, ?)",
      [req.userId, nrAmount],
    );

    await connection.commit();
    return res.status(200).json({ amount: newAmount });
  } catch {
    await connection.rollback();
    return res.status(500).json({ message: "Internt serverfel" });
  } finally {
    connection.release();
  }
});

app.post("/me/transactions", requireAuth, async (req, res) => {
  try {
    const transactions = await query(
      "SELECT id, amount, createdAt FROM transactions WHERE userId = ? ORDER BY createdAt DESC, id DESC",
      [req.userId],
    );
    return res.status(200).json({ transactions });
  } catch (error) {
    return res.status(500).json({ message: "Kunde inte hämta transaktioner" });
  }
});

// Starta servern
app.listen(port, () => {
  console.log(`Bankens backend körs på http://localhost:${port}`);
});

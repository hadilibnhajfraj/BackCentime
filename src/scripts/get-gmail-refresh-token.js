// 📁 get-gmail-refresh-token.js
const { google } = require("googleapis");
const readline = require("readline");

// 🔐 Données extraites depuis ton JSON Google Cloud
const CLIENT_ID = "643716741024-b17obejeud2ksngkbj3722smrttnkk0d.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
const REDIRECT_URI = "http://localhost:5173/oauth2callback"; // ou autre URI locale

// Scopes requis pour accéder à Gmail en lecture/IMAP
const SCOPES = ["https://mail.google.com/"];

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// 🔗 Génère l’URL d’autorisation
const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
  prompt: "consent",
});

console.log("👉 Autorise ici : ", authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// 📥 Saisie manuelle du code de vérification
rl.question("Colle ici le code reçu dans le navigateur après autorisation : ", (code) => {
  rl.close();
  oauth2Client.getToken(code, (err, token) => {
    if (err) {
      console.error("❌ Erreur de récupération du token :", err);
      return;
    }

    console.log("✅ Token OAuth2 récupéré !");
    console.log("🔑 Access Token :", token.access_token);
    console.log("🔁 Refresh Token :", token.refresh_token);
    console.log("📅 Expire dans :", token.expiry_date);

    // Tu peux copier le refresh_token dans ton .env
  });
});

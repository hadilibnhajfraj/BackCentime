const imaps = require("imap-simple");
const xoauth2 = require("xoauth2");

exports.getUnreadCount = async (req, res) => {
  const xoauth2gen = xoauth2.createXOAuth2Generator({
    user: process.env.GMAIL_USER,
    clientId: process.env.GMAIL_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET,
    refreshToken: process.env.GMAIL_REFRESH_TOKEN,
  });

  xoauth2gen.getToken(async (err, token) => {
    if (err) {
      console.error("Erreur OAuth2 :", err);
      return res.status(500).json({ error: "Erreur OAuth2" });
    }

    const config = {
      imap: {
        xoauth2: token,
        host: "imap.gmail.com",
        port: 993,
        tls: true,
        authTimeout: 5000,
      },
    };

    try {
      const connection = await imaps.connect(config);
      await connection.openBox("INBOX");

      const searchCriteria = ["UNSEEN"];
      const fetchOptions = { bodies: ["HEADER"], markSeen: false };

      const messages = await connection.search(searchCriteria, fetchOptions);
      return res.status(200).json({ unreadCount: messages.length });
    } catch (err) {
      console.error("❌ Erreur connexion Gmail OAuth2 :", err);
      return res.status(500).json({ error: "Erreur connexion Gmail" });
    }
  });
};

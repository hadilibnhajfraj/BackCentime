// services/gmail.service.js
const { google } = require("googleapis");

const oAuth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  "http://localhost:5173/oauth2callback"
);

oAuth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN
});

const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

async function getUnreadEmails(maxResults = 10) {
  const res = await gmail.users.messages.list({
    userId: "me",
    labelIds: ["INBOX", "UNREAD"],
    maxResults
  });

  const messages = res.data.messages || [];

  const detailedMessages = await Promise.all(
    messages.map(async (msg) => {
      const detail = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
        format: "metadata",
        metadataHeaders: ["Subject", "From", "Date"]
      });

      const headers = detail.data.payload.headers;
      const subject = headers.find((h) => h.name === "Subject")?.value;
      const from = headers.find((h) => h.name === "From")?.value;
      const date = headers.find((h) => h.name === "Date")?.value;

      return {
        id: msg.id,
        subject,
        from,
        date
      };
    })
  );

  return detailedMessages;
}

module.exports = { getUnreadEmails };

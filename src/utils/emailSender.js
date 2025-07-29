const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // ex: cetimea0@gmail.com
    pass: process.env.EMAIL_PASS_NODEMAILER, // mot de passe d'application
  },
});

const sendEmailToAdmin = async (rdv, clientNom = 'Client') => {
  const mailOptions = {
    from: `"CETIME Plateforme" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: '📅 Nouvelle demande de rendez-vous',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #3b82f6; text-align: center;">📅 Nouvelle demande de rendez-vous</h2>

        <p style="font-size: 16px; margin-bottom: 20px;">
          Une nouvelle demande de rendez-vous a été soumise par <strong>${clientNom}</strong> sur la plateforme CETIME :
        </p>

        <table style="width: 100%; font-size: 15px; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; font-weight: bold;">Nom du client :</td>
            <td style="padding: 8px;">${clientNom}</td>
          </tr>
          <tr style="background-color: #f9f9f9;">
            <td style="padding: 8px; font-weight: bold;">Date RDV :</td>
            <td style="padding: 8px;">${new Date(
              rdv.dateRdv,
            ).toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Durée :</td>
            <td style="padding: 8px;">${rdv.duree} minutes</td>
          </tr>
          <tr style="background-color: #f9f9f9;">
            <td style="padding: 8px; font-weight: bold;">Statut :</td>
            <td style="padding: 8px; text-transform: capitalize;">${
              rdv.statut
            }</td>
          </tr>
        </table>

        <p style="margin-top: 30px; font-size: 14px; color: #777; text-align: center;">
          CETIME Plateforme – Notification automatique
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email envoyé à l'administrateur :", info.response);
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de l'email :", error.message);
  }
};

module.exports = { sendEmailToAdmin };

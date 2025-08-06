const db = require('../models');
const RendezVous = db.RendezVous;
const User = db.res_users;
const Partner = db.res_partner; // ✅ modèle res_partner
const { sendEmailToAdmin ,sendEmailToClient } = require('../utils/emailSender');

// ✅ Client : Réserver un RDV
exports.reserver = async (req, res) => {
  try {
    const { id, role } = req.user;
    if (role.toUpperCase() !== "CLIENT") {
      return res.status(403).json({ message: "⛔ Réservations uniquement pour clients" });
    }

    const { dateRdv, duree } = req.body;
    if (!dateRdv || !duree) {
      return res.status(400).json({ message: "❌ Champs requis : dateRdv et duree" });
    }

    const start = new Date(dateRdv);
    const end = new Date(start.getTime() + duree * 60000);

    // 1️⃣ Vérifier si un agent est dispo dans ce créneau
    const disponibilites = await db.Disponibilite.findAll({
      where: {
        start: { [db.Sequelize.Op.lte]: start },
        end: { [db.Sequelize.Op.gte]: end }
      }
    });

    let agentDisponible = null;
    if (disponibilites.length > 0) {
      // On prend le premier agent dispo
      agentDisponible = disponibilites[0].agentId;
    }

    // 2️⃣ Créer le RDV avec ou sans agent
    const rdv = await RendezVous.create({
      clientId: id,
      agentId: agentDisponible || null,
      dateRdv: start,
      duree,
      statut: agentDisponible ? "valide" : "en_attente"
    });

    // 3️⃣ Récupérer les infos du client
    const user = await User.findByPk(id, {
      include: [{ model: Partner, as: "partner" }]
    });

    const clientNom = user?.partner?.name || "Client inconnu";
    const clientEmail = user?.partner?.email || null;

    // 4️⃣ Si pas d’agent : notifier l’admin
    if (!agentDisponible) {
      await sendEmailToAdmin(rdv, clientNom); // demande à admin
    } 
    // 5️⃣ Si agent trouvé : notifier le client par email
    else if (clientEmail) {
      await sendEmailToClient({
        to: clientEmail,
        subject: "✅ Confirmation de votre rendez-vous CETIME",
        html: `
          <div style="font-family: Arial, sans-serif; font-size: 16px;">
            <p>Bonjour ${clientNom},</p>
            <p>Votre rendez-vous a été confirmé avec succès.</p>
            <p><strong>Date :</strong> ${new Date(dateRdv).toLocaleString()}</p>
            <p><strong>Durée :</strong> ${duree} minutes</p>
            <p>Merci pour votre confiance.<br/>L'équipe CETIME</p>
          </div>
        `
      });
    }

    // 6️⃣ Retour API
    res.status(201).json({
      message: agentDisponible
        ? "✅ RDV confirmé automatiquement avec agent (email envoyé au client)"
        : "🔔 Pas d’agent disponible, demande envoyée à l’admin",
      rdv
    });
  } catch (error) {
    console.error("❌ Erreur backend:", error);
    res.status(500).json({ message: "Erreur lors de la réservation", error });
  }
};


// ✅ Client : Voir ses RDVs
exports.clientRdvs = async (req, res) => {
  const { id, role } = req.user;
  if (role.toUpperCase() !== "CLIENT") {
    return res.status(403).json({ message: "⛔ Accès refusé : non client" });
  }

  const rdvs = await RendezVous.findAll({ where: { clientId: id } });
  res.status(200).json(rdvs);
};

// ✅ Admin : Confirmer un RDV
exports.confirmer = async (req, res) => {
  try {
    const rdv = await RendezVous.findByPk(req.params.id);
    if (!rdv) return res.status(404).json({ message: 'Rendez-vous non trouvé' });

    rdv.statut = 'valide';
    await rdv.save();

    res.json({ message: 'Rendez-vous confirmé', rdv });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la confirmation', error });
  }
};

// ✅ Admin : Annuler un RDV
exports.annuler = async (req, res) => {
  try {
    const rdv = await RendezVous.findByPk(req.params.id);
    if (!rdv) return res.status(404).json({ message: 'Rendez-vous non trouvé' });

    rdv.statut = 'annule';
    await rdv.save();

    res.json({ message: 'Rendez-vous annulé', rdv });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'annulation", error });
  }
};

// ✅ Agent : Voir ses RDVs
exports.agentRdvs = async (req, res) => {
  try {
    const { agentId } = req.params;
    const rdvs = await RendezVous.findAll({ where: { agentId } });
    res.json(rdvs);
  } catch (error) {
    res.status(500).json({ message: "Erreur chargement RDVs Agent", error });
  }
};

// ✅ Admin : Voir tous les RDVs (réservés par clients + planifiés par agents)
exports.rdvAdmin = async (req, res) => {
  try {
    const { role } = req.user;

    if (role?.toLowerCase() !== "admin") {
      return res.status(403).json({ message: "⛔ Accès réservé à l'administrateur" });
    }

    const rdvs = await RendezVous.findAll({
      include: [
        {
          model: User,
          as: 'client',
          include: [{ model: Partner, as: 'partner' }]
        },
        {
          model: User,
          as: 'agent',
          include: [{ model: Partner, as: 'partner' }]
        }
      ]
    });

    const rdvsFormatted = rdvs.map((rdv) => {
      const start = rdv.dateRdv;
      const end = new Date(new Date(start).getTime() + rdv.duree * 60000);

      // 🎨 Couleur par statut
      let backgroundColor = "#ff9800"; // par défaut : en attente
      if (rdv.statut === "valide") backgroundColor = "#4caf50";
      else if (rdv.statut === "annule") backgroundColor = "#f44336";

      // 🧾 Type de RDV (client ou agent)
      const isClientInitiated = !!rdv.clientId;
      const title = isClientInitiated
        ? `RDV Client: ${rdv.client?.partner?.name || 'Inconnu'}`
        : `RDV Agent: ${rdv.agent?.partner?.name || 'Inconnu'}`;

      return {
        id: rdv.id,
        start,
        end,
        title,
        statut: rdv.statut, // ✅ Inclus explicitement pour le frontend
        backgroundColor,
        borderColor: backgroundColor
      };
    });

    res.json(rdvsFormatted);
  } catch (error) {
    console.error("❌ Erreur récupération RDVs admin :", error);
    res.status(500).json({ message: "Erreur chargement RDVs Admin", error });
  }
};



// GET /rendezvous/pending-validation
exports.getPendingForAgent = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Non autorisé : utilisateur manquant" });
  }

  const { id, role } = req.user;
  if (role.toUpperCase() !== "AGENT") {
    return res.status(403).json({ message: "⛔ Accès réservé aux agents" });
  }

  try {
    const rdvs = await db.RendezVous.findAll({
      where: {
        statut: "en_attente",
        agentId: null
      }
    });

    res.json(rdvs);
  } catch (error) {
    res.status(500).json({ message: "Erreur chargement RDVs en attente", error });
  }
};


// PUT /rendezvous/agent/valider/:id
// PUT /rendezvous/agent/valider/:id
exports.agentValider = async (req, res) => {
  const { id: agentId, role } = req.user;
  const { decision } = req.body; // 'valider' ou 'refuser'

  if (role.toUpperCase() !== "AGENT") {
    return res.status(403).json({ message: "⛔ Seuls les agents peuvent valider" });
  }

  try {
    const rdv = await db.RendezVous.findByPk(req.params.id, {
      include: [
        { model: User, as: "client", include: [{ model: Partner, as: "partner" }] }
      ]
    });

    if (!rdv || rdv.statut !== "en_attente") {
      return res.status(404).json({ message: "RDV introuvable ou déjà traité" });
    }

    if (decision === "valider") {
      rdv.agentId = agentId;
      rdv.statut = "valide";
      rdv.agentValidationDate = new Date();

      // ✅ Récupérer les infos client
      const clientEmail = rdv.client?.partner?.email;
      const clientNom = rdv.client?.partner?.name || "Client";

      // ✅ Envoyer un mail de confirmation
      if (clientEmail) {
        await sendEmailToClient({
          to: clientEmail,
          subject: "✅ Votre rendez-vous CETIME est confirmé",
          html: `
            <div style="font-family: Arial, sans-serif; font-size: 16px;">
              <p>Bonjour ${clientNom},</p>
              <p>Votre rendez-vous a été validé par notre équipe.</p>
              <p><strong>Date :</strong> ${new Date(rdv.dateRdv).toLocaleString()}</p>
              <p><strong>Durée :</strong> ${rdv.duree} minutes</p>
              <p>Merci pour votre confiance.<br/>L'équipe CETIME</p>
            </div>
          `
        });
      }

    } else if (decision === "refuser") {
      rdv.statut = "annule";
    } else {
      return res.status(400).json({ message: "Décision invalide" });
    }

    await rdv.save();
    res.json({ message: "Mise à jour effectuée", rdv });
  } catch (error) {
    res.status(500).json({ message: "Erreur de validation", error });
  }
};

// controllers/disponibilite.controller.js
exports.createByAdmin = async (req, res) => {
  const { agentId, start, end } = req.body;

  if (!agentId || !start || !end) {
    return res.status(400).json({ message: "Champs requis : agentId, start, end" });
  }

  try {
    const dispo = await db.Disponibilite.create({
      agentId,
      start,
      end,
      createdByAdmin: true
    });

    res.status(201).json({ message: "Disponibilité ajoutée", dispo });
  } catch (error) {
    console.error("Erreur ajout disponibilité admin", error);
    res.status(500).json({ message: "Erreur interne", error });
  }
};

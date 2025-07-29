const db = require('../models');
const RendezVous = db.RendezVous;
const User = db.res_users;
const Partner = db.res_partner; // ✅ modèle res_partner
const { sendEmailToAdmin } = require('../utils/emailSender');

// ✅ Client : Réserver un RDV
exports.reserver = async (req, res) => {
  try {
    const { id, role } = req.user;

    if (role.toUpperCase() !== "CLIENT") {
      return res.status(403).json({ message: "⛔ Réservations uniquement pour clients" });
    }

    const { dateRdv, duree } = req.body;

    if (!dateRdv || !duree) {
      return res.status(400).json({
        message: "❌ Champs requis : dateRdv et duree uniquement."
      });
    }

    const rdv = await RendezVous.create({
      clientId: id,
      dateRdv,
      duree,
      statut: "en_attente"
    });

    // ✅ Récupération du nom du client via la jointure res_users → res_partner
    let clientNom = "Client inconnu";

    const user = await User.findByPk(id, {
      include: [{ model: Partner, as: 'partner' }]
    });

    if (user?.partner?.name) {
      clientNom = user.partner.name;
    }

    await sendEmailToAdmin(rdv, clientNom);

    res.status(201).json({
      message: "✅ Demande de réservation envoyée avec succès",
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
      const isClientInitiated = !!rdv.clientId;
      const start = rdv.dateRdv;
      const end = new Date(new Date(start).getTime() + rdv.duree * 60000);

      if (isClientInitiated) {
        return {
          title: `RDV Client: ${rdv.client?.partner?.name || 'Inconnu'}`,
          start,
          end,
          backgroundColor: '#f44336', // 🔴 Rouge pour les clients
          borderColor: '#f44336',
        };
      } else {
        return {
          title: `RDV Agent: ${rdv.agent?.partner?.name || 'Inconnu'}`,
          start,
          end,
          backgroundColor: '#2196f3', // 🔵 Bleu pour les agents
          borderColor: '#2196f3',
        };
      }
    });

    res.json(rdvsFormatted);
  } catch (error) {
    console.error("❌ Erreur récupération RDVs admin :", error);
    res.status(500).json({ message: "Erreur chargement RDVs Admin", error });
  }
};



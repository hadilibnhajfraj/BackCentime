const { Op } = require('sequelize');
const db = require('../models');
const RendezVous = db.RendezVous;
const User = db.res_users;
const Partner = db.res_partner;
const { sendEmailToAdmin, sendEmailToClient } = require('../utils/emailSender');

/* ------------------------------ HELPERS DAY ------------------------------ */
const dayBounds = (dateLike) => {
  const d = new Date(dateLike);
  const start = new Date(d); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setDate(end.getDate() + 1);
  return { start, end };
};

/* ================================ CLIENT ================================ */
// POST /rendezvous/reserver
exports.reserver = async (req, res) => {
  try {
    const role = (req.user?.role || '').toUpperCase();
    const { id } = req.user;

    if (role !== 'CLIENT') {
      return res.status(403).json({ message: '⛔ Réservations uniquement pour clients' });
    }

    const { dateRdv, duree } = req.body;
    if (!dateRdv || !duree) {
      return res.status(400).json({ message: '❌ Champs requis : dateRdv et duree' });
    }

    const start = new Date(dateRdv);
    const end = new Date(start.getTime() + duree * 60000);

    // 1) chercher une disponibilité qui couvre le créneau
    const disponibilites = await db.Disponibilite.findAll({
      where: { start: { [Op.lte]: start }, end: { [Op.gte]: end } },
      order: [['start', 'ASC']],
    });

    let agentDisponible = disponibilites?.[0]?.agentId ?? null;

    // 1-bis) si un agent est trouvé, vérifier qu'il n'a PAS déjà un RDV ce jour-là
    if (agentDisponible) {
      const { start: ds, end: de } = dayBounds(start);
      const alreadyRdv = await RendezVous.count({
        where: {
          agentId: Number(agentDisponible),
          dateRdv: { [Op.gte]: ds, [Op.lt]: de },
        },
      });
      if (alreadyRdv > 0) {
        agentDisponible = null; // repasse en attente si conflit
      }
    }

    // 2) créer le RDV
    const rdv = await RendezVous.create({
      clientId: id,
      agentId: agentDisponible || null,
      dateRdv: start,
      duree,
      statut: agentDisponible ? 'valide' : 'en_attente',
    });

    // infos client
    const user = await User.findByPk(id, {
      include: [{ model: Partner, as: 'partner' }],
    });
    const clientNom = user?.partner?.name || 'Client inconnu';
    const clientEmail = user?.partner?.email || null;

    // 3) TOUJOURS notifier l’admin
    await sendEmailToAdmin({
      subject: '📅 Nouvelle réservation CETIME',
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 14px;">
          <p><strong>Client :</strong> ${clientNom}</p>
          <p><strong>Date :</strong> ${new Date(dateRdv).toLocaleString()}</p>
          <p><strong>Durée :</strong> ${duree} min</p>
          <p><strong>Agent auto-affecté :</strong> ${agentDisponible ? agentDisponible : 'Aucun (à affecter)'}</p>
          <p>ID RDV : ${rdv.id}</p>
        </div>
      `,
    });

    // 4) si agent trouvé : mail au client
    if (agentDisponible && clientEmail) {
      await sendEmailToClient({
        to: clientEmail,
        subject: '✅ Confirmation de votre rendez-vous CETIME',
        html: `
          <div style="font-family: Arial, sans-serif; font-size: 16px;">
            <p>Bonjour ${clientNom},</p>
            <p>Votre rendez-vous a été confirmé.</p>
            <p><strong>Date :</strong> ${new Date(dateRdv).toLocaleString()}</p>
            <p><strong>Durée :</strong> ${duree} minutes</p>
            <p>Merci pour votre confiance.<br/>L'équipe CETIME</p>
          </div>
        `,
      });
    }

    res.status(201).json({
      message: agentDisponible
        ? '✅ RDV confirmé automatiquement (emails admin & client envoyés)'
        : '🔔 Pas d’employé disponible (email admin envoyé)',
      rdv,
    });
  } catch (error) {
    console.error('❌ Erreur backend:', error);
    res.status(500).json({ message: 'Erreur lors de la réservation', error });
  }
};

// GET /rendezvous/client
exports.clientRdvs = async (req, res) => {
  const role = (req.user?.role || '').toUpperCase();
  const { id } = req.user;

  if (role !== 'CLIENT') {
    return res.status(403).json({ message: '⛔ Accès refusé : non client' });
  }

  const rdvs = await RendezVous.findAll({
    where: { clientId: id },
    include: [
      { model: User, as: 'agent', include: [{ model: Partner, as: 'partner', attributes: ['name', 'email'] }] }
    ]
  });

  res.status(200).json(rdvs);
};

/* ================================ ADMIN ================================= */
// POST /rendezvous/confirmer/:id
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

// PUT /rendezvous/annuler/:id
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

// GET /rendezvous/admin
exports.rdvAdmin = async (req, res) => {
  try {
    const role = (req.user?.role || '').toUpperCase();
    if (role !== 'ADMIN') {
      return res.status(403).json({ message: "⛔ Accès réservé à l'administrateur" });
    }

    const rdvs = await RendezVous.findAll({
      include: [
        { model: User, as: 'client', include: [{ model: Partner, as: 'partner' }] },
        { model: User, as: 'agent', include: [{ model: Partner, as: 'partner' }] },
      ],
    });

    // Le front refait son propre mapping ; on fournit les infos complètes
    res.json(rdvs);
  } catch (error) {
    console.error('❌ Erreur récupération RDVs admin :', error);
    res.status(500).json({ message: 'Erreur chargement RDVs Admin', error });
  }
};

/* ============================ AGENT / EMPLOYÉ ============================ */
// GET /rendezvous/agent/:agentId
exports.agentRdvs = async (req, res) => {
  try {
    const { agentId } = req.params;
    const rdvs = await RendezVous.findAll({ where: { agentId } });
    res.json(rdvs);
  } catch (error) {
    res.status(500).json({ message: 'Erreur chargement RDVs Employé', error });
  }
};

// GET /rendezvous/pending-validation
exports.getPendingForAgent = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Non autorisé : utilisateur manquant' });
  }

  const role = (req.user?.role || '').toUpperCase();
  if (!(role === 'AGENT' || role === 'EMPLOYEE')) {
    return res.status(403).json({ message: '⛔ Accès réservé aux agents/employés' });
  }

  try {
    const rdvs = await db.RendezVous.findAll({
      where: { statut: 'en_attente', agentId: null },
    });

    res.json(rdvs);
  } catch (error) {
    res.status(500).json({ message: 'Erreur chargement RDVs en attente', error });
  }
};

// PUT /rendezvous/agent/valider/:id
exports.agentValider = async (req, res) => {
  const role = (req.user?.role || '').toUpperCase();
  if (!(role === 'AGENT' || role === 'EMPLOYEE')) {
    return res.status(403).json({ message: '⛔ Seuls les agents/employés peuvent valider' });
  }

  const agentId = req.user.id;
  const { decision } = req.body; // 'valider' | 'refuser'

  try {
    const rdv = await db.RendezVous.findByPk(req.params.id, {
      include: [{ model: User, as: 'client', include: [{ model: Partner, as: 'partner' }] }],
    });

    if (!rdv || rdv.statut !== 'en_attente') {
      return res.status(404).json({ message: 'RDV introuvable ou déjà traité' });
    }

    if (decision === 'valider') {
      // Vérifier qu'il n'a pas déjà un RDV le même jour
      const { start, end } = dayBounds(rdv.dateRdv);
      const conflict = await RendezVous.count({
        where: {
          agentId: Number(agentId),
          dateRdv: { [Op.gte]: start, [Op.lt]: end },
        },
      });
      if (conflict > 0) {
        return res.status(409).json({ message: "Agent déjà pris par un autre RDV ce jour-là" });
      }

      rdv.agentId = agentId;
      rdv.statut = 'valide';
      rdv.agentValidationDate = new Date();

      const clientEmail = rdv.client?.partner?.email;
      const clientNom = rdv.client?.partner?.name || 'Client';

      if (clientEmail) {
        await sendEmailToClient({
          to: clientEmail,
          subject: '✅ Votre rendez-vous CETIME est confirmé',
          html: `
            <div style="font-family: Arial, sans-serif; font-size: 16px;">
              <p>Bonjour ${clientNom},</p>
              <p>Votre rendez-vous a été validé par notre équipe.</p>
              <p><strong>Date :</strong> ${new Date(rdv.dateRdv).toLocaleString()}</p>
              <p><strong>Durée :</strong> ${rdv.duree} minutes</p>
              <p>Merci pour votre confiance.<br/>L'équipe CETIME</p>
            </div>
          `,
        });
      }
    } else if (decision === 'refuser') {
      rdv.statut = 'annule';
    } else {
      return res.status(400).json({ message: 'Décision invalide' });
    }

    await rdv.save();
    res.json({ message: 'Mise à jour effectuée', rdv });
  } catch (error) {
    res.status(500).json({ message: 'Erreur de validation', error });
  }
};

/* ============================ DISPONIBILITÉS ============================ */
// POST /rendezvous/affecter/admin  (création d’une DISPO par l’admin)
exports.createByAdmin = async (req, res) => {
  const { agentId, start, end } = req.body;

  if (!agentId || !start || !end) {
    return res.status(400).json({ message: 'Champs requis : agentId, start, end' });
  }

  try {
    const { start: ds, end: de } = dayBounds(start);

    // 1 seule DISPO par agent et par jour
    const already = await db.Disponibilite.count({
      where: {
        agentId: Number(agentId),
        start: { [Op.gte]: ds, [Op.lt]: de },
      },
    });
    if (already > 0) {
      return res.status(409).json({ message: "Cet agent a déjà une affectation (disponibilité) ce jour-là" });
    }

    const dispo = await db.Disponibilite.create({
      agentId,
      start,
      end,
      createdByAdmin: true,
    });

    res.status(201).json({ message: 'Disponibilité employé ajoutée', dispo });
  } catch (error) {
    console.error('Erreur ajout disponibilité admin', error);
    res.status(500).json({ message: 'Erreur interne', error });
  }
};

// GET /disponibilite/agent/:agentId
exports.listByAgent = async (req, res) => {
  try {
    const { agentId } = req.params;
    const { id: userId, role } = req.user || {};
    const isAdmin = (role || '').toUpperCase() === 'ADMIN';

    if (!isAdmin && Number(agentId) !== Number(userId)) {
      return res.status(403).json({ message: '⛔ Accès refusé' });
    }

    const rows = await db.Disponibilite.findAll({
      where: { agentId: Number(agentId) },
      order: [['start', 'ASC']],
    });

    res.json(rows);
  } catch (e) {
    console.error('listByAgent error:', e);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/* ============================ RÉAFFECTATION ============================ */
// PUT /rendezvous/:id/reassign  (ADMIN)
exports.reassign = async (req, res) => {
  try {
    const role = (req.user?.role || '').toUpperCase();
    if (role !== 'ADMIN') {
      return res.status(403).json({ message: "⛔ Accès réservé à l'administrateur" });
    }

    const { id } = req.params;    // id du RDV
    const { agentId } = req.body; // nouvel agent
    if (!agentId) return res.status(400).json({ message: 'agentId requis' });

    const rdv = await RendezVous.findByPk(id, {
      include: [
        { model: User, as: 'client', include: [{ model: Partner, as: 'partner' }] },
        { model: User, as: 'agent',  include: [{ model: Partner, as: 'partner' }] },
      ],
    });
    if (!rdv) return res.status(404).json({ message: 'Rendez-vous non trouvé' });

    // Vérifier "1 RDV / jour / agent"
    const { start, end } = dayBounds(rdv.dateRdv);
    const conflict = await RendezVous.count({
      where: {
        agentId: Number(agentId),
        id: { [Op.ne]: rdv.id },
        dateRdv: { [Op.gte]: start, [Op.lt]: end },
      },
    });
    if (conflict > 0) {
      return res.status(409).json({ message: "Agent déjà pris par un autre RDV ce jour-là" });
    }

    // maj agent
    rdv.agentId = agentId;
    if (rdv.statut === 'en_attente') rdv.statut = 'valide';
    await rdv.save();

    const newAgent = await User.findByPk(agentId, {
      include: [{ model: Partner, as: 'partner' }],
    });

    // ✉️ Email client
    const clientEmail = rdv?.client?.partner?.email;
    if (clientEmail) {
      await sendEmailToClient({
        to: clientEmail,
        subject: '✅ Mise à jour de votre rendez-vous CETIME',
        html: `
          <div style="font-family: Arial, sans-serif; font-size: 16px;">
            <p>Bonjour ${rdv?.client?.partner?.name || 'Client'},</p>
            <p>Votre rendez-vous a été mis à jour.</p>
            <p><strong>Date :</strong> ${new Date(rdv.dateRdv).toLocaleString()}</p>
            <p><strong>Durée :</strong> ${rdv.duree} minutes</p>
            <p><strong>Nouvel agent :</strong> ${newAgent?.partner?.name || 'Notre équipe'}</p>
            <p>Merci pour votre confiance.<br/>L'équipe CETIME</p>
          </div>
        `,
      });
    }

    return res.json({
      message: 'RDV réaffecté (email client envoyé)',
      rdv: {
        id: rdv.id,
        agentId: rdv.agentId,
        agentName: newAgent?.partner?.name || null,
        dateRdv: rdv.dateRdv,
        duree: rdv.duree,
        statut: rdv.statut,
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Erreur réaffectation', error: e });
  }
};

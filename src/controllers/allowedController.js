// src/controllers/allowedController.js
const path = require("path");

/** Chargement robuste des models */
function loadDB(req) {
  // 1) si l'app a déjà injecté les models
  if (req?.app?.get && req.app.get("models")) return req.app.get("models");
  // 2) fallback: require du dossier models
  try {
    return require("../models");
  } catch {
    // 3) autre fallback courant si ton app est à la racine du projet
    return require(path.join(process.cwd(), "src", "models"));
  }
}

/** Normalisation nom (sans accents / espaces) */
const normalizeName = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/** Liste blanche issue du doc Word */
const WORD_ALLOWED_NAMES = [
  "Nizar LAKHAL","Ameur ACHOURI","Anis JELASSI","Naceur RIAHI","Tarek MAHDOUANI",
  "Walid JARRAYA","Mohamed MANAI","Akrem BELGHOUL","Habib SLAMA","Mohamed AYADI",
  "Moncef HAJJI","Hamadi TRIGUI","Kais BOUAZIZ","Fadhe GUESMI","Asma BELAHSEN",
  "Housni BEL HAJ","Sabeur BEN AMEUR","Kais BEN NSIR","Belhasen KHALFAOUI",
  "Med Taher RABHI","Riadh BEN ABDALLAH","Akrem TOUTI","Belgasem JOUMNI",
  "Tarek ZERMANI","Abed ERRAHEEM BAMRI","Maher CHERIF","Marouen SBAI",
  "Housem MEJRI","Amin BEN SAAD","Habib BOUDHIR","Majdi MALOULI",
  "Med Taher","Chouki abed lahris","Hassen TURKI","Marouen Zine elabedine",
  "Wael GUERMAZI","Hafedh DERBEL","Mohamed AYDI","Kais DAOUED","Bourhen BOUCHIBA",
];
const WORD_ALLOWED_SET = new Set(WORD_ALLOWED_NAMES.map(normalizeName));

/** GET /api/auth/allowed */
exports.getAllowedAgents = async (req, res) => {
  try {
    const db = loadDB(req);
    if (!db) {
      return res
        .status(500)
        .json({ message: "Models Sequelize introuvables (db)", error: "db undefined" });
    }

    // Cherche le bon nom de modèle selon ton index Sequelize
    const User =
      db.res_users || db.User || db.users || db.Users || db.ResUser || db.ResUsers;
    const Partner =
      db.res_partner || db.Partner || db.partners || db.ResPartner || db.ResPartners;

    if (!User) {
      return res
        .status(500)
        .json({ message: "Modèle utilisateurs introuvable (res_users/User)" });
    }

    // Récupère les users et leur partenaire si l'association existe
    let users;
    try {
      users = await User.findAll({
        include: Partner ? [{ model: Partner, as: "partner", required: false }] : [],
      });
    } catch {
      // si l'alias "partner" n'existe pas, récupère à plat
      users = await User.findAll();
    }

    // Map {id, name, email} puis filtre par liste Word
    const mapped = await Promise.all(
      users.map(async (u) => {
        // essaie de lire via include; sinon, tente partnerId / partner_id
        let name =
          u?.partner?.name || u?.dataValues?.partner?.name || u?.login || `Employé #${u.id}`;
        let email =
          u?.partner?.email || u?.dataValues?.partner?.email || u?.email || null;

        if ((!name || name.startsWith("Employé #")) && Partner) {
          const partnerId = u.partnerId ?? u.partner_id ?? null;
          if (partnerId) {
            try {
              const p = await Partner.findByPk(partnerId);
              if (p) {
                name = p.name || name;
                email = p.email || email;
              }
            } catch {}
          }
        }
        return { id: u.id, name, email };
      })
    );

    const allowed = mapped
      .filter((a) => WORD_ALLOWED_SET.has(normalizeName(a.name)))
      .sort((a, b) => a.name.localeCompare(b.name));

    return res.json(allowed);
  } catch (e) {
    console.error("getAllowedAgents error:", e);
    return res.status(500).json({ message: "Erreur serveur", error: e.message });
  }
};

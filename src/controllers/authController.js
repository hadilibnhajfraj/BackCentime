const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {
  res_users,
  res_partner,
  res_groups,
  res_users_res_groups_rel,
} = require('../models');

const { Op } = require('sequelize');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(
  '643716741024-b17obejeud2ksngkbj3722smrttnkk0d.apps.googleusercontent.com',
);
exports.register = async (req, res) => {
  try {
    const { name, email, login, password, role } = req.body;

    // 🔍 Log les données reçues
    console.log('📥 Données reçues pour register:', {
      name,
      email,
      login,
      role,
    });

    if (!name || !email || !login || !password || !role) {
      return res.status(400).json({ message: 'Champs obligatoires manquants' });
    }

    // Vérifie si le login existe déjà
    const existingUser = await res_users.findOne({ where: { login } });
    if (existingUser) {
      console.log('⚠️ Login déjà utilisé:', login);
      return res.status(409).json({ message: 'Login déjà utilisé' });
    }

    // ➤ 1. Génère un nouvel ID pour res_partner
    const lastPartner = await res_partner.findOne({ order: [['id', 'DESC']] });
    const nextPartnerId = (lastPartner?.id || 0) + 1;
    console.log('🆕 Prochain partner_id généré :', nextPartnerId);

    const newPartner = await res_partner.create({
      id: nextPartnerId,
      name,
      email,
      phone: null,
    });

    // ➤ 2. Génère un nouvel ID pour res_users
    const lastUser = await res_users.findOne({ order: [['id', 'DESC']] });
    const nextUserId = (lastUser?.id || 0) + 1;
    console.log('🆕 Prochain user_id généré :', nextUserId);

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await res_users.create({
      login,
      email,
      password: hashedPassword,
      active: false,
      partner_id: newPartner.id,
    });

    // ➤ 3. Récupérer le groupe correspondant
    console.log('🔍 Rôle demandé :', role);

    const group = await res_groups.findOne({
      where: {
        name: {
          [Op.iLike]: role, // insensible à la casse
        },
      },
    });

    if (!group) {
      console.log('❌ Groupe non trouvé pour le rôle:', role);
      return res
        .status(400)
        .json({ message: 'Groupe introuvable pour ce rôle' });
    }

    console.log('✅ Groupe trouvé :', group.name, `(ID: ${group.id})`);

    // ➤ 4. Créer la relation dans res_users_res_groups_rel
    await res_users_res_groups_rel.create({
      uid: newUser.id,
      gid: group.id,
    });

    console.log('✅ Utilisateur enregistré avec succès:', newUser.login);

    return res.status(201).json({
      message: 'Utilisateur enregistré avec succès',
      userId: newUser.id,
      role: role,
    });
  } catch (error) {
    console.error('❌ Erreur serveur lors du register:', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.login = async (req, res) => {
  const { loginOrEmail, password } = req.body;

  console.log('📥 Tentative de connexion:', loginOrEmail);

  if (!loginOrEmail || !password) {
    return res
      .status(400)
      .json({ message: 'Login/email et mot de passe requis.' });
  }

  try {
    // 🔍 Rechercher l'utilisateur actif (par login ou email)
    const user = await res_users.findOne({
      where: {
        [Op.and]: [
          {
            [Op.or]: [{ login: loginOrEmail }, { email: loginOrEmail }],
          },
          { active: true },
        ],
      },
      include: [{ model: res_partner, as: 'partner' }],
    });

    if (!user) {
      console.log('❌ Utilisateur introuvable ou inactif');
      return res
        .status(404)
        .json({ message: 'Utilisateur introuvable ou inactif.' });
    }

    // 🔐 Vérification du mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('❌ Mot de passe incorrect');
      return res.status(401).json({ message: 'Mot de passe incorrect.' });
    }

    // 🔄 Récupérer les groupes liés à l'utilisateur
    const groupLinks = await res_users_res_groups_rel.findAll({
      where: { uid: user.id },
    });
    const groupIds = groupLinks.map((g) => g.gid);

    const groups = await res_groups.findAll({ where: { id: groupIds } });

    // 🧑‍💼 Déterminer le rôle à partir des groupes
    let role = 'CLIENT'; // par défaut

    for (const g of groups) {
      const groupName = g.name.toLowerCase();
      if (groupName.includes('admin')) {
        role = 'ADMIN';
        break;
      }
      if (groupName.includes('employee') || groupName.includes('agent')) {
        role = 'AGENT';
      }
    }

    // 🔐 Générer le token JWT avec rôle en majuscule
    const token = jwt.sign(
      {
        id: user.id,
        name: user.partner?.name || user.login,
        email: user.partner?.email || user.login,
        role: role.toUpperCase(),
        partner_id: user.partner_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' },
    );

    // ✅ Répondre avec les infos utiles
    console.log(`✅ Connexion réussie : ${user.login} avec rôle ${role}`);

    res.status(200).json({
      token,
      role,
      user: {
        id: user.id,
        login: user.login,
        name: user.partner?.name,
        email: user.partner?.email,
        avatar: user.partner?.image || null,
        role,
      },
    });
  } catch (err) {
    console.error('💥 Erreur serveur:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.getUserStats = async (req, res) => {
  try {
    // Trouver le groupe admin
    const adminGroup = await res_groups.findOne({
      where: { name: { [Op.iLike]: 'admin' } },
    });

    let adminUserIds = [];

    if (adminGroup) {
      const relations = await res_users_res_groups_rel.findAll({
        where: { gid: adminGroup.id }, // clé correcte pour la relation
        attributes: ['uid'],
      });

      adminUserIds = relations.map((rel) => rel.uid);
    }

    // Récupérer tous les utilisateurs sauf ceux ayant un rôle admin
    const users = await res_users.findAll({
      where: {
        id: {
          [Op.notIn]: adminUserIds,
        },
      },
      attributes: ['id', 'login', 'email', 'active'],
    });

    const totalUsers = users.length;

    res.status(200).json({
      totalUsers,
      users,
    });
  } catch (error) {
    console.error('❌ Erreur dans getUserStats:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
/*
exports.getUserById = async (req, res) => {
  try {
    const id = req.params.id;

    const user = await res_users.findOne({
      where: { id },
      attributes: ['id', 'login', 'email', 'active']
    });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Erreur dans getUserById:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
*/
exports.getUserById = async (req, res) => {
  try {
    const id = req.params.id;

    const user = await res_users.findOne({
      where: { id },
      attributes: ['id', 'login', 'email', 'active'],
    });

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    // 🔄 Récupération du rôle dynamiquement
    const groupLinks = await res_users_res_groups_rel.findAll({
      where: { uid: user.id },
    });
    const groupIds = groupLinks.map((g) => g.gid);
    const groups = await res_groups.findAll({ where: { id: groupIds } });

    let role = 'client';
    if (groups.some((g) => g.name.toLowerCase().includes('admin')))
      role = 'admin';
    else if (
      groups.some(
        (g) =>
          g.name.toLowerCase().includes('employee') ||
          g.name.toLowerCase().includes('agent'),
      )
    )
      role = 'agent';

    // 👤 Réponse complète avec rôle et statut
    res.status(200).json({
      id: user.id,
      login: user.login,
      email: user.email,
      active: user.active,
      role,
    });
  } catch (error) {
    console.error('Erreur dans getUserById:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { active } = req.body;

  try {
    const user = await res_users.findByPk(id);
    if (!user)
      return res.status(404).json({ message: 'Utilisateur introuvable' });

    // ✅ Mise à jour du champ `active`
    if (typeof active === 'boolean') {
      user.active = active;
      await user.save();
      return res
        .status(200)
        .json({ message: `✅ Utilisateur ${user.login} mis à jour.` });
    } else {
      return res
        .status(400)
        .json({ message: "Champ 'active' invalide (attendu: true ou false)." });
    }
  } catch (error) {
    console.error('Erreur dans updateUser:', error);
    res.status(500).json({ message: 'Erreur serveur interne.' });
  }
};

exports.getClients = async (req, res) => {
  try {
    const clients = await res_users.findAll({
      include: [
        {
          model: res_users_res_groups_rel,
          as: 'groupLinks',
          required: true, // ✅ Filtres les utilisateurs qui ont un groupLink
          include: [
            {
              model: res_groups,
              as: 'group',
              required: true, // ✅ Filtres ceux qui ont un groupe associé
              where: {
                name: {
                  [Op.iLike]: 'client', // ✅ filtre uniquement les groupes "client"
                },
              },
            },
          ],
        },
      ],
    });

    res.status(200).json(clients);
  } catch (error) {
    console.error('Erreur getClients :', error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

exports.googleLogin = async (req, res) => {
  const { credential } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience:
        '643716741024-b17obejeud2ksngkbj3722smrttnkk0d.apps.googleusercontent.com',
    });

    const payload = ticket.getPayload(); // => { email, name, sub, picture }

    // Vérifiez si l'utilisateur existe déjà dans votre DB
    let user = await User.findOne({ where: { email: payload.email } });

    // Sinon, créez-le
    if (!user) {
      user = await User.create({
        name: payload.name,
        email: payload.email,
        login: payload.email.split('@')[0],
        role: 'client', // ou autre logique
        password: 'GoogleAuth', // mettre un placeholder
        isActive: true,
      });
    }

    const token = generateJwt(user); // fonction custom à créer
    res.status(200).json({ token, role: user.role, user });
  } catch (err) {
    console.error('Erreur Google Auth :', err);
    res.status(401).json({ message: 'Token Google invalide' });
  }
};

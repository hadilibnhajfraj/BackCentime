/* KPI service — version formules strictes (légende) */
const XLSX = require('xlsx');
const dayjs = require('dayjs');

const EXCEL_PATH = process.env.EXCEL_PATH || './src/data/Suivi des dossiers LL_08-09-2025.xlsx';

const YEAR = 2025;
const AREA_PER_SAMPLE_RECEPTION = 0.64; // m² / échantillon (réception)
const AREA_PER_SAMPLE_STOCKAGE  = 0.64; // m² / échantillon (stockage)
const SLA_RESPECT_DAYS = 30;

/* ------------------------- utils génériques ------------------------- */
const readWB = () => XLSX.readFile(EXCEL_PATH, { cellDates: true });
const toArr  = (ws) => XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false });
const norm   = (s) => String(s || '').toLowerCase().replace(/[’']/g, "'").trim();
const hasAny = (o) => Object.values(o).some(v => v != null && v !== '');

const safeNum = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
const asDate = (v) => (v ? dayjs(v) : null);
const valid  = (d) => !!(d && d.isValid());
const ddays  = (a, b) => (valid(a) && valid(b) ? Math.max(0, b.diff(a, 'day')) : null);
const avg    = (arr) => (arr.length ? Math.round((arr.reduce((s, x) => s + x, 0) / arr.length) * 10) / 10 : 0);

/* lecture Fiche de suivi 2025 — aplatit les 2 lignes d’en-têtes si présentes */
function loadFiche2025Rows() {
  const wb = readWB();
  const ws = wb.Sheets['Fiche de suivi 2025'];
  if (!ws) throw new Error('Feuille "Fiche de suivi 2025" introuvable');

  const A = toArr(ws);

  // repère une ligne d’en-tête plausible
  let H = A.findIndex(r =>
    Array.isArray(r) &&
    r.some(c => norm(c).includes('réception')) &&
    r.some(c => norm(c).includes('rapport'))
  );
  if (H < 0) H = 0;

  const h1 = A[H] || [];
  const h2 = A[H + 1] || [];
  const headers = h1.map((a, i) => {
    const b = h2[i];
    const A1 = String(a || '').trim();
    const B1 = String(b || '').trim();
    return B1 && !/^unnamed/i.test(B1) ? `${A1} | ${B1}` : A1;
  });

  const out = [];
  for (let r = H + 2; r < A.length; r++) {
    const row = A[r];
    if (!row) continue;
    const o = {};
    headers.forEach((h, i) => { if (h) o[h] = row[i]; });
    if (hasAny(o)) out.push(o);
  }
  return out;
}

/* helpers pick */
function pickKey(row, exact = [], contains = []) {
  const keys = Object.keys(row);
  let k = keys.find(c => exact.includes(c));
  if (!k) {
    const want = contains.map(norm);
    k = keys.find(c => want.some(w => norm(c).includes(w)));
  }
  return k || null;
}
function pickDate(row, exact = [], contains = []) {
  const k = pickKey(row, exact, contains);
  const d = k ? asDate(row[k]) : null;
  return valid(d) ? d : null;
}
function pickText(row, exact = [], contains = []) {
  const k = pickKey(row, exact, contains);
  return k ? String(row[k]).trim() : null;
}
function pickNumber(row, exact = [], contains = []) {
  const k = pickKey(row, exact, contains);
  return k ? safeNum(row[k]) : null;
}

/* colonne “Nb échantillons” si elle existe — sinon 1 */
function getSampleCount(row) {
  const n =
    pickNumber(row, [], ['nb échant', 'nbre échant', 'nombre échant', 'nb echant', 'nombre echantillons']) ?? 1;
  return Math.max(1, Number(n) || 1);
}

/* ------------------------- KPI Fiche de suivi 2025 ------------------------- */
function summarizeFiche2025() {
  const rows = loadFiche2025Rows();

  // libellés (contains) — ajuste si nécessaire selon ton fichier
  const D_REC_DEMANDE = ['date de réception de la demande', 'réception de la demande'];
  const D_REC_ECH     = ['réception échantillons', 'reception echantillons'];
  const D_DEVIS       = ['devis', 'envoi devis'];
  const D_CONFIRM     = ['date de confirmation', 'confirmation'];
  const D_RAPPORT     = ["rapport d'essai | date", 'date émission du rapport', 'date d’émission du rapport', 'rapport | date'];
  const D_FACTURE     = ['date de facturation', 'facturation'];
  const ETAT          = ['etat', 'état'];
  const D_DEBUT_ESSAI = ['début essai', 'debut essai', 'date début essai'];
  const FLAG_RETOUR   = ['attente de récupération', 'retour client'];

  // agrégateurs
  let nbDemandesTotal = 0, nbEchantsTotal = 0;
  let nbDemandesAchevees = 0, nbEchantsAcheves = 0;
  let nbDemandesEnCours = 0, nbEchantsEnCours = 0;
  let nbDemandesAttConf = 0;

  const delaisExec = [];  // = moy (rapport - confirmation) ; fallback (rapport - facturation)
  const delaisTrait = []; // = moy (dernier rapport - réception demande)

  let nbRapports = 0, nbRapportsDansDelais = 0;

  // Réception / En attente d’essai
  let samplesReceptionWaiting = 0;

  // Stockage / Retour client
  let samplesStockage = 0;

  for (const r of rows) {
    const dRecDem  = pickDate(r, [], D_REC_DEMANDE);
    const dRecEch  = pickDate(r, [], D_REC_ECH);
    const dDevis   = pickDate(r, [], D_DEVIS);
    const dConf    = pickDate(r, [], D_CONFIRM);
    const dRapport = pickDate(r, [], D_RAPPORT);
    const dFacture = pickDate(r, [], D_FACTURE);
    const etatTxt  = (pickText(r, [], ETAT) || '').toLowerCase();
    const dDebut   = pickDate(r, [], D_DEBUT_ESSAI);
    const retourTx = (pickText(r, [], FLAG_RETOUR) || '').toLowerCase();

    const samples = getSampleCount(r);

    // ----- Nombre total -----
    const refDemand = dRecDem;
    const refEchant = dRecEch;
    if (valid(refDemand) && refDemand.year() === YEAR) nbDemandesTotal += 1;
    if (valid(refEchant) && refEchant.year() === YEAR) nbEchantsTotal += samples;

    // état achevé
    const estAcheve = !!dRapport || /achev|rendu|termin/i.test(etatTxt);
    // état en cours
    const estEnCours = !estAcheve && !!dConf;

    // ----- Achevés -----
    if (estAcheve) {
      if (valid(dConf)) nbDemandesAchevees += 1; // “demandes confirmées et essais achevés”
      nbEchantsAcheves += samples;
    }

    // ----- En cours -----
    if (estEnCours) {
      nbDemandesEnCours += 1;
      nbEchantsEnCours  += samples;
    }

    // ----- Attente de confirmation -----
    if (!estAcheve && !estEnCours && !!dDevis && !dConf) {
      nbDemandesAttConf += 1;
    }

    // ----- Durées -----
    const exec = ddays(dConf, dRapport) ?? ddays(dFacture, dRapport); // formule: rapport - confirmation (fallback facturation)
    if (exec != null) delaisExec.push(exec);

    const trait = ddays(dRecDem, dRapport); // dernier rapport - réception de la demande
    if (trait != null) delaisTrait.push(trait);

    // ----- Respect des délais (30 j après confirmation) -----
    if (dRapport) {
      nbRapports++;
      const delta = ddays(dConf, dRapport);
      if (delta != null && delta <= SLA_RESPECT_DAYS) nbRapportsDansDelais++;
    }

    // ----- Réception / En attente d’essai -----
    if (dRecEch && !estAcheve && !dDebut) {
      samplesReceptionWaiting += samples;
    }

    // ----- Stockage / Retour client -----
    if (dRapport && /attente|récup|recup/i.test(retourTx)) {
      samplesStockage += samples;
    }
  }

  const espaceReception = Math.round(samplesReceptionWaiting * AREA_PER_SAMPLE_RECEPTION * 10) / 10;
  const espaceStockage  = Math.round(samplesStockage        * AREA_PER_SAMPLE_STOCKAGE  * 10) / 10;

  return {
    // paires “demandes / échantillons” selon tes formules
    nombreTotal: {
      demandes: nbDemandesTotal,
      echantillons: nbEchantsTotal
    },
    acheves: {
      demandes: nbDemandesAchevees,
      echantillons: nbEchantsAcheves
    },
    enCours: {
      demandes: nbDemandesEnCours,
      echantillons: nbEchantsEnCours
    },
    attenteConfirmation: nbDemandesAttConf, // (formule: demandes)

    dureeMoyRealisationJ: avg(delaisExec),
    dureeMoyTraitementJ:  avg(delaisTrait),

    respectDelaisPct: nbRapports ? Math.round((nbRapportsDansDelais / nbRapports) * 100) : 0,

    reception: { appareils: samplesReceptionWaiting, espaceOccupeM2: espaceReception },
    stockageRetour: { appareils: samplesStockage, espaceOccupeM2: espaceStockage },
  };
}

/* ------------------------- FEUIL2 — formules strictes ------------------------- */
/** 
 * Disponibilité = ((jours_travail - (arrêt prog + arrêt non prog)) / jours_travail) * 100
 * Occupation    = ((jours_travail - jours_utilisation) / jours_travail) * 100    (ta légende)
 */
function summarizeFeuil2() {
  const wb = readWB();
  const ws = wb.Sheets['Feuil2'];
  if (!ws) throw new Error('Feuille "Feuil2" introuvable');
  const arr = toArr(ws);

  const contains = (s, keys) => keys.some(k => norm(s).includes(norm(k)));
  const findRow  = (keys) => arr.findIndex(r => Array.isArray(r) && r.some(c => contains(c, keys)));

  const iTravail = findRow(['jours de travail', 'jours travail']);
  const iUtil    = findRow(["jours d'utilisation", 'jours d utilisation', 'utilisation des moyens']);
  const iProg    = findRow(['arrêt programmé', 'arret programme']);
  const iNonProg = findRow(['arrêt non programmé', 'arret non programme']);
  const iMTBF    = findRow(['mtbf', 'temps moyen entre pannes']);
  const iMTTR    = findRow(['mttr', 'temps moyen de réparation', 'temps moyen de reparation']);

  // colonne “Somme/Total/Moyenne”
  const header = arr.find(r => Array.isArray(r) && r.some(x => typeof x === 'string'));
  let cAgg = header ? header.findIndex(c => /(somme|total|moyenne)/i.test(String(c))) : -1;

  const sumSmart = (row) => {
    if (!row) return 0;
    const nums = row.map(safeNum).filter(n => n !== null);
    if (!nums.length) return 0;

    if (cAgg >= 0 && safeNum(row[cAgg]) !== null) {
      const agg = safeNum(row[cAgg]);
      const prev = row.map(safeNum).filter((n, i) => n !== null && i !== cAgg)
        .reduce((s, n) => s + n, 0);
      if (prev > 0 && Math.abs(agg - prev) / prev < 0.02) return agg;
    }
    return nums.reduce((s, n) => s + n, 0);
  };

  const firstNum = (row) => (row ? (row.map(safeNum).find(n => n !== null) ?? 0) : 0);

  const joursTravail = sumSmart(arr[iTravail]);
  const joursUtil    = sumSmart(arr[iUtil]);
  const arretProg    = sumSmart(arr[iProg]);
  const arretNonProg = sumSmart(arr[iNonProg]);
  const mtbfJ        = firstNum(arr[iMTBF]);
  const mttrJ        = firstNum(arr[iMTTR]);

  const arretsTotal = (arretProg || 0) + (arretNonProg || 0);
  const dispoPct = joursTravail ? Math.round(((joursTravail - arretsTotal) / joursTravail) * 100) : 0;
  const occupPct = joursTravail ? Math.round(((joursTravail - joursUtil) / joursTravail) * 100) : 0;

  return {
    tauxDisponibilitePct: Math.max(0, Math.min(100, dispoPct)),
    tauxOccupationPct:    Math.max(0, Math.min(100, occupPct)),
    utilisationJours:     joursUtil || 0,
    mtbfJours:            mtbfJ || 0,
    mttrJours:            mttrJ || 0,
    arretProgrammeJours:  arretProg || 0,
    arretNonProgrammeJours: arretNonProg || 0,
  };
}

/* ------------------------------ agrégation API ------------------------------ */
function getDashboard() {
  const a = summarizeFiche2025();
  const b = summarizeFeuil2();

  return {
    // Etats (on garde aussi un total agrégé pour compat UI existante si tu l’utilises)
    nombreTotal: a.nombreTotal,                              // { demandes, echantillons }
    nombreTotalAggregat: a.nombreTotal.echantillons || a.nombreTotal.demandes || 0,
    acheves: a.acheves,                                      // { demandes, echantillons }
    achevesAggregat: a.acheves.echantillons || a.acheves.demandes || 0,
    enCours: a.enCours,                                      // { demandes, echantillons }
    enCoursAggregat: a.enCours.echantillons || a.enCours.demandes || 0,
    attenteConfirmation: a.attenteConfirmation,              // demandes

    // Durées + respect
    dureeMoyTraitementJ: a.dureeMoyTraitementJ,
    dureeMoyRealisationJ: a.dureeMoyRealisationJ,
    respectDelaisPct: a.respectDelaisPct,

    // Réception / Stockage
    reception: a.reception,
    stockageRetour: a.stockageRetour,

    // Feuil2
    tauxDisponibilitePct: b.tauxDisponibilitePct,
    tauxOccupationPct: b.tauxOccupationPct,
    utilisationJours: b.utilisationJours,
    mtbfJours: b.mtbfJours,
    mttrJours: b.mttrJours,
    arretProgrammeJours: b.arretProgrammeJours,
    arretNonProgrammeJours: b.arretNonProgrammeJours,
  };
}

module.exports = {
  getDashboard,
  summarizeFiche2025,
  summarizeFeuil2,
};

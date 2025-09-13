// Liste officielle extraite du document Word "Liste de personel DCETE et CETIME.docx"
// Garde-la ici pour la maintenir facilement.

const WORD_ALLOWED_NAMES = [
  // Équipe Expertise Techniques & Évaluation
  "Nizar LAKHAL", "Ameur ACHOURI", "Anis JELASSI", "Naceur RIAHI", "Tarek MAHDOUANI",
  "Walid JARRAYA", "Mohamed MANAI", "Akrem BELGHOUL", "Habib SLAMA", "Mohamed AYADI",
  // Cadres CETIME pouvant réaliser
  "Moncef HAJJI", "Hamadi TRIGUI", "Kais BOUAZIZ", "Fadhe GUESMI", "Asma BELAHSEN",
  "Housni BEL HAJ", "Sabeur BEN AMEUR", "Kais BEN NSIR", "Belhasen KHALFAOUI",
  "Med Taher RABHI", "Riadh BEN ABDALLAH", "Akrem TOUTI", "Belgasem JOUMNI",
  "Tarek ZERMANI", "Abed ERRAHEEM BAMRI", "Maher CHERIF", "Marouen SBAI",
  "Housem MEJRI", "Amin BEN SAAD", "Habib BOUDHIR", "Majdi MALOULI",
  "Med Taher", "Chouki abed lahris", "Hassen TURKI", "Marouen Zine elabedine",
  "Wael GUERMAZI", "Hafedh DERBEL", "Mohamed AYDI", "Kais DAOUED", "Bourhen BOUCHIBA",
];

const normalizeName = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const WORD_ALLOWED_SET = new Set(WORD_ALLOWED_NAMES.map(normalizeName));

module.exports = {
  WORD_ALLOWED_NAMES,
  WORD_ALLOWED_SET,
  normalizeName,
};

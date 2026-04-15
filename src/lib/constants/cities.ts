// Legacy exports kept for compatibility
export const LV_CITIES = [
  "Rīga",
  "Jūrmala",
  "Daugavpils",
  "Liepāja",
  "Jelgava",
  "Ventspils",
  "Rēzekne",
  "Valmiera",
  "Cēsis",
  "Ogre",
];

export const SEARCH_LOCATIONS = [
  "Riga, Latvia",
  "Daugavpils, Latvia",
  "Liepāja, Latvia",
  "Jelgava, Latvia",
  "Jūrmala, Latvia",
  "Ventspils, Latvia",
];

// ---------------------------------------------------------------------------
// Comprehensive local list for instant autocomplete (no network needed)
// norm = diacritics stripped + lowercased, for prefix matching
// context = shown next to the label in the dropdown (optional)
// ---------------------------------------------------------------------------

export interface LvLocation {
  label: string;
  norm: string;
  context?: string;
}

function loc(label: string, context?: string): LvLocation {
  return {
    label,
    norm: label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(),
    context,
  };
}

export const LV_LOCATIONS: LvLocation[] = [
  // ── Valstspilsētas (state cities) ──────────────────────────────────────
  loc("Rīga"),
  loc("Daugavpils"),
  loc("Jelgava"),
  loc("Jūrmala"),
  loc("Liepāja"),
  loc("Rēzekne"),
  loc("Valmiera"),
  loc("Ventspils"),

  // ── Major towns ────────────────────────────────────────────────────────
  loc("Ādaži"),
  loc("Aizkraukle"),
  loc("Alūksne"),
  loc("Auce"),
  loc("Baldone"),
  loc("Balvi"),
  loc("Bauska"),
  loc("Carnikava"),
  loc("Cēsis"),
  loc("Dobele"),
  loc("Dundaga"),
  loc("Engure"),
  loc("Gulbene"),
  loc("Ikšķile"),
  loc("Jēkabpils"),
  loc("Kandava"),
  loc("Ķegums"),
  loc("Ķekava"),
  loc("Krāslava"),
  loc("Kuldīga"),
  loc("Limbaži"),
  loc("Ludza"),
  loc("Madona"),
  loc("Mārupe"),
  loc("Ogre"),
  loc("Olaine"),
  loc("Preiļi"),
  loc("Ropaži"),
  loc("Salaspils"),
  loc("Saldus"),
  loc("Saulkrasti"),
  loc("Sigulda"),
  loc("Smiltene"),
  loc("Stopiņi"),
  loc("Talsi"),
  loc("Tukums"),
  loc("Vangaži"),
  loc("Varakļāni"),
  loc("Viļāni"),

  // ── Jūrmala sub-areas ──────────────────────────────────────────────────
  loc("Majori", "Jūrmala"),
  loc("Dzintari", "Jūrmala"),
  loc("Dubulti", "Jūrmala"),
  loc("Lielupe", "Jūrmala"),
  loc("Bulduri", "Jūrmala"),
  loc("Kauguri", "Jūrmala"),
  loc("Sloka", "Jūrmala"),
  loc("Melluži", "Jūrmala"),
  loc("Asari", "Jūrmala"),
  loc("Vaivari", "Jūrmala"),
  loc("Ķemeri", "Jūrmala"),

  // ── Rīga neighborhoods ─────────────────────────────────────────────────
  loc("Āgenskalns", "Rīga"),
  loc("Bieriņi", "Rīga"),
  loc("Bolderāja", "Rīga"),
  loc("Buļļi", "Rīga"),
  loc("Centrs", "Rīga"),
  loc("Čiekurkalns", "Rīga"),
  loc("Dārzciems", "Rīga"),
  loc("Dreiliņi", "Rīga"),
  loc("Grīziņkalns", "Rīga"),
  loc("Iļģuciems", "Rīga"),
  loc("Imanta", "Rīga"),
  loc("Jaunciems", "Rīga"),
  loc("Jugla", "Rīga"),
  loc("Ķengarags", "Rīga"),
  loc("Ķīpsala", "Rīga"),
  loc("Kleisti", "Rīga"),
  loc("Mangaļsala", "Rīga"),
  loc("Mežaparks", "Rīga"),
  loc("Mežciems", "Rīga"),
  loc("Pļavnieki", "Rīga"),
  loc("Purvciems", "Rīga"),
  loc("Sarkandaugava", "Rīga"),
  loc("Šķirotava", "Rīga"),
  loc("Teika", "Rīga"),
  loc("Torņakalns", "Rīga"),
  loc("Vecāķi", "Rīga"),
  loc("Vecmīlgrāvis", "Rīga"),
  loc("Vecpilsēta", "Rīga"),
  loc("Ziepniekkalns", "Rīga"),
  loc("Zolitūde", "Rīga"),
];

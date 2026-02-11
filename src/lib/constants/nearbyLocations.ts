/**
 * Static proximity mapping for Latvian cities/towns.
 * Each key maps to an array of nearby location names.
 * When searching for a location, results from nearby locations are also shown.
 */

// Riga metropolitan area group
const RIGA_AREA = [
  "Rīga", "Riga", "Mārupe", "Piņķi", "Ādaži", "Jūrmala",
  "Salaspils", "Ķekava", "Ogre", "Olaine", "Babīte",
  "Stopiņi", "Carnikava", "Sigulda", "Jelgava", "Mālpils",
  "Ikšķile", "Baldone", "Saulkrasti",
];

// Latvia regional proximity groups
const LATVIA_PROXIMITY_GROUPS: string[][] = [
  RIGA_AREA,
  ["Daugavpils", "Krāslava", "Līvāni"],
  ["Liepāja", "Grobiņa", "Aizpute", "Priekule"],
  ["Ventspils", "Talsi", "Kuldīga"],
  ["Valmiera", "Cēsis", "Smiltene", "Limbaži"],
  ["Rēzekne", "Ludza", "Balvi"],
];

/**
 * Given a city name, returns an array of nearby city names (excluding itself).
 * Matching is case-insensitive.
 */
export function getNearbyCities(cityName: string): string[] {
  const lower = cityName.toLowerCase();
  for (const group of LATVIA_PROXIMITY_GROUPS) {
    const match = group.find((c) => c.toLowerCase() === lower);
    if (match) {
      return group.filter((c) => c.toLowerCase() !== lower);
    }
  }
  return [];
}

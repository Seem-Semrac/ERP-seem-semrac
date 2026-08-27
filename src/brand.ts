// ══════════════════════════════════════════════════════════════
// IDENTITÉ DE MARQUE — SOURCE UNIQUE de tous les documents PDF/imprimables
// (devis, facture, OF, PV, CoC, dérogation, FDS…).
//
// RÈGLE (user 2026-07-23) : tout PDF porte le logo Seem Semrac + le code couleur
//   de marque. Les coordonnées légales se remplissent SEULES sur chaque document
//   au fur et à mesure qu'on les saisit ici — « ni plus ni moins » : un champ vide
//   n'affiche RIEN (pas de placeholder, pas de tiret), un champ rempli s'affiche.
//
// → Pour compléter l'identité, il suffit d'éditer l'objet SOCIETE ci-dessous.
//   Aucune donnée n'est inventée : les champs légaux sont VIDES par défaut.
// ══════════════════════════════════════════════════════════════

export const SOCIETE = {
  nom: 'SEEM SEMRAC',                      // raison sociale (affichée en NOIR à côté du logo)
  activite: 'Usinage & tôlerie de précision',
  // — Champs légaux : laisser vide tant qu'ils ne sont pas fournis. Vide = non affiché. —
  forme: '',                               // ex. « SAS au capital de 50 000 € »
  adresse: '',                             // n° et rue
  cp: '',
  ville: '',
  siret: '',
  rcs: '',                                 // ex. « Toulouse B 000 000 000 »
  ape: '',                                 // code APE/NAF
  tva: '',                                 // n° TVA intracommunautaire (FR…)
  tel: '',
  email: '',
  web: '',
  iban: '',                               // affiché sur la facture uniquement (voir factureIban)
}

// Palette de marque relevée sur le logo (à utiliser sur tous les documents,
// en lieu et place de l'indigo générique #4338ca/#6366f1).
export const BRAND = {
  violet: '#5C5391',      // « Seem »
  bleu: '#22409B',        // « Semrac »
  bleuClair: '#29AAE1',
  bleuPale: '#9BD3EF',
  noir: '#1A1A1A',
}

// Logo SVG inline (vectoriel, net à l'impression, aucune requête réseau).
// `width="100%"` → il remplit son conteneur ; une règle CSS `svg{width:…}` peut le forcer.
export const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 1920 1447" role="img" aria-label="SEEM SEMRAC">
<rect width="1920" height="1447" fill="#9BD3EF"/>
<rect x="0" y="555" width="1150" height="892" fill="#29AAE1"/>
<rect x="0" y="960" width="550" height="487" fill="#0C9AD8"/>
<rect x="0" y="1155" width="225" height="292" fill="#1A1A1A"/>
<text x="550" y="930" textLength="1340" lengthAdjust="spacingAndGlyphs" font-family="Segoe UI, Frutiger, Calibri, Trebuchet MS, sans-serif" font-size="480" fill="#5C5391">Seem</text>
<text x="225" y="1360" textLength="1665" lengthAdjust="spacingAndGlyphs" font-family="Segoe UI, Frutiger, Calibri, Trebuchet MS, sans-serif" font-size="480" fill="#22409B">Semrac</text>
</svg>`

// Lignes d'identité société : UNIQUEMENT les champs renseignés (ni placeholder, ni ligne vide).
// C'est ici qu'est concentrée la logique « ni plus ni moins » ; tous les documents la réutilisent.
export function societeLignes(): string[] {
  const S = SOCIETE, L: string[] = []
  if (S.forme) L.push(S.forme)
  const ville = [S.cp, S.ville].filter(Boolean).join(' ')
  const adr = [S.adresse, ville].filter(Boolean).join(', ')
  if (adr) L.push(adr)
  const legal = [
    S.siret && ('SIRET ' + S.siret),
    S.rcs && ('RCS ' + S.rcs),
    S.ape && ('APE ' + S.ape),
  ].filter(Boolean).join(' · ')
  if (legal) L.push(legal)
  if (S.tva) L.push('N° TVA ' + S.tva)
  const contact = [
    S.tel && ('Tél. ' + S.tel),
    S.email,
    S.web,
  ].filter(Boolean).join(' · ')
  if (contact) L.push(contact)
  return L
}

const _esc = (s: any) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// En-tête de marque complet pour un document imprimable rendu CÔTÉ SERVEUR
// (facture, OF, PV, FDS…). Logo + raison sociale (noir) + lignes d'identité renseignées
// à gauche ; bloc `rightHTML` optionnel (n° de doc, date…) à droite. Styles inline → autonome.
export function brandHeaderHTML(rightHTML = ''): string {
  const lignes = societeLignes().map(_esc).join('<br/>')
  return '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:3px solid ' + BRAND.violet + ';padding-bottom:14px;margin-bottom:18px;">'
    + '<div style="display:flex;align-items:center;gap:14px;">'
    + '<div style="width:104px;flex:0 0 104px;">' + LOGO_SVG + '</div>'
    + '<div><div style="font-size:20px;font-weight:800;color:#000;letter-spacing:.5px;">' + _esc(SOCIETE.nom) + '</div>'
    + (SOCIETE.activite ? '<div style="font-size:11px;color:' + BRAND.bleu + ';margin-top:2px;">' + _esc(SOCIETE.activite) + '</div>' : '')
    + (lignes ? '<div style="font-size:10px;color:#475569;margin-top:5px;line-height:1.5;">' + lignes + '</div>' : '')
    + '</div></div>'
    + (rightHTML ? '<div style="text-align:right;font-size:11px;color:#475569;line-height:1.5;">' + rightHTML + '</div>' : '')
    + '</div>'
}

// Bloc de marque GAUCHE seul (logo + raison sociale noire + identité renseignée), à poser
// à gauche d'un en-tête de document ; chaque document ajoute son propre bloc à droite
// (n° de facture/OF, date…). Sert les documents rendus en JS client (injecter via sjX()).
export function brandBlockHTML(): string {
  const lignes = societeLignes().map(_esc).join('<br/>')
  return '<div style="display:flex;align-items:center;gap:14px;">'
    + '<div style="width:104px;flex:0 0 104px;">' + LOGO_SVG + '</div>'
    + '<div><div style="font-size:19px;font-weight:800;color:#000;letter-spacing:.5px;">' + _esc(SOCIETE.nom) + '</div>'
    + (SOCIETE.activite ? '<div style="font-size:11px;color:' + BRAND.bleu + ';margin-top:2px;">' + _esc(SOCIETE.activite) + '</div>' : '')
    + (lignes ? '<div style="font-size:10px;color:#475569;margin-top:5px;line-height:1.5;">' + lignes + '</div>' : '')
    + '</div></div>'
}

// CSS d'impression commun à insérer dans le <style> de tout document imprimable :
// @page A4 + print-color-adjust (sans lui, les aplats du logo NE S'IMPRIMENT PAS).
export const BRAND_PRINT_CSS = '@page{size:A4 portrait;margin:12mm;}*{-webkit-print-color-adjust:exact;print-color-adjust:exact;}@media print{body{padding:0;}thead{display:table-header-group;}tr{page-break-inside:avoid;}}'

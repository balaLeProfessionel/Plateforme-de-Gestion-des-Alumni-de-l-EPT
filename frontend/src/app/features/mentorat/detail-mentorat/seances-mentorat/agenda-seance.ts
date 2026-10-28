import { LIBELLES_MODALITE, SeanceMentorat } from '../../../../core/services/models/mentorat.model';

/**
 * Fichier iCalendar (RFC 5545) d'une séance, à importer dans Google Agenda, Outlook ou Calendrier.
 * L'UID reprend l'identifiant de la séance : réimporter une séance déplacée met l'événement à jour.
 */
export function fichierIcs(seance: SeanceMentorat, intitule: string, maintenant: Date): string {
  const debut = new Date(seance.debut);
  const fin = new Date(debut.getTime() + seance.dureeMinutes * 60_000);
  const lien = /^https:\/\//i.test(seance.lieuOuLien ?? '') ? seance.lieuOuLien : null;
  const description = [`Modalité : ${LIBELLES_MODALITE[seance.modalite]}`, lien && `Lien : ${lien}`]
    .filter(Boolean).join('\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EPT Alumni//Mentorat//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:seance-${seance.id}@ept-alumni`,
    `DTSTAMP:${dateUtc(maintenant)}`,
    `DTSTART:${dateUtc(debut)}`,
    `DTEND:${dateUtc(fin)}`,
    `SUMMARY:${echapper(intitule)}`,
    `DESCRIPTION:${echapper(description)}`,
    ...(seance.lieuOuLien ? [`LOCATION:${echapper(seance.lieuOuLien)}`] : []),
    ...(lien ? [`URL:${lien}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ].map(plier).join('\r\n') + '\r\n';
}

/** Nom de fichier lisible : « seance-mentorat-2026-10-28.ics ». */
export function nomFichierIcs(seance: SeanceMentorat): string {
  return `seance-mentorat-${seance.debut.slice(0, 10)}.ics`;
}

function dateUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function echapper(texte: string): string {
  return texte.replace(/\\/g, '\\\\').replace(/([;,])/g, '\\$1').replace(/\r?\n/g, '\\n');
}

/** Lignes de 75 octets au plus, les suivantes commençant par une espace (RFC 5545 §3.1). */
function plier(ligne: string): string {
  const encodeur = new TextEncoder();
  const morceaux: string[] = [];
  let courant = '';
  let octets = 0;
  for (const caractere of ligne) {
    const taille = encodeur.encode(caractere).length;
    const limite = morceaux.length === 0 ? 75 : 74;
    if (octets + taille > limite) {
      morceaux.push(courant);
      courant = '';
      octets = 0;
    }
    courant += caractere;
    octets += taille;
  }
  morceaux.push(courant);
  return morceaux.join('\r\n ');
}

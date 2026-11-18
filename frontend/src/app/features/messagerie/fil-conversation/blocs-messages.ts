import { formatDate } from '@angular/common';
import { Message } from '../../../core/services/models/messagerie.model';

/** Au-delà de cet écart, un message du même auteur rouvre un bloc (nom et avatar répétés). */
const ECART_SUITE_MS = 5 * 60_000;

export interface LigneFil {
  message: Message;
  /** Libellé du jour à afficher avant ce message (« Aujourd’hui », « Hier », « lundi 3 novembre »). */
  jour: string | null;
  /** Même auteur que le message précédent, peu après : la bulle se colle à la précédente. */
  suite: boolean;
  /**
   * Messages supprimés que cette ligne résume : ceux d’un même auteur qui se suivent, le même jour, tiennent
   * en une ligne (« 3 messages supprimés ») ; 0 pour un message qui ne l’est pas.
   */
  supprimes: number;
}

/** Messages triés du plus ancien au plus récent, sans doublon : les plus récents remplacent les anciens. */
export function fusionnerMessages(existants: readonly Message[], recus: readonly Message[]): Message[] {
  const parId = new Map(existants.map((message) => [message.id, message]));
  for (const message of recus) parId.set(message.id, message);
  return [...parId.values()].sort((a, b) =>
    a.envoyeLe === b.envoyeLe ? a.id.localeCompare(b.id) : a.envoyeLe < b.envoyeLe ? -1 : 1);
}

export function libelleJour(date: Date, maintenant: Date, locale = 'fr'): string {
  const jours = Math.round((debutJour(maintenant) - debutJour(date)) / 86_400_000);
  if (jours === 0) return 'Aujourd’hui';
  if (jours === 1) return 'Hier';
  const format = date.getFullYear() === maintenant.getFullYear() ? 'EEEE d MMMM' : 'EEEE d MMMM y';
  return formatDate(date, format, locale);
}

/** Découpe le fil en jours et en suites de messages d’un même auteur ; les suppressions d’affilée se regroupent. */
export function lignesDuFil(messages: readonly Message[], maintenant: Date, locale = 'fr'): LigneFil[] {
  const lignes: LigneFil[] = [];
  messages.forEach((message, index) => {
    const precedent = index > 0 ? messages[index - 1] : null;
    const date = new Date(message.envoyeLe);
    const datePrecedente = precedent ? new Date(precedent.envoyeLe) : null;
    const nouveauJour = !datePrecedente || debutJour(datePrecedente) !== debutJour(date);
    const derniere = lignes.at(-1);
    if (message.supprime && !nouveauJour && derniere?.message.supprime && precedent?.supprime
        && derniere.message.auteurId === message.auteurId) {
      derniere.supprimes += 1;
      return;
    }
    lignes.push({
      message,
      jour: nouveauJour ? libelleJour(date, maintenant, locale) : null,
      suite: !nouveauJour && precedent !== null && precedent.auteurId === message.auteurId
        && date.getTime() - (datePrecedente?.getTime() ?? 0) < ECART_SUITE_MS,
      supprimes: message.supprime ? 1 : 0,
    });
  });
  return lignes;
}

function debutJour(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { Message } from '../../../core/services/models/messagerie.model';
import { fusionnerMessages, libelleJour, lignesDuFil } from './blocs-messages';

registerLocaleData(localeFr);

const message = (id: string, envoyeLe: string, auteurId = 'a', deMoi = false): Message => ({
  id, auteurId, auteurNom: 'Awa Diop', auteurPhoto: null, contenu: id, supprime: false, envoyeLe, deMoi,
});

describe('Blocs du fil de messages', () => {
  const maintenant = new Date(2026, 10, 14, 15, 0);

  it('fusionne sans doublon, dans l’ordre, en gardant la version la plus récente', () => {
    const anciens = [message('m2', '2026-11-14T10:01:00Z'), message('m3', '2026-11-14T10:02:00Z')];
    const supprime = { ...message('m3', '2026-11-14T10:02:00Z'), supprime: true, contenu: null };

    const fusion = fusionnerMessages(anciens, [message('m1', '2026-11-14T10:00:00Z'), supprime]);

    expect(fusion.map((m) => m.id)).toEqual(['m1', 'm2', 'm3']);
    expect(fusion[2].supprime).toBe(true);
  });

  it('nomme les jours comme on les dit', () => {
    expect(libelleJour(new Date(2026, 10, 14, 8), maintenant)).toBe('Aujourd’hui');
    expect(libelleJour(new Date(2026, 10, 13, 23), maintenant)).toBe('Hier');
    expect(libelleJour(new Date(2026, 10, 3, 9), maintenant)).toBe('mardi 3 novembre');
    expect(libelleJour(new Date(2025, 0, 5, 9), maintenant)).toBe('dimanche 5 janvier 2025');
  });

  it('ouvre un jour au premier message et colle les messages rapprochés d’un même auteur', () => {
    const lignes = lignesDuFil([
      message('m1', new Date(2026, 10, 13, 9, 0).toISOString(), 'a'),
      message('m2', new Date(2026, 10, 14, 9, 0).toISOString(), 'a'),
      message('m3', new Date(2026, 10, 14, 9, 2).toISOString(), 'a'),
      message('m4', new Date(2026, 10, 14, 9, 3).toISOString(), 'b'),
      message('m5', new Date(2026, 10, 14, 9, 30).toISOString(), 'b'),
    ], maintenant);

    expect(lignes.map((l) => l.jour)).toEqual(['Hier', 'Aujourd’hui', null, null, null]);
    expect(lignes.map((l) => l.suite)).toEqual([false, false, true, false, false]);
  });
});

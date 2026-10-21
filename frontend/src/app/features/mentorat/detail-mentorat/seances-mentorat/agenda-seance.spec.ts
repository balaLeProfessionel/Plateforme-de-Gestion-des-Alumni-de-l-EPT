import { uneSeance } from '../../testing/donnees-mentorat';
import { fichierIcs, nomFichierIcs } from './agenda-seance';

describe('fichierIcs', () => {
  const maintenant = new Date('2026-10-21T09:15:30.123Z');

  it('décrit la séance en UTC, avec sa durée et son lien de visio', () => {
    const ics = fichierIcs(uneSeance({ debut: '2026-10-28T18:00:00Z', dureeMinutes: 90 }), 'Mentorat Data & IA avec Awa Thiam', maintenant);
    const lignes = ics.split('\r\n');

    expect(lignes[0]).toBe('BEGIN:VCALENDAR');
    expect(lignes).toContain('UID:seance-s1@ept-alumni');
    expect(lignes).toContain('DTSTAMP:20261021T091530Z');
    expect(lignes).toContain('DTSTART:20261028T180000Z');
    expect(lignes).toContain('DTEND:20261028T193000Z');
    expect(lignes).toContain('SUMMARY:Mentorat Data & IA avec Awa Thiam');
    expect(lignes).toContain('DESCRIPTION:Modalité : Visio\\nLien : https://meet.example.test/a');
    expect(lignes).toContain('URL:https://meet.example.test/a');
    expect(ics.endsWith('END:VEVENT\r\nEND:VCALENDAR\r\n')).toBe(true);
  });

  it('échappe le texte et omet le lien pour une séance en présentiel', () => {
    const ics = fichierIcs(uneSeance({ modalite: 'PRESENTIEL', lieuOuLien: 'Salle B12, bâtiment; nord' }), 'Mentorat', maintenant);
    expect(ics).toContain('LOCATION:Salle B12\\, bâtiment\\; nord');
    expect(ics).not.toContain('URL:');
    expect(ics).toContain('DESCRIPTION:Modalité : Présentiel\r\n');
  });

  it('plie les lignes trop longues sans couper un caractère accentué', () => {
    const ics = fichierIcs(uneSeance({ lieuOuLien: 'é'.repeat(100) }), 'Mentorat', maintenant);
    const encodeur = new TextEncoder();
    for (const ligne of ics.split('\r\n')) expect(encodeur.encode(ligne).length).toBeLessThanOrEqual(75);
    expect(ics.replace(/\r\n /g, '')).toContain(`LOCATION:${'é'.repeat(100)}`);
  });

  it('nomme le fichier d’après la date de la séance', () => {
    expect(nomFichierIcs(uneSeance())).toBe('seance-mentorat-2026-10-28.ics');
  });
});

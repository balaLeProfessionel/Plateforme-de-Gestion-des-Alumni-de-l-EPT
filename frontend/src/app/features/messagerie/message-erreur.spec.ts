import { HttpErrorResponse } from '@angular/common/http';
import { messageServeur } from './message-erreur';

describe('messageServeur', () => {
  it('reprend le message du serveur quand il a répondu', () => {
    const refus = new HttpErrorResponse({ status: 409, error: { message: 'Vous ne pouvez plus écrire dans cette conversation.' } });
    expect(messageServeur(refus, 'Message non envoyé.')).toBe('Vous ne pouvez plus écrire dans cette conversation.');
  });

  it('n’affiche jamais l’erreur technique du navigateur quand le réseau est coupé', () => {
    const coupure = new HttpErrorResponse({ status: 0, error: new TypeError('Failed to fetch') });
    expect(messageServeur(coupure, 'Message non envoyé.')).toBe('Message non envoyé.');
  });

  it('garde le texte par défaut pour une réponse sans message (page d’erreur, corps vide)', () => {
    expect(messageServeur(new HttpErrorResponse({ status: 502, error: '<html>Bad Gateway</html>' }), 'Réessayez.')).toBe('Réessayez.');
    expect(messageServeur(new HttpErrorResponse({ status: 500, error: { message: '  ' } }), 'Réessayez.')).toBe('Réessayez.');
    expect(messageServeur(new Error('autre'), 'Réessayez.')).toBe('Réessayez.');
  });
});

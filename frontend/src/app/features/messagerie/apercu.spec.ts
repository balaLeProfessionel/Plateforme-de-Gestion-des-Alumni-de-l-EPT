import { Conversation } from '../../core/services/models/messagerie.model';
import { apercuConversation, TEXTE_DEPART, texteSysteme } from './apercu';

const conversation = (type: 'DIRECTE' | 'GROUPE', dernier: Partial<Conversation['dernierMessage']> | null,
  categorie: Conversation['categorie'] = null): Conversation => ({
  id: 'c', type, nom: 'Nom', interlocuteur: null, urlPhoto: null, nombreParticipants: 2, monRole: 'MEMBRE', ecriture: 'OUVERTE', nombreNonLus: 0,
  dernierMessageLe: '2026-11-14T10:00:00Z', categorie,
  dernierMessage: dernier && { auteurId: 'autre', auteurNom: 'Awa Diop', contenu: 'Salut', supprime: false,
    envoyeLe: '2026-11-14T10:00:00Z', systeme: false, ...dernier },
});

describe('apercuConversation', () => {
  it('préfixe mes messages par « Vous » et ceux d’un groupe par leur auteur', () => {
    expect(apercuConversation(conversation('DIRECTE', { auteurId: 'moi' }), 'moi')).toBe('Vous : Salut');
    expect(apercuConversation(conversation('DIRECTE', {}), 'moi')).toBe('Salut');
    expect(apercuConversation(conversation('GROUPE', {}), 'moi')).toBe('Awa Diop : Salut');
  });

  it('signale un message supprimé et une conversation sans message', () => {
    expect(apercuConversation(conversation('DIRECTE', { supprime: true, contenu: '' }), 'moi')).toBe('Message supprimé');
    expect(apercuConversation(conversation('DIRECTE', null), 'moi')).toBe('Aucun message pour l’instant');
    expect(apercuConversation(conversation('GROUPE', null), 'moi')).toBe('Groupe créé, aucun message');
    expect(apercuConversation(conversation('GROUPE', null, 'PROMO'), 'moi')).toBe('Aucun message pour l’instant');
  });

  it('écrit l’arrivée dans une communauté comme une phrase, sans « Auteur : »', () => {
    const arrivee = { systeme: true, contenu: 'a rejoint la communauté.' };
    expect(apercuConversation(conversation('GROUPE', arrivee, 'PROMO'), 'moi')).toBe('Awa Diop a rejoint la communauté.');
    expect(apercuConversation(conversation('GROUPE', { ...arrivee, auteurId: 'moi' }, 'PROMO'), 'moi'))
      .toBe('Vous avez rejoint la communauté.');
  });

  it('écrit aussi le départ d’un membre', () => {
    const depart = { systeme: true, contenu: TEXTE_DEPART };
    expect(apercuConversation(conversation('GROUPE', depart, 'PROMO'), 'moi')).toBe('Awa Diop a quitté la communauté.');
    expect(texteSysteme(TEXTE_DEPART, 'Awa Diop', true)).toBe('Vous avez quitté la communauté.');
  });
});

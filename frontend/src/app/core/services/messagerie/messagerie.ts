import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import {
  Communautes, Conversation, ConversationDetail, MembreBloque, Message, ModificationGroupe, PageConversations, PageMessages,
  RoleParticipant,
} from '../models/messagerie.model';
import { PageAnnuaire } from '../models/annuaire.model';

const API = '/api/messagerie';

/** Appels HTTP de la messagerie : conversations, groupes et messages. */
@Service()
export class MessagerieService {
  private readonly http = inject(HttpClient);

  listerConversations(page = 0, taille = 30, recherche = '') {
    let params = new HttpParams().set('page', page).set('taille', taille);
    if (recherche.trim()) params = params.set('recherche', recherche.trim());
    return this.http.get<PageConversations>(`${API}/conversations`, { params });
  }

  /** Mes communautés (promo, filière… : le serveur m’y range d’abord) et celles que je peux rejoindre. */
  listerCommunautes() {
    return this.http.get<Communautes>(`${API}/communautes`);
  }

  /** Annuaire d’une communauté dont je fais partie : ses membres, triés par nom, au format de l’annuaire. */
  listerMembresCommunaute(id: string, page = 0, recherche = '', taille = 24) {
    let params = new HttpParams().set('page', page).set('taille', taille);
    if (recherche.trim()) params = params.set('recherche', recherche.trim());
    return this.http.get<PageAnnuaire>(`${API}/communautes/${encodeURIComponent(id)}/membres`, { params });
  }

  rejoindreCommunaute(id: string) {
    return this.http.post<ConversationDetail>(`${API}/communautes/${encodeURIComponent(id)}/rejoindre`, null);
  }

  /** Renvoie la conversation existante avec ce membre, ou la crée. */
  ouvrirDirecte(destinataireId: string) {
    return this.http.post<Conversation>(`${API}/conversations/directes`, { destinataireId });
  }

  /** Conversation avec le compte qui représente l'organisme (créée au besoin). */
  ouvrirAvecOrganisme(organismeId: string) {
    return this.http.post<Conversation>(`${API}/conversations/organismes/${organismeId}`, null);
  }

  creerGroupe(nom: string, membreIds: readonly string[], description = '') {
    return this.http.post<ConversationDetail>(`${API}/conversations/groupes`,
      { nom, membreIds, ...(description ? { description } : {}) });
  }

  obtenir(id: string) {
    return this.http.get<ConversationDetail>(`${API}/conversations/${encodeURIComponent(id)}`);
  }

  /** Nom et description du groupe (administrateur). */
  modifierGroupe(id: string, modification: ModificationGroupe) {
    return this.http.patch<ConversationDetail>(`${API}/conversations/${encodeURIComponent(id)}`, modification);
  }

  /** Supprime le groupe et ses messages pour tous ses membres (administrateur). */
  supprimerGroupe(id: string) {
    return this.http.delete<void>(`${API}/conversations/${encodeURIComponent(id)}`);
  }

  /** Photo déjà recadrée en carré : le serveur la ramène à 600 × 600. */
  changerPhotoGroupe(id: string, photo: File) {
    const donnees = new FormData();
    donnees.append('photo', photo, photo.name);
    return this.http.post<ConversationDetail>(`${API}/conversations/${encodeURIComponent(id)}/photo`, donnees);
  }

  retirerPhotoGroupe(id: string) {
    return this.http.delete<ConversationDetail>(`${API}/conversations/${encodeURIComponent(id)}/photo`);
  }

  /** Nommer un membre administrateur ou lui retirer ce rôle. */
  changerRole(id: string, utilisateurId: string, role: RoleParticipant) {
    return this.http.patch<ConversationDetail>(
      `${API}/conversations/${encodeURIComponent(id)}/participants/${encodeURIComponent(utilisateurId)}`, { role });
  }

  ajouterParticipants(id: string, membreIds: readonly string[]) {
    return this.http.post<ConversationDetail>(`${API}/conversations/${encodeURIComponent(id)}/participants`, { membreIds });
  }

  /** Retire un membre (administrateur) ou quitte le groupe avec son propre identifiant. */
  retirerParticipant(id: string, utilisateurId: string) {
    return this.http.delete<void>(
      `${API}/conversations/${encodeURIComponent(id)}/participants/${encodeURIComponent(utilisateurId)}`);
  }

  /** Les `taille` messages avant `avant` (ou les derniers), du plus ancien au plus récent. */
  listerMessages(id: string, avant?: string, taille = 30) {
    let params = new HttpParams().set('taille', taille);
    if (avant) params = params.set('avant', avant);
    return this.http.get<PageMessages>(`${API}/conversations/${encodeURIComponent(id)}/messages`, { params });
  }

  envoyer(id: string, contenu: string) {
    return this.http.post<Message>(`${API}/conversations/${encodeURIComponent(id)}/messages`, { contenu });
  }

  /** Envoi multipart : le navigateur pose lui-même l’en-tête `Content-Type` et sa frontière. */
  envoyerAvecFichier(id: string, fichier: File, contenu: string) {
    const donnees = new FormData();
    donnees.append('fichier', fichier, fichier.name);
    if (contenu) donnees.append('contenu', contenu);
    return this.http.post<Message>(`${API}/conversations/${encodeURIComponent(id)}/messages`, donnees);
  }

  /** Le fichier joint passe par HttpClient (jeton JWT) : il n’a pas d’adresse publique. */
  telechargerPieceJointe(id: string, messageId: string) {
    return this.http.get(
      `${API}/conversations/${encodeURIComponent(id)}/messages/${encodeURIComponent(messageId)}/piece-jointe`,
      { responseType: 'blob' });
  }

  supprimerMessage(id: string, messageId: string) {
    return this.http.delete<void>(
      `${API}/conversations/${encodeURIComponent(id)}/messages/${encodeURIComponent(messageId)}`);
  }

  marquerLu(id: string) {
    return this.http.patch<void>(`${API}/conversations/${encodeURIComponent(id)}/lu`, null);
  }

  listerBlocages() {
    return this.http.get<MembreBloque[]>(`${API}/blocages`);
  }

  bloquer(utilisateurId: string) {
    return this.http.put<void>(`${API}/blocages/${encodeURIComponent(utilisateurId)}`, null);
  }

  debloquer(utilisateurId: string) {
    return this.http.delete<void>(`${API}/blocages/${encodeURIComponent(utilisateurId)}`);
  }

  compterNonLus() {
    return this.http.get<{ nombre: number }>(`${API}/non-lus`);
  }
}

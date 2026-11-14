import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import {
  Conversation, ConversationDetail, Message, PageConversations, PageMessages,
} from '../models/messagerie.model';

const API = '/api/messagerie';

/** Appels HTTP de la messagerie : conversations, groupes et messages. */
@Service()
export class MessagerieService {
  private readonly http = inject(HttpClient);

  listerConversations(page = 0, taille = 30) {
    const params = new HttpParams().set('page', page).set('taille', taille);
    return this.http.get<PageConversations>(`${API}/conversations`, { params });
  }

  /** Renvoie la conversation existante avec ce membre, ou la crée. */
  ouvrirDirecte(destinataireId: string) {
    return this.http.post<Conversation>(`${API}/conversations/directes`, { destinataireId });
  }

  creerGroupe(nom: string, membreIds: readonly string[]) {
    return this.http.post<ConversationDetail>(`${API}/conversations/groupes`, { nom, membreIds });
  }

  obtenir(id: string) {
    return this.http.get<ConversationDetail>(`${API}/conversations/${encodeURIComponent(id)}`);
  }

  renommer(id: string, nom: string) {
    return this.http.patch<ConversationDetail>(`${API}/conversations/${encodeURIComponent(id)}`, { nom });
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

  supprimerMessage(id: string, messageId: string) {
    return this.http.delete<void>(
      `${API}/conversations/${encodeURIComponent(id)}/messages/${encodeURIComponent(messageId)}`);
  }

  marquerLu(id: string) {
    return this.http.patch<void>(`${API}/conversations/${encodeURIComponent(id)}/lu`, null);
  }

  compterNonLus() {
    return this.http.get<{ nombre: number }>(`${API}/non-lus`);
  }
}

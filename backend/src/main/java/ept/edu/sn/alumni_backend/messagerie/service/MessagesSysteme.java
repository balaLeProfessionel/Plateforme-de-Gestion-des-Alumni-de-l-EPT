package ept.edu.sn.alumni_backend.messagerie.service;

import ept.edu.sn.alumni_backend.messagerie.entity.Conversation;
import ept.edu.sn.alumni_backend.messagerie.entity.Message;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;

/**
 * Messages du système dans une communauté, précédés du nom de leur auteur à l'affichage (« Awa Diop a rejoint la
 * communauté. »). Ils servent aussi de trace : le dernier d'une personne dit si elle a quitté une communauté
 * automatique, que la synchronisation ne doit alors plus lui imposer. Ces textes ne doivent donc pas changer
 * sans reprendre les messages déjà écrits.
 */
final class MessagesSysteme {
    static final String ARRIVEE = "a rejoint la communauté.";
    static final String DEPART = "a quitté la communauté.";

    private MessagesSysteme() {}

    static Message creer(Conversation communaute, Utilisateur auteur, String texte) {
        Message message = new Message();
        message.setConversation(communaute);
        message.setAuteur(auteur);
        message.setContenu(texte);
        message.setSysteme(true);
        return message;
    }
}

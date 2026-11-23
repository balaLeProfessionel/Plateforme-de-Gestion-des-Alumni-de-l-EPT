package ept.edu.sn.alumni_backend.messagerie.tempsreel;

import java.util.Set;
import java.util.UUID;

/**
 * Signal envoyé en temps réel aux participants : il dit seulement quelle conversation a changé et comment.
 * Le navigateur recharge ensuite ce qu'il affiche par l'API habituelle, qui vérifie les droits :
 * aucun contenu ne passe par le flux.
 */
public record EvenementMessagerie(Set<UUID> destinataires, Type type, UUID conversationId) {

    public enum Type {
        /** Un message est arrivé ou a été supprimé : le fil et la liste se mettent à jour. */
        MESSAGE("message"),
        /** Nom ou membres ont changé : le détail, la liste et le badge se mettent à jour. */
        CONVERSATION("conversation"),
        /** J'ai lu la conversation (dans un autre onglet) : seuls la liste et le badge changent. */
        LU("lu");

        private final String nomEvenement;

        Type(String nomEvenement) {
            this.nomEvenement = nomEvenement;
        }

        public String nomEvenement() {
            return nomEvenement;
        }
    }

    public EvenementMessagerie {
        destinataires = Set.copyOf(destinataires);
    }
}

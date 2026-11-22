package ept.edu.sn.alumni_backend.messagerie.entity;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.Check;

import ept.edu.sn.alumni_backend.messagerie.AccesCommunaute;
import ept.edu.sn.alumni_backend.messagerie.CategorieCommunaute;
import ept.edu.sn.alumni_backend.messagerie.TypeConversation;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

/**
 * Fil de discussion, entre deux personnes ({@link TypeConversation#DIRECTE}) ou en groupe.
 * Les membres sont dans {@link Participant}, les messages dans {@link Message}.
 */
@Entity
@Table(name = "conversations", uniqueConstraints = {
    @UniqueConstraint(name = "uk_conversation_cle_directe", columnNames = "cle_directe"),
    @UniqueConstraint(name = "uk_conversation_cle_communaute", columnNames = "cle_communaute"),
})
@Check(name = "ck_conversation_type", constraints =
    "(type = 'DIRECTE' and cle_directe is not null and nom is null)"
    + " or (type = 'GROUPE' and nom is not null and cle_directe is null)")
@Getter
@Setter
public class Conversation {
    public static final int LONGUEUR_MAX_NOM = 80;
    public static final int LONGUEUR_MAX_DESCRIPTION = 500;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TypeConversation type;

    /** Nom du groupe ; absent pour une conversation directe. */
    @Column(length = LONGUEUR_MAX_NOM)
    private String nom;

    /**
     * Les deux identifiants triés, séparés par « : » (voir {@link #cleDirecte}). Unique : une même paire
     * de personnes n'a qu'une conversation directe, même si elles s'écrivent au même instant.
     */
    @Column(name = "cle_directe", length = 73)
    private String cleDirecte;

    /** Présentation d'un groupe, facultative ; toujours absente pour une conversation directe. */
    @Column(length = LONGUEUR_MAX_DESCRIPTION)
    private String description;

    /** Photo d'un groupe ({@code /api/photos/…}, carré de 600 px), facultative. */
    @Column(name = "url_photo")
    private String urlPhoto;

    @Column(nullable = false, updatable = false)
    private Instant creeLe;

    /** Date du dernier message, ou de la création tant qu'il n'y en a pas : sert à trier la liste. */
    @Column(nullable = false)
    private Instant dernierMessageLe;

    /** Remplie pour une communauté (un groupe ouvert à tout un public) ; absente pour un groupe privé ou une directe. */
    @Enumerated(EnumType.STRING)
    @Column(length = 15)
    private CategorieCommunaute categorie;

    /** Comment on entre dans la communauté ; absent hors communauté. */
    @Enumerated(EnumType.STRING)
    @Column(length = 12)
    private AccesCommunaute acces;

    /**
     * Identifie une communauté automatique (« PROMO:2015 », « FILIERE:genie civil ») : unique, elle garantit qu'une
     * promo n'a qu'une communauté même si deux membres la créent au même instant.
     */
    @Column(name = "cle_communaute", length = 120)
    private String cleCommunaute;

    @PrePersist
    void avantCreation() {
        if (creeLe == null) creeLe = Instant.now();
        if (dernierMessageLe == null) dernierMessageLe = creeLe;
    }

    public static Conversation directe(UUID premier, UUID second) {
        Conversation conversation = new Conversation();
        conversation.setType(TypeConversation.DIRECTE);
        conversation.setCleDirecte(cleDirecte(premier, second));
        return conversation;
    }

    public static Conversation groupe(String nom) {
        Conversation conversation = new Conversation();
        conversation.setType(TypeConversation.GROUPE);
        conversation.setNom(nom);
        return conversation;
    }

    public static Conversation communaute(String nom, CategorieCommunaute categorie, AccesCommunaute acces, String cle) {
        Conversation conversation = groupe(nom);
        conversation.setCategorie(categorie);
        conversation.setAcces(acces);
        conversation.setCleCommunaute(cle);
        return conversation;
    }

    public boolean estCommunaute() {
        return categorie != null;
    }

    /** Communauté dont on fait partie par son profil : on ne la quitte pas. */
    public boolean estCommunauteAutomatique() {
        return categorie != null && categorie.automatique();
    }

    /** L'autre personne d'une conversation directe, lue dans sa clé. */
    public UUID interlocuteurDe(UUID moi) {
        if (type != TypeConversation.DIRECTE) throw new IllegalStateException("Un groupe n'a pas d'interlocuteur unique.");
        String[] ids = cleDirecte.split(":");
        return UUID.fromString(ids[0].equals(moi.toString()) ? ids[1] : ids[0]);
    }

    /** Même clé quel que soit l'ordre des deux personnes. */
    public static String cleDirecte(UUID premier, UUID second) {
        if (premier.equals(second)) {
            throw new IllegalArgumentException("Une conversation directe réunit deux personnes différentes.");
        }
        String a = premier.toString();
        String b = second.toString();
        return a.compareTo(b) < 0 ? a + ":" + b : b + ":" + a;
    }
}

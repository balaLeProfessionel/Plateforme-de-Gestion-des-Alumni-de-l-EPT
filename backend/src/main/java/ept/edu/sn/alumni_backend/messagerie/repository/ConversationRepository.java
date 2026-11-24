package ept.edu.sn.alumni_backend.messagerie.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Limit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import ept.edu.sn.alumni_backend.messagerie.entity.Conversation;
import jakarta.persistence.LockModeType;

public interface ConversationRepository extends JpaRepository<Conversation, UUID> {
    /** Conversation directe existante entre deux personnes (clé de {@link Conversation#cleDirecte}). */
    Optional<Conversation> findByCleDirecte(String cleDirecte);

    /** Mes conversations (directes et groupes privés : les communautés ont leur onglet), la plus récemment active d'abord. */
    @Query(value = """
        select conversation from Participant participant join participant.conversation conversation
        where participant.utilisateur.id = :utilisateurId and conversation.categorie is null
        order by conversation.dernierMessageLe desc, conversation.id
        """,
        countQuery = """
        select count(participant) from Participant participant
        where participant.utilisateur.id = :utilisateurId and participant.conversation.categorie is null
        """)
    Page<Conversation> findDeParticipant(@Param("utilisateurId") UUID utilisateurId, Pageable pageable);

    /** Lettres accentuées et leur forme sans accent, une à une (pour {@code translate}, connu de PostgreSQL et de H2). */
    String AVEC_ACCENTS = "àâäáãåçéèêëíìîïñóòôöõúùûüýÿ";
    String SANS_ACCENTS = "aaaaaaceeeeiiiinooooouuuuyy";
    String FILTRE_RECHERCHE = """
        from Participant participant join participant.conversation conversation
        where participant.utilisateur.id = :utilisateurId and conversation.categorie is null
          and (cast(function('translate', lower(conversation.nom), '""" + AVEC_ACCENTS + "', '" + SANS_ACCENTS + """
        ') as String) like :motif escape '\\'
            or exists (select autre from Participant autre join autre.utilisateur personne
                       where autre.conversation = conversation and personne.id <> :utilisateurId
                         and conversation.type = ept.edu.sn.alumni_backend.messagerie.TypeConversation.DIRECTE
                         and cast(function('translate', lower(concat(coalesce(personne.prenom, ''), ' ', coalesce(personne.nom, ''))),
                           '""" + AVEC_ACCENTS + "', '" + SANS_ACCENTS + """
        ') as String) like :motif escape '\\'))
        """;

    /**
     * Mes conversations dont le nom contient le motif : nom du groupe, ou prénom et nom de l'interlocuteur d'une
     * conversation directe, sans tenir compte des majuscules ni des accents. {@code motif} est déjà en minuscules,
     * sans accents, entouré de {@code %}, avec {@code \} pour échapper.
     */
    @Query(value = "select conversation " + FILTRE_RECHERCHE + " order by conversation.dernierMessageLe desc, conversation.id",
        countQuery = "select count(conversation) " + FILTRE_RECHERCHE)
    Page<Conversation> rechercherDeParticipant(@Param("utilisateurId") UUID utilisateurId, @Param("motif") String motif,
                                               Pageable pageable);

    Optional<Conversation> findByCleCommunaute(String cleCommunaute);

    String FILTRE_COMMUNAUTES_ADMIN = """
        from Conversation conversation
        where conversation.categorie is not null
          and (:categorie is null or conversation.categorie = :categorie)
          and (:motif is null or cast(function('translate', lower(conversation.nom), '""" + AVEC_ACCENTS + "', '" + SANS_ACCENTS + """
        ') as String) like :motif escape '\\')
        """;

    /**
     * Toutes les communautés, pour l'administration, par ordre alphabétique. {@code categorie} et {@code motif}
     * ({@code null} : pas de filtre) ; le motif est déjà en minuscules, sans accents, entouré de {@code %}.
     */
    @Query(value = "select conversation " + FILTRE_COMMUNAUTES_ADMIN + " order by lower(conversation.nom), conversation.id",
        countQuery = "select count(conversation) " + FILTRE_COMMUNAUTES_ADMIN)
    Page<Conversation> rechercherCommunautes(@Param("categorie") ept.edu.sn.alumni_backend.messagerie.CategorieCommunaute categorie,
                                             @Param("motif") String motif, Pageable pageable);

    /** Une autre communauté porte-t-elle déjà ce nom (sans tenir compte des majuscules) ? {@code sauf} : celle qu'on renomme. */
    @Query("""
        select count(conversation) > 0 from Conversation conversation
        where conversation.categorie is not null and lower(conversation.nom) = lower(:nom)
          and (:sauf is null or conversation.id <> :sauf)
        """)
    boolean existeCommunauteNommee(@Param("nom") String nom, @Param("sauf") UUID sauf);

    /** Nombre de communautés de chaque catégorie, pour les filtres de l'administration. */
    @Query("""
        select conversation.categorie as categorie, count(conversation) as nombre from Conversation conversation
        where conversation.categorie is not null group by conversation.categorie
        """)
    List<NombreParCategorie> compterCommunautesParCategorie();

    interface NombreParCategorie {
        ept.edu.sn.alumni_backend.messagerie.CategorieCommunaute getCategorie();
        Long getNombre();
    }

    /** Mes communautés, la plus récemment active d'abord. */
    @Query("""
        select conversation from Participant participant join participant.conversation conversation
        where participant.utilisateur.id = :utilisateurId and conversation.categorie is not null
        order by conversation.dernierMessageLe desc, conversation.id
        """)
    List<Conversation> findCommunautesDe(@Param("utilisateurId") UUID utilisateurId);

    /** Communautés ouvertes ou sur demande dont je ne fais pas partie (les automatiques ne se rejoignent pas). */
    @Query("""
        select conversation from Conversation conversation
        where conversation.categorie is not null
          and conversation.categorie not in (ept.edu.sn.alumni_backend.messagerie.CategorieCommunaute.PROMO,
            ept.edu.sn.alumni_backend.messagerie.CategorieCommunaute.FILIERE,
            ept.edu.sn.alumni_backend.messagerie.CategorieCommunaute.PROMO_FILIERE)
          and not exists (select moi from Participant moi
                          where moi.conversation = conversation and moi.utilisateur.id = :utilisateurId)
        order by conversation.dernierMessageLe desc, conversation.id
        """)
    List<Conversation> findADecouvrir(@Param("utilisateurId") UUID utilisateurId, Limit limite);

    /**
     * Comme {@link #findADecouvrir}, parmi toutes celles dont le nom ou la description contient le motif (sans tenir
     * compte des majuscules ni des accents) ; le motif est déjà en minuscules, sans accents, entouré de {@code %}.
     */
    @Query("""
        select conversation from Conversation conversation
        where conversation.categorie is not null
          and conversation.categorie not in (ept.edu.sn.alumni_backend.messagerie.CategorieCommunaute.PROMO,
            ept.edu.sn.alumni_backend.messagerie.CategorieCommunaute.FILIERE,
            ept.edu.sn.alumni_backend.messagerie.CategorieCommunaute.PROMO_FILIERE)
          and not exists (select moi from Participant moi
                          where moi.conversation = conversation and moi.utilisateur.id = :utilisateurId)
          and (cast(function('translate', lower(conversation.nom), '""" + AVEC_ACCENTS + "', '" + SANS_ACCENTS + """
        ') as String) like :motif escape '\\'
            or cast(function('translate', lower(coalesce(conversation.description, '')), '""" + AVEC_ACCENTS + "', '" + SANS_ACCENTS + """
        ') as String) like :motif escape '\\')
        order by conversation.dernierMessageLe desc, conversation.id
        """)
    List<Conversation> rechercherADecouvrir(@Param("utilisateurId") UUID utilisateurId, @Param("motif") String motif,
                                            Limit limite);

    /** Communautés automatiques d'une personne : quand son profil change, elle quitte celles qui ne la concernent plus. */
    @Query("""
        select conversation from Participant participant join participant.conversation conversation
        where participant.utilisateur.id = :utilisateurId
          and conversation.categorie in (ept.edu.sn.alumni_backend.messagerie.CategorieCommunaute.PROMO,
            ept.edu.sn.alumni_backend.messagerie.CategorieCommunaute.FILIERE,
            ept.edu.sn.alumni_backend.messagerie.CategorieCommunaute.PROMO_FILIERE)
        """)
    List<Conversation> findCommunautesAutomatiquesDe(@Param("utilisateurId") UUID utilisateurId);

    /** Verrou de la conversation pendant un changement de membres : un groupe garde toujours un administrateur. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select conversation from Conversation conversation where conversation.id = :id")
    Optional<Conversation> findByIdForUpdate(@Param("id") UUID id);
}

package ept.edu.sn.alumni_backend.messagerie.service;

import java.text.Normalizer;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.messagerie.AccesCommunaute;
import ept.edu.sn.alumni_backend.messagerie.CategorieCommunaute;
import ept.edu.sn.alumni_backend.messagerie.RoleParticipant;
import ept.edu.sn.alumni_backend.messagerie.dto.CommunauteResponse;
import ept.edu.sn.alumni_backend.messagerie.dto.CommunautesResponse;
import ept.edu.sn.alumni_backend.messagerie.dto.ConversationDetailResponse;
import ept.edu.sn.alumni_backend.messagerie.entity.Conversation;
import ept.edu.sn.alumni_backend.messagerie.entity.Participant;
import ept.edu.sn.alumni_backend.messagerie.exception.ConflitMessagerieException;
import ept.edu.sn.alumni_backend.messagerie.exception.MessagerieIntrouvableException;
import ept.edu.sn.alumni_backend.messagerie.repository.ConversationRepository;
import ept.edu.sn.alumni_backend.messagerie.repository.MessageRepository;
import ept.edu.sn.alumni_backend.messagerie.repository.ParticipantRepository;
import ept.edu.sn.alumni_backend.messagerie.tempsreel.EvenementMessagerie;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

/**
 * Communautés : des groupes ouverts à tout un public. Celles de la promo, de la filière et des deux croisées sont
 * automatiques : chaque alumni ou étudiant y entre d'après son profil, et en sort si son profil change. Les autres
 * (ville, secteur, intérêt) sont créées par un administrateur de la plateforme et se rejoignent librement.
 */
@Service
public class CommunauteService {
    private static final int NOMBRE_MAX_A_DECOUVRIR = 30;
    private static final Set<TypeRole> ROLES_AVEC_PROMO = AccesConversation.ROLES_COMMUNAUTES;

    private final ConversationRepository conversations;
    private final ParticipantRepository participants;
    private final MessageRepository messages;
    private final UtilisateurRepository utilisateurs;
    private final ConversationService conversationService;
    private final ApplicationEventPublisher evenements;
    private final TransactionTemplate nouvelleTransaction;

    public CommunauteService(ConversationRepository conversations, ParticipantRepository participants,
                             MessageRepository messages, UtilisateurRepository utilisateurs,
                             ConversationService conversationService, ApplicationEventPublisher evenements,
                             PlatformTransactionManager gestionnaire) {
        this.conversations = conversations;
        this.participants = participants;
        this.messages = messages;
        this.utilisateurs = utilisateurs;
        this.conversationService = conversationService;
        this.evenements = evenements;
        this.nouvelleTransaction = new TransactionTemplate(gestionnaire);
        this.nouvelleTransaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    /** Une communauté automatique attendue d'après un profil. */
    record Cible(String cle, String nom, String description, CategorieCommunaute categorie) {}

    /** L'onglet « Communautés » ; mes communautés automatiques sont d'abord mises à jour d'après mon profil. */
    @Transactional
    public CommunautesResponse lister(UUID moi) {
        Utilisateur utilisateur = utilisateurs.findById(moi)
            .orElseThrow(() -> new MessagerieIntrouvableException("Ce membre est introuvable."));
        // Personnel, visiteurs, organismes, administrateurs : pas de communautés.
        if (!ROLES_AVEC_PROMO.contains(utilisateur.getRole())) return new CommunautesResponse(List.of(), List.of());
        synchroniser(utilisateur, true);
        participants.flush();

        List<Conversation> aDecouvrir = new ArrayList<>(automatiquesQuittees(utilisateur));
        aDecouvrir.addAll(conversations.findADecouvrir(moi, Limit.of(NOMBRE_MAX_A_DECOUVRIR)));
        return new CommunautesResponse(conversationService.versLignes(conversations.findCommunautesDe(moi), moi),
            versDecouvertes(aDecouvrir, utilisateur));
    }

    /**
     * Recherche parmi toutes les communautés que je peux rejoindre, et pas seulement les premières que montre
     * « À découvrir » : nom ou description, sans tenir compte des majuscules ni des accents. Simple lecture.
     */
    @Transactional(readOnly = true)
    public List<CommunauteResponse> rechercherADecouvrir(UUID moi, String recherche) {
        Utilisateur utilisateur = utilisateurs.findById(moi)
            .orElseThrow(() -> new MessagerieIntrouvableException("Ce membre est introuvable."));
        if (!ROLES_AVEC_PROMO.contains(utilisateur.getRole()) || recherche == null || recherche.isBlank()) return List.of();
        String motif = ConversationService.motifRecherche(recherche);
        String terme = normaliser(recherche.trim());

        List<Conversation> trouvees = new ArrayList<>(automatiquesQuittees(utilisateur).stream()
            .filter(c -> normaliser(c.getNom() + " " + (c.getDescription() == null ? "" : c.getDescription())).contains(terme))
            .toList());
        trouvees.addAll(conversations.rechercherADecouvrir(moi, motif, Limit.of(NOMBRE_MAX_A_DECOUVRIR)));
        return versDecouvertes(trouvees, utilisateur);
    }

    /** Cartes « À découvrir » : nombre de membres, et combien sont de ma promo, en deux requêtes groupées. */
    private List<CommunauteResponse> versDecouvertes(List<Conversation> communautes, Utilisateur utilisateur) {
        List<UUID> ids = communautes.stream().map(Conversation::getId).toList();
        Map<UUID, Long> membres = ids.isEmpty() ? Map.of() : enTable(participants.compterParConversation(ids));
        Map<UUID, Long> deMaPromo = ids.isEmpty() || utilisateur.getAnneeSortie() == null ? Map.of()
            : enTable(participants.compterDeLaPromoParConversation(ids, utilisateur.getAnneeSortie()));
        return communautes.stream().map(c -> new CommunauteResponse(c.getId(), c.getNom(), c.getDescription(), c.getUrlPhoto(),
            c.getCategorie(), c.getAcces(), membres.getOrDefault(c.getId(), 0L), deMaPromo.getOrDefault(c.getId(), 0L)))
            .toList();
    }

    /**
     * Rejoindre une communauté ouverte, ou revenir dans une communauté de mon profil que j'avais quittée ;
     * sans effet si j'en fais déjà partie.
     */
    @Transactional
    public ConversationDetailResponse rejoindre(UUID conversationId, UUID moi) {
        Conversation communaute = conversations.findByIdForUpdate(conversationId)
            .filter(Conversation::estCommunaute)
            .orElseThrow(() -> new MessagerieIntrouvableException("Cette communauté est introuvable."));
        if (participants.existsByConversationIdAndUtilisateurId(conversationId, moi)) {
            return conversationService.detail(communaute, moi);
        }
        Utilisateur utilisateur = utilisateurs.findById(moi)
            .filter(AccesConversation::estJoignable)
            .orElseThrow(() -> new MessagerieIntrouvableException("Ce membre est introuvable."));
        if (!ROLES_AVEC_PROMO.contains(utilisateur.getRole())) {
            throw new SecurityException(AccesConversation.COMMUNAUTES_RESERVEES);
        }
        if (communaute.estCommunauteAutomatique()) {
            boolean deMonProfil = ROLES_AVEC_PROMO.contains(utilisateur.getRole())
                && cibles(utilisateur.getAnneeSortie(), utilisateur.getNomFiliere()).containsKey(communaute.getCleCommunaute());
            if (!deMonProfil) {
                throw new ConflitMessagerieException("Cette communauté est réservée à sa promo et à sa filière.");
            }
        } else if (communaute.getAcces() != AccesCommunaute.OUVERTE) {
            throw new ConflitMessagerieException("Cette communauté n'accepte pas encore de demandes d'adhésion.");
        }
        accueillir(communaute, utilisateur, true);
        return conversationService.detail(communaute, moi);
    }


    /**
     * Range une personne dans les communautés de sa promo et de sa filière, et la retire de celles qui ne la concernent
     * plus (profil modifié). {@code annoncer} : un message « … a rejoint la communauté » salue chaque arrivée.
     */
    @Transactional
    public void synchroniser(Utilisateur utilisateur, boolean annoncer) {
        Map<String, Cible> cibles = AccesConversation.estJoignable(utilisateur) && ROLES_AVEC_PROMO.contains(utilisateur.getRole())
            ? cibles(utilisateur.getAnneeSortie(), utilisateur.getNomFiliere()) : Map.of();

        for (Conversation actuelle : conversations.findCommunautesAutomatiquesDe(utilisateur.getId())) {
            if (cibles.containsKey(actuelle.getCleCommunaute())) continue;
            participants.findByConversationIdAndUtilisateurId(actuelle.getId(), utilisateur.getId())
                .ifPresent(participants::delete);
        }
        for (Cible cible : cibles.values()) {
            UUID id = idDeLaCommunaute(cible);
            if (participants.existsByConversationIdAndUtilisateurId(id, utilisateur.getId())) continue;
            Conversation communaute = conversations.findByIdForUpdate(id).orElseThrow();
            // Revérifié sous le verrou : deux onglets ouverts au même moment ne m'ajoutent pas deux fois.
            if (participants.existsByConversationIdAndUtilisateurId(id, utilisateur.getId())) continue;
            // Partie d'elle-même : on ne la remet pas d'office ; elle peut revenir depuis « À découvrir ».
            if (!aQuitte(id, utilisateur.getId())) {
                accueillir(communaute, utilisateur, annoncer);
            }
        }
    }

    /** Vrai si le dernier message du système de cette personne dans la communauté est son départ. */
    private boolean aQuitte(UUID conversationId, UUID utilisateurId) {
        return messages.findFirstByConversationIdAndAuteurIdAndSystemeTrueOrderByEnvoyeLeDesc(conversationId, utilisateurId)
            .map(dernier -> MessagesSysteme.DEPART.equals(dernier.getContenu()))
            .orElse(false);
    }

    /** Communautés automatiques de mon profil que j'ai quittées : proposées en tête de « À découvrir ». */
    private List<Conversation> automatiquesQuittees(Utilisateur utilisateur) {
        if (!ROLES_AVEC_PROMO.contains(utilisateur.getRole())) return List.of();
        return cibles(utilisateur.getAnneeSortie(), utilisateur.getNomFiliere()).keySet().stream()
            .map(conversations::findByCleCommunaute)
            .flatMap(Optional::stream)
            .filter(c -> !participants.existsByConversationIdAndUtilisateurId(c.getId(), utilisateur.getId()))
            .toList();
    }

    /** Toutes les personnes, sans message d'arrivée : sert au démarrage, pour les comptes existants. */
    public int synchroniserTous() {
        List<UUID> ids = nouvelleTransaction.execute(statut -> utilisateurs.findAll().stream()
            .filter(u -> ROLES_AVEC_PROMO.contains(u.getRole())).map(Utilisateur::getId).toList());
        for (UUID id : ids) {
            nouvelleTransaction.executeWithoutResult(statut -> utilisateurs.findById(id).ifPresent(u -> synchroniser(u, false)));
        }
        return ids.size();
    }

    /** Promo, filière, et les deux croisées ; seulement celles que le profil permet de déduire. */
    static Map<String, Cible> cibles(Integer anneeSortie, String filiere) {
        Map<String, Cible> cibles = new LinkedHashMap<>();
        String nomFiliere = filiere == null || filiere.isBlank() ? null : filiere.trim().replaceAll("\\s+", " ");
        if (anneeSortie != null) {
            cibles.put("PROMO:" + anneeSortie, new Cible("PROMO:" + anneeSortie, "Promo " + anneeSortie,
                "Tous les membres EPT de la promo " + anneeSortie + ".", CategorieCommunaute.PROMO));
        }
        if (nomFiliere != null) {
            String cle = "FILIERE:" + normaliser(nomFiliere);
            cibles.put(cle, new Cible(cle, tronquer(nomFiliere),
                "Les membres de la filière " + nomFiliere + ", toutes promos confondues.", CategorieCommunaute.FILIERE));
        }
        if (anneeSortie != null && nomFiliere != null) {
            String cle = "PROMO_FILIERE:" + anneeSortie + ":" + normaliser(nomFiliere);
            cibles.put(cle, new Cible(cle, tronquer(nomFiliere + " · Promo " + anneeSortie),
                "Les membres de la filière " + nomFiliere + " de la promo " + anneeSortie + ".",
                CategorieCommunaute.PROMO_FILIERE));
        }
        return cibles;
    }

    /**
     * Identifiant de la communauté, créée au besoin dans sa propre transaction. Si deux membres la créent au même
     * instant, la contrainte unique refuse la seconde : on relit alors la première.
     */
    private UUID idDeLaCommunaute(Cible cible) {
        UUID existante = conversations.findByCleCommunaute(cible.cle()).map(Conversation::getId).orElse(null);
        if (existante != null) return existante;
        try {
            return nouvelleTransaction.execute(statut -> {
                Conversation communaute = Conversation.communaute(cible.nom(), cible.categorie(), AccesCommunaute.OUVERTE,
                    cible.cle());
                communaute.setDescription(cible.description());
                return conversations.saveAndFlush(communaute).getId();
            });
        } catch (DataIntegrityViolationException doublon) {
            return conversations.findByCleCommunaute(cible.cle()).map(Conversation::getId).orElseThrow(() -> doublon);
        }
    }

    /**
     * Ajoute un membre. Son historique n'est pas compté comme non lu (des centaines de messages d'un coup) ; s'il est
     * annoncé, le message d'arrivée prévient les membres en temps réel sans leur ajouter de pastille.
     */
    private void accueillir(Conversation communaute, Utilisateur utilisateur, boolean annoncer) {
        Participant participant = Participant.de(communaute, utilisateur, RoleParticipant.MEMBRE);
        participant.setDernierLuLe(Instant.now());
        participants.save(participant);
        if (!annoncer) return;
        messages.save(MessagesSysteme.creer(communaute, utilisateur, MessagesSysteme.ARRIVEE));
        participants.flush();
        Set<UUID> membres = participants.findUtilisateurIds(communaute.getId());
        evenements.publishEvent(new EvenementMessagerie(membres, EvenementMessagerie.Type.MESSAGE, communaute.getId()));
        // La liste des membres a changé : les fils ouverts relisent la communauté (nombre de membres, infos).
        evenements.publishEvent(new EvenementMessagerie(membres, EvenementMessagerie.Type.CONVERSATION, communaute.getId()));
    }

    /** Clé sans accents ni majuscules : « Génie Civil » et « genie civil » désignent la même filière. */
    private static String normaliser(String texte) {
        return Normalizer.normalize(texte.toLowerCase(Locale.ROOT), Normalizer.Form.NFD).replaceAll("\\p{M}", "");
    }

    private static String tronquer(String nom) {
        return nom.length() <= Conversation.LONGUEUR_MAX_NOM ? nom : nom.substring(0, Conversation.LONGUEUR_MAX_NOM - 1) + "…";
    }

    private static Map<UUID, Long> enTable(List<MessageRepository.NombreParConversation> nombres) {
        return nombres.stream().collect(Collectors.toMap(MessageRepository.NombreParConversation::getConversationId,
            MessageRepository.NombreParConversation::getNombre));
    }
}

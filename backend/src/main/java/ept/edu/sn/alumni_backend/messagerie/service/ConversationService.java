package ept.edu.sn.alumni_backend.messagerie.service;

import java.text.Normalizer;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;

import ept.edu.sn.alumni_backend.annuaire.dto.PageResponse;
import ept.edu.sn.alumni_backend.messagerie.EtatEcriture;
import ept.edu.sn.alumni_backend.messagerie.RoleParticipant;
import ept.edu.sn.alumni_backend.messagerie.TypeConversation;
import ept.edu.sn.alumni_backend.messagerie.dto.ConversationDetailResponse;
import ept.edu.sn.alumni_backend.messagerie.dto.ConversationResponse;
import ept.edu.sn.alumni_backend.messagerie.dto.GroupeRequest;
import ept.edu.sn.alumni_backend.messagerie.dto.MembreConversationResponse;
import ept.edu.sn.alumni_backend.messagerie.dto.ModificationGroupeRequest;
import ept.edu.sn.alumni_backend.messagerie.entity.Conversation;
import ept.edu.sn.alumni_backend.messagerie.entity.Message;
import ept.edu.sn.alumni_backend.messagerie.entity.Participant;
import ept.edu.sn.alumni_backend.messagerie.exception.ConflitMessagerieException;
import ept.edu.sn.alumni_backend.messagerie.exception.MessagerieIntrouvableException;
import ept.edu.sn.alumni_backend.messagerie.repository.BlocageRepository;
import ept.edu.sn.alumni_backend.messagerie.repository.ConversationRepository;
import ept.edu.sn.alumni_backend.messagerie.repository.MessageRepository;
import ept.edu.sn.alumni_backend.messagerie.repository.ParticipantRepository;
import ept.edu.sn.alumni_backend.messagerie.tempsreel.EvenementMessagerie;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import ept.edu.sn.alumni_backend.utilisateur.photo.StockagePhotoProfil;

/** Conversations : liste, ouverture d'une conversation directe, groupes et leurs membres. */
@Service
public class ConversationService {
    private final ConversationRepository conversations;
    private final ParticipantRepository participants;
    private final MessageRepository messages;
    private final UtilisateurRepository utilisateurs;
    private final AccesConversation acces;
    private final MessagerieMapper mapper;
    private final TransactionTemplate transaction;
    private final ApplicationEventPublisher evenements;
    private final BlocageRepository blocages;
    private final StockagePhotoProfil stockagePhoto;
    private final StockagePieceJointe stockagePieceJointe;

    public ConversationService(ConversationRepository conversations, ParticipantRepository participants,
                               MessageRepository messages, UtilisateurRepository utilisateurs, AccesConversation acces,
                               MessagerieMapper mapper, PlatformTransactionManager gestionnaire,
                               ApplicationEventPublisher evenements, BlocageRepository blocages,
                               StockagePhotoProfil stockagePhoto, StockagePieceJointe stockagePieceJointe) {
        this.conversations = conversations;
        this.participants = participants;
        this.messages = messages;
        this.utilisateurs = utilisateurs;
        this.acces = acces;
        this.mapper = mapper;
        this.transaction = new TransactionTemplate(gestionnaire);
        this.evenements = evenements;
        this.blocages = blocages;
        this.stockagePhoto = stockagePhoto;
        this.stockagePieceJointe = stockagePieceJointe;
    }

    /** Résultat de l'ouverture d'une conversation directe : {@code creee} décide entre 201 et 200. */
    public record Ouverture(ConversationResponse conversation, boolean creee) {}

    @Transactional(readOnly = true)
    public PageResponse<ConversationResponse> lister(UUID moi, int page, int taille, String recherche) {
        PageRequest pagination = PageRequest.of(page, taille);
        Page<Conversation> resultat = recherche == null || recherche.isBlank()
            ? conversations.findDeParticipant(moi, pagination)
            : conversations.rechercherDeParticipant(moi, motifRecherche(recherche), pagination);
        Map<UUID, ConversationResponse> lignes = versLignes(resultat.getContent(), moi).stream()
            .collect(Collectors.toMap(ConversationResponse::id, Function.identity()));
        return PageResponse.depuis(resultat.map(conversation -> lignes.get(conversation.getId())));
    }

    /** Lignes de liste d'un lot de conversations, en quelques requêtes groupées (jamais une par conversation). */
    List<ConversationResponse> versLignes(List<Conversation> lot, UUID moi) {
        List<UUID> ids = lot.stream().map(Conversation::getId).toList();
        if (ids.isEmpty()) return List.of();

        Map<UUID, List<Participant>> membres = participants.findByConversationIdInOrderByRejointLeAsc(ids).stream()
            .collect(Collectors.groupingBy(p -> p.getConversation().getId()));
        Map<UUID, Message> derniers = messages.findDerniersMessages(ids).stream()
            .collect(Collectors.toMap(m -> m.getConversation().getId(), Function.identity(),
                (a, b) -> a.getId().compareTo(b.getId()) > 0 ? a : b));
        Map<UUID, Long> nonLus = messages.compterNonLusParConversation(moi, ids).stream()
            .collect(Collectors.toMap(MessageRepository.NombreParConversation::getConversationId,
                MessageRepository.NombreParConversation::getNombre));
        List<BlocageRepository.Paire> paires = blocages.findPairesImpliquant(moi);

        return lot.stream().map(conversation -> versLigne(conversation, moi,
            membres.getOrDefault(conversation.getId(), List.of()), derniers.get(conversation.getId()),
            nonLus.getOrDefault(conversation.getId(), 0L), paires)).toList();
    }

    /**
     * Motif sans accents ni majuscules (« verif » trouve « Vérification ») ; « % » et « _ » tapés par l'utilisateur
     * se cherchent tels quels, sans jouer le rôle de jokers.
     */
    static String motifRecherche(String recherche) {
        String sansAccents = Normalizer.normalize(recherche.trim().toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "");
        String echappee = sansAccents.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
        return "%" + echappee + "%";
    }

    /**
     * Même règle que {@link #ouvrirDirecte}, le destinataire étant le compte qui représente l'organisme.
     */
    public Ouverture ouvrirAvecOrganisme(UUID moi, UUID organismeId) {
        UUID contact = transaction.execute(statut -> utilisateurs.findFirstByOrganismeIdOrderByDateCreationAsc(organismeId)
            .map(Utilisateur::getId).orElse(null));
        if (contact == null) {
            throw new MessagerieIntrouvableException("Cet organisme ne peut pas être contacté pour l'instant.");
        }
        return ouvrirDirecte(moi, contact);
    }

    /**
     * Ouvre la conversation directe avec un membre, ou renvoie celle qui existe. Si les deux personnes l'ouvrent au
     * même instant, la contrainte unique de la base refuse la seconde création : on relit alors celle de l'autre.
     */
    public Ouverture ouvrirDirecte(UUID moi, UUID destinataireId) {
        if (moi.equals(destinataireId)) {
            throw new IllegalArgumentException("Vous ne pouvez pas vous écrire à vous-même.");
        }
        String cle = Conversation.cleDirecte(moi, destinataireId);
        Ouverture existante = transaction.execute(statut -> {
            Ouverture trouvee = conversations.findByCleDirecte(cle).map(c -> new Ouverture(ligne(c, moi), false)).orElse(null);
            // Une conversation existante se relit toujours (fermée si l'autre est suspendu ou a bloqué) ;
            // une nouvelle ne s'ouvre ni avec un compte suspendu, ni à travers un blocage.
            if (trouvee == null) acces.chargerJoignable(destinataireId);
            if (trouvee == null && blocages.existsByBloqueurIdAndBloqueId(moi, destinataireId)) {
                throw new ConflitMessagerieException(AccesConversation.J_AI_BLOQUE);
            }
            if (trouvee == null && blocages.existsByBloqueurIdAndBloqueId(destinataireId, moi)) {
                throw new MessagerieIntrouvableException("Ce membre est introuvable.");
            }
            return trouvee;
        });
        if (existante != null) return existante;
        try {
            return transaction.execute(statut -> {
                Conversation conversation = conversations.saveAndFlush(Conversation.directe(moi, destinataireId));
                participants.save(Participant.de(conversation, utilisateurs.getReferenceById(moi), RoleParticipant.MEMBRE));
                participants.save(Participant.de(conversation, acces.chargerJoignable(destinataireId), RoleParticipant.MEMBRE));
                participants.flush();
                signaler(conversation.getId(), Set.of(moi, destinataireId));
                return new Ouverture(ligne(conversation, moi), true);
            });
        } catch (DataIntegrityViolationException doublon) {
            return transaction.execute(statut -> conversations.findByCleDirecte(cle)
                .map(c -> new Ouverture(ligne(c, moi), false))
                .orElseThrow(() -> doublon));
        }
    }

    @Transactional
    public ConversationDetailResponse creerGroupe(UUID moi, GroupeRequest requete) {
        Set<UUID> membreIds = new LinkedHashSet<>(requete.membreIds() == null ? Set.of() : requete.membreIds());
        membreIds.remove(moi);
        List<Utilisateur> membres = membreIds.stream().map(acces::chargerJoignable).toList();

        Conversation groupe = Conversation.groupe(requete.nom().trim());
        groupe.setDescription(descriptionNettoyee(requete.description()));
        groupe = conversations.save(groupe);
        participants.save(Participant.de(groupe, utilisateurs.getReferenceById(moi), RoleParticipant.ADMINISTRATEUR));
        for (Utilisateur membre : membres) participants.save(Participant.de(groupe, membre, RoleParticipant.MEMBRE));
        participants.flush();
        signaler(groupe.getId());
        return detail(groupe, moi);
    }

    @Transactional(readOnly = true)
    public ConversationDetailResponse obtenir(UUID conversationId, UUID moi) {
        return detail(acces.chargerParticipant(conversationId, moi).getConversation(), moi);
    }

    /** Nom et description du groupe ; un champ absent reste tel quel. */
    @Transactional
    public ConversationDetailResponse modifier(UUID conversationId, UUID moi, ModificationGroupeRequest requete) {
        Conversation conversation = groupeAdministre(conversationId, moi, "Seul un administrateur du groupe peut le modifier.");
        exigerHorsCommunaute(conversation, "Le nom et la description d'une communauté se modifient dans l'administration.");
        if (requete.nom() == null && requete.description() == null) {
            throw new IllegalArgumentException("Indiquez le nom ou la description à modifier.");
        }
        if (requete.nom() != null) conversation.setNom(requete.nom().trim());
        if (requete.description() != null) conversation.setDescription(descriptionNettoyee(requete.description()));
        signaler(conversationId);
        return detail(conversation, moi);
    }

    /** La photo est recadrée en carré de 600 px, comme une photo de profil ; l'ancienne quitte le disque après l'enregistrement. */
    @Transactional
    public ConversationDetailResponse changerPhoto(UUID conversationId, UUID moi, MultipartFile photo) {
        Conversation conversation = groupeAdministre(conversationId, moi, "Seul un administrateur du groupe peut changer sa photo.");
        String ancienne = conversation.getUrlPhoto();
        String nouvelle = stockagePhoto.stocker(photo);
        ApresTransaction.siAnnulee(() -> stockagePhoto.supprimerSiGeree(nouvelle));
        ApresTransaction.siValidee(() -> stockagePhoto.supprimerSiGeree(ancienne));
        conversation.setUrlPhoto(nouvelle);
        signaler(conversationId);
        return detail(conversation, moi);
    }

    @Transactional
    public ConversationDetailResponse retirerPhoto(UUID conversationId, UUID moi) {
        Conversation conversation = groupeAdministre(conversationId, moi, "Seul un administrateur du groupe peut retirer sa photo.");
        String ancienne = conversation.getUrlPhoto();
        if (ancienne != null) {
            conversation.setUrlPhoto(null);
            ApresTransaction.siValidee(() -> stockagePhoto.supprimerSiGeree(ancienne));
            signaler(conversationId);
        }
        return detail(conversation, moi);
    }

    /** Nomme un membre administrateur ou lui retire ce rôle ; le groupe garde toujours au moins un administrateur. */
    @Transactional
    public ConversationDetailResponse changerRole(UUID conversationId, UUID moi, UUID utilisateurId, RoleParticipant role) {
        exigerHorsCommunaute(groupeAdministre(conversationId, moi, "Seul un administrateur du groupe peut changer les rôles."),
            "Les administrateurs d'une communauté sont désignés par l'administration de la plateforme.");
        Conversation groupe = verrouiller(conversationId);
        Participant cible = participants.findByConversationIdAndUtilisateurId(conversationId, utilisateurId)
            .orElseThrow(() -> new MessagerieIntrouvableException("Ce membre ne fait pas partie du groupe."));
        if (cible.getRole() == role) return detail(groupe, moi);
        if (role == RoleParticipant.MEMBRE
                && participants.countByConversationIdAndRole(conversationId, RoleParticipant.ADMINISTRATEUR) <= 1) {
            throw new ConflitMessagerieException("Le groupe garde au moins un administrateur : nommez-en un autre d'abord.");
        }
        cible.setRole(role);
        participants.flush();
        signaler(conversationId);
        return detail(groupe, moi);
    }

    /**
     * Supprime le groupe pour tout le monde, avec ses messages ; les fichiers joints et la photo quittent le disque
     * une fois la suppression enregistrée. Les participants sont prévenus en temps réel avant de perdre l'accès.
     */
    @Transactional
    public void supprimerGroupe(UUID conversationId, UUID moi) {
        exigerHorsCommunaute(groupeAdministre(conversationId, moi, "Seul un administrateur du groupe peut le supprimer."),
            "Une communauté ne se supprime pas depuis la messagerie.");
        Conversation groupe = verrouiller(conversationId);
        Set<UUID> aPrevenir = participants.findUtilisateurIds(conversationId);
        List<String> fichiers = messages.findFichiersJoints(conversationId);
        String photo = groupe.getUrlPhoto();

        messages.supprimerDeConversation(conversationId);
        participants.supprimerDeConversation(conversationId);
        conversations.deleteById(conversationId);
        conversations.flush();

        ApresTransaction.siValidee(() -> {
            fichiers.forEach(stockagePieceJointe::supprimer);
            stockagePhoto.supprimerSiGeree(photo);
        });
        signaler(conversationId, aPrevenir);
    }

    @Transactional
    public ConversationDetailResponse ajouterParticipants(UUID conversationId, UUID moi, Set<UUID> membreIds) {
        Participant participant = acces.chargerParticipant(conversationId, moi);
        acces.exigerGroupe(participant.getConversation(), "Une conversation directe réunit deux personnes seulement.");
        acces.exigerAdministrateur(participant, "Seul un administrateur du groupe peut ajouter des membres.");
        // On entre dans une communauté en la rejoignant soi-même, selon son mode d'accès, jamais ajouté par un membre.
        exigerHorsCommunaute(participant.getConversation(), "On rejoint une communauté soi-même, depuis « À découvrir ».");
        Conversation groupe = verrouiller(conversationId);

        for (UUID membreId : membreIds) {
            if (participants.existsByConversationIdAndUtilisateurId(conversationId, membreId)) continue;
            Utilisateur membre = acces.chargerJoignable(membreId);
            participants.save(Participant.de(groupe, membre, RoleParticipant.MEMBRE));
        }
        participants.flush();
        signaler(conversationId);
        return detail(groupe, moi);
    }

    /** Retire un membre (administrateur) ou quitte le groupe (soi-même). Le groupe garde toujours un administrateur. */
    @Transactional
    public void retirerParticipant(UUID conversationId, UUID moi, UUID utilisateurId) {
        Participant demandeur = acces.chargerParticipant(conversationId, moi);
        Conversation conversation = demandeur.getConversation();
        acces.exigerGroupe(conversation, "On ne quitte pas une conversation directe.");
        boolean depart = utilisateurId.equals(moi);
        // Une communauté de promo ou de filière n'a pas d'administrateur : chacun peut seulement en partir.
        if (!depart && conversation.estCommunauteAutomatique()) {
            throw new SecurityException("Personne ne retire un membre d'une communauté de promo ou de filière.");
        }
        if (!depart) {
            acces.exigerAdministrateur(demandeur, "Seul un administrateur du groupe peut retirer un membre.");
        }
        verrouiller(conversationId);
        Participant retire = participants.findByConversationIdAndUtilisateurId(conversationId, utilisateurId)
            .orElseThrow(() -> new MessagerieIntrouvableException("Ce membre ne fait pas partie du groupe."));
        Set<UUID> aPrevenir = participants.findUtilisateurIds(conversationId);
        participants.delete(retire);
        if (depart && conversation.estCommunaute()) {
            // Le départ s'affiche dans le fil, et sert de trace : la synchronisation ne remettra pas ce membre.
            messages.save(MessagesSysteme.creer(conversation, retire.getUtilisateur(), MessagesSysteme.DEPART));
            evenements.publishEvent(new EvenementMessagerie(aPrevenir, EvenementMessagerie.Type.MESSAGE, conversationId));
        }
        participants.flush();
        signaler(conversationId, aPrevenir);

        // Un groupe garde toujours un administrateur. Une communauté, non : elle relève de l'administration de la
        // plateforme, et un départ ne doit pas faire d'un membre son administrateur.
        if (!conversation.estCommunaute()
            && participants.countByConversationIdAndRole(conversationId, RoleParticipant.ADMINISTRATEUR) == 0) {
            participants.findByConversationIdOrderByRejointLeAsc(conversationId).stream().findFirst()
                .ifPresent(plusAncien -> plusAncien.setRole(RoleParticipant.ADMINISTRATEUR));
        }
    }

    /** Nom, membres ou rôles ont changé : chaque participant recharge le détail et sa liste. */
    private void signaler(UUID conversationId) {
        signaler(conversationId, participants.findUtilisateurIds(conversationId));
    }

    private void signaler(UUID conversationId, Set<UUID> destinataires) {
        evenements.publishEvent(new EvenementMessagerie(destinataires, EvenementMessagerie.Type.CONVERSATION, conversationId));
    }

    private Conversation groupeAdministre(UUID conversationId, UUID moi, String messageRefus) {
        Participant participant = acces.chargerParticipant(conversationId, moi);
        acces.exigerGroupe(participant.getConversation(), "Une conversation directe ne se modifie pas.");
        acces.exigerAdministrateur(participant, messageRefus);
        return participant.getConversation();
    }

    /** Nom unique, fin de vie : une communauté relève de l'administration de la plateforme, pas de ses membres. */
    private static void exigerHorsCommunaute(Conversation conversation, String messageRefus) {
        if (conversation.estCommunaute()) throw new SecurityException(messageRefus);
    }

    static String descriptionNettoyee(String description) {
        if (description == null) return null;
        String texte = description.strip();
        return texte.isEmpty() ? null : texte;
    }

    /** État d'écriture de mes conversations directes, d'après les blocages où j'apparais. */
    /** Même règle qu'{@link AccesConversation#exigerEcriture}, calculée sur des données déjà chargées. */
    private EtatEcriture ecriture(Conversation conversation, UUID moi, List<Participant> membres,
                                  List<BlocageRepository.Paire> paires) {
        if (conversation.getType() != TypeConversation.DIRECTE) return EtatEcriture.OUVERTE;
        UUID autre = conversation.interlocuteurDe(moi);
        if (paires.stream().anyMatch(p -> p.getBloqueurId().equals(moi) && p.getBloqueId().equals(autre))) {
            return EtatEcriture.J_AI_BLOQUE;
        }
        if (paires.stream().anyMatch(p -> p.getBloqueurId().equals(autre) && p.getBloqueId().equals(moi))) {
            return EtatEcriture.FERMEE;
        }
        boolean joignable = membres.stream().map(Participant::getUtilisateur)
            .filter(utilisateur -> utilisateur.getId().equals(autre))
            .anyMatch(AccesConversation::estJoignable);
        return joignable ? EtatEcriture.OUVERTE : EtatEcriture.FERMEE;
    }

    private Conversation verrouiller(UUID conversationId) {
        return conversations.findByIdForUpdate(conversationId)
            .orElseThrow(() -> new MessagerieIntrouvableException(AccesConversation.CONVERSATION_INTROUVABLE));
    }

    ConversationResponse ligne(Conversation conversation, UUID moi) {
        UUID id = conversation.getId();
        List<Participant> membres = participants.findByConversationIdOrderByRejointLeAsc(id);
        Message dernier = messages.findDerniersMessages(List.of(id)).stream()
            .max(Comparator.comparing(Message::getId)).orElse(null);
        long nonLus = messages.compterNonLusParConversation(moi, List.of(id)).stream()
            .mapToLong(MessageRepository.NombreParConversation::getNombre).sum();
        return versLigne(conversation, moi, membres, dernier, nonLus, blocages.findPairesImpliquant(moi));
    }

    private ConversationResponse versLigne(Conversation conversation, UUID moi, List<Participant> membres,
                                           Message dernier, long nonLus, List<BlocageRepository.Paire> paires) {
        Participant interlocuteur = conversation.getType() == TypeConversation.DIRECTE
            ? membres.stream().filter(p -> !p.getUtilisateur().getId().equals(moi)).findFirst().orElse(null)
            : null;
        RoleParticipant monRole = membres.stream().filter(p -> p.getUtilisateur().getId().equals(moi))
            .map(Participant::getRole).findFirst().orElse(RoleParticipant.MEMBRE);
        MembreConversationResponse autre = interlocuteur == null ? null : mapper.versMembre(interlocuteur);
        String nom = conversation.getType() == TypeConversation.GROUPE
            ? conversation.getNom()
            : (autre == null ? "Conversation" : autre.nomAffiche());
        return new ConversationResponse(conversation.getId(), conversation.getType(), nom, autre, conversation.getUrlPhoto(),
            membres.size(), monRole, ecriture(conversation, moi, membres, paires),
            dernier == null ? null : mapper.versApercu(dernier), nonLus, conversation.getDernierMessageLe(),
            conversation.getCategorie());
    }

    ConversationDetailResponse detail(Conversation conversation, UUID moi) {
        List<Participant> membres = participants.findByConversationIdOrderByRejointLeAsc(conversation.getId());
        List<MembreConversationResponse> liste = membres.stream().map(mapper::versMembre).toList();
        RoleParticipant monRole = membres.stream().filter(p -> p.getUtilisateur().getId().equals(moi))
            .map(Participant::getRole).findFirst().orElseThrow(
                () -> new MessagerieIntrouvableException(AccesConversation.CONVERSATION_INTROUVABLE));
        String nom = conversation.getType() == TypeConversation.GROUPE
            ? conversation.getNom()
            : liste.stream().filter(m -> !m.id().equals(moi)).map(MembreConversationResponse::nomAffiche)
                .findFirst().orElse("Conversation");
        return new ConversationDetailResponse(conversation.getId(), conversation.getType(), nom,
            conversation.getDescription(), conversation.getUrlPhoto(), monRole,
            ecriture(conversation, moi, membres, blocages.findPairesImpliquant(moi)), conversation.getCreeLe(), liste,
            conversation.getCategorie(), conversation.getAcces());
    }
}

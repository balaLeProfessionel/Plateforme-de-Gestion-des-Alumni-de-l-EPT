package ept.edu.sn.alumni_backend.messagerie.service;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.annuaire.dto.PageResponse;
import ept.edu.sn.alumni_backend.messagerie.AccesCommunaute;
import ept.edu.sn.alumni_backend.messagerie.CategorieCommunaute;
import ept.edu.sn.alumni_backend.messagerie.dto.CommunauteAdminResponse;
import ept.edu.sn.alumni_backend.messagerie.dto.CommunauteRequest;
import ept.edu.sn.alumni_backend.messagerie.dto.ModificationCommunauteRequest;
import ept.edu.sn.alumni_backend.messagerie.dto.ResumeCommunautesResponse;
import ept.edu.sn.alumni_backend.messagerie.entity.Conversation;
import ept.edu.sn.alumni_backend.messagerie.exception.ConflitMessagerieException;
import ept.edu.sn.alumni_backend.messagerie.exception.MessagerieIntrouvableException;
import ept.edu.sn.alumni_backend.messagerie.repository.ConversationRepository;
import ept.edu.sn.alumni_backend.messagerie.repository.MessageRepository;
import ept.edu.sn.alumni_backend.messagerie.repository.ParticipantRepository;
import ept.edu.sn.alumni_backend.messagerie.tempsreel.EvenementMessagerie;
import lombok.RequiredArgsConstructor;

/**
 * Les communautés vues par l'administration de la plateforme (permission GERER_COMMUNAUTES) : toutes les lister,
 * créer celles de ville, de secteur ou d'intérêt, et les modifier. L'administrateur n'en devient pas membre :
 * les communautés restent réservées aux alumni et aux étudiants, qui les rejoignent d'eux-mêmes.
 */
@Service
@RequiredArgsConstructor
public class AdministrationCommunautesService {
    private final ConversationRepository conversations;
    private final ParticipantRepository participants;
    private final ApplicationEventPublisher evenements;

    @Transactional(readOnly = true)
    public PageResponse<CommunauteAdminResponse> lister(CategorieCommunaute categorie, String recherche, int page, int taille) {
        String motif = recherche == null || recherche.isBlank() ? null : ConversationService.motifRecherche(recherche);
        Page<Conversation> resultat = conversations.rechercherCommunautes(categorie, motif, PageRequest.of(page, taille));
        List<UUID> ids = resultat.getContent().stream().map(Conversation::getId).toList();
        Map<UUID, Long> membres = ids.isEmpty() ? Map.of() : participants.compterParConversation(ids).stream()
            .collect(Collectors.toMap(MessageRepository.NombreParConversation::getConversationId,
                MessageRepository.NombreParConversation::getNombre));
        return PageResponse.depuis(resultat.map(c -> versReponse(c, membres.getOrDefault(c.getId(), 0L))));
    }

    @Transactional(readOnly = true)
    public ResumeCommunautesResponse resumer() {
        Map<CategorieCommunaute, Long> parCategorie = new EnumMap<>(CategorieCommunaute.class);
        for (CategorieCommunaute categorie : CategorieCommunaute.values()) parCategorie.put(categorie, 0L);
        conversations.compterCommunautesParCategorie().forEach(n -> parCategorie.put(n.getCategorie(), n.getNombre()));
        return new ResumeCommunautesResponse(parCategorie.values().stream().mapToLong(Long::longValue).sum(), parCategorie);
    }

    /** Une communauté de ville, de secteur ou d'intérêt, sans membre : les alumni et étudiants la découvrent et la rejoignent. */
    @Transactional
    public CommunauteAdminResponse creer(CommunauteRequest requete) {
        if (requete.categorie().automatique()) {
            throw new IllegalArgumentException("Les communautés de promo et de filière se créent toutes seules.");
        }
        exigerNomLibre(requete.nom().trim(), null);
        Conversation communaute = Conversation.communaute(requete.nom().trim(), requete.categorie(),
            requete.acces() == null ? AccesCommunaute.OUVERTE : requete.acces(), null);
        communaute.setDescription(ConversationService.descriptionNettoyee(requete.description()));
        return versReponse(conversations.save(communaute), 0);
    }

    /**
     * Nom, description, accès ; une communauté de promo ou de filière ne change que de description : son nom et
     * son accès suivent les profils. Ses membres voient le changement aussitôt.
     */
    @Transactional
    public CommunauteAdminResponse modifier(UUID id, ModificationCommunauteRequest requete) {
        Conversation communaute = conversations.findById(id).filter(Conversation::estCommunaute)
            .orElseThrow(() -> new MessagerieIntrouvableException("Cette communauté est introuvable."));
        if (requete.nom() == null && requete.description() == null && requete.acces() == null) {
            throw new IllegalArgumentException("Indiquez ce qui change : le nom, la description ou l'accès.");
        }
        boolean nomChange = requete.nom() != null && !requete.nom().trim().equals(communaute.getNom());
        boolean accesChange = requete.acces() != null && requete.acces() != communaute.getAcces();
        if (communaute.estCommunauteAutomatique() && (nomChange || accesChange)) {
            throw new IllegalArgumentException(
                "Le nom et l'accès d'une communauté de promo ou de filière suivent les profils : seule sa description se modifie.");
        }
        if (nomChange) {
            exigerNomLibre(requete.nom().trim(), id);
            communaute.setNom(requete.nom().trim());
        }
        if (accesChange) communaute.setAcces(requete.acces());
        if (requete.description() != null) communaute.setDescription(ConversationService.descriptionNettoyee(requete.description()));
        evenements.publishEvent(new EvenementMessagerie(participants.findUtilisateurIds(id), EvenementMessagerie.Type.CONVERSATION, id));
        return versReponse(communaute, participants.countByConversationId(id));
    }

    /** Deux communautés du même nom se confondraient dans « À découvrir » : le nom doit être libre. */
    private void exigerNomLibre(String nom, UUID sauf) {
        if (conversations.existeCommunauteNommee(nom, sauf)) {
            throw new ConflitMessagerieException("Une communauté porte déjà le nom « " + nom + " ».");
        }
    }

    private static CommunauteAdminResponse versReponse(Conversation c, long nombreMembres) {
        return new CommunauteAdminResponse(c.getId(), c.getNom(), c.getDescription(), c.getUrlPhoto(), c.getCategorie(),
            c.getAcces(), c.estCommunauteAutomatique(), nombreMembres, c.getCreeLe(), c.getDernierMessageLe());
    }
}

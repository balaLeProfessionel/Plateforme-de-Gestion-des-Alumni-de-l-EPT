package ept.edu.sn.alumni_backend.messagerie.service;

import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.annuaire.AnnuaireMapper;
import ept.edu.sn.alumni_backend.annuaire.dto.AnnuaireMembreResponse;
import ept.edu.sn.alumni_backend.annuaire.dto.PageResponse;
import ept.edu.sn.alumni_backend.mentorat.ParticipationMentorat;
import ept.edu.sn.alumni_backend.mentorat.StatutMentor;
import ept.edu.sn.alumni_backend.mentorat.service.ProfilMentorService;
import ept.edu.sn.alumni_backend.messagerie.entity.Participant;
import ept.edu.sn.alumni_backend.messagerie.exception.MessagerieIntrouvableException;
import ept.edu.sn.alumni_backend.utilisateur.MembreVisibilite;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import jakarta.persistence.criteria.Subquery;
import lombok.RequiredArgsConstructor;

/**
 * Annuaire d'une communauté : ses membres en cartes, comme dans l'annuaire général et avec les mêmes règles de
 * visibilité (compte vérifié, actif ou en attente). Réservé à ses membres ; une communauté dont je ne fais pas
 * partie, ou un groupe privé, répond « introuvable ».
 */
@Service
@RequiredArgsConstructor
public class AnnuaireCommunauteService {
    private static final char ECHAPPEMENT = '\\';

    private final AccesConversation acces;
    private final UtilisateurRepository utilisateurs;
    private final AnnuaireMapper mapper;
    private final ProfilMentorService profilMentorService;

    @Transactional(readOnly = true)
    public PageResponse<AnnuaireMembreResponse> membres(UUID communauteId, UUID moi, String recherche, int page, int taille) {
        Participant participant = acces.chargerParticipant(communauteId, moi);
        if (!participant.getConversation().estCommunaute()) {
            throw new MessagerieIntrouvableException("Cette communauté est introuvable.");
        }

        Specification<Utilisateur> specification = MembreVisibilite.visibleDansAnnuaire().and(membreDe(communauteId));
        if (recherche != null && !recherche.isBlank()) {
            specification = specification.and(correspondA(recherche));
        }
        Page<Utilisateur> membres = utilisateurs.findAll(specification,
            PageRequest.of(page, taille, Sort.by(Sort.Order.asc("nom"), Sort.Order.asc("prenom"), Sort.Order.asc("id"))));

        Map<UUID, StatutMentor> mentors = profilMentorService.statutsMentors(
            membres.stream().filter(m -> ParticipationMentorat.autorise(m.getRole())).map(Utilisateur::getId).toList());
        return PageResponse.depuis(membres.map(membre -> mapper.versResponse(membre, mentors.get(membre.getId()))));
    }

    /** Participant de la communauté : sous-requête {@code exists}, sans jointure ni doublon. */
    private static Specification<Utilisateur> membreDe(UUID communauteId) {
        return (racine, requete, cb) -> {
            Subquery<UUID> participation = requete.subquery(UUID.class);
            var participant = participation.from(Participant.class);
            participation.select(participant.get("id")).where(
                cb.equal(participant.get("conversation").get("id"), communauteId),
                cb.equal(participant.get("utilisateur"), racine));
            return cb.exists(participation);
        };
    }

    /** Nom, prénom (dans les deux ordres), poste, ville ou filière contenant le texte cherché. */
    private static Specification<Utilisateur> correspondA(String recherche) {
        String motif = "%" + echapper(recherche.trim().toLowerCase(Locale.ROOT)) + "%";
        return (racine, requete, cb) -> cb.or(
            cb.like(cb.lower(cb.concat(cb.concat(racine.get("prenom"), " "), racine.get("nom"))), motif, ECHAPPEMENT),
            cb.like(cb.lower(cb.concat(cb.concat(racine.get("nom"), " "), racine.get("prenom"))), motif, ECHAPPEMENT),
            cb.like(cb.lower(racine.get("posteActuel")), motif, ECHAPPEMENT),
            cb.like(cb.lower(racine.get("villeResidence")), motif, ECHAPPEMENT),
            // La filière est une entité : jointure externe sur son nom (un compte sans filière reste trouvable par son nom).
            cb.like(cb.lower(racine.join("filiere", jakarta.persistence.criteria.JoinType.LEFT).get("nom")), motif, ECHAPPEMENT));
    }

    /** « 100% » ou « a_b » se cherchent tels quels : % et _ ne sont pas des jokers ici. */
    private static String echapper(String texte) {
        return texte.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}

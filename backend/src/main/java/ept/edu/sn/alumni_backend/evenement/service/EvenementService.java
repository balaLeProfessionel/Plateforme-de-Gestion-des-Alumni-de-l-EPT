package ept.edu.sn.alumni_backend.evenement.service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.evenement.AudienceEvenement;
import ept.edu.sn.alumni_backend.evenement.PeriodeEvenement;
import ept.edu.sn.alumni_backend.evenement.ReponseParticipation;
import ept.edu.sn.alumni_backend.evenement.StatutEvenement;
import ept.edu.sn.alumni_backend.evenement.dto.EvenementResponse;
import ept.edu.sn.alumni_backend.evenement.dto.PageEvenementsResponse;
import ept.edu.sn.alumni_backend.evenement.entity.Evenement;
import ept.edu.sn.alumni_backend.evenement.exception.EvenementIntrouvableException;
import ept.edu.sn.alumni_backend.evenement.repository.EvenementRepository;
import ept.edu.sn.alumni_backend.evenement.repository.ParticipationEvenementRepository;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EvenementService {
    private final EvenementRepository evenementRepository;
    private final ParticipationEvenementRepository participationRepository;
    private final EvenementMapper evenementMapper;

    @Transactional(readOnly = true)
    public PageEvenementsResponse lister(
            UtilisateurPrincipal principal,
            PeriodeEvenement periode,
            int page,
            int taille) {
        TypeRole role = principal.getUtilisateur().getRole();
        Instant maintenant = Instant.now();
        Specification<Evenement> specification = visiblePar(role)
            .and((racine, requete, cb) -> cb.equal(racine.get("statut"), StatutEvenement.PUBLIE))
            .and((racine, requete, cb) -> periode == PeriodeEvenement.AVENIR
                ? cb.greaterThanOrEqualTo(racine.get("dateFin"), maintenant)
                : cb.lessThan(racine.get("dateFin"), maintenant));

        Sort tri = periode == PeriodeEvenement.AVENIR
            ? Sort.by(Sort.Order.asc("dateDebut"), Sort.Order.asc("id"))
            : Sort.by(Sort.Order.desc("dateDebut"), Sort.Order.asc("id"));
        Page<Evenement> evenements = evenementRepository.findAll(
            specification, PageRequest.of(page, taille, tri));
        Map<UUID, Long> nombresParticipants = compterParticipants(evenements);

        return PageEvenementsResponse.depuis(evenements.map(evenement ->
            evenementMapper.versResponse(evenement, nombresParticipants.getOrDefault(evenement.getId(), 0L))));
    }

    @Transactional(readOnly = true)
    public EvenementResponse obtenir(UUID evenementId, UtilisateurPrincipal principal) {
        Evenement evenement = evenementRepository.findById(evenementId)
            .filter(e -> e.getStatut() == StatutEvenement.PUBLIE)
            .filter(e -> estVisiblePar(e, principal.getUtilisateur().getRole()))
            .orElseThrow(EvenementIntrouvableException::new);
        long nombreParticipants = participationRepository.countByEvenement_IdAndReponse(
            evenementId, ReponseParticipation.PARTICIPERA);
        return evenementMapper.versResponse(evenement, nombreParticipants);
    }

    private Specification<Evenement> visiblePar(TypeRole role) {
        return (racine, requete, cb) -> {
            if (role == TypeRole.ADMIN) {
                return cb.conjunction();
            }
            AudienceEvenement audienceRole = audiencePour(role);
            if (audienceRole == null) {
                return cb.equal(racine.get("audience"), AudienceEvenement.TOUS);
            }
            return cb.or(
                cb.equal(racine.get("audience"), AudienceEvenement.TOUS),
                cb.equal(racine.get("audience"), audienceRole)
            );
        };
    }

    private boolean estVisiblePar(Evenement evenement, TypeRole role) {
        return role == TypeRole.ADMIN
            || evenement.getAudience() == AudienceEvenement.TOUS
            || evenement.getAudience() == audiencePour(role);
    }

    private AudienceEvenement audiencePour(TypeRole role) {
        return switch (role) {
            case ETUDIANT -> AudienceEvenement.ETUDIANTS;
            case ALUMNI -> AudienceEvenement.ALUMNI;
            default -> null;
        };
    }

    private Map<UUID, Long> compterParticipants(Page<Evenement> evenements) {
        if (evenements.isEmpty()) {
            return Map.of();
        }
        return participationRepository.compterParEvenements(
                evenements.getContent().stream().map(Evenement::getId).toList(),
                ReponseParticipation.PARTICIPERA)
            .stream()
            .collect(Collectors.toMap(
                ParticipationEvenementRepository.NombreParticipantsProjection::getEvenementId,
                ParticipationEvenementRepository.NombreParticipantsProjection::getNombre
            ));
    }
}

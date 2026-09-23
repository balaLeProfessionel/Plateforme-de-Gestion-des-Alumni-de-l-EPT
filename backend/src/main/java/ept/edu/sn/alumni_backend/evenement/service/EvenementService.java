package ept.edu.sn.alumni_backend.evenement.service;

import java.time.Instant;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.evenement.AudienceEvenement;
import ept.edu.sn.alumni_backend.evenement.EvenementProperties;
import ept.edu.sn.alumni_backend.evenement.PeriodeEvenement;
import ept.edu.sn.alumni_backend.evenement.ReponseParticipation;
import ept.edu.sn.alumni_backend.evenement.StatutEvenement;
import ept.edu.sn.alumni_backend.evenement.dto.EvenementRequest;
import ept.edu.sn.alumni_backend.evenement.dto.EvenementResponse;
import ept.edu.sn.alumni_backend.evenement.dto.PageEvenementsResponse;
import ept.edu.sn.alumni_backend.evenement.dto.StatutOfficielRequest;
import ept.edu.sn.alumni_backend.evenement.entity.Evenement;
import ept.edu.sn.alumni_backend.evenement.exception.EvenementIntrouvableException;
import ept.edu.sn.alumni_backend.evenement.exception.LimiteCreationEvenementAtteinteException;
import ept.edu.sn.alumni_backend.evenement.repository.EvenementRepository;
import ept.edu.sn.alumni_backend.evenement.repository.ParticipationEvenementRepository;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EvenementService {
    private final EvenementRepository evenementRepository;
    private final ParticipationEvenementRepository participationRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final EvenementMapper evenementMapper;
    private final EvenementProperties evenementProperties;

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

    @Transactional
    public EvenementResponse creer(EvenementRequest request, UtilisateurPrincipal principal) {
        UUID organisateurId = principal.getUtilisateur().getId();
        Utilisateur organisateur = utilisateurRepository.findByIdForUpdate(organisateurId)
            .orElseThrow(() -> new IllegalStateException("Le compte de l’organisateur est introuvable."));
        Instant debutFenetre = Instant.now().minus(Duration.ofHours(24));
        long creationsRecentes = evenementRepository.countByOrganisateur_IdAndCreeLeGreaterThanEqual(
            organisateurId, debutFenetre);
        if (creationsRecentes >= evenementProperties.limiteCreations24h()) {
            throw new LimiteCreationEvenementAtteinteException();
        }

        Evenement evenement = new Evenement();
        appliquer(evenement, request);
        evenement.setOrganisateur(organisateur);
        evenement.setOfficielEpt(false);
        evenement.setStatut(StatutEvenement.PUBLIE);
        return evenementMapper.versResponse(evenementRepository.save(evenement), 0);
    }

    @Transactional
    public EvenementResponse modifier(UUID evenementId, EvenementRequest request, UtilisateurPrincipal principal) {
        Evenement evenement = trouverPourGestion(evenementId, principal);
        appliquer(evenement, request);
        Evenement actualise = evenementRepository.save(evenement);
        long nombreParticipants = participationRepository.countByEvenement_IdAndReponse(
            evenementId, ReponseParticipation.PARTICIPERA);
        return evenementMapper.versResponse(actualise, nombreParticipants);
    }

    @Transactional
    public EvenementResponse annuler(UUID evenementId, UtilisateurPrincipal principal) {
        Evenement evenement = trouverPourGestion(evenementId, principal);
        evenement.setStatut(StatutEvenement.ANNULE);
        Evenement annule = evenementRepository.save(evenement);
        long nombreParticipants = participationRepository.countByEvenement_IdAndReponse(
            evenementId, ReponseParticipation.PARTICIPERA);
        return evenementMapper.versResponse(annule, nombreParticipants);
    }

    @Transactional
    public EvenementResponse definirStatutOfficiel(
            UUID evenementId,
            StatutOfficielRequest request,
            UtilisateurPrincipal principal) {
        if (principal.getUtilisateur().getRole() != TypeRole.ADMIN) {
            throw new AccessDeniedException("Seule l’administration peut modifier le statut officiel.");
        }
        Evenement evenement = evenementRepository.findById(evenementId)
            .orElseThrow(EvenementIntrouvableException::new);
        evenement.setOfficielEpt(request.officielEpt());
        Evenement actualise = evenementRepository.save(evenement);
        long nombreParticipants = participationRepository.countByEvenement_IdAndReponse(
            evenementId, ReponseParticipation.PARTICIPERA);
        return evenementMapper.versResponse(actualise, nombreParticipants);
    }

    private Evenement trouverPourGestion(UUID evenementId, UtilisateurPrincipal principal) {
        Evenement evenement = evenementRepository.findById(evenementId)
            .orElseThrow(EvenementIntrouvableException::new);
        Utilisateur utilisateurCourant = principal.getUtilisateur();
        boolean estAdministrateur = utilisateurCourant.getRole() == TypeRole.ADMIN;
        boolean estOrganisateur = evenement.getOrganisateur().getId().equals(utilisateurCourant.getId());
        if (!estAdministrateur && !estOrganisateur) {
            throw new EvenementIntrouvableException();
        }
        return evenement;
    }

    private void appliquer(Evenement evenement, EvenementRequest request) {
        evenement.setTitre(request.titre().strip());
        evenement.setDescription(request.description().strip());
        evenement.setLieu(request.lieu().strip());
        evenement.setDateDebut(request.dateDebut());
        evenement.setDateFin(request.dateFin());
        evenement.setAudience(request.audience());
        evenement.setNombrePlaces(request.nombrePlaces());
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

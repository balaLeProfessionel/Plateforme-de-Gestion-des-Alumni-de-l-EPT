package ept.edu.sn.alumni_backend.evenement.service;

import ept.edu.sn.alumni_backend.evenement.dto.FiltresEvenements;
import jakarta.persistence.criteria.Predicate;
import java.util.Locale;
import java.util.ArrayList;
import java.time.Instant;
import java.time.Duration;
import java.util.Map;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import ept.edu.sn.alumni_backend.evenement.AudienceEvenement;
import ept.edu.sn.alumni_backend.evenement.EvenementProperties;
import ept.edu.sn.alumni_backend.evenement.PeriodeEvenement;
import ept.edu.sn.alumni_backend.evenement.ReponseParticipation;
import ept.edu.sn.alumni_backend.evenement.StatutEvenement;
import ept.edu.sn.alumni_backend.evenement.dto.EvenementRequest;
import ept.edu.sn.alumni_backend.evenement.dto.EvenementResponse;
import ept.edu.sn.alumni_backend.evenement.dto.PageParticipantsResponse;
import ept.edu.sn.alumni_backend.evenement.dto.PageEvenementsResponse;
import ept.edu.sn.alumni_backend.evenement.dto.ParticipantEvenementResponse;
import ept.edu.sn.alumni_backend.evenement.dto.ReponseParticipationRequest;
import ept.edu.sn.alumni_backend.evenement.entity.Evenement;
import ept.edu.sn.alumni_backend.evenement.entity.ParticipationEvenement;
import ept.edu.sn.alumni_backend.evenement.exception.EvenementIntrouvableException;
import ept.edu.sn.alumni_backend.evenement.exception.LimiteCreationEvenementAtteinteException;
import ept.edu.sn.alumni_backend.evenement.exception.CapaciteEvenementAtteinteException;
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
    private static final char ECHAPPEMENT = '\\';

    private static final Logger LOGGER = LoggerFactory.getLogger(EvenementService.class);
    private final EvenementRepository evenementRepository;
    private final ParticipationEvenementRepository participationRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final EvenementMapper evenementMapper;
    private final EvenementProperties evenementProperties;
    private final StockageImageEvenement stockageImageEvenement;

    @Transactional(readOnly = true)
    public PageEvenementsResponse lister(
            UtilisateurPrincipal principal,
            PeriodeEvenement periode,
            FiltresEvenements filtres,
            int page,
            int taille) {
        TypeRole role = principal.getUtilisateur().getRole();
        Instant maintenant = Instant.now();
        Specification<Evenement> specification = visiblePar(role)
            .and((racine, requete, cb) -> cb.equal(racine.get("statut"), StatutEvenement.PUBLIE))
            .and((racine, requete, cb) -> periode == PeriodeEvenement.AVENIR
                ? cb.greaterThanOrEqualTo(racine.get("dateFin"), maintenant)
                : cb.lessThan(racine.get("dateFin"), maintenant))
            .and(correspondA(filtres));

        Sort tri = periode == PeriodeEvenement.AVENIR
            ? Sort.by(Sort.Order.asc("dateDebut"), Sort.Order.asc("id"))
            : Sort.by(Sort.Order.desc("dateDebut"), Sort.Order.asc("id"));
        Page<Evenement> evenements = evenementRepository.findAll(
            specification, PageRequest.of(page, taille, tri));
        Map<UUID, Long> nombresParticipants = compterParticipants(evenements);
        Map<UUID, ReponseParticipation> mesReponses = trouverMesReponses(evenements, principal);

        return PageEvenementsResponse.depuis(evenements.map(evenement ->
            evenementMapper.versResponse(
                evenement,
                nombresParticipants.getOrDefault(evenement.getId(), 0L),
                mesReponses.get(evenement.getId()))));
    }

    @Transactional(readOnly = true)
    public PageEvenementsResponse listerMesEvenements(
            UtilisateurPrincipal principal,
            PeriodeEvenement periode,
            FiltresEvenements filtres,
            int page,
            int taille) {
        Instant maintenant = Instant.now();
        UUID organisateurId = principal.getUtilisateur().getId();
        Specification<Evenement> proprietaire = (racine, requete, cb) -> cb.and(
            cb.equal(racine.get("organisateur").get("id"), organisateurId),
            periode == PeriodeEvenement.AVENIR
                ? cb.greaterThanOrEqualTo(racine.get("dateFin"), maintenant)
                : cb.lessThan(racine.get("dateFin"), maintenant));
        Specification<Evenement> specification = proprietaire.and(correspondA(filtres));

        Sort tri = periode == PeriodeEvenement.AVENIR
            ? Sort.by(Sort.Order.asc("dateDebut"), Sort.Order.asc("id"))
            : Sort.by(Sort.Order.desc("dateDebut"), Sort.Order.asc("id"));
        Page<Evenement> evenements = evenementRepository.findAll(
            specification, PageRequest.of(page, taille, tri));
        Map<UUID, Long> nombresParticipants = compterParticipants(evenements);
        Map<UUID, ReponseParticipation> mesReponses = trouverMesReponses(evenements, principal);

        return PageEvenementsResponse.depuis(evenements.map(evenement ->
            evenementMapper.versResponse(
                evenement,
                nombresParticipants.getOrDefault(evenement.getId(), 0L),
                mesReponses.get(evenement.getId()))));
    }

    @Transactional(readOnly = true)
    public EvenementResponse obtenir(UUID evenementId, UtilisateurPrincipal principal) {
        Evenement evenement = evenementRepository.findById(evenementId)
            .filter(e -> peutGerer(e, principal)
                || (e.getStatut() == StatutEvenement.PUBLIE
                    && estVisiblePar(e, principal.getUtilisateur().getRole())))
            .orElseThrow(EvenementIntrouvableException::new);
        long nombreParticipants = participationRepository.countByEvenement_IdAndReponse(
            evenementId, ReponseParticipation.PARTICIPERA);
        ReponseParticipation maReponse = participationRepository
            .findByEvenement_IdAndUtilisateur_Id(evenementId, principal.getUtilisateur().getId())
            .map(participation -> participation.getReponse())
            .orElse(null);
        return evenementMapper.versResponse(evenement, nombreParticipants, maReponse);
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
        // Un événement officiel de l'EPT est un événement publié par l'administration, et seulement lui.
        evenement.setOfficielEpt(organisateur.getRole() == TypeRole.ADMIN);
        evenement.setStatut(StatutEvenement.PUBLIE);
        return evenementMapper.versResponse(evenementRepository.save(evenement), 0);
    }

    @Transactional
    public EvenementResponse modifier(UUID evenementId, EvenementRequest request, UtilisateurPrincipal principal) {
        Evenement evenement = trouverPourGestion(evenementId, principal);
        if (request.nombrePlaces() != null
                && request.nombrePlaces() < participationRepository.countByEvenement_IdAndReponse(
                    evenementId, ReponseParticipation.PARTICIPERA)) {
            throw new CapaciteEvenementAtteinteException(
                "Le nombre de places ne peut pas être inférieur au nombre de participants déjà inscrits.");
        }
        appliquer(evenement, request);
        return reponsePourUtilisateur(evenementRepository.save(evenement), principal);
    }

    @Transactional
    public EvenementResponse joindreImage(UUID evenementId, MultipartFile image, UtilisateurPrincipal principal) {
        Evenement evenement = trouverPourGestion(evenementId, principal);
        String ancienneUrl = evenement.getUrlImage();
        String nouvelleUrl = stockageImageEvenement.stocker(image);
        try {
            evenement.setUrlImage(nouvelleUrl);
            Evenement actualise = evenementRepository.saveAndFlush(evenement);
            nettoyerImagesApresTransaction(ancienneUrl, nouvelleUrl);
            return reponsePourUtilisateur(actualise, principal);
        } catch (RuntimeException erreur) {
            stockageImageEvenement.supprimerSiGeree(nouvelleUrl);
            throw erreur;
        }
    }

    @Transactional
    public EvenementResponse supprimerImage(UUID evenementId, UtilisateurPrincipal principal) {
        Evenement evenement = trouverPourGestion(evenementId, principal);
        String ancienneUrl = evenement.getUrlImage();
        evenement.setUrlImage(null);
        Evenement actualise = evenementRepository.saveAndFlush(evenement);
        nettoyerImagesApresTransaction(ancienneUrl, null);
        return reponsePourUtilisateur(actualise, principal);
    }

    @Transactional
    public EvenementResponse annuler(UUID evenementId, UtilisateurPrincipal principal) {
        Evenement evenement = trouverPourGestion(evenementId, principal);
        evenement.setStatut(StatutEvenement.ANNULE);
        return reponsePourUtilisateur(evenementRepository.save(evenement), principal);
    }

    @Transactional
    public EvenementResponse repondre(
            UUID evenementId,
            ReponseParticipationRequest request,
            UtilisateurPrincipal principal) {
        Evenement evenement = evenementRepository.findByIdAvecVerrou(evenementId)
            .orElseThrow(EvenementIntrouvableException::new);
        TypeRole role = principal.getUtilisateur().getRole();
        if (evenement.getStatut() != StatutEvenement.PUBLIE
                || !evenement.getDateFin().isAfter(Instant.now())
                || !estDansAudience(evenement.getAudience(), role)) {
            throw new EvenementIntrouvableException();
        }

        UUID utilisateurId = principal.getUtilisateur().getId();
        ParticipationEvenement participation = participationRepository
            .findByEvenement_IdAndUtilisateur_Id(evenementId, utilisateurId)
            .orElse(null);
        boolean participeDeja = participation != null
            && participation.getReponse() == ReponseParticipation.PARTICIPERA;
        if (request.reponse() == ReponseParticipation.PARTICIPERA
                && !participeDeja
                && evenement.getNombrePlaces() != null
                && participationRepository.countByEvenement_IdAndReponse(
                    evenementId, ReponseParticipation.PARTICIPERA) >= evenement.getNombrePlaces()) {
            throw new CapaciteEvenementAtteinteException();
        }

        if (participation == null) {
            participation = new ParticipationEvenement();
            participation.setEvenement(evenement);
            participation.setUtilisateur(principal.getUtilisateur());
        }
        participation.setReponse(request.reponse());
        participation.setReponduLe(Instant.now());
        participationRepository.saveAndFlush(participation);
        return reponsePourUtilisateur(evenement, principal);
    }

    @Transactional(readOnly = true)
    public PageParticipantsResponse listerParticipants(
            UUID evenementId,
            int page,
            int taille,
            UtilisateurPrincipal principal) {
        Evenement evenement = evenementRepository.findById(evenementId)
            .orElseThrow(EvenementIntrouvableException::new);
        Utilisateur utilisateurCourant = principal.getUtilisateur();
        boolean estAdministrateur = utilisateurCourant.getRole() == TypeRole.ADMIN;
        boolean estOrganisateur = evenement.getOrganisateur().getId().equals(utilisateurCourant.getId());
        if (!estAdministrateur && !estOrganisateur) {
            throw new EvenementIntrouvableException();
        }

        Page<ParticipantEvenementResponse> participants = participationRepository.listerParticipants(
                evenementId,
                ReponseParticipation.PARTICIPERA,
                PageRequest.of(page, taille))
            .map(participant -> new ParticipantEvenementResponse(
                participant.getId(),
                participant.getNom(),
                participant.getPrenom(),
                participant.getRole(),
                participant.getUrlPhoto()));
        return PageParticipantsResponse.depuis(participants);
    }

    private Evenement trouverPourGestion(UUID evenementId, UtilisateurPrincipal principal) {
        Evenement evenement = evenementRepository.findByIdAvecVerrou(evenementId)
            .orElseThrow(EvenementIntrouvableException::new);
        Utilisateur utilisateurCourant = principal.getUtilisateur();
        if (!peutGerer(evenement, principal)) {
            throw new EvenementIntrouvableException();
        }
        return evenement;
    }

    private void nettoyerImagesApresTransaction(String ancienneUrl, String nouvelleUrl) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            stockageImageEvenement.supprimerSiGeree(ancienneUrl);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                supprimerSansInterrompre(ancienneUrl);
            }

            @Override
            public void afterCompletion(int statut) {
                if (statut != STATUS_COMMITTED) supprimerSansInterrompre(nouvelleUrl);
            }

            private void supprimerSansInterrompre(String url) {
                try {
                    stockageImageEvenement.supprimerSiGeree(url);
                } catch (RuntimeException erreur) {
                    LOGGER.warn("Nettoyage d’une image d’événement impossible.", erreur);
                }
            }
        });
    }

    private boolean peutGerer(Evenement evenement, UtilisateurPrincipal principal) {
        Utilisateur utilisateurCourant = principal.getUtilisateur();
        return utilisateurCourant.getRole() == TypeRole.ADMIN
            || evenement.getOrganisateur().getId().equals(utilisateurCourant.getId());
    }

    private void appliquer(Evenement evenement, EvenementRequest request) {
        evenement.setTitre(request.titre().strip());
        evenement.setDescription(request.description().strip());
        evenement.setLieu(request.lieu().strip());
        evenement.setDateDebut(request.dateDebut());
        evenement.setDateFin(request.dateFin() != null ? request.dateFin() : request.dateDebut());
        evenement.setAudience(request.audience());
        evenement.setNombrePlaces(request.nombrePlaces());
    }

    /** Filtres de recherche ; un critère absent ne restreint rien. */
    private static Specification<Evenement> correspondA(FiltresEvenements filtres) {
        return (racine, requete, cb) -> {
            List<Predicate> conditions = new ArrayList<>();
            if (filtres.recherche() != null) {
                String motif = motif(filtres.recherche());
                conditions.add(cb.or(
                    cb.like(cb.lower(racine.get("titre")), motif, ECHAPPEMENT),
                    cb.like(cb.lower(racine.get("description")), motif, ECHAPPEMENT)));
            }
            if (filtres.lieu() != null) {
                conditions.add(cb.like(cb.lower(racine.get("lieu")), motif(filtres.lieu()), ECHAPPEMENT));
            }
            if (filtres.officiel() != null) {
                conditions.add(cb.equal(racine.get("officielEpt"), filtres.officiel()));
            }
            return cb.and(conditions.toArray(Predicate[]::new));
        };
    }

    /** Motif LIKE insensible à la casse ; « % », « _ » et « \ » saisis sont cherchés tels quels. */
    private static String motif(String texte) {
        return "%" + texte.toLowerCase(Locale.ROOT).replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
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

    private boolean estDansAudience(AudienceEvenement audience, TypeRole role) {
        return audience == AudienceEvenement.TOUS || audience == audiencePour(role);
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

    private Map<UUID, ReponseParticipation> trouverMesReponses(
            Page<Evenement> evenements,
            UtilisateurPrincipal principal) {
        if (evenements.isEmpty()) {
            return Map.of();
        }
        return participationRepository.trouverReponsesUtilisateur(
                evenements.getContent().stream().map(Evenement::getId).toList(),
                principal.getUtilisateur().getId())
            .stream()
            .collect(Collectors.toMap(
                ParticipationEvenementRepository.ReponseUtilisateurProjection::getEvenementId,
                ParticipationEvenementRepository.ReponseUtilisateurProjection::getReponse));
    }

    private EvenementResponse reponsePourUtilisateur(Evenement evenement, UtilisateurPrincipal principal) {
        long nombreParticipants = participationRepository.countByEvenement_IdAndReponse(
            evenement.getId(), ReponseParticipation.PARTICIPERA);
        ReponseParticipation maReponse = participationRepository
            .findByEvenement_IdAndUtilisateur_Id(evenement.getId(), principal.getUtilisateur().getId())
            .map(ParticipationEvenement::getReponse)
            .orElse(null);
        return evenementMapper.versResponse(evenement, nombreParticipants, maReponse);
    }
}

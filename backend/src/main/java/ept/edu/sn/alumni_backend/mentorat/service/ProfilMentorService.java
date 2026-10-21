package ept.edu.sn.alumni_backend.mentorat.service;

import java.util.Collection;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.annuaire.dto.PageResponse;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.mentorat.StatutMentor;
import ept.edu.sn.alumni_backend.mentorat.StatutMentorat;
import ept.edu.sn.alumni_backend.mentorat.dto.DomaineMentoratResponse;
import ept.edu.sn.alumni_backend.mentorat.dto.MentorResponse;
import ept.edu.sn.alumni_backend.mentorat.dto.ProfilMentorRequest;
import ept.edu.sn.alumni_backend.mentorat.dto.ProfilMentorResponse;
import ept.edu.sn.alumni_backend.mentorat.entity.DomaineMentorat;
import ept.edu.sn.alumni_backend.mentorat.entity.ProfilMentor;
import ept.edu.sn.alumni_backend.mentorat.exception.ConflitMentoratException;
import ept.edu.sn.alumni_backend.mentorat.repository.DomaineMentoratRepository;
import ept.edu.sn.alumni_backend.mentorat.repository.MentoratRepository;
import ept.edu.sn.alumni_backend.mentorat.repository.ProfilMentorRepository;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import lombok.RequiredArgsConstructor;

/** Offre de mentorat des alumni et recherche de mentors. */
@Service
@RequiredArgsConstructor
public class ProfilMentorService {
    private final ProfilMentorRepository profilMentorRepository;
    private final DomaineMentoratRepository domaineRepository;
    private final MentoratRepository mentoratRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final MentoratMapper mapper;

    @Transactional(readOnly = true)
    public List<DomaineMentoratResponse> listerDomaines() {
        return domaineRepository.findByActifTrueOrderByOrdreAscLibelleAsc().stream()
            .map(mapper::versResponse)
            .toList();
    }

    /** Vide quand l'alumni n'a pas encore proposé de mentorat. */
    @Transactional(readOnly = true)
    public Optional<ProfilMentorResponse> obtenirMonProfil(UtilisateurPrincipal principal) {
        return profilMentorRepository.findByUtilisateur_Id(principal.getUtilisateur().getId())
            .map(profil -> mapper.versResponse(profil, mentoresActifs(profil.getId())));
    }

    @Transactional
    public ProfilMentorResponse enregistrerMonProfil(ProfilMentorRequest request, UtilisateurPrincipal principal) {
        Utilisateur utilisateur = principal.getUtilisateur();
        if (utilisateur.getRole() != TypeRole.ALUMNI) {
            throw new SecurityException("Seuls les alumni peuvent proposer du mentorat.");
        }
        Set<DomaineMentorat> domaines = new LinkedHashSet<>(domaineRepository.findAllById(request.domaineIds()));
        if (domaines.size() != request.domaineIds().size() || domaines.stream().anyMatch(d -> !d.isActif())) {
            throw new IllegalArgumentException("Un des domaines choisis n'existe pas.");
        }

        ProfilMentor profil = profilMentorRepository.findByUtilisateur_Id(utilisateur.getId())
            .orElseGet(() -> {
                ProfilMentor nouveau = new ProfilMentor();
                nouveau.setUtilisateur(utilisateurRepository.getReferenceById(utilisateur.getId()));
                return nouveau;
            });
        long actifs = profil.getId() == null ? 0 : mentoresActifs(profil.getId());
        if (request.capaciteMax() < actifs) {
            throw new ConflitMentoratException(
                "Vous accompagnez déjà " + actifs + " mentorés : la capacité ne peut pas être inférieure.");
        }
        profil.setPresentation(texteOuNull(request.presentation()));
        profil.setDisponible(request.disponible());
        profil.setCapaciteMax(request.capaciteMax());
        profil.getDomaines().clear();
        profil.getDomaines().addAll(domaines);
        return mapper.versResponse(profilMentorRepository.save(profil), actifs);
    }

    @Transactional(readOnly = true)
    public PageResponse<MentorResponse> rechercherMentors(
            String recherche,
            UUID domaineId,
            boolean disponiblesSeulement,
            int page,
            int taille,
            UtilisateurPrincipal principal) {
        UUID moi = principal.getUtilisateur().getId();
        Specification<ProfilMentor> specification = mentorVisible(moi)
            .and(correspondA(recherche))
            .and(couvreDomaine(domaineId))
            .and(disponiblesSeulement
                ? (racine, requete, cb) -> cb.isTrue(racine.get("disponible"))
                : Specification.unrestricted());
        Sort tri = Sort.by(Sort.Order.desc("disponible"),
            Sort.Order.asc("utilisateur.nom"), Sort.Order.asc("utilisateur.prenom"), Sort.Order.asc("id"));
        Page<ProfilMentor> profils = profilMentorRepository.findAll(specification, PageRequest.of(page, taille, tri));

        Set<UUID> ids = profils.stream().map(ProfilMentor::getId).collect(Collectors.toSet());
        Map<UUID, Long> actifsParProfil = ids.isEmpty() ? Map.of() : mentoratRepository
            .compterParProfils(ids, StatutMentorat.ACCEPTEE).stream()
            .collect(Collectors.toMap(
                MentoratRepository.NombreParProfilProjection::getProfilMentorId,
                MentoratRepository.NombreParProfilProjection::getNombre));
        Set<UUID> demandesEnCours = ids.isEmpty() ? Set.of() : new HashSet<>(mentoratRepository
            .trouverProfilsAvecDemandeEnCours(ids, moi, StatutMentorat.EN_COURS));

        return PageResponse.depuis(profils.map(profil -> mapper.versCarte(
            profil,
            actifsParProfil.getOrDefault(profil.getId(), 0L),
            demandesEnCours.contains(profil.getId()))));
    }

    /**
     * Offre d'un alumni consultée depuis son profil. Vide s'il ne propose pas de mentorat ou
     * n'est pas sollicitable, comme dans la recherche.
     */
    @Transactional(readOnly = true)
    public Optional<MentorResponse> obtenirMentor(UUID utilisateurId, UtilisateurPrincipal principal) {
        UUID moi = principal.getUtilisateur().getId();
        return profilMentorRepository.findByUtilisateur_Id(utilisateurId)
            .filter(ProfilMentor::estSollicitable)
            .map(profil -> mapper.versCarte(profil, mentoresActifs(profil.getId()),
                mentoratRepository.existsByMentore_IdAndProfilMentor_IdAndStatutIn(
                    moi, profil.getId(), StatutMentorat.EN_COURS)));
    }

    /** Statut de mentor des membres d'une page de l'annuaire, en deux requêtes pour toute la page. */
    @Transactional(readOnly = true)
    public Map<UUID, StatutMentor> statutsMentors(Collection<UUID> utilisateurIds) {
        if (utilisateurIds.isEmpty()) return Map.of();
        List<ProfilMentor> profils = profilMentorRepository.findByUtilisateur_IdIn(utilisateurIds).stream()
            .filter(ProfilMentor::estSollicitable)
            .toList();
        if (profils.isEmpty()) return Map.of();
        Map<UUID, Long> actifs = mentoratRepository
            .compterParProfils(profils.stream().map(ProfilMentor::getId).toList(), StatutMentorat.ACCEPTEE).stream()
            .collect(Collectors.toMap(
                MentoratRepository.NombreParProfilProjection::getProfilMentorId,
                MentoratRepository.NombreParProfilProjection::getNombre));
        return profils.stream().collect(Collectors.toMap(
            profil -> profil.getUtilisateur().getId(),
            profil -> profil.isDisponible() && profil.getCapaciteMax() > actifs.getOrDefault(profil.getId(), 0L)
                ? StatutMentor.DISPONIBLE
                : StatutMentor.INDISPONIBLE));
    }

    private long mentoresActifs(UUID profilId) {
        return mentoratRepository.countByProfilMentor_IdAndStatut(profilId, StatutMentorat.ACCEPTEE);
    }

    private static Specification<ProfilMentor> mentorVisible(UUID moi) {
        return (racine, requete, cb) -> {
            var utilisateur = racine.join("utilisateur");
            return cb.and(
                cb.isTrue(utilisateur.get("emailVerifie")),
                cb.equal(utilisateur.get("statutCompte"), StatutCompte.ACTIF),
                cb.equal(utilisateur.get("role"), TypeRole.ALUMNI),
                cb.notEqual(utilisateur.get("id"), moi));
        };
    }

    private static Specification<ProfilMentor> correspondA(String recherche) {
        if (recherche == null || recherche.isBlank()) {
            return Specification.unrestricted();
        }
        String motif = "%" + recherche.trim().toLowerCase() + "%";
        return (racine, requete, cb) -> {
            var utilisateur = racine.join("utilisateur");
            return cb.or(
                cb.like(cb.lower(utilisateur.get("nom")), motif),
                cb.like(cb.lower(utilisateur.get("prenom")), motif),
                cb.like(cb.lower(cb.coalesce(utilisateur.get("posteActuel"), "")), motif));
        };
    }

    /** Sous-requête plutôt qu'une jointure : pas de doublons, donc pas de DISTINCT à combiner avec le tri. */
    private static Specification<ProfilMentor> couvreDomaine(UUID domaineId) {
        if (domaineId == null) {
            return Specification.unrestricted();
        }
        return (racine, requete, cb) -> {
            var sousRequete = requete.subquery(UUID.class);
            var profil = sousRequete.from(ProfilMentor.class);
            var domaine = profil.join("domaines");
            sousRequete.select(profil.get("id")).where(
                cb.equal(profil.get("id"), racine.get("id")),
                cb.equal(domaine.get("id"), domaineId));
            return cb.exists(sousRequete);
        };
    }

    private static String texteOuNull(String texte) {
        return texte == null || texte.isBlank() ? null : texte.trim();
    }
}

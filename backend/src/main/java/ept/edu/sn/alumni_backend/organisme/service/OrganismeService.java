package ept.edu.sn.alumni_backend.organisme.service;

import java.text.Normalizer;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.organisme.dto.CompleterOrganismeRequest;
import ept.edu.sn.alumni_backend.organisme.dto.MembreOrganismeResponse;
import ept.edu.sn.alumni_backend.organisme.dto.PageMembresOrganismeResponse;
import ept.edu.sn.alumni_backend.organisme.dto.PresenceMembre;
import ept.edu.sn.alumni_backend.organisme.dto.OrganismeRechercheResponse;
import ept.edu.sn.alumni_backend.organisme.dto.OrganismePublicResponse;
import ept.edu.sn.alumni_backend.organisme.entity.Organisme;
import ept.edu.sn.alumni_backend.organisme.exception.OrganismeIntrouvableException;
import ept.edu.sn.alumni_backend.organisme.repository.OrganismeRepository;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.utilisateur.MembreVisibilite;
import ept.edu.sn.alumni_backend.parcours.entity.ExperienceProfessionelle;
import ept.edu.sn.alumni_backend.parcours.repository.ExperienceRepository;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrganismeService {
    private static final Set<String> NOMS_EPT = Set.of(
        "ept",
        "ecole polytechnique de thies",
        "ecole polytechnique thies",
        "ecole polytechnique de thies ept"
    );

    private final OrganismeRepository organismeRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final ExperienceRepository experienceRepository;

    @Transactional(readOnly = true)
    public OrganismePublicResponse obtenirMonProfil(UtilisateurPrincipal principal) {
        var utilisateur = utilisateurRepository.findById(principal.getUtilisateur().getId())
            .orElseThrow(OrganismeIntrouvableException::new);
        Organisme organisme = utilisateur.getOrganisme();
        if (organisme == null) {
            throw new OrganismeIntrouvableException();
        }
        return new OrganismePublicResponse(
            organisme.getId(),
            organisme.getNom(),
            organisme.getDescription(),
            organisme.getSecteurActivite(),
            organisme.getTypeOrganisme() == null ? null : organisme.getTypeOrganisme().name(),
            organisme.getAdresse(),
            organisme.getPays(),
            organisme.getSiteWeb(),
            organisme.getLogoUrl(),
            organisme.getStatutJuridique(),
            organisme.getTrancheEffectif(),
            organisme.getDateCreation(),
            utilisateur.getStatutCompte().name()
        );
    }

    @Transactional(readOnly = true)
    public OrganismePublicResponse obtenirProfilPublic(UUID id) {
        var utilisateur = compteVisible(id);
        Organisme organisme = utilisateur.getOrganisme();
        return new OrganismePublicResponse(
            organisme.getId(),
            organisme.getNom(),
            organisme.getDescription(),
            organisme.getSecteurActivite(),
            organisme.getTypeOrganisme() == null ? null : organisme.getTypeOrganisme().name(),
            organisme.getAdresse(),
            organisme.getPays(),
            organisme.getSiteWeb(),
            organisme.getLogoUrl(),
            organisme.getStatutJuridique(),
            organisme.getTrancheEffectif(),
            organisme.getDateCreation(),
            utilisateur.getStatutCompte().name()
        );
    }

    /**
     * Membres dont le parcours passe par l'organisme : ceux qui y sont encore d'abord. Les règles de
     * l'annuaire s'appliquent ; une fiche invisible dans l'annuaire n'a pas de liste non plus.
     */
    @Transactional(readOnly = true)
    public PageMembresOrganismeResponse listerMembres(UUID id, PresenceMembre presence, String recherche,
                                                      int page, int taille) {
        compteVisible(id);
        var statuts = List.of(StatutCompte.ACTIF, StatutCompte.EN_ATTENTE);
        var roles = MembreVisibilite.ROLES_PROFIL_PUBLIC;
        String motif = recherche == null || recherche.isBlank() ? null : motifSansAccents(recherche.strip());
        long total = experienceRepository.compterMembres(id, statuts, roles, motif);
        long actuels = experienceRepository.compterMembresActuels(id, statuts, roles, motif);
        long anciens = total - actuels;
        Integer enPoste = presence == null ? null : presence == PresenceMembre.ACTUELS ? 1 : 0;
        long filtres = presence == null ? total : presence == PresenceMembre.ACTUELS ? actuels : anciens;

        List<UUID> membres = experienceRepository.membresDe(id, statuts, roles, enPoste, motif,
            PageRequest.of(page, taille));
        Map<UUID, List<ExperienceProfessionelle>> parMembre = membres.isEmpty() ? Map.of() : experienceRepository
            .experiencesChez(id, membres).stream()
            .collect(Collectors.groupingBy(experience -> experience.getUtilisateur().getId()));
        List<MembreOrganismeResponse> contenu = membres.stream()
            .map(membre -> versMembre(parMembre.getOrDefault(membre, List.of())))
            .filter(Objects::nonNull)
            .toList();
        int totalPages = (int) ((filtres + taille - 1) / taille);
        return new PageMembresOrganismeResponse(contenu, page, taille, filtres, totalPages, actuels, anciens);
    }

    /** Motif LIKE minuscule et sans accents, caractères spéciaux échappés par une barre oblique inverse. */
    private static String motifSansAccents(String texte) {
        String simple = Normalizer.normalize(texte, Normalizer.Form.NFD).replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT);
        return "%" + simple.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
    }

    private Utilisateur compteVisible(UUID organismeId) {
        return utilisateurRepository.findOne(
            MembreVisibilite.visibleDansAnnuaire()
                .and((racine, requete, cb) -> cb.equal(racine.get("role"), TypeRole.ORGANISME))
                .and((racine, requete, cb) -> cb.equal(racine.get("organisme").get("id"), organismeId))
        ).orElseThrow(OrganismeIntrouvableException::new);
    }

    /** Poste en cours le plus récent, sinon le dernier quitté ; années de la première arrivée au départ. */
    private static MembreOrganismeResponse versMembre(List<ExperienceProfessionelle> experiences) {
        if (experiences.isEmpty()) return null;
        Comparator<LocalDate> plusRecent = Comparator.nullsFirst(Comparator.<LocalDate>naturalOrder());
        ExperienceProfessionelle representative = experiences.stream()
            .max(Comparator.<ExperienceProfessionelle, Boolean>comparing(experience -> experience.getDateFin() == null)
                .thenComparing(experience -> experience.getDateFin() == null
                    ? experience.getDateDebut() : experience.getDateFin(), plusRecent))
            .orElseThrow();
        boolean actuel = representative.getDateFin() == null;
        Integer debut = experiences.stream().map(ExperienceProfessionelle::getDateDebut).filter(Objects::nonNull)
            .min(Comparator.naturalOrder()).map(LocalDate::getYear).orElse(null);
        Integer fin = actuel ? null : experiences.stream().map(ExperienceProfessionelle::getDateFin)
            .filter(Objects::nonNull).max(Comparator.naturalOrder()).map(LocalDate::getYear).orElse(null);
        Utilisateur membre = representative.getUtilisateur();
        return new MembreOrganismeResponse(membre.getId(), membre.getPrenom(), membre.getNom(), membre.getUrlPhoto(),
            membre.getRole().name(), representative.getPoste(), actuel, debut, fin);
    }

    @Transactional
    public OrganismePublicResponse completerProfil(UtilisateurPrincipal principal, CompleterOrganismeRequest request) {
        UUID organismeId = principal.getUtilisateur().getOrganisme() != null
        ? principal.getUtilisateur().getOrganisme().getId()
        : null;

        if (organismeId == null) {
            throw new IllegalStateException("Ce compte n'est lié à aucun organisme");
        }

        Organisme organisme = organismeRepository.findById(organismeId)
            .orElseThrow(() -> new IllegalStateException("Organisme introuvable"));

        organisme.setDescription(request.description());
        organisme.setSecteurActivite(request.secteurActivite());
        organisme.setTypeOrganisme(request.typeOrganisme());
        organisme.setAdresse(request.adresse());
        organisme.setSiteWeb(request.siteWeb());
        organisme.setLogoUrl(request.logoUrl());
        organisme.setStatutJuridique(request.statutJuridique());
        organisme.setPays(request.pays());

        organisme = organismeRepository.save(organisme);
        var utilisateur = utilisateurRepository.findById(principal.getUtilisateur().getId())
            .orElseThrow(OrganismeIntrouvableException::new);
        return versResponse(utilisateur, organisme);
    }

    private OrganismePublicResponse versResponse(Utilisateur utilisateur,
                                                  Organisme organisme) {
        return new OrganismePublicResponse(
            organisme.getId(), organisme.getNom(), organisme.getDescription(), organisme.getSecteurActivite(),
            organisme.getTypeOrganisme() == null ? null : organisme.getTypeOrganisme().name(), organisme.getAdresse(),
            organisme.getPays(), organisme.getSiteWeb(), organisme.getLogoUrl(), organisme.getStatutJuridique(),
            organisme.getTrancheEffectif(), organisme.getDateCreation(), utilisateur.getStatutCompte().name()
        );
    }

    public List<OrganismeRechercheResponse> rechercherParNom(String q) {
        if (q == null || q.isBlank()) {
            return List.of();
        }
        return this.organismeRepository.findByNomContainingIgnoreCase(q.trim()).stream()
            .map(org -> new OrganismeRechercheResponse(org.getId(), org.getNom()))
            .toList();
    }

    public Organisme resoudreOrganisme(UUID organismeId, String nomNouvelOrganisme) {
        // Cas 1 : l'utilisateur a sélectionné un organisme existant
        if (organismeId != null) {
            return organismeRepository.findById(organismeId)
                .orElseThrow(() -> new IllegalArgumentException("Organisme introuvable"));
        }
        // Cas 2 : l'utilisateur a saisi un nom libre
        if (nomNouvelOrganisme != null && !nomNouvelOrganisme.isBlank()) {
            String nom = nomNouvelOrganisme.trim();
            if (NOMS_EPT.contains(normaliserNom(nom))) {
                return organismeRepository.findFirstByEtablissementEptTrue()
                    .orElseThrow(() -> new IllegalStateException("L'organisme officiel de l'EPT est introuvable"));
            }
            // On évite les doublons : si le nom correspond déjà à un organisme
            // (insensible à la casse), on le réutilise plutôt que d'en créer un autre
            return organismeRepository.findByNomIgnoreCase(nom)
                .orElseGet(() -> {
                    Organisme nouveau = new Organisme();
                    nouveau.setNom(nom);
                    nouveau.setStatutValidation(StatutCompte.EN_ATTENTE); // à valider par l'admin
                    return organismeRepository.save(nouveau);
                });
        }
        throw new IllegalArgumentException("Un organisme (existant ou nouveau) est obligatoire");
    }

    private String normaliserNom(String valeur) {
        return Normalizer.normalize(valeur, Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "")
            .replaceAll("[^a-zA-Z0-9]+", " ")
            .trim()
            .toLowerCase(Locale.ROOT);
    }
}

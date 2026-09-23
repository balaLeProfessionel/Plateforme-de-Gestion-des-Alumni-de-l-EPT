package ept.edu.sn.alumni_backend.organisme.service;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.organisme.dto.CompleterOrganismeRequest;
import ept.edu.sn.alumni_backend.organisme.dto.OrganismeRechercheResponse;
import ept.edu.sn.alumni_backend.organisme.dto.OrganismePublicResponse;
import ept.edu.sn.alumni_backend.organisme.entity.Organisme;
import ept.edu.sn.alumni_backend.organisme.exception.OrganismeIntrouvableException;
import ept.edu.sn.alumni_backend.organisme.repository.OrganismeRepository;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.utilisateur.MembreVisibilite;
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
        var utilisateur = utilisateurRepository.findOne(
            MembreVisibilite.visibleDansAnnuaire()
                .and((racine, requete, cb) -> cb.equal(racine.get("role"), TypeRole.ORGANISME))
                .and((racine, requete, cb) -> cb.equal(racine.get("organisme").get("id"), id))
        ).orElseThrow(OrganismeIntrouvableException::new);
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

    private OrganismePublicResponse versResponse(ept.edu.sn.alumni_backend.utilisateur.Utilisateur utilisateur,
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

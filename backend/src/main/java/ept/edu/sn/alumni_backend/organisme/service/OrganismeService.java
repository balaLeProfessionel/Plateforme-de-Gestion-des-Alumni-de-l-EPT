package ept.edu.sn.alumni_backend.organisme.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.organisme.dto.CompleterOrganismeRequest;
import ept.edu.sn.alumni_backend.organisme.dto.OrganismeRechercheResponse;
import ept.edu.sn.alumni_backend.organisme.entity.Organisme;
import ept.edu.sn.alumni_backend.organisme.repository.OrganismeRepository;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrganismeService {
    private final OrganismeRepository organismeRepository;

    @Transactional
    public void completerProfil(UtilisateurPrincipal principal, CompleterOrganismeRequest request) {
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

        organismeRepository.save(organisme);
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
}

package ept.edu.sn.alumni_backend.organisme.service;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.organisme.dto.CompleterOrganismeRequest;
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
}

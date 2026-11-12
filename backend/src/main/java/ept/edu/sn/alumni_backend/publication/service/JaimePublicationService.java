package ept.edu.sn.alumni_backend.publication.service;

import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.publication.dto.JaimeResponse;
import ept.edu.sn.alumni_backend.publication.entity.JaimePublication;
import ept.edu.sn.alumni_backend.publication.entity.Publication;
import ept.edu.sn.alumni_backend.publication.exception.ConflitPublicationException;
import ept.edu.sn.alumni_backend.publication.repository.JaimePublicationRepository;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import lombok.RequiredArgsConstructor;

/** Un seul « J'aime » par membre et par publication ; aimer deux fois ne change rien. */
@Service
@RequiredArgsConstructor
public class JaimePublicationService {
    private final JaimePublicationRepository jaimes;
    private final PublicationService publications;

    @Transactional
    public JaimeResponse aimer(UUID publicationId, UtilisateurPrincipal principal) {
        Publication publication = publications.chargerVisible(publicationId, principal);
        UUID lecteur = principal.getUtilisateur().getId();
        if (!jaimes.existsByPublication_IdAndUtilisateur_Id(publicationId, lecteur)) {
            JaimePublication jaime = new JaimePublication();
            jaime.setPublication(publication);
            jaime.setUtilisateur(principal.getUtilisateur());
            try {
                jaimes.saveAndFlush(jaime);
            } catch (DataIntegrityViolationException doublon) {
                // Deux requêtes simultanées : la contrainte a gardé la première, la transaction de celle-ci est perdue.
                throw new ConflitPublicationException("Vous aimez déjà cette publication.");
            }
        }
        return new JaimeResponse(jaimes.countByPublication_Id(publicationId), true);
    }

    @Transactional
    public JaimeResponse retirer(UUID publicationId, UtilisateurPrincipal principal) {
        publications.chargerVisible(publicationId, principal);
        jaimes.retirer(publicationId, principal.getUtilisateur().getId());
        return new JaimeResponse(jaimes.countByPublication_Id(publicationId), false);
    }
}

package ept.edu.sn.alumni_backend;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.publication.AudiencePublication;
import ept.edu.sn.alumni_backend.publication.StatutPublication;
import ept.edu.sn.alumni_backend.publication.TypePublication;
import ept.edu.sn.alumni_backend.publication.entity.Publication;
import ept.edu.sn.alumni_backend.publication.repository.PublicationRepository;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

@SpringBootTest
@Transactional
class PublicationModeleIntegrationTests {
    @Autowired private PublicationRepository publications;
    @Autowired private UtilisateurRepository utilisateurs;

    @Test
    void enregistreUnePublicationSansTitreEtLassocieASonAuteur() {
        Utilisateur auteur = new Utilisateur();
        auteur.setEmail("publication." + UUID.randomUUID() + "@example.invalid");
        auteur.setPassword("hash-de-test");
        auteur.setRole(TypeRole.ALUMNI);
        auteur.setStatutCompte(StatutCompte.ACTIF);
        auteur.setEmailVerifie(true);
        utilisateurs.saveAndFlush(auteur);

        Publication publication = new Publication();
        publication.setAuteur(auteur);
        publication.setType(TypePublication.PUBLICATION);
        publication.setAudience(AudiencePublication.TOUS);
        publication.setContenu("Bonjour au réseau EPT.");
        Publication enregistree = publications.saveAndFlush(publication);

        assertThat(enregistree.getId()).isNotNull();
        assertThat(enregistree.getTitre()).isNull();
        assertThat(enregistree.getAuteur().getId()).isEqualTo(auteur.getId());
        assertThat(enregistree.getStatut()).isEqualTo(StatutPublication.PUBLIE);
        assertThat(enregistree.getPublieLe()).isNotNull();
        assertThat(enregistree.getModifieLe()).isEqualTo(enregistree.getPublieLe());
    }
}

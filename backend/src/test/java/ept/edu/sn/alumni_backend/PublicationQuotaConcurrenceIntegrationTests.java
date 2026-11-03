package ept.edu.sn.alumni_backend;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.publication.AudiencePublication;
import ept.edu.sn.alumni_backend.publication.TypePublication;
import ept.edu.sn.alumni_backend.publication.dto.PublicationRequest;
import ept.edu.sn.alumni_backend.publication.entity.Publication;
import ept.edu.sn.alumni_backend.publication.exception.LimiteCreationPublicationAtteinteException;
import ept.edu.sn.alumni_backend.publication.repository.PublicationRepository;
import ept.edu.sn.alumni_backend.publication.service.PublicationService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

@SpringBootTest(properties = "app.publications.limite-creations-24h=10")
class PublicationQuotaConcurrenceIntegrationTests {
    @Autowired private PublicationService service;
    @Autowired private UtilisateurRepository utilisateurs;
    @Autowired private PublicationRepository publications;
    @Autowired private PlatformTransactionManager transactionManager;

    @Test
    void deuxCreationsSimultaneesNeDepassentPasLeQuota() throws Exception {
        TransactionTemplate transaction = new TransactionTemplate(transactionManager);
        Utilisateur auteur = transaction.execute(statut -> {
            Utilisateur membre = new Utilisateur();
            membre.setEmail("quota." + UUID.randomUUID() + "@example.invalid");
            membre.setPassword("hash-de-test");
            membre.setRole(TypeRole.ALUMNI);
            membre.setStatutCompte(StatutCompte.ACTIF);
            membre.setEmailVerifie(true);
            utilisateurs.saveAndFlush(membre);
            for (int i = 0; i < 9; i++) {
                Publication publication = new Publication();
                publication.setAuteur(membre);
                publication.setType(TypePublication.PUBLICATION);
                publication.setAudience(AudiencePublication.TOUS);
                publication.setContenu("Publication existante");
                publications.save(publication);
            }
            return membre;
        });
        assertThat(auteur).isNotNull();
        var depart = new CountDownLatch(1);
        var requete = new PublicationRequest(TypePublication.PUBLICATION, null, "Bonjour", AudiencePublication.TOUS, null);
        try (var executeur = Executors.newFixedThreadPool(2)) {
            var premier = executeur.submit(() -> creerAuSignal(depart, requete, auteur));
            var second = executeur.submit(() -> creerAuSignal(depart, requete, auteur));
            depart.countDown();
            assertThat(premier.get(20, TimeUnit.SECONDS) + second.get(20, TimeUnit.SECONDS)).isEqualTo(1);
        } finally {
            transaction.executeWithoutResult(statut -> {
                publications.deleteAll(publications.findAll().stream()
                    .filter(p -> p.getAuteur().getId().equals(auteur.getId())).toList());
                publications.flush();
                utilisateurs.deleteById(auteur.getId());
            });
        }
    }

    private int creerAuSignal(CountDownLatch depart, PublicationRequest requete, Utilisateur auteur)
            throws InterruptedException {
        if (!depart.await(10, TimeUnit.SECONDS)) throw new IllegalStateException("Synchronisation impossible");
        try {
            service.creer(requete, new UtilisateurPrincipal(auteur));
            return 1;
        } catch (LimiteCreationPublicationAtteinteException ex) {
            return 0;
        }
    }
}

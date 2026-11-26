package ept.edu.sn.alumni_backend.cv.service;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.task.TaskRejectedException;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import ept.edu.sn.alumni_backend.cv.StatutImportCv;
import ept.edu.sn.alumni_backend.cv.extraction.ContenuCv;
import ept.edu.sn.alumni_backend.cv.extraction.ExtracteurCv;
import ept.edu.sn.alumni_backend.cv.extraction.ProfilExtrait;
import ept.edu.sn.alumni_backend.cv.extraction.ResultatExtraction;
import ept.edu.sn.alumni_backend.cv.repository.ImportCvRepository;
import jakarta.annotation.PreDestroy;

import tools.jackson.databind.json.JsonMapper;

/**
 * Analyse en arrière-plan : l'appel à l'IA prend plusieurs secondes, la requête HTTP rend la main tout de
 * suite et l'écran interroge l'état. Le contenu du CV ne vit qu'en mémoire, le temps de l'appel.
 * Un pool dédié et borné limite les appels simultanés (et donc le coût) sans toucher aux autres tâches.
 */
@Component
class AnalyseImportCv {
    private static final Logger LOG = LoggerFactory.getLogger(AnalyseImportCv.class);
    static final String MESSAGE_ECHEC =
        "L'analyse de votre CV n'a pas abouti.";
    static final String MESSAGE_VIDE =
        "Aucune information de parcours n'a été trouvée dans ce document. Vérifiez qu'il s'agit bien de votre CV.";

    private final ExtracteurCv extracteur;
    private final VerificationProfilExtrait verification;
    private final ImportCvRepository imports;
    private final TransactionTemplate transaction;
    private final JsonMapper json;
    private final Duration conservation;
    private final ThreadPoolTaskExecutor executeur;

    AnalyseImportCv(ExtracteurCv extracteur, VerificationProfilExtrait verification, ImportCvRepository imports,
            PlatformTransactionManager transactions, JsonMapper json,
            @Value("${app.cv.conservation-brouillon:P7D}") Duration conservation,
            @Value("${app.cv.analyses-simultanees:2}") int analysesSimultanees) {
        this.extracteur = extracteur;
        this.verification = verification;
        this.imports = imports;
        this.transaction = new TransactionTemplate(transactions);
        this.json = json;
        this.conservation = conservation;
        this.executeur = new ThreadPoolTaskExecutor();
        this.executeur.setCorePoolSize(analysesSimultanees);
        this.executeur.setMaxPoolSize(analysesSimultanees);
        this.executeur.setQueueCapacity(50);
        this.executeur.setThreadNamePrefix("analyse-cv-");
        this.executeur.initialize();
    }

    @PreDestroy
    void arreter() {
        executeur.shutdown();
    }

    void lancer(UUID idImport, ContenuCv contenu) {
        try {
            executeur.execute(() -> executer(idImport, contenu));
        } catch (TaskRejectedException e) {
            LOG.warn("Import de CV {} refusé : file d'analyse pleine", idImport);
            echouer(idImport, "Trop d'analyses sont en cours. Réessayez dans quelques minutes.");
        }
    }

    private void executer(UUID idImport, ContenuCv contenu) {
        ResultatExtraction resultat;
        ProfilExtrait profil;
        try {
            resultat = extraireAvecUneRelance(contenu, idImport);
            profil = verification.verifier(resultat.profil());
        } catch (RuntimeException e) {
            LOG.warn("Import de CV {} en échec : {}", idImport, e.toString());
            echouer(idImport, MESSAGE_ECHEC);
            return;
        }
        if (estVide(profil)) {
            echouer(idImport, MESSAGE_VIDE);
            return;
        }
        String brouillon = json.writeValueAsString(profil);
        transaction.executeWithoutResult(statut -> imports.findById(idImport).ifPresent(imp -> {
            // Abandonné entre-temps (nouvel import, membre parti) : on ne garde rien
            if (imp.getStatut() != StatutImportCv.EN_COURS) return;
            Instant maintenant = Instant.now();
            imp.setStatut(StatutImportCv.PRET);
            imp.setResultat(brouillon);
            imp.setFournisseur(tronquer(resultat.fournisseur(), 40));
            imp.setModele(tronquer(resultat.modele(), 80));
            imp.setJetonsEntree(resultat.jetonsEntree());
            imp.setJetonsSortie(resultat.jetonsSortie());
            imp.setTermineLe(maintenant);
            imp.setExpireLe(maintenant.plus(conservation));
        }));
    }

    /** Une réponse mal formée arrive parfois : une seule nouvelle tentative, pour borner le coût. */
    private ResultatExtraction extraireAvecUneRelance(ContenuCv contenu, UUID idImport) {
        try {
            return extracteur.extraire(contenu);
        } catch (RuntimeException premiere) {
            LOG.info("Import de CV {} : nouvelle tentative après {}", idImport, premiere.toString());
            return extracteur.extraire(contenu);
        }
    }

    private void echouer(UUID idImport, String message) {
        transaction.executeWithoutResult(statut -> imports.findById(idImport).ifPresent(imp -> {
            if (imp.getStatut() != StatutImportCv.EN_COURS) return;
            imp.cloturer(StatutImportCv.ECHEC);
            imp.setMessageErreur(message);
            imp.setTermineLe(Instant.now());
        }));
    }

    private static boolean estVide(ProfilExtrait p) {
        return p.formations().isEmpty() && p.experiences().isEmpty() && p.competences().isEmpty()
            && p.identite().nom() == null && p.identite().prenom() == null;
    }

    private static String tronquer(String texte, int longueur) {
        return texte == null || texte.length() <= longueur ? texte : texte.substring(0, longueur);
    }
}

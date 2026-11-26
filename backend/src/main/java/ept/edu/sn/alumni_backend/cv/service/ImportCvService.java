package ept.edu.sn.alumni_backend.cv.service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import ept.edu.sn.alumni_backend.common.stockage.ApresTransaction;
import ept.edu.sn.alumni_backend.cv.StatutImportCv;
import ept.edu.sn.alumni_backend.cv.dto.DisponibiliteImportCvResponse;
import ept.edu.sn.alumni_backend.cv.dto.ImportCvResponse;
import ept.edu.sn.alumni_backend.cv.entity.ImportCv;
import ept.edu.sn.alumni_backend.cv.exception.ConflitImportCvException;
import ept.edu.sn.alumni_backend.cv.exception.ImportCvIndisponibleException;
import ept.edu.sn.alumni_backend.cv.exception.ImportCvIntrouvableException;
import ept.edu.sn.alumni_backend.cv.extraction.ContenuCv;
import ept.edu.sn.alumni_backend.cv.extraction.ExtracteurCv;
import ept.edu.sn.alumni_backend.cv.extraction.ProfilExtrait;
import ept.edu.sn.alumni_backend.cv.lecture.LecteurCv;
import ept.edu.sn.alumni_backend.cv.repository.ImportCvRepository;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import tools.jackson.databind.json.JsonMapper;

/**
 * Import de CV pour remplir le profil. Le résultat est écrit dans le profil par {@link #appliquer},
 * puis le membre le corrige depuis sa page profil.
 */
@Service
public class ImportCvService {
    private static final Set<TypeRole> ROLES_AUTORISES = Set.of(TypeRole.ETUDIANT, TypeRole.ALUMNI, TypeRole.PERSONNEL);
    private static final Duration DUREE_MAX_ANALYSE = Duration.ofMinutes(15);

    private final ExtracteurCv extracteur;
    private final LecteurCv lecteur;
    private final AnalyseImportCv analyse;
    private final ApplicationProfilExtrait application;
    private final ImportCvRepository imports;
    private final UtilisateurRepository utilisateurs;
    private final JsonMapper json;
    private final int limiteParJour;

    public ImportCvService(ExtracteurCv extracteur, LecteurCv lecteur, AnalyseImportCv analyse,
            ApplicationProfilExtrait application,
            ImportCvRepository imports, UtilisateurRepository utilisateurs, JsonMapper json,
            @Value("${app.cv.limite-imports-24h:5}") int limiteParJour) {
        this.extracteur = extracteur;
        this.lecteur = lecteur;
        this.analyse = analyse;
        this.application = application;
        this.imports = imports;
        this.utilisateurs = utilisateurs;
        this.json = json;
        this.limiteParJour = limiteParJour;
    }

    public DisponibiliteImportCvResponse disponibilite(Utilisateur utilisateur) {
        boolean disponible = extracteur.disponible() && ROLES_AUTORISES.contains(utilisateur.getRole());
        return new DisponibiliteImportCvResponse(
            disponible,
            disponible && extracteur.imagesAcceptees(),
            disponible ? extracteur.nomFournisseur() : null,
            LecteurCv.FICHIERS_MAX,
            LecteurCv.TAILLE_MAX_OCTETS);
    }

    @Transactional
    public ImportCvResponse demarrer(Utilisateur utilisateur, List<MultipartFile> fichiers, boolean consentement) {
        if (!ROLES_AUTORISES.contains(utilisateur.getRole())) {
            throw new SecurityException("L'import de CV est réservé aux étudiants, aux alumni et au personnel.");
        }
        if (!extracteur.disponible()) {
            throw new ImportCvIndisponibleException();
        }
        if (!consentement) {
            throw new IllegalArgumentException("Votre accord est nécessaire pour faire lire votre CV par le service d'IA.");
        }
        ContenuCv contenu = lecteur.lire(fichiers, extracteur.imagesAcceptees());

        // Verrou sur le membre : deux dépôts simultanés ne lancent pas deux analyses
        Utilisateur membre = utilisateurs.findByIdForUpdate(utilisateur.getId())
            .orElseThrow(() -> new IllegalStateException("Utilisateur introuvable"));
        if (imports.existsByUtilisateurIdAndStatut(membre.getId(), StatutImportCv.EN_COURS)) {
            throw new ConflitImportCvException("Une analyse de CV est déjà en cours.");
        }
        Instant maintenant = Instant.now();
        if (imports.countByUtilisateurIdAndCreeLeAfter(membre.getId(), maintenant.minus(Duration.ofHours(24))) >= limiteParJour) {
            throw new ConflitImportCvException("Vous avez atteint la limite de " + limiteParJour
                + " imports de CV par jour. Réessayez demain, ou remplissez votre profil à la main.");
        }
        // Un nouvel import remplace le brouillon précédent, qui n'a pas été relu
        imports.findByUtilisateurIdAndStatutIn(membre.getId(), List.of(StatutImportCv.PRET))
            .forEach(ancien -> ancien.cloturer(StatutImportCv.ABANDONNE));

        ImportCv nouvel = new ImportCv();
        nouvel.setUtilisateur(membre);
        nouvel.setStatut(StatutImportCv.EN_COURS);
        nouvel.setTypeSource(contenu.type());
        nouvel.setNombreFichiers((short) fichiers.size());
        nouvel.setConsentementLe(maintenant);
        ImportCv enregistre = imports.save(nouvel);

        UUID id = enregistre.getId();
        ApresTransaction.siValidee(() -> analyse.lancer(id, contenu));
        return versResponse(enregistre);
    }

    @Transactional(readOnly = true)
    public ImportCvResponse consulter(Utilisateur utilisateur, UUID id) {
        return versResponse(charger(utilisateur, id));
    }

    /** Brouillon prêt à relire, pour reprendre la relecture après un rechargement de page. */
    @Transactional(readOnly = true)
    public Optional<ImportCvResponse> courant(Utilisateur utilisateur) {
        return imports.findFirstByUtilisateurIdAndStatutOrderByCreeLeDesc(utilisateur.getId(), StatutImportCv.PRET)
            .filter(imp -> imp.getExpireLe() == null || imp.getExpireLe().isAfter(Instant.now()))
            .map(this::versResponse);
    }

    /** Le membre a enregistré son profil : le brouillon est effacé. */
    @Transactional
    public ImportCvResponse valider(Utilisateur utilisateur, UUID id) {
        ImportCv imp = charger(utilisateur, id);
        if (imp.getStatut() != StatutImportCv.PRET) {
            throw new ConflitImportCvException("Cet import n'est plus à relire.");
        }
        imp.cloturer(StatutImportCv.VALIDE);
        return versResponse(imp);
    }

    /** Écrit le résultat dans le profil (sans rien écraser) ; le membre corrige ensuite depuis sa page profil. */
    @Transactional
    public ImportCvResponse appliquer(Utilisateur utilisateur, UUID id) {
        ImportCv imp = charger(utilisateur, id);
        if (imp.getStatut() != StatutImportCv.PRET || imp.getResultat() == null) {
            throw new ConflitImportCvException("Cet import n'est plus disponible.");
        }
        application.appliquer(utilisateur, json.readValue(imp.getResultat(), ProfilExtrait.class));
        // Rechargé : le remplacement des compétences vide le contexte de persistance
        ImportCv clos = charger(utilisateur, id);
        clos.cloturer(StatutImportCv.VALIDE);
        return versResponse(clos);
    }

    @Transactional
    public ImportCvResponse abandonner(Utilisateur utilisateur, UUID id) {
        ImportCv imp = charger(utilisateur, id);
        if (imp.getStatut() == StatutImportCv.PRET || imp.getStatut() == StatutImportCv.EN_COURS) {
            imp.cloturer(StatutImportCv.ABANDONNE);
        }
        return versResponse(imp);
    }

    /** Brouillons expirés effacés ; analyses interrompues (redémarrage du serveur) marquées en échec. */
    @Transactional
    public int nettoyer() {
        Instant maintenant = Instant.now();
        List<ImportCv> expires = imports.findByStatutAndExpireLeBefore(StatutImportCv.PRET, maintenant);
        expires.forEach(imp -> imp.cloturer(StatutImportCv.ABANDONNE));
        List<ImportCv> bloques = imports.findByStatutAndCreeLeBefore(StatutImportCv.EN_COURS, maintenant.minus(DUREE_MAX_ANALYSE));
        bloques.forEach(imp -> {
            imp.cloturer(StatutImportCv.ECHEC);
            imp.setMessageErreur(AnalyseImportCv.MESSAGE_ECHEC);
            imp.setTermineLe(maintenant);
        });
        return expires.size() + bloques.size();
    }

    private ImportCv charger(Utilisateur utilisateur, UUID id) {
        return imports.findByIdAndUtilisateurId(id, utilisateur.getId()).orElseThrow(ImportCvIntrouvableException::new);
    }

    private ImportCvResponse versResponse(ImportCv imp) {
        ProfilExtrait profil = imp.getStatut() == StatutImportCv.PRET && imp.getResultat() != null
            ? json.readValue(imp.getResultat(), ProfilExtrait.class)
            : null;
        return new ImportCvResponse(imp.getId(), imp.getStatut().name(), imp.getTypeSource().name(),
            imp.getMessageErreur(), profil, imp.getExpireLe());
    }
}

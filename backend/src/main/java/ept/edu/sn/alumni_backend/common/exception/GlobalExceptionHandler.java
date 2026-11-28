package ept.edu.sn.alumni_backend.common.exception;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import ept.edu.sn.alumni_backend.admin.exception.CompteIntrouvableException;
import ept.edu.sn.alumni_backend.admin.exception.ConflitCompteException;
import ept.edu.sn.alumni_backend.auth.exception.EmailDejaUtiliseException;
import ept.edu.sn.alumni_backend.auth.exception.NomOrganismeManquantException;
import ept.edu.sn.alumni_backend.auth.exception.RoleNonAutoriseException;
import ept.edu.sn.alumni_backend.auth.exception.TokenInvalideException;
import ept.edu.sn.alumni_backend.evenement.exception.EvenementIntrouvableException;
import ept.edu.sn.alumni_backend.filiere.exception.ConflitFiliereException;
import ept.edu.sn.alumni_backend.filiere.exception.FiliereIntrouvableException;
import ept.edu.sn.alumni_backend.common.stockage.FichierIntrouvableException;
import ept.edu.sn.alumni_backend.common.stockage.StockageFichierException;
import ept.edu.sn.alumni_backend.mobilite.exception.ConflitMobiliteException;
import ept.edu.sn.alumni_backend.partenariat.exception.AccordIntrouvableException;
import ept.edu.sn.alumni_backend.partenariat.exception.ConflitConventionException;
import ept.edu.sn.alumni_backend.partenariat.exception.ConventionIntrouvableException;
import ept.edu.sn.alumni_backend.mobilite.exception.OffreMobiliteIntrouvableException;
import ept.edu.sn.alumni_backend.emploi.exception.ConflitOffreEmploiException;
import ept.edu.sn.alumni_backend.emploi.exception.OffreEmploiIntrouvableException;
import ept.edu.sn.alumni_backend.stage.exception.ConflitStageException;
import ept.edu.sn.alumni_backend.stage.exception.OffreStageIntrouvableException;
import ept.edu.sn.alumni_backend.evenement.exception.ImageEvenementIntrouvableException;
import ept.edu.sn.alumni_backend.evenement.exception.StockageImageEvenementException;
import ept.edu.sn.alumni_backend.evenement.exception.CapaciteEvenementAtteinteException;
import ept.edu.sn.alumni_backend.evenement.exception.LimiteCreationEvenementAtteinteException;
import ept.edu.sn.alumni_backend.mentorat.exception.ConflitMentoratException;
import ept.edu.sn.alumni_backend.mentorat.exception.MentoratIntrouvableException;
import ept.edu.sn.alumni_backend.cv.exception.ConflitImportCvException;
import ept.edu.sn.alumni_backend.cv.exception.ImportCvIndisponibleException;
import ept.edu.sn.alumni_backend.cv.exception.ImportCvIntrouvableException;
import ept.edu.sn.alumni_backend.messagerie.exception.ConflitMessagerieException;
import ept.edu.sn.alumni_backend.messagerie.exception.LimiteEnvoisAtteinteException;
import ept.edu.sn.alumni_backend.messagerie.exception.MessagerieIntrouvableException;
import ept.edu.sn.alumni_backend.organisme.exception.OrganismeIntrouvableException;
import ept.edu.sn.alumni_backend.article.exception.ArticleIntrouvableException;
import ept.edu.sn.alumni_backend.article.exception.ConflitArticleException;
import ept.edu.sn.alumni_backend.publication.exception.PublicationIntrouvableException;
import ept.edu.sn.alumni_backend.publication.exception.ConflitPublicationException;
import ept.edu.sn.alumni_backend.publication.exception.SignalementIntrouvableException;
import ept.edu.sn.alumni_backend.publication.exception.LimiteCreationPublicationAtteinteException;
import ept.edu.sn.alumni_backend.utilisateur.exception.ProfilIntrouvableException;
import ept.edu.sn.alumni_backend.utilisateur.photo.PhotoIntrouvableException;
import ept.edu.sn.alumni_backend.utilisateur.photo.StockagePhotoException;
import jakarta.validation.ConstraintViolationException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(LimiteCreationPublicationAtteinteException.class)
    public ResponseEntity<Map<String, String>> handleLimiteCreationPublication(
            LimiteCreationPublicationAtteinteException e) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(PublicationIntrouvableException.class)
    public ResponseEntity<Map<String, String>> handlePublicationIntrouvable(PublicationIntrouvableException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(ArticleIntrouvableException.class)
    public ResponseEntity<Map<String, String>> handleArticleIntrouvable(ArticleIntrouvableException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(ConflitArticleException.class)
    public ResponseEntity<Map<String, String>> handleConflitArticle(ConflitArticleException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(SignalementIntrouvableException.class)
    public ResponseEntity<Map<String, String>> handleSignalementIntrouvable(SignalementIntrouvableException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(ConflitPublicationException.class)
    public ResponseEntity<Map<String, String>> handleConflitPublication(ConflitPublicationException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleBadCredentials() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Email ou mot de passe incorrect"));
    }

    @ExceptionHandler(EmailDejaUtiliseException.class)
    public ResponseEntity<Map<String, String>> handleEmailDejaUtilise(EmailDejaUtiliseException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(RoleNonAutoriseException.class)
    public ResponseEntity<Map<String, String>> handleRoleNonAutorise(RoleNonAutoriseException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException e) {
        Map<String, String> erreurs = new HashMap<>();
        e.getBindingResult().getFieldErrors()
            .forEach(err -> erreurs.put(err.getField(), err.getDefaultMessage()));
        return ResponseEntity.badRequest().body(erreurs);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, String>> handleConstraintViolation(ConstraintViolationException e) {
        // Le message brut (« lister.taille: must be… ») donnait le nom de la méthode Java, en anglais : on nomme
        // seulement le paramètre, avec le message écrit pour lui s'il y en a un.
        String message = e.getConstraintViolations().stream()
            .sorted(java.util.Comparator.comparing(v -> v.getPropertyPath().toString()))
            .map(violation -> {
                String parametre = null;
                for (jakarta.validation.Path.Node noeud : violation.getPropertyPath()) parametre = noeud.getName();
                boolean messageParDefaut = violation.getMessageTemplate().startsWith("{jakarta.validation");
                return messageParDefaut ? "Le paramètre « " + parametre + " » est invalide." : violation.getMessage();
            })
            .distinct()
            .collect(java.util.stream.Collectors.joining(" "));
        return ResponseEntity.badRequest().body(Map.of("message", message.isBlank() ? "Requête invalide." : message));
    }

    /** Paramètre obligatoire absent : sans ce gestionnaire, la page /error de Spring répondait un 403 trompeur. */
    @ExceptionHandler(org.springframework.web.bind.MissingServletRequestParameterException.class)
    public ResponseEntity<Map<String, String>> handleParametreManquant(
            org.springframework.web.bind.MissingServletRequestParameterException e) {
        return ResponseEntity.badRequest().body(Map.of("message", "Le paramètre « " + e.getParameterName() + " » est obligatoire."));
    }

    @ExceptionHandler(TokenInvalideException.class)
    public ResponseEntity<Map<String, String>> handleTokenInvalide(TokenInvalideException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<Map<String, String>> handleDisabled() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message",
                    "Compte non activé. Vérifiez votre email, ou contactez l'administration si votre compte a été suspendu."));
    }

    @ExceptionHandler(ept.edu.sn.alumni_backend.auth.google.JetonGoogleInvalideException.class)
    public ResponseEntity<Map<String, String>> handleJetonGoogleInvalide(RuntimeException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(ept.edu.sn.alumni_backend.auth.google.CompteGoogleInconnuException.class)
    public ResponseEntity<Map<String, String>> handleCompteGoogleInconnu(
            ept.edu.sn.alumni_backend.auth.google.CompteGoogleInconnuException e) {
        // Ce que Google sait de la personne, pour pré-remplir l'inscription (prénom ou nom peuvent manquer).
        ept.edu.sn.alumni_backend.auth.google.IdentiteGoogle identite = e.identite();
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
            "code", "COMPTE_INCONNU", "message", e.getMessage(), "email", identite.email(),
            "prenom", identite.prenom() == null ? "" : identite.prenom(),
            "nom", identite.nom() == null ? "" : identite.nom()));
    }

    @ExceptionHandler(ept.edu.sn.alumni_backend.auth.google.ConflitLiaisonGoogleException.class)
    public ResponseEntity<Map<String, String>> handleConflitLiaisonGoogle(
            ept.edu.sn.alumni_backend.auth.google.ConflitLiaisonGoogleException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("code", e.code(), "message", e.getMessage()));
    }

    @ExceptionHandler(ept.edu.sn.alumni_backend.auth.google.ConnexionGoogleIndisponibleException.class)
    public ResponseEntity<Map<String, String>> handleConnexionGoogleIndisponible(RuntimeException e) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(LockedException.class)
    public ResponseEntity<Map<String, String>> handleLocked() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message", "Votre compte a été suspendu. Contactez l'administration."));
    }

    @ExceptionHandler(NomOrganismeManquantException.class)
    public ResponseEntity<Map<String, String>> handleNomOrganismeManquant(NomOrganismeManquantException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(ProfilIntrouvableException.class)
    public ResponseEntity<Map<String, String>> handleProfilIntrouvable(ProfilIntrouvableException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(OrganismeIntrouvableException.class)
    public ResponseEntity<Map<String, String>> handleOrganismeIntrouvable(OrganismeIntrouvableException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(EvenementIntrouvableException.class)
    public ResponseEntity<Map<String, String>> handleEvenementIntrouvable(EvenementIntrouvableException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(ImageEvenementIntrouvableException.class)
    public ResponseEntity<Map<String, String>> handleImageEvenementIntrouvable(ImageEvenementIntrouvableException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(StockageImageEvenementException.class)
    public ResponseEntity<Map<String, String>> handleStockageImageEvenement(StockageImageEvenementException e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(LimiteCreationEvenementAtteinteException.class)
    public ResponseEntity<Map<String, String>> handleLimiteCreationEvenement(
            LimiteCreationEvenementAtteinteException e) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(CapaciteEvenementAtteinteException.class)
    public ResponseEntity<Map<String, String>> handleCapaciteEvenementAtteinte(
            CapaciteEvenementAtteinteException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(MentoratIntrouvableException.class)
    public ResponseEntity<Map<String, String>> handleMentoratIntrouvable(MentoratIntrouvableException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler({ConflitMentoratException.class, ObjectOptimisticLockingFailureException.class})
    public ResponseEntity<Map<String, String>> handleConflitMentorat(RuntimeException e) {
        String message = e instanceof ConflitMentoratException
            ? e.getMessage()
            : "Ces informations viennent d'être modifiées. Rechargez la page et réessayez.";
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", message));
    }

    @ExceptionHandler(MessagerieIntrouvableException.class)
    public ResponseEntity<Map<String, String>> handleMessagerieIntrouvable(MessagerieIntrouvableException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(LimiteEnvoisAtteinteException.class)
    public ResponseEntity<Map<String, String>> handleLimiteEnvois(LimiteEnvoisAtteinteException e) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(ConflitMessagerieException.class)
    public ResponseEntity<Map<String, String>> handleConflitMessagerie(ConflitMessagerieException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(CompteIntrouvableException.class)
    public ResponseEntity<Map<String, String>> gererCompteIntrouvable(CompteIntrouvableException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(ConflitCompteException.class)
    public ResponseEntity<Map<String, String>> gererConflitCompte(ConflitCompteException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(FiliereIntrouvableException.class)
    public ResponseEntity<Map<String, String>> gererFiliereIntrouvable(FiliereIntrouvableException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(ConflitFiliereException.class)
    public ResponseEntity<Map<String, String>> gererConflitFiliere(ConflitFiliereException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(OffreStageIntrouvableException.class)
    public ResponseEntity<Map<String, String>> gererOffreStageIntrouvable(OffreStageIntrouvableException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(ConflitStageException.class)
    public ResponseEntity<Map<String, String>> gererConflitStage(ConflitStageException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(OffreEmploiIntrouvableException.class)
    public ResponseEntity<Map<String, String>> gererOffreEmploiIntrouvable(
            OffreEmploiIntrouvableException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(ConflitOffreEmploiException.class)
    public ResponseEntity<Map<String, String>> gererConflitOffreEmploi(ConflitOffreEmploiException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(OffreMobiliteIntrouvableException.class)
    public ResponseEntity<Map<String, String>> gererOffreMobiliteIntrouvable(OffreMobiliteIntrouvableException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(ConventionIntrouvableException.class)
    public ResponseEntity<Map<String, String>> gererConventionIntrouvable(ConventionIntrouvableException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(AccordIntrouvableException.class)
    public ResponseEntity<Map<String, String>> gererAccordIntrouvable(AccordIntrouvableException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(ConflitConventionException.class)
    public ResponseEntity<Map<String, String>> gererConflitConvention(ConflitConventionException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(ConflitMobiliteException.class)
    public ResponseEntity<Map<String, String>> gererConflitMobilite(ConflitMobiliteException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(ImportCvIntrouvableException.class)
    public ResponseEntity<Map<String, String>> gererImportCvIntrouvable(ImportCvIntrouvableException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(ConflitImportCvException.class)
    public ResponseEntity<Map<String, String>> gererConflitImportCv(ConflitImportCvException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(ImportCvIndisponibleException.class)
    public ResponseEntity<Map<String, String>> gererImportCvIndisponible(ImportCvIndisponibleException e) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(FichierIntrouvableException.class)
    public ResponseEntity<Map<String, String>> gererFichierIntrouvable(FichierIntrouvableException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(StockageFichierException.class)
    public ResponseEntity<Map<String, String>> gererStockageFichier(StockageFichierException e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(PhotoIntrouvableException.class)
    public ResponseEntity<Map<String, String>> handlePhotoIntrouvable(PhotoIntrouvableException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(StockagePhotoException.class)
    public ResponseEntity<Map<String, String>> handleStockagePhoto(StockagePhotoException e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, String>> handlePhotoTropGrande() {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
            .body(Map.of("message", "Le fichier ne doit pas dépasser la taille maximale autorisée."));
    }

    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<Map<String, String>> handleSecurity(SecurityException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(Map.of("message", e.getMessage()));
    }

    /** Paramètre d'URL mal formé (identifiant, catégorie…) : on nomme le paramètre, sans le message Java brut. */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, String>> handleTypeParametre(MethodArgumentTypeMismatchException e) {
        return ResponseEntity.badRequest().body(Map.of("message", "Le paramètre « " + e.getName() + " » est invalide."));
    }

    /*
     * Sans ces trois gestionnaires, l'erreur passe par la page /error de Spring, réservée aux personnes connectées
     * par la sécurité : la réponse devenait un 403 trompeur au lieu de dire ce qui ne va pas.
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> handleCorpsIllisible() {
        return ResponseEntity.badRequest().body(Map.of("message", "Le contenu de la requête est illisible ou mal formé."));
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<Map<String, String>> handleFormatNonPris() {
        return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE).body(Map.of("message", "Ce format de contenu n'est pas accepté."));
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Map<String, String>> handleMethodeNonPrise() {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(Map.of("message", "Cette action n'existe pas à cette adresse."));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(Map.of("message", e.getMessage()));
    }
}

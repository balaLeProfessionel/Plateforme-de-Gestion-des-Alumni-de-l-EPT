package ept.edu.sn.alumni_backend.admin.service;

import java.util.Locale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.admin.PermissionAdmin;
import ept.edu.sn.alumni_backend.admin.TypeActionAdmin;
import ept.edu.sn.alumni_backend.admin.entity.ActionAdmin;
import ept.edu.sn.alumni_backend.admin.repository.ActionAdminRepository;
import ept.edu.sn.alumni_backend.auth.dto.ChangerMotDePasseInitialRequest;
import ept.edu.sn.alumni_backend.auth.dto.CreerCompteRequest;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import jakarta.validation.Validator;

/**
 * Crée le premier compte d'administration au démarrage, super administrateur : seul un super administrateur peut
 * en créer d'autres.
 * N'agit que si la base n'en a aucun. Un compte existant n'est jamais modifié ni promu : l'adresse
 * configurée a pu être inscrite par quelqu'un d'autre.
 * Le mot de passe configuré est provisoire : il doit être changé à la première connexion.
 */
@Component
public class PremierAdminInitializer implements ApplicationRunner {
    private static final Logger LOGGER = LoggerFactory.getLogger(PremierAdminInitializer.class);

    private final UtilisateurRepository utilisateurRepository;
    private final ActionAdminRepository actionAdminRepository;
    private final PasswordEncoder passwordEncoder;
    private final Validator validator;
    private final String email;
    private final String motDePasse;

    public PremierAdminInitializer(
            UtilisateurRepository utilisateurRepository,
            ActionAdminRepository actionAdminRepository,
            PasswordEncoder passwordEncoder,
            Validator validator,
            @Value("${app.premier-admin.email:}") String email,
            @Value("${app.premier-admin.mot-de-passe:}") String motDePasse) {
        this.utilisateurRepository = utilisateurRepository;
        this.actionAdminRepository = actionAdminRepository;
        this.passwordEncoder = passwordEncoder;
        this.validator = validator;
        this.email = email;
        this.motDePasse = motDePasse;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (utilisateurRepository.existsByRole(TypeRole.ADMIN)) {
            return;
        }
        if (email.isBlank() || motDePasse.isBlank()) {
            LOGGER.warn("Aucun compte d'administration : définissez APP_PREMIER_ADMIN_EMAIL et APP_PREMIER_ADMIN_PASSWORD, puis redémarrez.");
            return;
        }

        String adresse = email.trim().toLowerCase(Locale.ROOT);
        verifier(CreerCompteRequest.class, "email", adresse);
        verifier(ChangerMotDePasseInitialRequest.class, "nouveauMotDePasse", motDePasse);
        if (utilisateurRepository.existsByEmail(adresse)) {
            throw new IllegalStateException(
                "Premier administrateur : cette adresse appartient déjà à un compte, qui n'est pas promu automatiquement. Choisissez une autre adresse.");
        }

        Utilisateur admin = new Utilisateur();
        admin.setPrenom("Administration");
        admin.setNom("EPT");
        admin.setEmail(adresse);
        admin.setPassword(passwordEncoder.encode(motDePasse));
        admin.setRole(TypeRole.ADMIN);
        admin.setStatutCompte(StatutCompte.ACTIF);
        admin.setEmailVerifie(true);
        admin.setDoitChangerMotDePasse(true);
        admin.getPermissionsAdmin().add(PermissionAdmin.GERER_ADMINISTRATEURS);
        admin = utilisateurRepository.save(admin);
        // Personne d'autre ne l'a créé : le compte figure comme auteur, et le journal affichera son vrai nom une fois choisi.
        actionAdminRepository.save(new ActionAdmin(admin, admin, TypeActionAdmin.CREATION_COMPTE, null,
            "Premier administrateur, créé au démarrage à partir de la configuration du serveur"));
        LOGGER.info("Premier compte d'administration créé : {}", adresse);
    }

    /** Une configuration invalide arrête le démarrage : sinon, la plateforme tournerait sans administrateur. */
    private void verifier(Class<?> type, String champ, String valeur) {
        validator.validateValue(type, champ, valeur).stream().findFirst().ifPresent(violation -> {
            throw new IllegalStateException("Premier administrateur : " + violation.getMessage());
        });
    }
}

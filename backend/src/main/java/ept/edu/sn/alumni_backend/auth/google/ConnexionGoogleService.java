package ept.edu.sn.alumni_backend.auth.google;

import java.util.Locale;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AccountStatusUserDetailsChecker;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.auth.AuthService;
import ept.edu.sn.alumni_backend.auth.dto.AuthResponse;
import ept.edu.sn.alumni_backend.auth.dto.InscriptionGoogleRequest;
import ept.edu.sn.alumni_backend.auth.dto.LiaisonGoogleResponse;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

/**
 * Connexion, inscription et liaison avec un compte Google.
 * <ul>
 *   <li>Compte Google lié (identifiant « sub ») : session ouverte sur ce compte, quelle que soit son adresse.</li>
 *   <li>Sinon, compte de même adresse : session ouverte et compte Google lié au passage, sauf si la personne
 *       a délié Google ou lié un autre compte Google.</li>
 *   <li>Adresse inconnue : ce que Google sait de la personne est renvoyé pour pré-remplir l'inscription,
 *       qui garde le choix du rôle et la validation par l'administration.</li>
 * </ul>
 * Les refus de la connexion par mot de passe s'appliquent toujours (compte suspendu).
 */
@Service
public class ConnexionGoogleService {

    private final VerificateurJetonGoogle verificateur;
    private final UtilisateurRepository utilisateurRepository;
    private final AuthService authService;
    private final String clientId;
    private final AccountStatusUserDetailsChecker verificationStatut = new AccountStatusUserDetailsChecker();

    public ConnexionGoogleService(VerificateurJetonGoogle verificateur, UtilisateurRepository utilisateurRepository,
            AuthService authService, @Value("${app.google.client-id:}") String clientId) {
        this.verificateur = verificateur;
        this.utilisateurRepository = utilisateurRepository;
        this.authService = authService;
        this.clientId = clientId == null ? "" : clientId.trim();
    }

    /** Identifiant client public, vide quand la connexion Google n'est pas configurée. */
    public String clientId() {
        return clientId;
    }

    @Transactional
    public AuthResponse connecter(String jeton) {
        IdentiteGoogle identite = identiteVerifiee(jeton);
        Utilisateur utilisateur = utilisateurRepository.findByGoogleSub(identite.sub())
            .orElseGet(() -> compteDeMemeAdresse(identite));
        // Google vient de prouver la propriété de l'adresse : un compte jamais vérifié l'est maintenant.
        if (utilisateur.getStatutCompte() != StatutCompte.SUSPENDU) {
            authService.verifierAdresseParGoogle(utilisateur);
        }
        // Mêmes refus que la connexion par mot de passe : LockedException (suspendu).
        verificationStatut.check(new UtilisateurPrincipal(utilisateur));
        return authService.ouvrirSession(utilisateur);
    }

    /** Crée le compte avec l'adresse du jeton (jamais une adresse envoyée par le navigateur) et ouvre la session. */
    @Transactional
    public AuthResponse inscrire(InscriptionGoogleRequest requete) {
        IdentiteGoogle identite = identiteVerifiee(requete.credential());
        if (utilisateurRepository.findByGoogleSub(identite.sub()).isPresent()) {
            throw dejaLieAUnAutreCompte();
        }
        return authService.inscrireAvecGoogle(identite.email(), identite.sub(), new AuthService.ProfilInscription(
            requete.nom().trim(), requete.prenom().trim(), requete.role(), requete.telephone(),
            requete.anneeSortie(), requete.filiere(), requete.nomOrganisme()));
    }

    // ==================== LIAISON DEPUIS LES PARAMÈTRES ====================

    @Transactional(readOnly = true)
    public LiaisonGoogleResponse etatLiaison(UUID utilisateurId) {
        return reponse(charger(utilisateurId));
    }

    /** Lie le compte Google du jeton au compte connecté, même si leurs adresses diffèrent. */
    @Transactional
    public LiaisonGoogleResponse lier(UUID utilisateurId, String jeton) {
        IdentiteGoogle identite = identiteVerifiee(jeton);
        Utilisateur utilisateur = charger(utilisateurId);
        utilisateurRepository.findByGoogleSub(identite.sub())
            .filter(autre -> !autre.getId().equals(utilisateur.getId()))
            .ifPresent(autre -> {
                throw dejaLieAUnAutreCompte();
            });
        if (utilisateur.getGoogleSub() != null && !utilisateur.getGoogleSub().equals(identite.sub())) {
            throw new ConflitLiaisonGoogleException("DEJA_LIE",
                "Un autre compte Google est déjà lié. Déliez-le d'abord pour en lier un nouveau.");
        }
        attacher(utilisateur, identite);
        return reponse(utilisateurRepository.save(utilisateur));
    }

    /**
     * Retire la liaison. Google ne rouvre plus ce compte, même par son adresse, jusqu'à une nouvelle liaison.
     * Refusé quand la personne ne connaît pas son mot de passe : elle ne pourrait plus se connecter.
     */
    @Transactional
    public LiaisonGoogleResponse delier(UUID utilisateurId) {
        Utilisateur utilisateur = charger(utilisateurId);
        if (!utilisateur.isMotDePasseDefini()) {
            throw new ConflitLiaisonGoogleException("MOT_DE_PASSE_REQUIS",
                "Définissez d'abord un mot de passe (« Mot de passe oublié ») : sans Google, "
                    + "c'est votre seul moyen de vous connecter.");
        }
        utilisateur.setGoogleSub(null);
        utilisateur.setGoogleEmail(null);
        utilisateur.setConnexionGoogleParAdresse(false);
        return reponse(utilisateurRepository.save(utilisateur));
    }

    // ==================== OUTILS ====================

    /** Première connexion Google d'un compte existant : retrouvé par son adresse, puis lié. */
    private Utilisateur compteDeMemeAdresse(IdentiteGoogle identite) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(identite.email())
            .orElseThrow(() -> new CompteGoogleInconnuException(identite));
        if (utilisateur.getGoogleSub() != null) {
            throw new ConflitLiaisonGoogleException("LIE_A_UN_AUTRE_GOOGLE",
                "Ce compte est lié à un autre compte Google. Utilisez celui-ci, ou votre mot de passe.");
        }
        if (!utilisateur.isConnexionGoogleParAdresse()) {
            throw new ConflitLiaisonGoogleException("GOOGLE_DESACTIVE",
                "La connexion avec Google a été désactivée pour ce compte. Connectez-vous avec votre mot de passe, "
                    + "puis liez Google depuis vos paramètres.");
        }
        attacher(utilisateur, identite);
        return utilisateur;
    }

    private void attacher(Utilisateur utilisateur, IdentiteGoogle identite) {
        utilisateur.setGoogleSub(identite.sub());
        utilisateur.setGoogleEmail(identite.email());
        utilisateur.setConnexionGoogleParAdresse(true);
    }

    private static ConflitLiaisonGoogleException dejaLieAUnAutreCompte() {
        return new ConflitLiaisonGoogleException("ADRESSE_DEJA_LIEE",
            "Ce compte Google est déjà lié à un autre compte EPT Alumni.");
    }

    private Utilisateur charger(UUID utilisateurId) {
        return utilisateurRepository.findById(utilisateurId)
            .orElseThrow(() -> new IllegalStateException("Utilisateur introuvable"));
    }

    private static LiaisonGoogleResponse reponse(Utilisateur utilisateur) {
        return new LiaisonGoogleResponse(utilisateur.getGoogleSub() != null, utilisateur.getGoogleEmail(),
            utilisateur.isMotDePasseDefini());
    }

    private IdentiteGoogle identiteVerifiee(String jeton) {
        if (clientId.isEmpty()) {
            throw new ConnexionGoogleIndisponibleException();
        }
        IdentiteGoogle identite = verificateur.verifier(jeton);
        if (!identite.emailVerifie() || identite.email() == null || identite.email().isBlank()) {
            throw new JetonGoogleInvalideException("Votre adresse Google n'est pas vérifiée par Google.");
        }
        if (identite.sub() == null || identite.sub().isBlank()) {
            throw new JetonGoogleInvalideException("La connexion Google a échoué. Réessayez.");
        }
        return new IdentiteGoogle(identite.sub(), identite.email().trim().toLowerCase(Locale.ROOT), true,
            identite.prenom(), identite.nom());
    }
}

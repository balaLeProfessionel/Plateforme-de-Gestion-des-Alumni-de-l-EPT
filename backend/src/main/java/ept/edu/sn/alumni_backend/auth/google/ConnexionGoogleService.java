package ept.edu.sn.alumni_backend.auth.google;

import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AccountStatusUserDetailsChecker;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.auth.AuthService;
import ept.edu.sn.alumni_backend.auth.dto.AuthResponse;
import ept.edu.sn.alumni_backend.auth.dto.InscriptionGoogleRequest;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

/**
 * Connexion et inscription avec un compte Google : Google prouve que la personne possède l'adresse.
 * <ul>
 *   <li>Adresse connue : session ouverte, avec les refus de la connexion par mot de passe (compte suspendu).</li>
 *   <li>Adresse inconnue : ce que Google sait de la personne est renvoyé pour pré-remplir l'inscription,
 *       qui garde le choix du rôle et la validation par l'administration.</li>
 * </ul>
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
        Utilisateur utilisateur = utilisateurRepository.findByEmail(identite.email())
            .orElseThrow(() -> new CompteGoogleInconnuException(identite));
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
        return authService.inscrireAvecGoogle(identite.email(), new AuthService.ProfilInscription(
            requete.nom().trim(), requete.prenom().trim(), requete.role(), requete.telephone(),
            requete.anneeSortie(), requete.filiere(), requete.nomOrganisme()));
    }

    private IdentiteGoogle identiteVerifiee(String jeton) {
        if (clientId.isEmpty()) {
            throw new ConnexionGoogleIndisponibleException();
        }
        IdentiteGoogle identite = verificateur.verifier(jeton);
        if (!identite.emailVerifie() || identite.email() == null || identite.email().isBlank()) {
            throw new JetonGoogleInvalideException("Votre adresse Google n'est pas vérifiée par Google.");
        }
        return new IdentiteGoogle(identite.email().trim().toLowerCase(Locale.ROOT), true, identite.prenom(), identite.nom());
    }
}

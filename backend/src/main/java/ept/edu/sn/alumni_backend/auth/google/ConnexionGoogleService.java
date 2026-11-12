package ept.edu.sn.alumni_backend.auth.google;

import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AccountStatusUserDetailsChecker;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.auth.AuthService;
import ept.edu.sn.alumni_backend.auth.dto.AuthResponse;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

/**
 * Connexion avec un compte Google : Google prouve que la personne possède l'adresse, le compte
 * EPT Alumni doit déjà exister avec cette adresse. Les règles d'accès sont celles de la connexion
 * par mot de passe (compte suspendu ou adresse non vérifiée refusés). Aucune inscription ici :
 * le rôle et la validation par l'administration passent toujours par le parcours d'inscription.
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
        if (clientId.isEmpty()) {
            throw new ConnexionGoogleIndisponibleException();
        }
        IdentiteGoogle identite = verificateur.verifier(jeton);
        if (!identite.emailVerifie() || identite.email() == null || identite.email().isBlank()) {
            throw new JetonGoogleInvalideException("Votre adresse Google n'est pas vérifiée par Google.");
        }
        Utilisateur utilisateur = utilisateurRepository.findByEmail(identite.email().trim().toLowerCase(Locale.ROOT))
            .orElseThrow(CompteGoogleInconnuException::new);
        // Mêmes refus que la connexion par mot de passe : LockedException (suspendu), DisabledException (non vérifié).
        verificationStatut.check(new UtilisateurPrincipal(utilisateur));
        return authService.ouvrirSession(utilisateur);
    }
}

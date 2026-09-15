package ept.edu.sn.alumni_backend;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockFilterChain;

import ept.edu.sn.alumni_backend.auth.AuthService;
import ept.edu.sn.alumni_backend.auth.EmailService;
import ept.edu.sn.alumni_backend.auth.dto.AuthResponse;
import ept.edu.sn.alumni_backend.auth.dto.ChangerMotDePasseInitialRequest;
import ept.edu.sn.alumni_backend.auth.dto.CompteCreeResponse;
import ept.edu.sn.alumni_backend.auth.dto.CreerCompteRequest;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.organisme.repository.OrganismeRepository;
import ept.edu.sn.alumni_backend.security.JwtService;
import ept.edu.sn.alumni_backend.security.PremiereConnexionFilter;
import ept.edu.sn.alumni_backend.security.RefreshTokenService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.CodeVerificationRepository;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

class PremiereConnexionTests {
    private UtilisateurRepository utilisateurRepository;
    private PasswordEncoder passwordEncoder;
    private JwtService jwtService;
    private RefreshTokenService refreshTokenService;
    private AuthService authService;

    @BeforeEach
    void preparer() {
        utilisateurRepository = mock(UtilisateurRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        jwtService = mock(JwtService.class);
        refreshTokenService = mock(RefreshTokenService.class);
        authService = new AuthService(
            utilisateurRepository,
            mock(OrganismeRepository.class),
            mock(CodeVerificationRepository.class),
            passwordEncoder,
            mock(AuthenticationManager.class),
            jwtService,
            mock(EmailService.class),
            refreshTokenService
        );
    }

    @Test
    void imposeLeChangementAuCompteEtudiantCreeParAdmin() {
        when(passwordEncoder.encode(any())).thenReturn("hash-temporaire");
        when(utilisateurRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        CompteCreeResponse reponse = authService.creerCompteParAdmin(
            new CreerCompteRequest(
                "Diop", "Awa", "awa.diop@example.com", TypeRole.ETUDIANT, 2026, "GIT"
            )
        );

        assertTrue(reponse.motDePasseTemporaire().length() >= 12);
        verify(utilisateurRepository).save(
            org.mockito.ArgumentMatchers.argThat(Utilisateur::isDoitChangerMotDePasse)
        );
    }

    @Test
    void remplaceLeMotDePasseEtRenouvelleLaSession() {
        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setEmail("awa.diop@example.com");
        utilisateur.setId(UUID.randomUUID());
        utilisateur.setNom("Diop");
        utilisateur.setPrenom("Awa");
        utilisateur.setRole(TypeRole.ETUDIANT);
        utilisateur.setStatutCompte(StatutCompte.ACTIF);
        utilisateur.setEmailVerifie(true);
        utilisateur.setDoitChangerMotDePasse(true);

        when(passwordEncoder.encode("NouveauPass2026!")).thenReturn("nouveau-hash");
        when(refreshTokenService.verifierEtObtenirUtilisateur("ancien-refresh-token"))
            .thenReturn(utilisateur);
        when(utilisateurRepository.save(utilisateur)).thenReturn(utilisateur);
        when(jwtService.genererToken(any())).thenReturn("nouvel-access-token");
        when(refreshTokenService.creerRefreshToken(utilisateur)).thenReturn("nouveau-refresh-token");

        AuthResponse reponse = authService.changerMotDePasseInitial(
            utilisateur,
            new ChangerMotDePasseInitialRequest("NouveauPass2026!", "ancien-refresh-token")
        );

        assertFalse(utilisateur.isDoitChangerMotDePasse());
        assertFalse(reponse.doitChangerMotDePasse());
        verify(passwordEncoder).encode("NouveauPass2026!");
        verify(refreshTokenService).supprimerTousPour(utilisateur);
    }

    @Test
    void refuseLeChangementInitialQuandIlNestPasRequis() {
        Utilisateur utilisateur = new Utilisateur();

        assertThrows(
            IllegalArgumentException.class,
            () -> authService.changerMotDePasseInitial(
                utilisateur,
                new ChangerMotDePasseInitialRequest("NouveauPass2026!", "refresh-token")
            )
        );
    }

    @Test
    void bloqueLesAutresEndpointsAvantLeChangementInitial() throws Exception {
        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setEmail("awa.diop@example.com");
        utilisateur.setPassword("hash");
        utilisateur.setRole(TypeRole.ETUDIANT);
        utilisateur.setDoitChangerMotDePasse(true);
        UtilisateurPrincipal principal = new UtilisateurPrincipal(utilisateur);
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities())
        );

        MockHttpServletResponse response = new MockHttpServletResponse();
        new PremiereConnexionFilter().doFilter(
            new MockHttpServletRequest("GET", "/api/profil/me"),
            response,
            new MockFilterChain()
        );

        assertTrue(response.getStatus() == 403);
        SecurityContextHolder.clearContext();
    }
}

package ept.edu.sn.alumni_backend;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import ept.edu.sn.alumni_backend.auth.AuthService;
import ept.edu.sn.alumni_backend.auth.EmailService;
import ept.edu.sn.alumni_backend.auth.dto.AuthResponse;
import ept.edu.sn.alumni_backend.auth.dto.LoginRequest;
import ept.edu.sn.alumni_backend.auth.dto.RefreshRequest;
import ept.edu.sn.alumni_backend.auth.dto.RegisterRequest;
import ept.edu.sn.alumni_backend.auth.dto.VerifierOtpRequest;
import ept.edu.sn.alumni_backend.auth.exception.RoleNonAutoriseException;
import ept.edu.sn.alumni_backend.auth.exception.TokenInvalideException;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.organisme.repository.OrganismeRepository;
import ept.edu.sn.alumni_backend.security.JwtService;
import ept.edu.sn.alumni_backend.security.RefreshTokenService;
import ept.edu.sn.alumni_backend.utilisateur.CodeReinitialisationMotDePasseRepository;
import ept.edu.sn.alumni_backend.utilisateur.CodeVerification;
import ept.edu.sn.alumni_backend.utilisateur.CodeVerificationRepository;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

class ParcoursAuthentificationTests {
    private UtilisateurRepository utilisateurRepository;
    private CodeVerificationRepository codeRepository;
    private PasswordEncoder passwordEncoder;
    private AuthenticationManager authenticationManager;
    private JwtService jwtService;
    private EmailService emailService;
    private RefreshTokenService refreshTokenService;
    private AuthService authService;

    @BeforeEach
    void preparer() {
        utilisateurRepository = mock(UtilisateurRepository.class);
        codeRepository = mock(CodeVerificationRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        authenticationManager = mock(AuthenticationManager.class);
        jwtService = mock(JwtService.class);
        emailService = mock(EmailService.class);
        refreshTokenService = mock(RefreshTokenService.class);
        authService = new AuthService(
            utilisateurRepository,
            mock(OrganismeRepository.class),
            codeRepository,
            mock(CodeReinitialisationMotDePasseRepository.class),
            passwordEncoder,
            authenticationManager,
            jwtService,
            emailService,
            refreshTokenService
        );
    }

    @Test
    void refuseLInscriptionLibreDUnEtudiant() {
        RegisterRequest request = inscription(TypeRole.ETUDIANT, "awa.diop@example.com");

        assertThrows(RoleNonAutoriseException.class, () -> authService.inscrire(request));
    }

    @Test
    void inscritUnCompteEnAttenteEtNormaliseLEmail() {
        when(passwordEncoder.encode("MotDePasse2026!")).thenReturn("hash");
        when(utilisateurRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        authService.inscrire(inscription(TypeRole.VISITEUR, "  Awa.Diop@Example.com "));

        ArgumentCaptor<Utilisateur> utilisateurCaptor = ArgumentCaptor.forClass(Utilisateur.class);
        ArgumentCaptor<CodeVerification> codeCaptor = ArgumentCaptor.forClass(CodeVerification.class);
        verify(utilisateurRepository).save(utilisateurCaptor.capture());
        verify(codeRepository).save(codeCaptor.capture());
        Utilisateur utilisateur = utilisateurCaptor.getValue();
        assertEquals("awa.diop@example.com", utilisateur.getEmail());
        assertEquals(StatutCompte.EN_ATTENTE, utilisateur.getStatutCompte());
        assertFalse(utilisateur.isEmailVerifie());
        assertEquals(6, codeCaptor.getValue().getCode().length());
        verify(emailService).envoyerCodeOtp(
            utilisateur.getEmail(), codeCaptor.getValue().getCode()
        );
    }

    @Test
    void activeLePersonnelAvecUnEmailEptApresOtp() {
        Utilisateur utilisateur = utilisateur(TypeRole.PERSONNEL, "awa.diop@ept.edu.sn");
        utilisateur.setEmailVerifie(false);
        utilisateur.setStatutCompte(StatutCompte.EN_ATTENTE);
        CodeVerification code = new CodeVerification(
            "123456", LocalDateTime.now().plusMinutes(5), utilisateur
        );
        when(utilisateurRepository.findByEmail(utilisateur.getEmail()))
            .thenReturn(Optional.of(utilisateur));
        when(codeRepository.findByUtilisateur(utilisateur)).thenReturn(Optional.of(code));
        when(jwtService.genererToken(any())).thenReturn("access-token");
        when(refreshTokenService.creerRefreshToken(utilisateur)).thenReturn("refresh-token");

        AuthResponse reponse = authService.verifierOtp(
            new VerifierOtpRequest("Awa.Diop@EPT.edu.sn", "123456")
        );

        assertTrue(utilisateur.isEmailVerifie());
        assertEquals(StatutCompte.ACTIF, utilisateur.getStatutCompte());
        assertEquals("access-token", reponse.accessToken());
        verify(codeRepository).delete(code);
    }

    @Test
    void compteUneTentativeOtpIncorrecte() {
        Utilisateur utilisateur = utilisateur(TypeRole.VISITEUR, "visiteur@example.com");
        utilisateur.setEmailVerifie(false);
        CodeVerification code = new CodeVerification(
            "123456", LocalDateTime.now().plusMinutes(5), utilisateur
        );
        when(utilisateurRepository.findByEmail(utilisateur.getEmail()))
            .thenReturn(Optional.of(utilisateur));
        when(codeRepository.findByUtilisateur(utilisateur)).thenReturn(Optional.of(code));

        assertThrows(TokenInvalideException.class, () ->
            authService.verifierOtp(new VerifierOtpRequest(utilisateur.getEmail(), "654321"))
        );

        assertEquals(1, code.getTentatives());
        verify(codeRepository).save(code);
    }

    @Test
    void connecteAvecUnEmailNormaliseEtExposeLObligationInitiale() {
        Utilisateur utilisateur = utilisateur(TypeRole.ETUDIANT, "awa.diop@example.com");
        utilisateur.setDoitChangerMotDePasse(true);
        when(utilisateurRepository.findByEmail(utilisateur.getEmail()))
            .thenReturn(Optional.of(utilisateur));
        when(jwtService.genererToken(any())).thenReturn("access-token");
        when(refreshTokenService.creerRefreshToken(utilisateur)).thenReturn("refresh-token");

        AuthResponse reponse = authService.connecter(
            new LoginRequest(" Awa.Diop@Example.com ", "Temporaire2026")
        );

        verify(authenticationManager).authenticate(
            new UsernamePasswordAuthenticationToken(
                "awa.diop@example.com", "Temporaire2026"
            )
        );
        assertTrue(reponse.doitChangerMotDePasse());
    }

    @Test
    void rafraichitLAccesSansRemplacerLeRefreshToken() {
        Utilisateur utilisateur = utilisateur(TypeRole.ALUMNI, "awa.diop@example.com");
        when(refreshTokenService.verifierEtObtenirUtilisateur("refresh-token"))
            .thenReturn(utilisateur);
        when(jwtService.genererToken(any())).thenReturn("nouvel-access-token");

        AuthResponse reponse = authService.rafraichir(new RefreshRequest("refresh-token"));

        assertEquals("nouvel-access-token", reponse.accessToken());
        assertEquals("refresh-token", reponse.refreshToken());
    }

    private RegisterRequest inscription(TypeRole role, String email) {
        return new RegisterRequest(
            "Diop", "Awa", email, "MotDePasse2026!", role,
            null, null, null, null
        );
    }

    private Utilisateur utilisateur(TypeRole role, String email) {
        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setId(UUID.randomUUID());
        utilisateur.setEmail(email);
        utilisateur.setPassword("hash");
        utilisateur.setNom("Diop");
        utilisateur.setPrenom("Awa");
        utilisateur.setRole(role);
        utilisateur.setEmailVerifie(true);
        utilisateur.setStatutCompte(StatutCompte.ACTIF);
        return utilisateur;
    }
}

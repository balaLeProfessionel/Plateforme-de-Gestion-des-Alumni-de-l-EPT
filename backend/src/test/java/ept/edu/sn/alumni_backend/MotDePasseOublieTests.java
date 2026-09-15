package ept.edu.sn.alumni_backend;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import ept.edu.sn.alumni_backend.auth.AuthService;
import ept.edu.sn.alumni_backend.auth.EmailService;
import ept.edu.sn.alumni_backend.auth.dto.MessageResponse;
import ept.edu.sn.alumni_backend.auth.dto.MotDePasseOublieRequest;
import ept.edu.sn.alumni_backend.auth.dto.ReinitialiserMotDePasseRequest;
import ept.edu.sn.alumni_backend.auth.exception.TokenInvalideException;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.organisme.repository.OrganismeRepository;
import ept.edu.sn.alumni_backend.security.JwtService;
import ept.edu.sn.alumni_backend.security.RefreshTokenService;
import ept.edu.sn.alumni_backend.utilisateur.CodeReinitialisationMotDePasse;
import ept.edu.sn.alumni_backend.utilisateur.CodeReinitialisationMotDePasseRepository;
import ept.edu.sn.alumni_backend.utilisateur.CodeVerificationRepository;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

class MotDePasseOublieTests {
    private UtilisateurRepository utilisateurRepository;
    private CodeReinitialisationMotDePasseRepository codeRepository;
    private PasswordEncoder passwordEncoder;
    private EmailService emailService;
    private RefreshTokenService refreshTokenService;
    private AuthService authService;

    @BeforeEach
    void preparer() {
        utilisateurRepository = mock(UtilisateurRepository.class);
        codeRepository = mock(CodeReinitialisationMotDePasseRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        emailService = mock(EmailService.class);
        refreshTokenService = mock(RefreshTokenService.class);
        authService = new AuthService(
            utilisateurRepository,
            mock(OrganismeRepository.class),
            mock(CodeVerificationRepository.class),
            codeRepository,
            passwordEncoder,
            mock(AuthenticationManager.class),
            mock(JwtService.class),
            emailService,
            refreshTokenService
        );
    }

    @Test
    void gardeUneReponseGeneriqueQuandLeCompteNExistePas() {
        when(utilisateurRepository.findByEmail("inconnu@example.com")).thenReturn(Optional.empty());

        MessageResponse reponse = authService.demanderReinitialisation(
            new MotDePasseOublieRequest("Inconnu@Example.com")
        );

        assertEquals(
            "Si un compte actif correspond à cette adresse, un code de réinitialisation a été envoyé.",
            reponse.message()
        );
        verify(codeRepository, never()).save(any());
        verify(emailService, never()).envoyerCodeReinitialisation(any(), any());
    }

    @Test
    void creeUnCodePourUnCompteActifEtVerifie() {
        Utilisateur utilisateur = utilisateurActif();
        when(utilisateurRepository.findByEmail(utilisateur.getEmail()))
            .thenReturn(Optional.of(utilisateur));

        authService.demanderReinitialisation(new MotDePasseOublieRequest(utilisateur.getEmail()));

        ArgumentCaptor<CodeReinitialisationMotDePasse> captor =
            ArgumentCaptor.forClass(CodeReinitialisationMotDePasse.class);
        verify(codeRepository).deleteByUtilisateur(utilisateur);
        verify(codeRepository).save(captor.capture());
        assertEquals(6, captor.getValue().getCode().length());
        verify(emailService).envoyerCodeReinitialisation(
            utilisateur.getEmail(), captor.getValue().getCode()
        );
    }

    @Test
    void remplaceLeMotDePasseEtRevoqueLesSessions() {
        Utilisateur utilisateur = utilisateurActif();
        utilisateur.setDoitChangerMotDePasse(true);
        CodeReinitialisationMotDePasse code = new CodeReinitialisationMotDePasse(
            "123456", LocalDateTime.now().plusMinutes(5), utilisateur
        );
        when(utilisateurRepository.findByEmail(utilisateur.getEmail()))
            .thenReturn(Optional.of(utilisateur));
        when(codeRepository.findByUtilisateur(utilisateur)).thenReturn(Optional.of(code));
        when(passwordEncoder.encode("NouveauPass2026!")).thenReturn("nouveau-hash");

        authService.reinitialiserMotDePasse(new ReinitialiserMotDePasseRequest(
            utilisateur.getEmail(), "123456", "NouveauPass2026!"
        ));

        assertEquals("nouveau-hash", utilisateur.getPassword());
        assertFalse(utilisateur.isDoitChangerMotDePasse());
        verify(codeRepository).delete(code);
        verify(refreshTokenService).supprimerTousPour(utilisateur);
    }

    @Test
    void compteLesCodesIncorrects() {
        Utilisateur utilisateur = utilisateurActif();
        CodeReinitialisationMotDePasse code = new CodeReinitialisationMotDePasse(
            "123456", LocalDateTime.now().plusMinutes(5), utilisateur
        );
        when(utilisateurRepository.findByEmail(utilisateur.getEmail()))
            .thenReturn(Optional.of(utilisateur));
        when(codeRepository.findByUtilisateur(utilisateur)).thenReturn(Optional.of(code));

        assertThrows(TokenInvalideException.class, () ->
            authService.reinitialiserMotDePasse(new ReinitialiserMotDePasseRequest(
                utilisateur.getEmail(), "654321", "NouveauPass2026!"
            ))
        );

        assertEquals(1, code.getTentatives());
        verify(codeRepository).save(code);
    }

    private Utilisateur utilisateurActif() {
        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setId(UUID.randomUUID());
        utilisateur.setEmail("awa.diop@example.com");
        utilisateur.setPassword("ancien-hash");
        utilisateur.setNom("Diop");
        utilisateur.setPrenom("Awa");
        utilisateur.setRole(TypeRole.ETUDIANT);
        utilisateur.setEmailVerifie(true);
        utilisateur.setStatutCompte(StatutCompte.ACTIF);
        return utilisateur;
    }
}

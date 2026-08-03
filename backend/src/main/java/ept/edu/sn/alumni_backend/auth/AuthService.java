package ept.edu.sn.alumni_backend.auth;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.Set;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.auth.dto.*;
import ept.edu.sn.alumni_backend.auth.exception.EmailDejaUtiliseException;
import ept.edu.sn.alumni_backend.auth.exception.RoleNonAutoriseException;
import ept.edu.sn.alumni_backend.auth.exception.TokenInvalideException;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.security.JwtService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.CodeVerification;
import ept.edu.sn.alumni_backend.utilisateur.CodeVerificationRepository;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final Set<String> DOMAINES_OFFICIELS_EPT = Set.of("ept.edu.sn", "ept.sn");

    private static final Set<TypeRole> ROLES_INSCRIPTION_LIBRE =
            EnumSet.of(TypeRole.ALUMNI, TypeRole.ENSEIGNANT, TypeRole.ORGANISME, TypeRole.VISITEUR);

    private static final int DUREE_VALIDITE_MINUTES = 10;
    private static final int MAX_TENTATIVES = 5;

    private final UtilisateurRepository utilisateurRepository;
    private final CodeVerificationRepository codeVerificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final EmailService emailService;

    // ==================== INSCRIPTION ====================

    @Transactional
    public InscriptionResponse inscrire(RegisterRequest request) {
        String email = normaliser(request.email());

        if (!ROLES_INSCRIPTION_LIBRE.contains(request.role())) {
            throw new RoleNonAutoriseException(
                "L'inscription n'est pas ouverte pour ce type de compte. "
                + "Les comptes étudiants sont créés par l'administration de l'EPT.");
        }
        if (utilisateurRepository.existsByEmail(email)) {
            throw new EmailDejaUtiliseException("Cet email est déjà utilisé");
        }

        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setNom(request.nom());
        utilisateur.setPrenom(request.prenom());
        utilisateur.setEmail(email);
        utilisateur.setPassword(passwordEncoder.encode(request.password()));
        utilisateur.setRole(request.role());
        utilisateur.setEmailVerifie(false);
        utilisateur.setStatutCompte(StatutCompte.EN_ATTENTE);
        utilisateur.setTelephone(request.telephone());
        utilisateur.setAnneeEntree(request.anneeEntree());
        utilisateur.setFiliere(request.filiere());

        utilisateur = utilisateurRepository.save(utilisateur);

        genererEtEnvoyerCode(utilisateur);

        return new InscriptionResponse(email,
            "Un code de vérification à 6 chiffres a été envoyé à votre adresse email.");
    }

    // ==================== VÉRIFICATION OTP ====================

    @Transactional
    public AuthResponse verifierOtp(VerifierOtpRequest request) {
        String email = normaliser(request.email());

        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
            .orElseThrow(() -> new TokenInvalideException("Aucun compte associé à cet email"));

        if (utilisateur.isEmailVerifie()) {
            throw new TokenInvalideException("Cet email est déjà vérifié, connectez-vous");
        }

        CodeVerification cv = codeVerificationRepository.findByUtilisateur(utilisateur)
            .orElseThrow(() -> new TokenInvalideException(
                "Aucun code en attente. Demandez un nouveau code."));

        if (cv.estExpire()) {
            codeVerificationRepository.delete(cv);
            throw new TokenInvalideException("Ce code a expiré. Demandez un nouveau code.");
        }
        if (cv.getTentatives() >= MAX_TENTATIVES) {
            codeVerificationRepository.delete(cv);
            throw new TokenInvalideException(
                "Trop de tentatives échouées. Demandez un nouveau code.");
        }
        if (!cv.getCode().equals(request.code())) {
            cv.setTentatives(cv.getTentatives() + 1);
            codeVerificationRepository.save(cv);
            throw new TokenInvalideException("Code incorrect");
        }

        // Code correct : la propriété de l'email est prouvée
        utilisateur.setEmailVerifie(true);

        // Le badge institutionnel ne se décide qu'ici, après preuve de propriété
        if ((utilisateur.getRole() == TypeRole.ALUMNI
                || utilisateur.getRole() == TypeRole.ENSEIGNANT)
                && estEmailOfficielEpt(email)) {
            utilisateur.setStatutCompte(StatutCompte.ACTIF);
        }
        // sinon reste EN_ATTENTE : accès complet, mais badge en attente de vérif admin

        utilisateurRepository.save(utilisateur);
        codeVerificationRepository.delete(cv);

        // Le token n'est délivré qu'ici, une fois l'email vérifié
        String token = jwtService.genererToken(new UtilisateurPrincipal(utilisateur));
        return construireReponse(token, utilisateur, "Email vérifié. Bienvenue !");
    }

    @Transactional
    public InscriptionResponse renvoyerOtp(RenvoyerOtpRequest request) {
        String email = normaliser(request.email());

        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
            .orElseThrow(() -> new TokenInvalideException("Aucun compte associé à cet email"));

        if (utilisateur.isEmailVerifie()) {
            throw new TokenInvalideException("Cet email est déjà vérifié, connectez-vous");
        }

        // On efface l'ancien code s'il existe, puis on en génère un nouveau
        codeVerificationRepository.deleteByUtilisateur(utilisateur);
        genererEtEnvoyerCode(utilisateur);

        return new InscriptionResponse(email, "Un nouveau code a été envoyé.");
    }

    // ==================== CONNEXION ====================

    public AuthResponse connecter(LoginRequest request) {
        String email = normaliser(request.email());

        // authenticate() lève :
        //  - BadCredentialsException si identifiants faux
        //  - DisabledException si isEnabled() = false (email non vérifié OU suspendu)
        //  - LockedException si suspendu
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(email, request.password()));

        Utilisateur utilisateur = utilisateurRepository.findByEmail(email).orElseThrow();
        String token = jwtService.genererToken(new UtilisateurPrincipal(utilisateur));
        return construireReponse(token, utilisateur, null);
    }

    // ==================== CRÉATION PAR L'ADMIN ====================

    @Transactional
    public CompteCreeResponse creerCompteParAdmin(CreerCompteRequest request) {
        String email = normaliser(request.email());
        if (utilisateurRepository.existsByEmail(email)) {
            throw new EmailDejaUtiliseException("Cet email est déjà utilisé");
        }

        String motDePasseTemporaire = genererMotDePasseTemporaire();

        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setNom(request.nom());
        utilisateur.setPrenom(request.prenom());
        utilisateur.setEmail(email);
        utilisateur.setPassword(passwordEncoder.encode(motDePasseTemporaire));
        utilisateur.setRole(request.role());
        utilisateur.setStatutCompte(StatutCompte.ACTIF);
        utilisateur.setEmailVerifie(true);
        utilisateur.setAnneeEntree(request.anneeEntree());
        utilisateur.setFiliere(request.filiere());

        utilisateur = utilisateurRepository.save(utilisateur);

        return new CompteCreeResponse(
            utilisateur.getId(), utilisateur.getEmail(), utilisateur.getNom(),
            utilisateur.getPrenom(), utilisateur.getRole().name(), motDePasseTemporaire);
    }

    // ==================== OUTILS ====================

    private void genererEtEnvoyerCode(Utilisateur utilisateur) {
        String code = String.valueOf(new SecureRandom().nextInt(900000) + 100000);
        CodeVerification cv = new CodeVerification(
            code, LocalDateTime.now().plusMinutes(DUREE_VALIDITE_MINUTES), utilisateur);
        codeVerificationRepository.save(cv);
        emailService.envoyerCodeOtp(utilisateur.getEmail(), code);
    }

    private String genererMotDePasseTemporaire() {
        final String alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder(12);
        for (int i = 0; i < 12; i++) sb.append(alphabet.charAt(random.nextInt(alphabet.length())));
        return sb.toString();
    }

    private boolean estEmailOfficielEpt(String email) {
        int arobase = email.indexOf('@');
        if (arobase < 0) return false;
        return DOMAINES_OFFICIELS_EPT.contains(email.substring(arobase + 1));
    }

    private String normaliser(String email) {
        return email == null ? null : email.toLowerCase().trim();
    }

    private AuthResponse construireReponse(String token, Utilisateur u, String message) {
        return new AuthResponse(token, u.getId(), u.getEmail(), u.getNom(), u.getPrenom(),
                u.getRole().name(), u.getStatutCompte().name(), message);
    }
}
package ept.edu.sn.alumni_backend.admin.service;

import ept.edu.sn.alumni_backend.admin.NomCompte;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import ept.edu.sn.alumni_backend.admin.TypeActionAdmin;
import ept.edu.sn.alumni_backend.admin.dto.ImportComptesRequest;
import ept.edu.sn.alumni_backend.admin.dto.ResultatImportResponse;
import ept.edu.sn.alumni_backend.admin.exception.ConflitCompteException;
import ept.edu.sn.alumni_backend.auth.AuthService;
import ept.edu.sn.alumni_backend.auth.dto.CompteCreeResponse;
import ept.edu.sn.alumni_backend.auth.dto.CreerCompteRequest;
import ept.edu.sn.alumni_backend.auth.exception.EmailDejaUtiliseException;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;

/**
 * Création de comptes par l'administration, à l'unité ou par promotion entière.
 * Le titulaire reçoit son mot de passe provisoire par e-mail et doit le changer à la première connexion.
 * Un organisme ne se crée pas ici : son compte est lié à sa fiche d'organisme.
 */
@Service
@RequiredArgsConstructor
public class CreationComptesService {
    static final Set<TypeRole> ROLES_CREABLES =
        EnumSet.of(TypeRole.ETUDIANT, TypeRole.ALUMNI, TypeRole.PERSONNEL, TypeRole.VISITEUR, TypeRole.ADMIN);

    private final AuthService authService;
    private final UtilisateurRepository utilisateurRepository;
    private final TraceCompte trace;
    private final Validator validator;
    private final TransactionTemplate transaction;

    @Transactional
    public CompteCreeResponse creer(CreerCompteRequest request, UtilisateurPrincipal principal) {
        if (!ROLES_CREABLES.contains(request.role())) {
            throw new IllegalArgumentException("Un compte d'organisme se crée depuis la page d'inscription des organismes.");
        }
        verifierAnnees(request.anneeEntree(), request.anneeSortie());
        CompteCreeResponse cree = authService.creerCompteParAdmin(request);
        Utilisateur compte = utilisateurRepository.findById(cree.id()).orElseThrow();
        trace.consigner(principal, compte, TypeActionAdmin.CREATION_COMPTE, null, compte.getRole().name());
        trace.notifier(compte, "Votre compte EPT Alumni est prêt",
            "Bonjour " + NomCompte.salutation(compte) + ", l'administration de l'EPT vous a créé un compte sur EPT Alumni. "
            + "Connectez-vous avec cette adresse et le mot de passe provisoire " + cree.motDePasseTemporaire()
            + " : vous choisirez votre propre mot de passe à la première connexion.");
        return cree;
    }

    /** Chaque ligne est créée dans sa propre transaction : une ligne en erreur n'empêche pas les autres. */
    public ResultatImportResponse importer(ImportComptesRequest request, UtilisateurPrincipal principal) {
        List<ResultatImportResponse.Ligne> lignes = new ArrayList<>();
        Set<String> emailsVus = new HashSet<>();
        int crees = 0;
        for (int i = 0; i < request.lignes().size(); i++) {
            ImportComptesRequest.Ligne ligne = request.lignes().get(i);
            int numero = i + 1;
            String email = ligne.email() == null ? "" : ligne.email().trim().toLowerCase(Locale.ROOT);
            CreerCompteRequest demande = new CreerCompteRequest(
                vide(ligne.nom()), vide(ligne.prenom()), email, request.role(), ligne.anneeEntree(), ligne.filiere(), ligne.anneeSortie());
            String erreur = premiereErreur(demande);
            if (erreur == null && !emailsVus.add(email)) {
                erreur = "Cette adresse apparaît plusieurs fois dans le fichier.";
            }
            if (erreur != null) {
                lignes.add(new ResultatImportResponse.Ligne(numero, email, false, erreur, null, null));
                continue;
            }
            try {
                CompteCreeResponse cree = transaction.execute(statut -> creer(demande, principal));
                lignes.add(new ResultatImportResponse.Ligne(numero, email, true, null, cree.id(), cree.motDePasseTemporaire()));
                crees++;
            } catch (EmailDejaUtiliseException e) {
                lignes.add(new ResultatImportResponse.Ligne(numero, email, false, "Un compte existe déjà avec cette adresse.", null, null));
            } catch (IllegalArgumentException | ConflitCompteException e) {
                lignes.add(new ResultatImportResponse.Ligne(numero, email, false, e.getMessage(), null, null));
            }
        }
        return new ResultatImportResponse(crees, lignes);
    }

    private String premiereErreur(CreerCompteRequest demande) {
        Set<ConstraintViolation<CreerCompteRequest>> violations = validator.validate(demande);
        if (!violations.isEmpty()) {
            return violations.stream().map(ConstraintViolation::getMessage).sorted().findFirst().orElseThrow();
        }
        try {
            verifierAnnees(demande.anneeEntree(), demande.anneeSortie());
            return null;
        } catch (IllegalArgumentException e) {
            return e.getMessage();
        }
    }

    static void verifierAnnees(Integer anneeEntree, Integer anneeSortie) {
        int anneeMax = LocalDate.now(ZoneId.of("Africa/Dakar")).getYear() + 1;
        if (anneeEntree != null && anneeEntree > anneeMax) {
            throw new IllegalArgumentException("L'année d'entrée ne peut pas dépasser " + anneeMax + ".");
        }
        if (anneeSortie != null && anneeSortie > anneeMax) {
            throw new IllegalArgumentException("L'année de sortie ne peut pas dépasser " + anneeMax + ".");
        }
        if (anneeEntree != null && anneeSortie != null && anneeSortie < anneeEntree) {
            throw new IllegalArgumentException("L'année de sortie ne peut pas précéder l'année d'entrée.");
        }
    }

    private static String vide(String valeur) {
        return valeur == null ? null : valeur.trim();
    }
}

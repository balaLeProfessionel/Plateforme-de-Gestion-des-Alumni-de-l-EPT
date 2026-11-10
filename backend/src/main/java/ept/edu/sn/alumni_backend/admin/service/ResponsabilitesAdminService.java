package ept.edu.sn.alumni_backend.admin.service;

import java.util.EnumSet;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.admin.NomCompte;
import ept.edu.sn.alumni_backend.admin.PermissionAdmin;
import ept.edu.sn.alumni_backend.admin.TypeActionAdmin;
import ept.edu.sn.alumni_backend.admin.dto.FicheCompteResponse;
import ept.edu.sn.alumni_backend.admin.exception.CompteIntrouvableException;
import ept.edu.sn.alumni_backend.admin.exception.ConflitCompteException;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import lombok.RequiredArgsConstructor;

/**
 * Responsabilités des administrateurs (TRA-13), cochées par un super administrateur. Le filtre JWT relit le compte
 * à chaque requête : un ajout ou un retrait s'applique dès la requête suivante.
 */
@Service
@RequiredArgsConstructor
public class ResponsabilitesAdminService {
    private final UtilisateurRepository utilisateurRepository;
    private final GardeSuperAdministrateur garde;
    private final GestionComptesService gestionComptesService;
    private final TraceCompte trace;

    @Transactional
    public FicheCompteResponse modifier(UUID id, Set<PermissionAdmin> demandees, UtilisateurPrincipal principal) {
        garde.exiger(principal);
        Utilisateur compte = utilisateurRepository.findByIdForUpdate(id)
            .filter(Utilisateur::isEmailVerifie)
            .orElseThrow(CompteIntrouvableException::new);
        if (compte.getId().equals(principal.getUtilisateur().getId())) {
            throw new ConflitCompteException(
                "Vous ne pouvez pas modifier vos propres responsabilités : un autre super administrateur doit le faire.");
        }
        if (compte.getRole() != TypeRole.ADMIN) {
            throw new ConflitCompteException("Seul un compte d'administration a des responsabilités.");
        }
        if (demandees.contains(PermissionAdmin.CONSULTER_TABLEAU_DE_BORD)) {
            throw new IllegalArgumentException(
                "Le tableau de bord est ouvert à tout administrateur : ce n'est pas une responsabilité à cocher.");
        }
        // Un super administrateur a tout : on ne garde que ce statut, qui suffit.
        Set<PermissionAdmin> nouvelles = demandees.contains(PermissionAdmin.GERER_ADMINISTRATEURS)
            ? EnumSet.of(PermissionAdmin.GERER_ADMINISTRATEURS)
            : demandees.isEmpty() ? EnumSet.noneOf(PermissionAdmin.class) : EnumSet.copyOf(demandees);
        Set<PermissionAdmin> anciennes = compte.getPermissionsAdmin().isEmpty()
            ? EnumSet.noneOf(PermissionAdmin.class) : EnumSet.copyOf(compte.getPermissionsAdmin());
        if (anciennes.equals(nouvelles)) {
            throw new ConflitCompteException("Ce compte a déjà ces responsabilités.");
        }

        compte.getPermissionsAdmin().clear();
        compte.getPermissionsAdmin().addAll(nouvelles);
        trace.consigner(principal, compte, TypeActionAdmin.MODIFICATION_RESPONSABILITES, null,
            decrire(anciennes, Enum::name) + " → " + decrire(nouvelles, Enum::name));
        trace.notifier(compte, "Vos responsabilités sur EPT Alumni ont changé",
            "Bonjour " + NomCompte.salutation(compte) + ", un super administrateur de l'EPT a modifié vos responsabilités "
                + "d'administration. Elles sont désormais : " + decrire(nouvelles, PermissionAdmin::libelle)
                + ". Le changement s'applique dès maintenant.");
        return gestionComptesService.fiche(id);
    }

    private static String decrire(Set<PermissionAdmin> permissions, Function<PermissionAdmin, String> nom) {
        return permissions.isEmpty() ? "aucune" : permissions.stream().map(nom).collect(Collectors.joining(", "));
    }
}

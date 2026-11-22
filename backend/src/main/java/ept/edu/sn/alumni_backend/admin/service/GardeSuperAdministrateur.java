package ept.edu.sn.alumni_backend.admin.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.admin.PermissionAdmin;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import lombok.RequiredArgsConstructor;

/**
 * Toute décision qui fait entrer un compte dans l'administration, l'en fait sortir ou change ce qu'il peut y faire
 * (création, rôle, responsabilités, suspension, réactivation) est réservée à un super administrateur actif (TRA-13).
 *
 * Les super administrateurs actifs sont verrouillés avant le compte visé, toujours dans le même ordre : deux super
 * administrateurs qui se retirent mutuellement leur statut passent l'un après l'autre, et le second, qui ne l'est
 * plus, est refusé. Comme personne n'agit sur son propre compte, il reste toujours au moins un super administrateur.
 */
@Component
@RequiredArgsConstructor
public class GardeSuperAdministrateur {
    static final String REFUS = "Seul un super administrateur peut gérer les comptes d'administration.";

    private final UtilisateurRepository utilisateurRepository;

    /** À appeler dans la transaction de la décision, avant de verrouiller le compte visé. */
    @Transactional(propagation = Propagation.MANDATORY)
    public void exiger(UtilisateurPrincipal principal) {
        UUID auteur = principal.getUtilisateur().getId();
        List<Utilisateur> superAdministrateurs =
            utilisateurRepository.verrouillerAdministrateursActifsAvec(PermissionAdmin.GERER_ADMINISTRATEURS);
        if (superAdministrateurs.stream().noneMatch(compte -> compte.getId().equals(auteur))) {
            throw new SecurityException(REFUS);
        }
    }

    /** Exige un super administrateur si la décision touche un compte d'administration, ou en crée un. */
    @Transactional(propagation = Propagation.MANDATORY)
    public void exigerSiAdministration(UUID cibleId, TypeRole nouveauRole, UtilisateurPrincipal principal) {
        // Le rôle seul, sans charger le compte : il sera verrouillé ensuite, et relu à ce moment-là.
        boolean cibleAdministrateur = cibleId != null
            && utilisateurRepository.trouverRole(cibleId).map(role -> role == TypeRole.ADMIN).orElse(false);
        if (cibleAdministrateur || nouveauRole == TypeRole.ADMIN) {
            exiger(principal);
        }
    }
}

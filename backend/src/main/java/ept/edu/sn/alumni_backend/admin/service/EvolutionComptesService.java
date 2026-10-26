package ept.edu.sn.alumni_backend.admin.service;

import ept.edu.sn.alumni_backend.admin.NomCompte;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.admin.TypeActionAdmin;
import ept.edu.sn.alumni_backend.admin.dto.CompteAdminResponse;
import ept.edu.sn.alumni_backend.admin.dto.PromotionResponse;
import ept.edu.sn.alumni_backend.admin.dto.ResultatDiplomationResponse;
import ept.edu.sn.alumni_backend.admin.exception.CompteIntrouvableException;
import ept.edu.sn.alumni_backend.admin.exception.ConflitCompteException;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import lombok.RequiredArgsConstructor;

/**
 * Évolutions d'un compte décidées par l'administration : changement de rôle (GAEPT-5) et passage
 * d'étudiant à alumni (GAEPT-33). Le profil, les formations et les expériences sont conservés ;
 * le filtre JWT relit le rôle à chaque requête, le changement s'applique donc tout de suite.
 */
@Service
@RequiredArgsConstructor
public class EvolutionComptesService {
    private final UtilisateurRepository utilisateurRepository;
    private final GestionComptesService gestionComptesService;
    private final TraceCompte trace;

    @Transactional
    public CompteAdminResponse changerRole(UUID id, TypeRole nouveauRole, String motif, UtilisateurPrincipal principal) {
        Utilisateur compte = utilisateurRepository.findByIdForUpdate(id)
            .filter(Utilisateur::isEmailVerifie)
            .orElseThrow(CompteIntrouvableException::new);
        if (compte.getId().equals(principal.getUtilisateur().getId())) {
            throw new ConflitCompteException("Vous ne pouvez pas changer votre propre rôle.");
        }
        if (compte.getRole() == TypeRole.ORGANISME || nouveauRole == TypeRole.ORGANISME) {
            throw new ConflitCompteException("Le rôle Organisme est lié à une fiche d'organisme : il ne se change pas ici.");
        }
        if (compte.getStatutCompte() == StatutCompte.SUSPENDU) {
            throw new ConflitCompteException("Réactivez le compte avant de changer son rôle.");
        }
        if (compte.getRole() == nouveauRole) {
            throw new ConflitCompteException("Ce compte a déjà ce rôle.");
        }
        TypeRole ancienRole = compte.getRole();
        compte.setRole(nouveauRole);
        trace.consigner(principal, compte, TypeActionAdmin.CHANGEMENT_ROLE, motif, ancienRole.name() + " → " + nouveauRole.name());
        trace.notifier(compte, "Votre rôle sur EPT Alumni a changé",
            "Bonjour " + NomCompte.salutation(compte) + ", l'administration de l'EPT a modifié votre rôle sur EPT Alumni. Motif : " + motif);
        return gestionComptesService.reponse(compte);
    }

    /** Marque diplômés les étudiants choisis ; les autres comptes sont laissés de côté avec la raison. */
    @Transactional
    public ResultatDiplomationResponse marquerDiplomes(List<UUID> ids, int anneeSortie, UtilisateurPrincipal principal) {
        CreationComptesService.verifierAnnees(null, anneeSortie);
        int diplomes = 0;
        List<ResultatDiplomationResponse.Ignore> ignores = new ArrayList<>();
        for (UUID id : new LinkedHashSet<>(ids)) {
            Utilisateur compte = utilisateurRepository.findByIdForUpdate(id).filter(Utilisateur::isEmailVerifie).orElse(null);
            String raison = compte == null ? "Compte introuvable."
                : compte.getRole() != TypeRole.ETUDIANT ? "Ce compte n'est pas un compte étudiant."
                : compte.getStatutCompte() == StatutCompte.SUSPENDU ? "Ce compte est suspendu."
                : compte.getAnneeEntree() != null && anneeSortie < compte.getAnneeEntree()
                    ? "L'année de sortie précède son année d'entrée (" + compte.getAnneeEntree() + ")." : null;
            if (raison != null) {
                ignores.add(new ResultatDiplomationResponse.Ignore(id, compte == null ? null : nomComplet(compte), raison));
                continue;
            }
            compte.setRole(TypeRole.ALUMNI);
            compte.setAnneeSortie(anneeSortie);
            trace.consigner(principal, compte, TypeActionAdmin.DIPLOMATION, null, "Promotion " + anneeSortie);
            trace.notifier(compte, "Félicitations, vous êtes alumni de l'EPT",
                "Bonjour " + NomCompte.salutation(compte) + ", l'administration de l'EPT a enregistré votre diplôme (promotion "
                + anneeSortie + "). Votre compte EPT Alumni est désormais un compte alumni ; votre parcours est conservé.");
            diplomes++;
        }
        return new ResultatDiplomationResponse(diplomes, ignores);
    }

    /** Promotions d'entrée où il reste des étudiants, pour choisir qui marquer diplômé. */
    @Transactional(readOnly = true)
    public List<PromotionResponse> promotionsEtudiantes() {
        return utilisateurRepository.compterEtudiantsParPromotion().stream()
            .map(ligne -> new PromotionResponse(ligne.getAnneeEntree(), ligne.getFiliere(), ligne.getNombre()))
            .toList();
    }

    private static String nomComplet(Utilisateur utilisateur) {
        return NomCompte.complet(utilisateur);
    }
}

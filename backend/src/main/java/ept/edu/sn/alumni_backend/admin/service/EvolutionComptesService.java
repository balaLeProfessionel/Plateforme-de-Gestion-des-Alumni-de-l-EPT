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
import ept.edu.sn.alumni_backend.admin.dto.ClasseEtudianteResponse;
import ept.edu.sn.alumni_backend.admin.dto.ResultatDiplomationResponse;
import ept.edu.sn.alumni_backend.admin.dto.ResultatPassageResponse;
import ept.edu.sn.alumni_backend.admin.exception.CompteIntrouvableException;
import ept.edu.sn.alumni_backend.admin.exception.ConflitCompteException;
import ept.edu.sn.alumni_backend.enums.Classe;
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
    private final GardeSuperAdministrateur garde;

    @Transactional
    public CompteAdminResponse changerRole(UUID id, TypeRole nouveauRole, String motif, UtilisateurPrincipal principal) {
        garde.exigerSiAdministration(id, nouveauRole, principal);
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
        if (nouveauRole == TypeRole.ADMIN && compte.getStatutCompte() != StatutCompte.ACTIF) {
            throw new ConflitCompteException("Validez d'abord l'inscription de ce compte : le rôle Administration ne se donne qu'à un compte vérifié.");
        }
        TypeRole ancienRole = compte.getRole();
        compte.setRole(nouveauRole);
        // La classe n'a de sens que pour un étudiant.
        if (nouveauRole != TypeRole.ETUDIANT) compte.setClasse(null);
        // Hors de l'administration, un compte n'a plus de responsabilités ; un nouvel administrateur n'en a pas encore.
        compte.getPermissionsAdmin().clear();
        trace.consigner(principal, compte, TypeActionAdmin.CHANGEMENT_ROLE, motif, ancienRole.name() + " → " + nouveauRole.name());
        trace.notifier(compte, "Votre rôle sur EPT Alumni a changé",
            "Bonjour " + NomCompte.salutation(compte) + ", l'administration de l'EPT a modifié votre rôle sur EPT Alumni : votre compte a désormais le rôle "
                + NomCompte.role(nouveauRole) + ". Motif : " + motif);
        return gestionComptesService.reponse(compte);
    }

    /** Classe d'un étudiant : passage en classe supérieure ou correction, consigné au journal. */
    @Transactional
    public CompteAdminResponse changerClasse(UUID id, Classe classe, UtilisateurPrincipal principal) {
        Utilisateur compte = utilisateurRepository.findByIdForUpdate(id)
            .filter(Utilisateur::isEmailVerifie)
            .orElseThrow(CompteIntrouvableException::new);
        if (compte.getRole() != TypeRole.ETUDIANT) {
            throw new ConflitCompteException("Seul un compte étudiant a une classe.");
        }
        if (compte.getClasse() == classe) {
            throw new ConflitCompteException("Ce compte est déjà dans cette classe.");
        }
        String avant = compte.getClasse() == null ? "non renseignée" : compte.getClasse().libelle();
        compte.setClasse(classe);
        trace.consigner(principal, compte, TypeActionAdmin.MODIFICATION_CLASSE, null, avant + " → " + classe.libelle());
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
                ignores.add(new ResultatDiplomationResponse.Ignore(id, compte == null ? null : NomCompte.complet(compte), raison));
                continue;
            }
            compte.setRole(TypeRole.ALUMNI);
            compte.setAnneeSortie(anneeSortie);
            compte.setClasse(null);
            trace.consigner(principal, compte, TypeActionAdmin.DIPLOMATION, null, "Promotion " + anneeSortie);
            trace.notifier(compte, "Félicitations, vous êtes alumni de l'EPT",
                "Bonjour " + NomCompte.salutation(compte) + ", l'administration de l'EPT a enregistré votre diplôme (promotion "
                + anneeSortie + "). Votre compte EPT Alumni est désormais un compte alumni ; votre parcours est conservé.");
            diplomes++;
        }
        return new ResultatDiplomationResponse(diplomes, ignores);
    }

    /**
     * Passage annuel en masse : chaque étudiant choisi, encore dans la classe de départ, passe dans la classe
     * d'arrivée ; un compte suspendu, qui n'est plus étudiant ou dont la classe a changé entre-temps est laissé de côté.
     */
    @Transactional
    public ResultatPassageResponse passerEnClasse(List<UUID> ids, Classe depart, Classe arrivee, UtilisateurPrincipal principal) {
        if (depart == arrivee) {
            throw new IllegalArgumentException("La classe d'arrivée doit différer de la classe de départ.");
        }
        String detail = (depart == null ? "non renseignée" : depart.libelle()) + " → " + arrivee.libelle() + " (passage annuel)";
        int passes = 0;
        List<ResultatDiplomationResponse.Ignore> ignores = new ArrayList<>();
        // Ordre fixe des verrous : deux passages simultanés ne se bloquent pas mutuellement.
        for (UUID id : new java.util.TreeSet<>(ids)) {
            Utilisateur compte = utilisateurRepository.findByIdForUpdate(id).filter(Utilisateur::isEmailVerifie).orElse(null);
            String raison = compte == null ? "Compte introuvable."
                : compte.getRole() != TypeRole.ETUDIANT ? "Ce compte n'est pas un compte étudiant."
                : compte.getStatutCompte() == StatutCompte.SUSPENDU ? "Ce compte est suspendu."
                : compte.getClasse() != depart ? "Sa classe a changé entre-temps ("
                    + (compte.getClasse() == null ? "non renseignée" : compte.getClasse().libelle()) + ")." : null;
            if (raison != null) {
                ignores.add(new ResultatDiplomationResponse.Ignore(id, compte == null ? null : NomCompte.complet(compte), raison));
                continue;
            }
            compte.setClasse(arrivee);
            trace.consigner(principal, compte, TypeActionAdmin.MODIFICATION_CLASSE, null, detail);
            passes++;
        }
        return new ResultatPassageResponse(passes, ignores);
    }

    /** Étudiants par classe et filière, pour choisir qui faire passer ; les classes dans l'ordre du cursus. */
    @Transactional(readOnly = true)
    public List<ClasseEtudianteResponse> classesEtudiantes() {
        return utilisateurRepository.compterEtudiantsParClasse().stream()
            .sorted(java.util.Comparator.comparing((UtilisateurRepository.ClasseEtudianteProjection l) -> l.getClasse(),
                    java.util.Comparator.nullsLast(java.util.Comparator.naturalOrder()))
                .thenComparing(UtilisateurRepository.ClasseEtudianteProjection::getFiliere,
                    java.util.Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
            .map(l -> new ClasseEtudianteResponse(l.getClasse() == null ? null : l.getClasse().name(), l.getFiliere(), l.getNombre()))
            .toList();
    }

    /** Promotions d'entrée où il reste des étudiants, pour choisir qui marquer diplômé. */
    @Transactional(readOnly = true)
    public List<PromotionResponse> promotionsEtudiantes() {
        return utilisateurRepository.compterEtudiantsParPromotion().stream()
            .map(ligne -> new PromotionResponse(ligne.getAnneeEntree(), ligne.getFiliere(), ligne.getNombre()))
            .toList();
    }

}

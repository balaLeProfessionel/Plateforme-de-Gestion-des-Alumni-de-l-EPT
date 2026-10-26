package ept.edu.sn.alumni_backend.admin.service;

import ept.edu.sn.alumni_backend.admin.NomCompte;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.admin.TypeActionAdmin;
import ept.edu.sn.alumni_backend.admin.dto.ActionAdminResponse;
import ept.edu.sn.alumni_backend.admin.dto.CompteAdminResponse;
import ept.edu.sn.alumni_backend.admin.dto.FicheCompteResponse;
import ept.edu.sn.alumni_backend.admin.dto.ResumeComptesResponse;
import ept.edu.sn.alumni_backend.admin.entity.ActionAdmin;
import ept.edu.sn.alumni_backend.admin.evenement.NotificationCompte;
import ept.edu.sn.alumni_backend.admin.exception.CompteIntrouvableException;
import ept.edu.sn.alumni_backend.admin.exception.ConflitCompteException;
import ept.edu.sn.alumni_backend.admin.repository.ActionAdminRepository;
import ept.edu.sn.alumni_backend.admin.repository.ActionAdminRepository.NombreParCibleProjection;
import ept.edu.sn.alumni_backend.annuaire.dto.PageResponse;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.security.RefreshTokenService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import jakarta.persistence.criteria.JoinType;
import lombok.RequiredArgsConstructor;

/**
 * Validation des inscriptions et suspension des comptes (GAEPT-3, GAEPT-6).
 * Un refus d'inscription suspend le compte avec son motif ; chaque décision est journalisée
 * et notifiée au titulaire. Un compte dont l'email n'est pas vérifié n'est pas encore une
 * inscription : il reste hors de ces listes.
 */
@Service
@RequiredArgsConstructor
public class GestionComptesService {
    private static final Set<TypeActionAdmin> ACTIONS_SUSPENDANTES =
        EnumSet.of(TypeActionAdmin.SUSPENSION, TypeActionAdmin.REFUS_INSCRIPTION);

    private final UtilisateurRepository utilisateurRepository;
    private final ActionAdminRepository actionAdminRepository;
    private final RefreshTokenService refreshTokenService;
    private final ApplicationEventPublisher evenements;

    @Transactional(readOnly = true)
    public PageResponse<CompteAdminResponse> rechercher(
            String recherche, TypeRole role, StatutCompte statut, int page, int taille) {
        return rechercher(recherche, role, statut, null, null, page, taille);
    }

    @Transactional(readOnly = true)
    public PageResponse<CompteAdminResponse> rechercher(String recherche, TypeRole role, StatutCompte statut,
            Integer anneeEntree, String filiere, int page, int taille) {
        Specification<Utilisateur> specification = (racine, requete, cb) -> cb.isTrue(racine.get("emailVerifie"));
        if (role != null) {
            specification = specification.and((racine, requete, cb) -> cb.equal(racine.get("role"), role));
        }
        if (statut != null) {
            specification = specification.and((racine, requete, cb) -> cb.equal(racine.get("statutCompte"), statut));
        }
        if (anneeEntree != null) {
            specification = specification.and((racine, requete, cb) -> cb.equal(racine.get("anneeEntree"), anneeEntree));
        }
        if (filiere != null && !filiere.isBlank()) {
            String valeur = filiere.trim().toLowerCase(Locale.ROOT);
            specification = specification.and((racine, requete, cb) -> cb.equal(cb.lower(racine.get("filiere")), valeur));
        }
        if (recherche != null && !recherche.isBlank()) {
            String motif = "%" + recherche.trim().toLowerCase(Locale.ROOT) + "%";
            specification = specification.and((racine, requete, cb) -> cb.or(
                cb.like(cb.lower(racine.get("nom")), motif),
                cb.like(cb.lower(racine.get("prenom")), motif),
                cb.like(cb.lower(racine.get("email")), motif),
                cb.like(cb.lower(racine.join("organisme", JoinType.LEFT).get("nom")), motif),
                cb.like(cb.lower(cb.concat(cb.concat(racine.get("prenom"), " "), racine.get("nom"))), motif)
            ));
        }
        // Les inscriptions à examiner se traitent dans l'ordre d'arrivée ; le reste par nom.
        Sort tri = statut == StatutCompte.EN_ATTENTE
            ? Sort.by("dateCreation", "id").ascending()
            : Sort.by("nom", "prenom", "id");
        Page<Utilisateur> comptes = utilisateurRepository.findAll(specification, PageRequest.of(page, taille, tri));

        List<UUID> suspendus = comptes.stream()
            .filter(compte -> compte.getStatutCompte() == StatutCompte.SUSPENDU)
            .map(Utilisateur::getId)
            .toList();
        Map<UUID, String> motifs = suspendus.isEmpty() ? Map.of()
            : actionAdminRepository.dernieresActions(suspendus, ACTIONS_SUSPENDANTES).stream()
                .filter(action -> action.getMotif() != null)
                .collect(Collectors.toMap(action -> action.getCible().getId(), ActionAdmin::getMotif, (a, b) -> a));
        List<UUID> ids = comptes.map(Utilisateur::getId).getContent();
        Map<UUID, Long> decisions = ids.isEmpty() ? Map.of()
            : actionAdminRepository.compterParCibles(ids).stream()
                .collect(Collectors.toMap(NombreParCibleProjection::getCibleId, NombreParCibleProjection::getNombre));
        return PageResponse.depuis(comptes.map(compte ->
            versReponse(compte, motifs.get(compte.getId()), decisions.getOrDefault(compte.getId(), 0L))));
    }

    @Transactional(readOnly = true)
    public ResumeComptesResponse resume() {
        Map<String, Long> enAttenteParRole = new TreeMap<>();
        utilisateurRepository.compterParRole(StatutCompte.EN_ATTENTE)
            .forEach(ligne -> enAttenteParRole.put(ligne.getRole().name(), ligne.getNombre()));
        return new ResumeComptesResponse(
            utilisateurRepository.countByStatutCompteAndEmailVerifieTrue(StatutCompte.EN_ATTENTE),
            utilisateurRepository.countByStatutCompteAndEmailVerifieTrue(StatutCompte.ACTIF),
            utilisateurRepository.countByStatutCompteAndEmailVerifieTrue(StatutCompte.SUSPENDU),
            enAttenteParRole);
    }

    @Transactional(readOnly = true)
    public FicheCompteResponse fiche(UUID id) {
        Utilisateur compte = utilisateurRepository.findById(id)
            .filter(Utilisateur::isEmailVerifie)
            .orElseThrow(CompteIntrouvableException::new);
        String motif = compte.getStatutCompte() != StatutCompte.SUSPENDU ? null
            : actionAdminRepository.dernieresActions(List.of(id), ACTIONS_SUSPENDANTES).stream()
                .map(ActionAdmin::getMotif).filter(java.util.Objects::nonNull).findFirst().orElse(null);
        return new FicheCompteResponse(versReponse(compte, motif, nombreDecisions(compte)),
            compte.getVilleResidence(), compte.getPosteActuel(), compte.getLienLinkedin(), compte.getLienPortfolio(),
            compte.getBio(), compte.getDiplome() == null ? null : compte.getDiplome().name(), compte.getDateNaissance(),
            compte.isDoitChangerMotDePasse(), compte.getFormations().size(), compte.getExperiences().size());
    }

    @Transactional(readOnly = true)
    public List<ActionAdminResponse> historique(UUID id) {
        if (!utilisateurRepository.existsById(id)) {
            throw new CompteIntrouvableException();
        }
        return actionAdminRepository.findByCible_IdOrderByDateActionDesc(id).stream()
            .map(action -> new ActionAdminResponse(action.getId(), action.getType().name(), action.getMotif(),
                action.getDetails(), action.getDateAction(), nomComplet(action.getAdmin())))
            .toList();
    }

    @Transactional
    public CompteAdminResponse valider(UUID id, UtilisateurPrincipal principal) {
        Utilisateur compte = chargerInscription(id, "valider");
        compte.setStatutCompte(StatutCompte.ACTIF);
        if (compte.getOrganisme() != null) {
            compte.getOrganisme().setStatutValidation(StatutCompte.ACTIF);
        }
        journaliser(principal, compte, TypeActionAdmin.VALIDATION_INSCRIPTION, null);
        notifier(compte, "Votre inscription est validée",
            "Bonjour " + NomCompte.salutation(compte) + ", l'administration de l'EPT a vérifié votre inscription. "
            + "Votre compte est désormais reconnu sur EPT Alumni.");
        return versReponse(compte, null, nombreDecisions(compte));
    }

    @Transactional
    public CompteAdminResponse refuser(UUID id, String motif, UtilisateurPrincipal principal) {
        Utilisateur compte = chargerInscription(id, "refuser");
        compte.setStatutCompte(StatutCompte.SUSPENDU);
        if (compte.getOrganisme() != null) {
            compte.getOrganisme().setStatutValidation(StatutCompte.SUSPENDU);
        }
        refreshTokenService.supprimerTousPour(compte);
        journaliser(principal, compte, TypeActionAdmin.REFUS_INSCRIPTION, motif);
        notifier(compte, "Votre inscription n'a pas été retenue",
            "Bonjour " + NomCompte.salutation(compte) + ", l'administration de l'EPT n'a pas pu valider votre inscription. "
            + "Motif : " + motif);
        return versReponse(compte, motif, nombreDecisions(compte));
    }

    @Transactional
    public CompteAdminResponse suspendre(UUID id, String motif, UtilisateurPrincipal principal) {
        Utilisateur compte = chargerPourModification(id);
        if (compte.getId().equals(principal.getUtilisateur().getId())) {
            throw new ConflitCompteException("Vous ne pouvez pas suspendre votre propre compte.");
        }
        if (compte.getStatutCompte() == StatutCompte.EN_ATTENTE) {
            throw new ConflitCompteException(
                "Cette inscription est en attente : refusez-la plutôt que de suspendre le compte.");
        }
        if (compte.getStatutCompte() != StatutCompte.ACTIF) {
            throw new ConflitCompteException("Ce compte est déjà suspendu.");
        }
        compte.setStatutCompte(StatutCompte.SUSPENDU);
        // Le filtre JWT relit le statut à chaque requête : l'accès est coupé tout de suite.
        refreshTokenService.supprimerTousPour(compte);
        journaliser(principal, compte, TypeActionAdmin.SUSPENSION, motif);
        notifier(compte, "Votre compte est suspendu",
            "Bonjour " + NomCompte.salutation(compte) + ", votre compte EPT Alumni a été suspendu par l'administration. "
            + "Motif : " + motif);
        return versReponse(compte, motif, nombreDecisions(compte));
    }

    @Transactional
    public CompteAdminResponse reactiver(UUID id, String motif, UtilisateurPrincipal principal) {
        Utilisateur compte = chargerPourModification(id);
        if (compte.getStatutCompte() != StatutCompte.SUSPENDU) {
            throw new ConflitCompteException("Ce compte n'est pas suspendu.");
        }
        compte.setStatutCompte(StatutCompte.ACTIF);
        if (compte.getOrganisme() != null) {
            compte.getOrganisme().setStatutValidation(StatutCompte.ACTIF);
        }
        String motifNettoye = motif == null || motif.isBlank() ? null : motif.trim();
        journaliser(principal, compte, TypeActionAdmin.REACTIVATION, motifNettoye);
        notifier(compte, "Votre compte est réactivé",
            "Bonjour " + NomCompte.salutation(compte) + ", votre compte EPT Alumni est de nouveau actif. "
            + "Vous pouvez vous reconnecter.");
        return versReponse(compte, null, nombreDecisions(compte));
    }

    /** Verrouille le compte : deux administrateurs ne décident pas en même temps. */
    private Utilisateur chargerPourModification(UUID id) {
        return utilisateurRepository.findByIdForUpdate(id)
            .filter(Utilisateur::isEmailVerifie)
            .orElseThrow(CompteIntrouvableException::new);
    }

    private Utilisateur chargerInscription(UUID id, String verbe) {
        Utilisateur compte = chargerPourModification(id);
        if (compte.getStatutCompte() != StatutCompte.EN_ATTENTE) {
            throw new ConflitCompteException("Cette inscription a déjà été traitée : impossible de la " + verbe + ".");
        }
        return compte;
    }

    private void journaliser(UtilisateurPrincipal principal, Utilisateur cible, TypeActionAdmin type, String motif) {
        actionAdminRepository.save(new ActionAdmin(principal.getUtilisateur(), cible, type, motif));
    }

    private void notifier(Utilisateur compte, String sujet, String message) {
        evenements.publishEvent(new NotificationCompte(compte.getEmail(), sujet, message));
    }

    private static String nomComplet(Utilisateur utilisateur) {
        return NomCompte.complet(utilisateur);
    }

    /** Réponse d'une décision prise ailleurs (rôle, diplomation) : le compte tel qu'il est maintenant. */
    public CompteAdminResponse reponse(Utilisateur compte) {
        return versReponse(compte, null, nombreDecisions(compte));
    }

    private long nombreDecisions(Utilisateur compte) {
        return actionAdminRepository.compterParCibles(List.of(compte.getId())).stream()
            .mapToLong(NombreParCibleProjection::getNombre).sum();
    }

    private static CompteAdminResponse versReponse(Utilisateur compte, String motifSuspension, long nombreDecisions) {
        return new CompteAdminResponse(
            compte.getId(), compte.getPrenom(), compte.getNom(), compte.getEmail(), compte.getTelephone(),
            compte.getRole().name(), compte.getStatutCompte().name(), compte.getFiliere(),
            compte.getAnneeEntree(), compte.getAnneeSortie(),
            compte.getOrganisme() == null ? null : compte.getOrganisme().getNom(),
            compte.getOrganisme() == null ? null : compte.getOrganisme().getId(),
            compte.getUrlPhoto(), compte.getDateCreation(), motifSuspension, nombreDecisions);
    }
}

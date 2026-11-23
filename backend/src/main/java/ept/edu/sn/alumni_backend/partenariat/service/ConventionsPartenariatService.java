package ept.edu.sn.alumni_backend.partenariat.service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.admin.NomCompte;
import ept.edu.sn.alumni_backend.admin.PermissionAdmin;
import ept.edu.sn.alumni_backend.annuaire.dto.PageResponse;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.notification.NouvelleNotification;
import ept.edu.sn.alumni_backend.notification.TypeNotification;
import ept.edu.sn.alumni_backend.organisme.entity.Organisme;
import ept.edu.sn.alumni_backend.organisme.exception.OrganismeIntrouvableException;
import ept.edu.sn.alumni_backend.organisme.repository.OrganismeRepository;
import ept.edu.sn.alumni_backend.partenariat.ActionConvention;
import ept.edu.sn.alumni_backend.partenariat.OrigineConvention;
import ept.edu.sn.alumni_backend.partenariat.StatutConvention;
import ept.edu.sn.alumni_backend.partenariat.dto.ActivationConventionRequest;
import ept.edu.sn.alumni_backend.partenariat.dto.ConventionResponse;
import ept.edu.sn.alumni_backend.partenariat.dto.DemandeConventionRequest;
import ept.edu.sn.alumni_backend.partenariat.dto.HistoriqueConventionResponse;
import ept.edu.sn.alumni_backend.partenariat.dto.ModificationConventionRequest;
import ept.edu.sn.alumni_backend.partenariat.dto.PieceConventionResponse;
import ept.edu.sn.alumni_backend.partenariat.dto.SaisieConventionRequest;
import ept.edu.sn.alumni_backend.partenariat.entity.ConventionPartenariat;
import ept.edu.sn.alumni_backend.partenariat.entity.HistoriqueConvention;
import ept.edu.sn.alumni_backend.partenariat.entity.PieceConventionPartenariat;
import ept.edu.sn.alumni_backend.partenariat.exception.ConflitConventionException;
import ept.edu.sn.alumni_backend.partenariat.exception.ConventionIntrouvableException;
import ept.edu.sn.alumni_backend.partenariat.repository.ConventionPartenariatRepository;
import ept.edu.sn.alumni_backend.partenariat.repository.HistoriqueConventionRepository;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import lombok.RequiredArgsConstructor;

/**
 * Conventions-cadres de partenariat : demande de l'organisme, traitement par le service des Relations extérieures,
 * validité et expiration. Chaque opération est consignée dans l'historique de la convention, dans sa transaction.
 */
@Service
@RequiredArgsConstructor
public class ConventionsPartenariatService {
    static final ZoneId THIES = ZoneId.of("Africa/Dakar");
    /** Une convention active « arrive à expiration » dans ses 60 derniers jours. */
    static final int JOURS_ALERTE = 60;
    private static final DateTimeFormatter FORMAT_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy", Locale.FRENCH);

    private final ConventionPartenariatRepository conventionRepository;
    private final HistoriqueConventionRepository historiqueRepository;
    private final OrganismeRepository organismeRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final ApplicationEventPublisher evenements;

    // ----- Organisme -----

    @Transactional
    public ConventionResponse demander(DemandeConventionRequest request, UtilisateurPrincipal principal) {
        Utilisateur auteur = principal.getUtilisateur();
        Organisme organisme = organismeDemandeur(auteur);
        if (conventionRepository.existsByOrganisme_IdAndStatutIn(organisme.getId(), StatutConvention.EN_COURS)) {
            throw new ConflitConventionException("Une demande de convention est déjà en cours de traitement : suivez-la ou annulez-la avant d'en déposer une autre.");
        }
        ConventionPartenariat convention = new ConventionPartenariat();
        convention.setOrganisme(organisme);
        convention.setOrigine(OrigineConvention.ORGANISME);
        convention.setStatut(StatutConvention.DEMANDEE);
        convention.setCreePar(auteur);
        appliquerDemande(convention, request);
        convention = conventionRepository.save(convention);
        consigner(convention, ActionConvention.DEMANDE, null, null, auteur);
        notifierChefs("Demande de convention", organisme.getNom() + " demande une convention de partenariat : « " + convention.getObjet() + " ».", convention);
        return reponse(convention, auteur, true);
    }

    @Transactional
    public ConventionResponse modifierDemande(UUID id, DemandeConventionRequest request, UtilisateurPrincipal principal) {
        Utilisateur auteur = principal.getUtilisateur();
        ConventionPartenariat convention = chargerPourOrganisme(id, auteur, true);
        if (convention.getStatut() != StatutConvention.DEMANDEE) {
            throw new ConflitConventionException("L'école examine déjà votre demande : elle ne peut plus être modifiée.");
        }
        appliquerDemande(convention, request);
        consigner(convention, ActionConvention.MODIFICATION_DEMANDE, null, null, auteur);
        return reponse(convention, auteur, true);
    }

    /** L'organisme retire sa demande tant qu'elle n'est pas conclue ; elle reste dans l'historique. */
    @Transactional
    public ConventionResponse annuler(UUID id, UtilisateurPrincipal principal) {
        Utilisateur auteur = principal.getUtilisateur();
        ConventionPartenariat convention = chargerPourOrganisme(id, auteur, true);
        if (convention.getOrigine() != OrigineConvention.ORGANISME || !convention.getStatut().estEnCours()) {
            throw new ConflitConventionException("Seule une demande en cours de traitement peut être annulée.");
        }
        String details = convention.getStatut() + " → " + StatutConvention.ANNULEE;
        convention.setStatut(StatutConvention.ANNULEE);
        consigner(convention, ActionConvention.ANNULATION, details, null, auteur);
        notifierChefs("Demande de convention annulée", convention.getOrganisme().getNom() + " a annulé sa demande « " + convention.getObjet() + " ».", convention);
        return reponse(convention, auteur, true);
    }

    @Transactional(readOnly = true)
    public List<ConventionResponse> mesConventions(UtilisateurPrincipal principal) {
        Utilisateur auteur = principal.getUtilisateur();
        Organisme organisme = organismeDuCompte(auteur);
        return conventionRepository.findByOrganisme_IdOrderByCreeeLeDesc(organisme.getId()).stream()
            .map(c -> reponse(c, auteur, false)).toList();
    }

    @Transactional(readOnly = true)
    public ConventionResponse detailPourOrganisme(UUID id, UtilisateurPrincipal principal) {
        Utilisateur auteur = principal.getUtilisateur();
        return reponse(chargerPourOrganisme(id, auteur, false), auteur, true);
    }

    @Transactional(readOnly = true)
    public List<HistoriqueConventionResponse> historiquePourOrganisme(UUID id, UtilisateurPrincipal principal) {
        return historique(chargerPourOrganisme(id, principal.getUtilisateur(), false).getId());
    }

    // ----- Service des Relations extérieures -----

    @Transactional(readOnly = true)
    public PageResponse<ConventionResponse> lister(StatutConvention statut, UUID organismeId, String recherche, boolean expireBientot,
            int page, int taille, UtilisateurPrincipal principal) {
        Specification<ConventionPartenariat> filtre = Specification.unrestricted();
        if (statut != null) filtre = filtre.and((r, q, cb) -> cb.equal(r.get("statut"), statut));
        if (organismeId != null) filtre = filtre.and((r, q, cb) -> cb.equal(r.get("organisme").get("id"), organismeId));
        if (recherche != null && !recherche.isBlank()) {
            String motif = "%" + recherche.strip().toLowerCase(Locale.ROOT) + "%";
            filtre = filtre.and((r, q, cb) -> cb.or(cb.like(cb.lower(r.get("objet")), motif), cb.like(cb.lower(r.get("organisme").get("nom")), motif)));
        }
        if (expireBientot) {
            LocalDate limite = aujourdhui().plusDays(JOURS_ALERTE);
            filtre = filtre.and((r, q, cb) -> cb.and(cb.equal(r.get("statut"), StatutConvention.ACTIVE), cb.lessThanOrEqualTo(r.get("dateFin"), limite)));
        }
        Utilisateur lecteur = principal.getUtilisateur();
        return PageResponse.depuis(conventionRepository.findAll(filtre, PageRequest.of(page, taille, Sort.by(Sort.Direction.DESC, "modifieeLe")))
            .map(c -> reponse(c, lecteur, false)));
    }

    @Transactional(readOnly = true)
    public ConventionResponse detail(UUID id, UtilisateurPrincipal principal) {
        return reponse(conventionRepository.findById(id).orElseThrow(ConventionIntrouvableException::new), principal.getUtilisateur(), true);
    }

    @Transactional(readOnly = true)
    public List<HistoriqueConventionResponse> historique(UUID id) {
        if (!conventionRepository.existsById(id)) throw new ConventionIntrouvableException();
        return historiqueRepository.findByConventionIdOrderByDateActionAsc(id).stream()
            .map(h -> new HistoriqueConventionResponse(h.getAction(), h.getDetails(), h.getMotif(),
                h.getAuteur() == null ? "Plateforme" : NomCompte.complet(h.getAuteur()), h.getDateAction()))
            .toList();
    }

    /** Convention signée hors plateforme (ACTIVE) ou en cours de négociation, enregistrée par l'école. */
    @Transactional
    public ConventionResponse saisir(SaisieConventionRequest request, UtilisateurPrincipal principal) {
        Utilisateur auteur = principal.getUtilisateur();
        if (request.statut() != StatutConvention.ACTIVE && request.statut() != StatutConvention.EN_NEGOCIATION) {
            throw new IllegalArgumentException("Une convention saisie est active (déjà signée) ou en négociation.");
        }
        Organisme organisme = organismeRepository.findById(request.organismeId()).orElseThrow(OrganismeIntrouvableException::new);
        if (organisme.isEtablissementEpt()) throw new IllegalArgumentException("L'EPT ne signe pas de convention avec elle-même.");
        ConventionPartenariat convention = new ConventionPartenariat();
        convention.setOrganisme(organisme);
        convention.setOrigine(OrigineConvention.ECOLE);
        convention.setStatut(request.statut());
        convention.setCreePar(auteur);
        convention.setObjet(request.objet().strip());
        convention.setDomaines(texte(request.domaines()));
        if (request.statut() == StatutConvention.ACTIVE) {
            verifierDates(request.dateSignature(), request.dateDebut(), request.dateFin());
            convention.setDateSignature(request.dateSignature());
            convention.setDateDebut(request.dateDebut());
            convention.setDateFin(request.dateFin());
        }
        convention = conventionRepository.save(convention);
        consigner(convention, ActionConvention.SAISIE, String.valueOf(request.statut()), null, auteur);
        notifierOrganisme(convention, request.statut() == StatutConvention.ACTIVE ? "Convention de partenariat enregistrée" : "Convention de partenariat en négociation",
            "L'EPT a enregistré la convention « " + convention.getObjet() + " »" + periode(convention) + ".");
        return reponse(convention, auteur, true);
    }

    /** Correction de l'objet, des domaines et, pour une convention active, des dates de validité. */
    @Transactional
    public ConventionResponse modifier(UUID id, ModificationConventionRequest request, UtilisateurPrincipal principal) {
        Utilisateur auteur = principal.getUtilisateur();
        ConventionPartenariat convention = verrouiller(id);
        StatutConvention statut = convention.getStatut();
        if (!statut.estEnCours() && statut != StatutConvention.ACTIVE) {
            throw new ConflitConventionException("Une convention " + libelle(statut) + " ne se modifie plus : elle reste telle quelle dans l'historique.");
        }
        List<String> changements = new ArrayList<>();
        if (!Objects.equals(convention.getObjet(), request.objet().strip())) changements.add("objet");
        if (!Objects.equals(convention.getDomaines(), texte(request.domaines()))) changements.add("domaines");
        convention.setObjet(request.objet().strip());
        convention.setDomaines(texte(request.domaines()));
        if (statut == StatutConvention.ACTIVE) {
            verifierDates(request.dateSignature(), request.dateDebut(), request.dateFin());
            ajouterChangement(changements, "signature", convention.getDateSignature(), request.dateSignature());
            ajouterChangement(changements, "début", convention.getDateDebut(), request.dateDebut());
            if (!Objects.equals(convention.getDateFin(), request.dateFin())) {
                ajouterChangement(changements, "fin", convention.getDateFin(), request.dateFin());
                convention.setAlerteExpirationEnvoyee(false);
            }
            convention.setDateSignature(request.dateSignature());
            convention.setDateDebut(request.dateDebut());
            convention.setDateFin(request.dateFin());
        }
        if (!changements.isEmpty()) consigner(convention, ActionConvention.MODIFICATION, String.join(" ; ", changements), null, auteur);
        return reponse(convention, auteur, true);
    }

    @Transactional
    public ConventionResponse examiner(UUID id, UtilisateurPrincipal principal) {
        ConventionPartenariat convention = transition(id, StatutConvention.EN_EXAMEN, ActionConvention.EXAMEN, null, principal);
        notifierOrganisme(convention, "Demande de convention en examen", "L'EPT examine votre demande « " + convention.getObjet() + " ».");
        return reponse(convention, principal.getUtilisateur(), true);
    }

    @Transactional
    public ConventionResponse negocier(UUID id, UtilisateurPrincipal principal) {
        ConventionPartenariat convention = transition(id, StatutConvention.EN_NEGOCIATION, ActionConvention.NEGOCIATION, null, principal);
        notifierOrganisme(convention, "Convention en négociation", "Votre demande « " + convention.getObjet() + " » passe en négociation avec l'EPT.");
        return reponse(convention, principal.getUtilisateur(), true);
    }

    @Transactional
    public ConventionResponse activer(UUID id, ActivationConventionRequest request, UtilisateurPrincipal principal) {
        verifierDates(request.dateSignature(), request.dateDebut(), request.dateFin());
        ConventionPartenariat convention = verrouiller(id);
        verifierTransition(convention, StatutConvention.ACTIVE);
        convention.setDateSignature(request.dateSignature());
        convention.setDateDebut(request.dateDebut());
        convention.setDateFin(request.dateFin());
        convention.setAlerteExpirationEnvoyee(false);
        convention.setMotifDecision(null);
        String details = convention.getStatut() + " → ACTIVE" + periode(convention);
        convention.setStatut(StatutConvention.ACTIVE);
        consigner(convention, ActionConvention.ACTIVATION, details, null, principal.getUtilisateur());
        notifierOrganisme(convention, "Convention de partenariat signée", "La convention « " + convention.getObjet() + " » est active" + periode(convention) + ".");
        return reponse(convention, principal.getUtilisateur(), true);
    }

    @Transactional
    public ConventionResponse refuser(UUID id, String motif, UtilisateurPrincipal principal) {
        ConventionPartenariat convention = transition(id, StatutConvention.REFUSEE, ActionConvention.REFUS, motif, principal);
        notifierOrganisme(convention, "Demande de convention refusée", "L'EPT ne donne pas suite à la demande « " + convention.getObjet() + " » : " + motif.strip());
        return reponse(convention, principal.getUtilisateur(), true);
    }

    @Transactional
    public ConventionResponse resilier(UUID id, String motif, UtilisateurPrincipal principal) {
        ConventionPartenariat convention = transition(id, StatutConvention.RESILIEE, ActionConvention.RESILIATION, motif, principal);
        notifierOrganisme(convention, "Convention de partenariat résiliée", "La convention « " + convention.getObjet() + " » est résiliée : " + motif.strip());
        return reponse(convention, principal.getUtilisateur(), true);
    }

    // ----- Échéances (plateforme) -----

    /** Passe en EXPIREE les conventions actives dont la date de fin est dépassée et prévient de celles qui approchent. */
    @Transactional
    public void actualiserEcheances() {
        LocalDate jour = aujourdhui();
        for (ConventionPartenariat convention : conventionRepository.echues(jour)) {
            convention.setStatut(StatutConvention.EXPIREE);
            consigner(convention, ActionConvention.EXPIRATION, "fin le " + FORMAT_DATE.format(convention.getDateFin()), null, null);
            String message = "La convention « " + convention.getObjet() + " » avec " + convention.getOrganisme().getNom() + " a expiré.";
            notifierOrganisme(convention, "Convention de partenariat expirée", message);
            notifierChefs("Convention expirée", message, convention);
        }
        for (ConventionPartenariat convention : conventionRepository.aAlerter(jour, jour.plusDays(JOURS_ALERTE))) {
            convention.setAlerteExpirationEnvoyee(true);
            String message = "La convention « " + convention.getObjet() + " » avec " + convention.getOrganisme().getNom()
                + " prend fin le " + FORMAT_DATE.format(convention.getDateFin()) + ".";
            notifierOrganisme(convention, "Convention bientôt expirée", message);
            notifierChefs("Convention bientôt expirée", message, convention);
        }
    }

    // ----- Partagé avec les pièces -----

    /** Convention verrouillée, si l'utilisateur la gère : le chef du service, ou l'organisme concerné. 404 sinon. */
    ConventionPartenariat chargerPourGestion(UUID id, Utilisateur utilisateur) {
        ConventionPartenariat convention = verrouiller(id);
        if (!AccesPartenariat.estChef(utilisateur) && !AccesPartenariat.estDeLOrganisme(convention, utilisateur)) {
            throw new ConventionIntrouvableException();
        }
        return convention;
    }

    ConventionPartenariat chargerVisible(UUID id, Utilisateur utilisateur) {
        ConventionPartenariat convention = conventionRepository.findById(id).orElseThrow(ConventionIntrouvableException::new);
        if (!AccesPartenariat.estChef(utilisateur) && !AccesPartenariat.estDeLOrganisme(convention, utilisateur)) {
            throw new ConventionIntrouvableException();
        }
        return convention;
    }

    void consigner(ConventionPartenariat convention, ActionConvention action, String details, String motif, Utilisateur auteur) {
        historiqueRepository.save(new HistoriqueConvention(convention.getId(), action, details, motif,
            auteur == null ? null : utilisateurRepository.getReferenceById(auteur.getId())));
    }

    ConventionResponse reponse(ConventionPartenariat convention, Utilisateur lecteur, boolean avecPieces) {
        Organisme organisme = convention.getOrganisme();
        Long joursRestants = null;
        boolean expireBientot = false;
        if (convention.getStatut() == StatutConvention.ACTIVE && convention.getDateFin() != null) {
            joursRestants = ChronoUnit.DAYS.between(aujourdhui(), convention.getDateFin());
            expireBientot = joursRestants <= JOURS_ALERTE;
        }
        List<PieceConventionResponse> pieces = avecPieces
            ? convention.getPieces().stream().map(p -> new PieceConventionResponse(p.getId(), p.getNomFichier(), p.getTaille(),
                p.isDeposeeParOrganisme(), p.getAjouteeLe(), peutRetirer(convention, p, lecteur))).toList()
            : List.of();
        return new ConventionResponse(convention.getId(), organisme.getId(), organisme.getNom(), organisme.getLogoUrl(),
            convention.getObjet(), convention.getDomaines(), convention.getMessage(), convention.getStatut(), convention.getOrigine(),
            convention.getDateSignature(), convention.getDateDebut(), convention.getDateFin(), joursRestants, expireBientot,
            convention.getMotifDecision(), convention.getCreeeLe(), convention.getModifieeLe(), pieces);
    }

    /** Le chef retire un document tant que la convention vit ; l'organisme, ceux qu'il a déposés pendant la demande. */
    static boolean peutRetirer(ConventionPartenariat convention, PieceConventionPartenariat piece, Utilisateur utilisateur) {
        StatutConvention statut = convention.getStatut();
        if (AccesPartenariat.estChef(utilisateur)) return statut.estEnCours() || statut == StatutConvention.ACTIVE;
        return piece.isDeposeeParOrganisme() && statut.estEnCours() && AccesPartenariat.estDeLOrganisme(convention, utilisateur);
    }

    static LocalDate aujourdhui() {
        return LocalDate.now(THIES);
    }

    // ----- Interne -----

    private ConventionPartenariat transition(UUID id, StatutConvention suivant, ActionConvention action, String motif, UtilisateurPrincipal principal) {
        ConventionPartenariat convention = verrouiller(id);
        verifierTransition(convention, suivant);
        String details = convention.getStatut() + " → " + suivant;
        convention.setStatut(suivant);
        if (motif != null) convention.setMotifDecision(motif.strip());
        consigner(convention, action, details, motif == null ? null : motif.strip(), principal.getUtilisateur());
        return convention;
    }

    private static void verifierTransition(ConventionPartenariat convention, StatutConvention suivant) {
        if (!convention.getStatut().peutPasserA(suivant)) {
            throw new ConflitConventionException("Une convention " + libelle(convention.getStatut()) + " ne peut pas passer à « " + libelle(suivant) + " ».");
        }
    }

    private ConventionPartenariat verrouiller(UUID id) {
        return conventionRepository.findByIdForUpdate(id).orElseThrow(ConventionIntrouvableException::new);
    }

    private ConventionPartenariat chargerPourOrganisme(UUID id, Utilisateur auteur, boolean verrou) {
        ConventionPartenariat convention = (verrou ? conventionRepository.findByIdForUpdate(id) : conventionRepository.findById(id))
            .orElseThrow(ConventionIntrouvableException::new);
        if (!AccesPartenariat.estDeLOrganisme(convention, auteur)) throw new ConventionIntrouvableException();
        return convention;
    }

    private static Organisme organismeDuCompte(Utilisateur auteur) {
        if (auteur.getRole() != TypeRole.ORGANISME || auteur.getOrganisme() == null) {
            throw new SecurityException("Seul un organisme suit des conventions de partenariat.");
        }
        return auteur.getOrganisme();
    }

    /** Organisme du compte, verrouillé, validé par l'école et distinct de l'EPT. */
    private Organisme organismeDemandeur(Utilisateur auteur) {
        UUID organismeId = organismeDuCompte(auteur).getId();
        Organisme organisme = organismeRepository.findByIdForUpdate(organismeId).orElseThrow(OrganismeIntrouvableException::new);
        if (organisme.isEtablissementEpt()) throw new SecurityException("L'EPT ne demande pas de convention avec elle-même.");
        if (organisme.getStatutValidation() != StatutCompte.ACTIF) {
            throw new SecurityException("Votre organisme doit être validé par l'école avant de demander une convention.");
        }
        return organisme;
    }

    private static void appliquerDemande(ConventionPartenariat convention, DemandeConventionRequest request) {
        convention.setObjet(request.objet().strip());
        convention.setDomaines(texte(request.domaines()));
        convention.setMessage(request.message().strip());
    }

    /** Dates d'une convention active : complètes, dans l'ordre, signée au plus tard aujourd'hui, pas encore échue. */
    private static void verifierDates(LocalDate signature, LocalDate debut, LocalDate fin) {
        if (signature == null || debut == null || fin == null) {
            throw new IllegalArgumentException("Une convention active a une date de signature, de début et de fin.");
        }
        if (debut.isAfter(fin)) throw new IllegalArgumentException("La date de fin doit suivre la date de début.");
        if (signature.isAfter(aujourdhui())) throw new IllegalArgumentException("La date de signature ne peut pas être dans le futur.");
        if (fin.isBefore(aujourdhui())) throw new IllegalArgumentException("La date de fin est déjà passée : la convention ne peut pas être active.");
    }

    private static void ajouterChangement(List<String> changements, String champ, LocalDate avant, LocalDate apres) {
        if (!Objects.equals(avant, apres)) {
            changements.add(champ + " " + (avant == null ? "—" : FORMAT_DATE.format(avant)) + " → " + FORMAT_DATE.format(apres));
        }
    }

    private static String periode(ConventionPartenariat convention) {
        if (convention.getDateDebut() == null || convention.getDateFin() == null) return "";
        return " du " + FORMAT_DATE.format(convention.getDateDebut()) + " au " + FORMAT_DATE.format(convention.getDateFin());
    }

    private static String texte(String valeur) {
        return valeur == null || valeur.isBlank() ? null : valeur.strip();
    }

    static String libelle(StatutConvention statut) {
        return switch (statut) {
            case DEMANDEE -> "demandée";
            case EN_EXAMEN -> "en examen";
            case EN_NEGOCIATION -> "en négociation";
            case ACTIVE -> "active";
            case REFUSEE -> "refusée";
            case ANNULEE -> "annulée";
            case RESILIEE -> "résiliée";
            case EXPIREE -> "expirée";
        };
    }

    private void notifierChefs(String titre, String message, ConventionPartenariat convention) {
        utilisateurRepository.administrateursActifsAvecUneDe(List.of(PermissionAdmin.GERER_PARTENARIATS, PermissionAdmin.GERER_ADMINISTRATEURS))
            .forEach(chef -> evenements.publishEvent(new NouvelleNotification(chef.getId(), TypeNotification.PARTENARIAT, titre, message,
                "/admin/partenariats/conventions/" + convention.getId())));
    }

    private void notifierOrganisme(ConventionPartenariat convention, String titre, String message) {
        Utilisateur contact = convention.getOrganisme().getContact();
        if (contact == null) return;
        evenements.publishEvent(new NouvelleNotification(contact.getId(), TypeNotification.PARTENARIAT, titre, message,
            "/partenariats/conventions/" + convention.getId()));
    }
}

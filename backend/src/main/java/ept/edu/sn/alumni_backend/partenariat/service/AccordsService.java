package ept.edu.sn.alumni_backend.partenariat.service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.admin.NomCompte;
import ept.edu.sn.alumni_backend.annuaire.dto.PageResponse;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.filiere.entity.Filiere;
import ept.edu.sn.alumni_backend.filiere.repository.FiliereRepository;
import ept.edu.sn.alumni_backend.organisme.entity.Organisme;
import ept.edu.sn.alumni_backend.organisme.exception.OrganismeIntrouvableException;
import ept.edu.sn.alumni_backend.organisme.repository.OrganismeRepository;
import ept.edu.sn.alumni_backend.partenariat.ActionAccord;
import ept.edu.sn.alumni_backend.partenariat.OrigineConvention;
import ept.edu.sn.alumni_backend.partenariat.StatutAccord;
import ept.edu.sn.alumni_backend.partenariat.StatutConvention;
import ept.edu.sn.alumni_backend.partenariat.TypeAccord;
import ept.edu.sn.alumni_backend.partenariat.dto.AccordRequest;
import ept.edu.sn.alumni_backend.partenariat.dto.AccordResponse;
import ept.edu.sn.alumni_backend.partenariat.dto.HistoriqueAccordResponse;
import ept.edu.sn.alumni_backend.partenariat.dto.PieceConventionResponse;
import ept.edu.sn.alumni_backend.partenariat.entity.AccordCollaboration;
import ept.edu.sn.alumni_backend.partenariat.entity.ConventionPartenariat;
import ept.edu.sn.alumni_backend.partenariat.entity.HistoriqueAccord;
import ept.edu.sn.alumni_backend.partenariat.entity.PieceAccord;
import ept.edu.sn.alumni_backend.partenariat.exception.AccordIntrouvableException;
import ept.edu.sn.alumni_backend.partenariat.exception.ConflitConventionException;
import ept.edu.sn.alumni_backend.partenariat.repository.AccordCollaborationRepository;
import ept.edu.sn.alumni_backend.partenariat.repository.ConventionPartenariatRepository;
import ept.edu.sn.alumni_backend.partenariat.repository.HistoriqueAccordRepository;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import lombok.RequiredArgsConstructor;

/**
 * Accords de stage et de mobilité. Une partie propose (l'organisme par son compte, l'école par le service des
 * Relations extérieures), l'autre accepte ou refuse ; celle qui a proposé corrige ou retire tant qu'il n'y a pas de
 * réponse. Chaque partie résilie un accord en vigueur avec un préavis de trois mois. Début et fin suivent les dates
 * de l'accord ; les deux parties en sont prévenues.
 */
@Service
@RequiredArgsConstructor
public class AccordsService {
    private static final DateTimeFormatter FORMAT_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy", Locale.FRENCH);

    private final AccordCollaborationRepository accordRepository;
    private final HistoriqueAccordRepository historiqueRepository;
    private final ConventionPartenariatRepository conventionRepository;
    private final OrganismeRepository organismeRepository;
    private final FiliereRepository filiereRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final AvisPartenariat avis;

    // ----- Propositions -----

    @Transactional
    public AccordResponse proposer(AccordRequest request, UtilisateurPrincipal principal) {
        Utilisateur auteur = principal.getUtilisateur();
        OrigineConvention partie = partie(auteur);
        Organisme organisme = partie == OrigineConvention.ORGANISME ? organismeProposant(auteur) : organismeVise(request.organismeId());
        AccordCollaboration accord = new AccordCollaboration();
        accord.setOrganisme(organisme);
        accord.setProposePar(partie);
        accord.setStatut(StatutAccord.PROPOSE);
        accord.setCreePar(auteur);
        appliquer(accord, request);
        accord = accordRepository.save(accord);
        consigner(accord, ActionAccord.PROPOSITION, null, null, auteur);
        String message = (partie == OrigineConvention.ORGANISME ? organisme.getNom() + " propose" : "L'EPT propose")
            + " un accord " + libelle(accord.getType()) + " : « " + accord.getObjet() + " ».";
        prevenirAutrePartie(accord, "Proposition d'accord " + libelle(accord.getType()), message);
        return reponse(accord, auteur, true);
    }

    @Transactional
    public AccordResponse modifier(UUID id, AccordRequest request, UtilisateurPrincipal principal) {
        Utilisateur auteur = principal.getUtilisateur();
        AccordCollaboration accord = chargerPourGestion(id, auteur);
        if (!estProposant(accord, auteur) || accord.getStatut() != StatutAccord.PROPOSE) {
            throw new ConflitConventionException("Seule la partie qui a proposé l'accord le corrige, tant que l'autre n'a pas répondu.");
        }
        appliquer(accord, request);
        consigner(accord, ActionAccord.MODIFICATION, null, null, auteur);
        return reponse(accord, auteur, true);
    }

    @Transactional
    public AccordResponse retirer(UUID id, UtilisateurPrincipal principal) {
        Utilisateur auteur = principal.getUtilisateur();
        AccordCollaboration accord = chargerPourGestion(id, auteur);
        if (!estProposant(accord, auteur) || accord.getStatut() != StatutAccord.PROPOSE) {
            throw new ConflitConventionException("Seule la partie qui a proposé l'accord le retire, tant que l'autre n'a pas répondu.");
        }
        accord.setStatut(StatutAccord.RETIRE);
        consigner(accord, ActionAccord.RETRAIT, "PROPOSE → RETIRE", null, auteur);
        prevenirAutrePartie(accord, "Proposition d'accord retirée", "La proposition « " + accord.getObjet() + " » a été retirée.");
        return reponse(accord, auteur, true);
    }

    // ----- Réponses -----

    /** Accepté, l'accord est en vigueur si sa date de début est arrivée, à venir sinon. */
    @Transactional
    public AccordResponse accepter(UUID id, UtilisateurPrincipal principal) {
        Utilisateur auteur = principal.getUtilisateur();
        AccordCollaboration accord = chargerPourReponse(id, auteur);
        LocalDate jour = ConventionsPartenariatService.aujourdhui();
        if (accord.getDateFin().isBefore(jour)) {
            throw new ConflitConventionException("La période de cet accord est déjà passée : il ne peut plus être accepté.");
        }
        StatutAccord statut = accord.getDateDebut().isAfter(jour) ? StatutAccord.A_VENIR : StatutAccord.ACTIF;
        accord.setStatut(statut);
        consigner(accord, ActionAccord.ACCEPTATION, "PROPOSE → " + statut, null, auteur);
        prevenirProposant(accord, "Accord accepté", "L'accord « " + accord.getObjet() + " » est accepté" + periode(accord) + ".");
        return reponse(accord, auteur, true);
    }

    @Transactional
    public AccordResponse refuser(UUID id, String motif, UtilisateurPrincipal principal) {
        Utilisateur auteur = principal.getUtilisateur();
        AccordCollaboration accord = chargerPourReponse(id, auteur);
        accord.setStatut(StatutAccord.REFUSE);
        accord.setMotifDecision(motif.strip());
        consigner(accord, ActionAccord.REFUS, "PROPOSE → REFUSE", motif.strip(), auteur);
        prevenirProposant(accord, "Accord refusé", "L'accord « " + accord.getObjet() + " » est refusé : " + motif.strip());
        return reponse(accord, auteur, true);
    }

    /**
     * Une partie signale la résiliation d'un accord en vigueur ou à venir ; l'autre est prévenue et reçoit le motif.
     * L'accord reste en vigueur jusqu'à la fin du préavis de trois mois, sauf s'il se termine avant : la résiliation
     * est alors refusée, l'accord s'achèvera de lui-même.
     */
    @Transactional
    public AccordResponse resilier(UUID id, String motif, UtilisateurPrincipal principal) {
        Utilisateur auteur = principal.getUtilisateur();
        OrigineConvention partie = partie(auteur);
        AccordCollaboration accord = chargerPourGestion(id, auteur);
        if (!accord.getStatut().estEnVigueur()) {
            throw new ConflitConventionException("Seul un accord en vigueur ou à venir peut être résilié.");
        }
        LocalDate jour = ConventionsPartenariatService.aujourdhui();
        LocalDate effet = PreavisResiliation.dateEffet(accord.getDateFin(), accord.getDateEffetResiliation());
        accord.setResiliationDemandeePar(partie);
        accord.setResiliationDemandeeLe(jour);
        accord.setDateEffetResiliation(effet);
        accord.setMotifDecision(motif.strip());
        consigner(accord, ActionAccord.RESILIATION, "effet le " + FORMAT_DATE.format(effet), motif.strip(), auteur);
        String message = PreavisResiliation.annonce(partie == OrigineConvention.ORGANISME ? accord.getOrganisme().getNom() : "L'EPT",
            "l'accord « " + accord.getObjet() + " »", motif.strip(), effet);
        if (partie == OrigineConvention.ORGANISME) {
            avis.auxRelationsExterieures("Résiliation d'un accord", message, lienEcole(accord));
        } else {
            avis.aLOrganisme(accord.getOrganisme(), "Résiliation d'un accord", message, lienOrganisme(accord));
        }
        return reponse(accord, auteur, true);
    }

    /** La partie qui a signalé la résiliation y renonce avant la date d'effet ; l'accord continue. */
    @Transactional
    public AccordResponse annulerResiliation(UUID id, UtilisateurPrincipal principal) {
        Utilisateur auteur = principal.getUtilisateur();
        AccordCollaboration accord = chargerPourGestion(id, auteur);
        if (!peutAnnulerResiliation(accord, auteur)) {
            throw new ConflitConventionException("Seule la partie qui a signalé la résiliation peut y renoncer, avant sa date d'effet.");
        }
        OrigineConvention partie = accord.getResiliationDemandeePar();
        accord.setResiliationDemandeePar(null);
        accord.setResiliationDemandeeLe(null);
        accord.setDateEffetResiliation(null);
        accord.setMotifDecision(null);
        consigner(accord, ActionAccord.ANNULATION_RESILIATION, null, null, auteur);
        String message = "La résiliation de l'accord « " + accord.getObjet() + " » est annulée : l'accord continue.";
        if (partie == OrigineConvention.ORGANISME) avis.auxRelationsExterieures("Résiliation annulée", message, lienEcole(accord));
        else avis.aLOrganisme(accord.getOrganisme(), "Résiliation annulée", message, lienOrganisme(accord));
        return reponse(accord, auteur, true);
    }

    // ----- Lecture -----

    @Transactional(readOnly = true)
    public List<AccordResponse> mesAccords(UtilisateurPrincipal principal) {
        Utilisateur lecteur = principal.getUtilisateur();
        return accordRepository.findByOrganisme_IdOrderByCreeLeDesc(organismeDuCompte(lecteur).getId()).stream()
            .map(a -> reponse(a, lecteur, false)).toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<AccordResponse> lister(TypeAccord type, StatutAccord statut, UUID organismeId, String recherche, boolean aRepondre,
            int page, int taille, UtilisateurPrincipal principal) {
        Specification<AccordCollaboration> filtre = Specification.unrestricted();
        if (type != null) filtre = filtre.and((r, q, cb) -> cb.equal(r.get("type"), type));
        if (statut != null) filtre = filtre.and((r, q, cb) -> cb.equal(r.get("statut"), statut));
        if (organismeId != null) filtre = filtre.and((r, q, cb) -> cb.equal(r.get("organisme").get("id"), organismeId));
        if (aRepondre) {
            filtre = filtre.and((r, q, cb) -> cb.and(cb.equal(r.get("statut"), StatutAccord.PROPOSE), cb.equal(r.get("proposePar"), OrigineConvention.ORGANISME)));
        }
        if (recherche != null && !recherche.isBlank()) {
            String motif = "%" + recherche.strip().toLowerCase(Locale.ROOT) + "%";
            filtre = filtre.and((r, q, cb) -> cb.or(cb.like(cb.lower(r.get("objet")), motif), cb.like(cb.lower(r.get("organisme").get("nom")), motif)));
        }
        Utilisateur lecteur = principal.getUtilisateur();
        return PageResponse.depuis(accordRepository.findAll(filtre, PageRequest.of(page, taille, Sort.by(Sort.Direction.DESC, "modifieLe")))
            .map(a -> reponse(a, lecteur, false)));
    }

    @Transactional(readOnly = true)
    public AccordResponse detail(UUID id, UtilisateurPrincipal principal) {
        Utilisateur lecteur = principal.getUtilisateur();
        return reponse(chargerVisible(id, lecteur), lecteur, true);
    }

    @Transactional(readOnly = true)
    public List<HistoriqueAccordResponse> historique(UUID id, UtilisateurPrincipal principal) {
        UUID accordId = chargerVisible(id, principal.getUtilisateur()).getId();
        return historiqueRepository.findByAccordIdOrderByDateActionAsc(accordId).stream()
            .map(h -> new HistoriqueAccordResponse(h.getAction(), h.getDetails(), h.getMotif(),
                h.getAuteur() == null ? "Plateforme" : NomCompte.complet(h.getAuteur()), h.getDateAction()))
            .toList();
    }

    // ----- Échéances (plateforme) -----

    /**
     * Applique les résiliations dont le préavis est écoulé, termine les accords échus, puis fait démarrer ceux dont la
     * date de début est arrivée. Les deux parties sont prévenues à chaque étape.
     */
    @Transactional
    public void actualiserEcheances() {
        LocalDate jour = ConventionsPartenariatService.aujourdhui();
        for (AccordCollaboration accord : accordRepository.resiliationsEchues(jour)) {
            String details = accord.getStatut() + " → RESILIE";
            accord.setStatut(StatutAccord.RESILIE);
            consigner(accord, ActionAccord.RESILIATION_EFFECTIVE, details, null, null);
            prevenirLesDeux(accord, "Accord résilié", "La résiliation de l'accord « " + accord.getObjet() + " » avec "
                + accord.getOrganisme().getNom() + " prend effet aujourd'hui : l'accord n'est plus en vigueur.");
        }
        for (AccordCollaboration accord : accordRepository.echus(jour)) {
            String details = accord.getStatut() + " → TERMINE";
            accord.setStatut(StatutAccord.TERMINE);
            consigner(accord, ActionAccord.FIN, details, null, null);
            prevenirLesDeux(accord, "Accord terminé", "L'accord « " + accord.getObjet() + " » avec " + accord.getOrganisme().getNom()
                + " a pris fin le " + FORMAT_DATE.format(accord.getDateFin()) + ".");
        }
        for (AccordCollaboration accord : accordRepository.aDemarrer(jour)) {
            accord.setStatut(StatutAccord.ACTIF);
            consigner(accord, ActionAccord.DEBUT, "A_VENIR → ACTIF", null, null);
            prevenirLesDeux(accord, "Accord en vigueur", "L'accord « " + accord.getObjet() + " » avec " + accord.getOrganisme().getNom()
                + " entre en vigueur" + periode(accord) + ".");
        }
    }

    // ----- Partagé avec les pièces -----

    /** Accord verrouillé, si l'utilisateur en est l'une des parties (école ou organisme concerné). 404 sinon. */
    AccordCollaboration chargerPourGestion(UUID id, Utilisateur utilisateur) {
        AccordCollaboration accord = accordRepository.findByIdForUpdate(id).orElseThrow(AccordIntrouvableException::new);
        verifierPartie(accord, utilisateur);
        return accord;
    }

    AccordCollaboration chargerVisible(UUID id, Utilisateur utilisateur) {
        AccordCollaboration accord = accordRepository.findById(id).orElseThrow(AccordIntrouvableException::new);
        verifierPartie(accord, utilisateur);
        return accord;
    }

    void consigner(AccordCollaboration accord, ActionAccord action, String details, String motif, Utilisateur auteur) {
        historiqueRepository.save(new HistoriqueAccord(accord.getId(), action, details, motif,
            auteur == null ? null : utilisateurRepository.getReferenceById(auteur.getId())));
    }

    AccordResponse reponse(AccordCollaboration accord, Utilisateur lecteur, boolean avecPieces) {
        Organisme organisme = accord.getOrganisme();
        ConventionPartenariat convention = accord.getConvention();
        boolean propose = accord.getStatut() == StatutAccord.PROPOSE;
        boolean proposant = estProposant(accord, lecteur);
        List<AccordResponse.FiliereAccord> filieres = accord.getFilieres().stream()
            .sorted(Comparator.comparing(Filiere::getNom)).map(f -> new AccordResponse.FiliereAccord(f.getId(), f.getNom())).toList();
        List<PieceConventionResponse> pieces = avecPieces
            ? accord.getPieces().stream().map(p -> new PieceConventionResponse(p.getId(), p.getNomFichier(), p.getTaille(),
                p.isDeposeeParOrganisme(), p.getAjouteeLe(), peutRetirer(accord, p, lecteur))).toList()
            : List.of();
        return new AccordResponse(accord.getId(), organisme.getId(), organisme.getNom(),
            convention == null ? null : convention.getId(), convention == null ? null : convention.getObjet(),
            accord.getType(), accord.getProposePar(), accord.getObjet(), accord.getDescription(), accord.getNombrePlaces(), filieres,
            accord.getDateDebut(), accord.getDateFin(), accord.getStatut(), accord.getMotifDecision(),
            accord.getResiliationDemandeePar(), accord.getResiliationDemandeeLe(), accord.getDateEffetResiliation(),
            propose && !proposant, propose && proposant,
            accord.getStatut().estEnVigueur() && accord.getDateEffetResiliation() == null && (AccesPartenariat.estChef(lecteur) || estDeLOrganisme(accord, lecteur)),
            peutAnnulerResiliation(accord, lecteur),
            accord.getCreeLe(), accord.getModifieLe(), pieces);
    }

    /** L'école retire un document tant que l'accord vit ; l'organisme, ceux qu'il a déposés pendant la proposition. */
    static boolean peutRetirer(AccordCollaboration accord, PieceAccord piece, Utilisateur utilisateur) {
        StatutAccord statut = accord.getStatut();
        if (AccesPartenariat.estChef(utilisateur)) return statut == StatutAccord.PROPOSE || statut.estEnVigueur();
        return piece.isDeposeeParOrganisme() && statut == StatutAccord.PROPOSE && estDeLOrganisme(accord, utilisateur);
    }

    /** Résiliation en cours, signalée par la partie de cet utilisateur. */
    static boolean peutAnnulerResiliation(AccordCollaboration accord, Utilisateur utilisateur) {
        if (!accord.getStatut().estEnVigueur() || accord.getDateEffetResiliation() == null) return false;
        return accord.getResiliationDemandeePar() == OrigineConvention.ECOLE ? AccesPartenariat.estChef(utilisateur) : estDeLOrganisme(accord, utilisateur);
    }

    static boolean estDeLOrganisme(AccordCollaboration accord, Utilisateur utilisateur) {
        return utilisateur.getRole() == TypeRole.ORGANISME && utilisateur.getOrganisme() != null
            && utilisateur.getOrganisme().getId().equals(accord.getOrganisme().getId());
    }

    // ----- Interne -----

    private AccordCollaboration chargerPourReponse(UUID id, Utilisateur auteur) {
        AccordCollaboration accord = chargerPourGestion(id, auteur);
        if (accord.getStatut() != StatutAccord.PROPOSE) {
            throw new ConflitConventionException("Cet accord n'attend plus de réponse.");
        }
        if (estProposant(accord, auteur)) {
            throw new ConflitConventionException("Vous avez proposé cet accord : c'est à l'autre partie d'y répondre.");
        }
        return accord;
    }

    private static void verifierPartie(AccordCollaboration accord, Utilisateur utilisateur) {
        if (!AccesPartenariat.estChef(utilisateur) && !estDeLOrganisme(accord, utilisateur)) throw new AccordIntrouvableException();
    }

    private static OrigineConvention partie(Utilisateur utilisateur) {
        if (AccesPartenariat.estChef(utilisateur)) return OrigineConvention.ECOLE;
        if (utilisateur.getRole() == TypeRole.ORGANISME && utilisateur.getOrganisme() != null) return OrigineConvention.ORGANISME;
        throw new SecurityException("Seuls un organisme et le service des Relations extérieures proposent des accords.");
    }

    private static boolean estProposant(AccordCollaboration accord, Utilisateur utilisateur) {
        return accord.getProposePar() == OrigineConvention.ECOLE ? AccesPartenariat.estChef(utilisateur) : estDeLOrganisme(accord, utilisateur);
    }

    private static Organisme organismeDuCompte(Utilisateur utilisateur) {
        if (utilisateur.getRole() != TypeRole.ORGANISME || utilisateur.getOrganisme() == null) {
            throw new SecurityException("Seul un organisme suit ses accords.");
        }
        return utilisateur.getOrganisme();
    }

    private Organisme organismeProposant(Utilisateur auteur) {
        Organisme organisme = organismeRepository.findById(organismeDuCompte(auteur).getId()).orElseThrow(OrganismeIntrouvableException::new);
        if (organisme.isEtablissementEpt()) throw new SecurityException("L'EPT ne propose pas d'accord à elle-même.");
        if (organisme.getStatutValidation() != StatutCompte.ACTIF) {
            throw new SecurityException("Votre organisme doit être validé par l'école avant de proposer un accord.");
        }
        return organisme;
    }

    private Organisme organismeVise(UUID organismeId) {
        if (organismeId == null) throw new IllegalArgumentException("Choisissez l'organisme concerné par l'accord.");
        Organisme organisme = organismeRepository.findById(organismeId).orElseThrow(OrganismeIntrouvableException::new);
        if (organisme.isEtablissementEpt()) throw new IllegalArgumentException("L'EPT ne signe pas d'accord avec elle-même.");
        return organisme;
    }

    /** Champs de la proposition : dates cohérentes et pas encore passées, convention active de l'organisme, filières connues. */
    private void appliquer(AccordCollaboration accord, AccordRequest request) {
        if (request.dateDebut().isAfter(request.dateFin())) throw new IllegalArgumentException("La date de fin doit suivre la date de début.");
        if (request.dateFin().isBefore(ConventionsPartenariatService.aujourdhui())) {
            throw new IllegalArgumentException("La date de fin est déjà passée.");
        }
        ConventionPartenariat convention = null;
        if (request.conventionId() != null) {
            convention = conventionRepository.findById(request.conventionId())
                .filter(c -> c.getOrganisme().getId().equals(accord.getOrganisme().getId()) && c.getStatut() == StatutConvention.ACTIVE)
                .orElseThrow(() -> new IllegalArgumentException("La convention-cadre choisie n'est pas une convention active de cet organisme."));
        }
        List<UUID> ids = request.filiereIds() == null ? List.of() : request.filiereIds().stream().distinct().toList();
        List<Filiere> filieres = filiereRepository.findAllById(ids);
        if (filieres.size() != ids.size()) throw new IllegalArgumentException("Une des filières choisies n'existe pas.");
        accord.setConvention(convention);
        accord.setType(request.type());
        accord.setObjet(request.objet().strip());
        accord.setDescription(request.description() == null || request.description().isBlank() ? null : request.description().strip());
        accord.setNombrePlaces(request.nombrePlaces());
        accord.setFilieres(new HashSet<>(filieres));
        accord.setDateDebut(request.dateDebut());
        accord.setDateFin(request.dateFin());
    }

    private void prevenirAutrePartie(AccordCollaboration accord, String titre, String message) {
        if (accord.getProposePar() == OrigineConvention.ORGANISME) {
            avis.auxRelationsExterieures(titre, message, lienEcole(accord));
        } else {
            avis.aLOrganisme(accord.getOrganisme(), titre, message, lienOrganisme(accord));
        }
    }

    private void prevenirProposant(AccordCollaboration accord, String titre, String message) {
        if (accord.getProposePar() == OrigineConvention.ORGANISME) {
            avis.aLOrganisme(accord.getOrganisme(), titre, message, lienOrganisme(accord));
        } else {
            avis.auxRelationsExterieures(titre, message, lienEcole(accord));
        }
    }

    private void prevenirLesDeux(AccordCollaboration accord, String titre, String message) {
        avis.aLOrganisme(accord.getOrganisme(), titre, message, lienOrganisme(accord));
        avis.auxRelationsExterieures(titre, message, lienEcole(accord));
    }

    private static String lienEcole(AccordCollaboration accord) {
        return "/admin/partenariats/accords/" + accord.getId();
    }

    private static String lienOrganisme(AccordCollaboration accord) {
        return "/partenariats/accords/" + accord.getId();
    }

    private static String libelle(TypeAccord type) {
        return type == TypeAccord.STAGE ? "de stage" : "de mobilité";
    }

    private static String periode(AccordCollaboration accord) {
        return " du " + FORMAT_DATE.format(accord.getDateDebut()) + " au " + FORMAT_DATE.format(accord.getDateFin());
    }
}

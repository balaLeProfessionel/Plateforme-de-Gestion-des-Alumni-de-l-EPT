package ept.edu.sn.alumni_backend.mobilite.service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.admin.evenement.NotificationCompte;
import ept.edu.sn.alumni_backend.annuaire.dto.PageResponse;
import ept.edu.sn.alumni_backend.enums.Classe;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeOrganisme;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.filiere.entity.Filiere;
import ept.edu.sn.alumni_backend.filiere.repository.FiliereRepository;
import ept.edu.sn.alumni_backend.mobilite.ActionHistorique;
import ept.edu.sn.alumni_backend.mobilite.ObjetHistorique;
import ept.edu.sn.alumni_backend.mobilite.PeriodeMobilite;
import ept.edu.sn.alumni_backend.mobilite.PublicVise;
import ept.edu.sn.alumni_backend.mobilite.StatutOffreMobilite;
import ept.edu.sn.alumni_backend.mobilite.TypeMobilite;
import ept.edu.sn.alumni_backend.mobilite.dto.OffreMobiliteRequest;
import ept.edu.sn.alumni_backend.mobilite.dto.OffreMobiliteResponse;
import ept.edu.sn.alumni_backend.mobilite.entity.OffreMobilite;
import ept.edu.sn.alumni_backend.mobilite.exception.ConflitMobiliteException;
import ept.edu.sn.alumni_backend.mobilite.exception.OffreMobiliteIntrouvableException;
import ept.edu.sn.alumni_backend.mobilite.repository.OffreMobiliteRepository;
import ept.edu.sn.alumni_backend.notification.NouvelleNotification;
import ept.edu.sn.alumni_backend.notification.TypeNotification;
import ept.edu.sn.alumni_backend.organisme.entity.Organisme;
import ept.edu.sn.alumni_backend.organisme.repository.OrganismeRepository;
import ept.edu.sn.alumni_backend.organisme.service.OrganismeService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import lombok.RequiredArgsConstructor;

/**
 * Offres de mobilité.
 * - Un établissement d'enseignement partenaire, au compte validé, publie directement ses offres.
 * - Le chef du service mobilité publie au nom d'un partenaire, même sans compte, et retire une offre avec un motif.
 * - L'institut et le chef modifient ou clôturent une offre publiée.
 * - Étudiants et enseignants voient les offres de leur public ; l'annonce d'une offre leur parvient dans la cloche.
 */
@Service
@RequiredArgsConstructor
public class OffresMobiliteService {
    static final ZoneId FUSEAU = ZoneId.of("Africa/Dakar");
    private static final DateTimeFormatter FORMAT_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final OffreMobiliteRepository offreRepository;
    private final OrganismeRepository organismeRepository;
    private final OrganismeService organismeService;
    private final FiliereRepository filiereRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final HistoriqueMobiliteService historique;
    private final ApplicationEventPublisher evenements;

    @Transactional
    public OffreMobiliteResponse publierParInstitut(OffreMobiliteRequest request, UtilisateurPrincipal principal) {
        Utilisateur auteur = principal.getUtilisateur();
        String refus = "Seul un établissement d'enseignement partenaire publie des offres de mobilité.";
        if (auteur.getRole() != TypeRole.ORGANISME || auteur.getOrganisme() == null) {
            throw new SecurityException(refus);
        }
        // Le compte du jeton est détaché : l'organisme est relu dans la transaction, avec son statut à jour.
        Organisme organisme = organismeRepository.findById(auteur.getOrganisme().getId()).orElseThrow(() -> new SecurityException(refus));
        if (organisme.getTypeOrganisme() != TypeOrganisme.ETABLISSEMENT_ENSEIGNEMENT) {
            throw new SecurityException(refus);
        }
        if (organisme.getStatutValidation() != StatutCompte.ACTIF) {
            throw new SecurityException("Votre établissement doit être validé par l'école avant de publier une offre de mobilité.");
        }
        return publier(request, organisme, auteur);
    }

    @Transactional
    public OffreMobiliteResponse publierParChef(OffreMobiliteRequest request, UUID organismeId, String nomNouvelOrganisme,
            UtilisateurPrincipal principal) {
        Organisme organisme = organismeService.resoudreOrganisme(organismeId, nomNouvelOrganisme);
        if (organisme.getTypeOrganisme() == null) {
            organisme.setTypeOrganisme(TypeOrganisme.ETABLISSEMENT_ENSEIGNEMENT);
        } else if (organisme.getTypeOrganisme() != TypeOrganisme.ETABLISSEMENT_ENSEIGNEMENT) {
            throw new IllegalArgumentException("Une offre de mobilité se publie au nom d'un établissement d'enseignement.");
        }
        if (organisme.getStatutValidation() == StatutCompte.SUSPENDU) {
            throw new IllegalArgumentException("Cet établissement est suspendu : ses offres ne seraient pas visibles.");
        }
        return publier(request, organisme, principal.getUtilisateur());
    }

    @Transactional
    public OffreMobiliteResponse modifier(UUID id, OffreMobiliteRequest request, UtilisateurPrincipal principal) {
        Utilisateur auteur = principal.getUtilisateur();
        OffreMobilite offre = chargerPourGestion(id, auteur);
        if (offre.getStatut() != StatutOffreMobilite.PUBLIEE) {
            throw new ConflitMobiliteException("Seule une offre publiée se modifie.");
        }
        String changements = changements(offre, request);
        remplir(offre, request, false);
        if (!changements.isEmpty()) {
            historique.consigner(ObjetHistorique.OFFRE, offre.getId(), ActionHistorique.MODIFICATION_OFFRE, changements, null, auteur.getId());
        }
        return reponseComplete(offre, auteur);
    }

    /** L'institut ou le chef ferme les candidatures avant la date limite. */
    @Transactional
    public OffreMobiliteResponse cloturer(UUID id, UtilisateurPrincipal principal) {
        Utilisateur auteur = principal.getUtilisateur();
        OffreMobilite offre = chargerPourGestion(id, auteur);
        if (offre.getStatut() != StatutOffreMobilite.PUBLIEE) {
            throw new ConflitMobiliteException("Seule une offre publiée se clôture.");
        }
        offre.setStatut(StatutOffreMobilite.CLOTUREE);
        historique.consigner(ObjetHistorique.OFFRE, offre.getId(), ActionHistorique.CLOTURE_OFFRE, null, null, auteur.getId());
        return reponseComplete(offre, auteur);
    }

    /** Le chef du service mobilité retire une offre ; l'institut est prévenu avec le motif. */
    @Transactional
    public OffreMobiliteResponse retirer(UUID id, String motif, UtilisateurPrincipal principal) {
        Utilisateur auteur = principal.getUtilisateur();
        OffreMobilite offre = verrouiller(id);
        if (offre.getStatut() != StatutOffreMobilite.PUBLIEE && offre.getStatut() != StatutOffreMobilite.CLOTUREE) {
            throw new ConflitMobiliteException("Seule une offre publiée ou close peut être retirée.");
        }
        String texte = motif.trim();
        offre.setStatut(StatutOffreMobilite.RETIREE);
        offre.setMotifRetrait(texte);
        historique.consigner(ObjetHistorique.OFFRE, offre.getId(), ActionHistorique.RETRAIT_OFFRE, null, texte, auteur.getId());
        Utilisateur contact = offre.getOrganisme().getContact();
        if (contact != null && contact.getEmail() != null) {
            evenements.publishEvent(new NotificationCompte(contact.getId(), contact.getEmail(), "Votre offre de mobilité a été retirée",
                "Bonjour, l'école a retiré votre offre « " + offre.getTitre() + " », qui n'est plus visible. Motif : " + texte));
        }
        return reponseComplete(offre, auteur);
    }

    /**
     * Offres visibles d'un étudiant ou d'un enseignant : celles de son public, hors offres retirées ou d'un
     * établissement suspendu. « Éligibles » ne garde que celles où il peut encore candidater.
     */
    @Transactional(readOnly = true)
    public PageResponse<OffreMobiliteResponse> listerPourCandidat(TypeMobilite type, String pays, PeriodeMobilite periode, String annee,
            boolean eligiblesSeulement, UtilisateurPrincipal principal, int page, int taille) {
        Utilisateur lecteur = lecteur(principal);
        if (!AccesMobilite.estCandidatPossible(lecteur)) {
            throw new SecurityException("Les offres de mobilité sont réservées aux étudiants et aux enseignants.");
        }
        Specification<OffreMobilite> specification = visibles().and(duPublic(lecteur.getRole()));
        if (type != null) {
            specification = specification.and((racine, requete, cb) -> cb.equal(racine.get("type"), type));
        }
        if (pays != null && !pays.isBlank()) {
            String motif = "%" + pays.trim().toLowerCase(Locale.ROOT) + "%";
            specification = specification.and((racine, requete, cb) -> cb.like(cb.lower(racine.get("pays")), motif));
        }
        if (periode != null) {
            specification = specification.and((racine, requete, cb) -> cb.equal(racine.get("periode"), periode));
        }
        if (annee != null && !annee.isBlank()) {
            String valeur = annee.trim();
            specification = specification.and((racine, requete, cb) -> cb.equal(racine.get("anneeUniversitaire"), valeur));
        }
        if (eligiblesSeulement) {
            LocalDate aujourdhui = aujourdhui();
            specification = specification.and((racine, requete, cb) -> cb.and(
                cb.equal(racine.get("statut"), StatutOffreMobilite.PUBLIEE),
                cb.greaterThanOrEqualTo(racine.get("dateLimite"), aujourdhui)));
            if (lecteur.getRole() == TypeRole.ETUDIANT) {
                specification = specification.and(conditionsEtudiant(lecteur));
            }
        }
        Sort tri = eligiblesSeulement
            ? Sort.by(Sort.Order.asc("dateLimite"), Sort.Order.desc("publieeLe"))
            : Sort.by(Sort.Order.desc("dateLimite"), Sort.Order.desc("publieeLe"));
        return PageResponse.depuis(offreRepository.findAll(specification, PageRequest.of(page, taille, tri))
            .map(offre -> versReponse(offre, lecteur, false)));
    }

    @Transactional(readOnly = true)
    public OffreMobiliteResponse detail(UUID id, UtilisateurPrincipal principal) {
        Utilisateur lecteur = lecteur(principal);
        return reponseComplete(chargerVisible(id, lecteur), lecteur);
    }

    /**
     * L'offre, si le lecteur peut la voir : son public (offre non retirée, établissement non suspendu), son institut et
     * le chef du service mobilité. Sinon 404, pour ne pas révéler son existence.
     */
    @Transactional(readOnly = true)
    public OffreMobilite chargerVisible(UUID id, Utilisateur lecteur) {
        OffreMobilite offre = offreRepository.findWithOrganismeById(id).orElseThrow(OffreMobiliteIntrouvableException::new);
        boolean visible = offre.visible() && offre.getOrganisme().getStatutValidation() != StatutCompte.SUSPENDU
            && offre.getPublicVise().admet(lecteur.getRole());
        if (!visible && !AccesMobilite.peutGerer(offre, lecteur)) {
            throw new OffreMobiliteIntrouvableException();
        }
        return offre;
    }

    /** L'offre verrouillée pour la modifier : son institut ou le chef ; un autre membre reçoit 404, une offre retirée 409. */
    @Transactional
    public OffreMobilite chargerPourGestion(UUID id, Utilisateur auteur) {
        OffreMobilite offre = verrouiller(id);
        if (!AccesMobilite.peutGerer(offre, auteur)) {
            throw new OffreMobiliteIntrouvableException();
        }
        if (offre.getStatut() == StatutOffreMobilite.RETIREE) {
            throw new ConflitMobiliteException("Une offre retirée ne se modifie plus.");
        }
        return offre;
    }

    @Transactional(readOnly = true)
    public List<OffreMobiliteResponse> mesOffres(UtilisateurPrincipal principal) {
        Utilisateur lecteur = lecteur(principal);
        if (lecteur.getOrganisme() == null) return List.of();
        UUID organismeId = lecteur.getOrganisme().getId();
        Specification<OffreMobilite> deLInstitut = (racine, requete, cb) -> cb.equal(racine.get("organisme").get("id"), organismeId);
        return offreRepository.findAll(deLInstitut, PageRequest.of(0, 200, Sort.by(Sort.Order.desc("creeeLe"))))
            .map(offre -> versReponse(offre, lecteur, false)).getContent();
    }

    @Transactional(readOnly = true)
    public PageResponse<OffreMobiliteResponse> listerPourChef(StatutOffreMobilite statut, UUID organismeId, String annee,
            UtilisateurPrincipal principal, int page, int taille) {
        Utilisateur lecteur = lecteur(principal);
        Specification<OffreMobilite> specification = Specification.unrestricted();
        if (statut != null) {
            specification = specification.and((racine, requete, cb) -> cb.equal(racine.get("statut"), statut));
        }
        if (organismeId != null) {
            specification = specification.and((racine, requete, cb) -> cb.equal(racine.get("organisme").get("id"), organismeId));
        }
        if (annee != null && !annee.isBlank()) {
            String valeur = annee.trim();
            specification = specification.and((racine, requete, cb) -> cb.equal(racine.get("anneeUniversitaire"), valeur));
        }
        return PageResponse.depuis(offreRepository.findAll(specification, PageRequest.of(page, taille, Sort.by(Sort.Order.desc("creeeLe"))))
            .map(offre -> versReponse(offre, lecteur, false)));
    }

    /** Réponse avec les documents joints : détail et modifications. */
    public OffreMobiliteResponse reponseComplete(OffreMobilite offre, Utilisateur lecteur) {
        return versReponse(offre, lecteur, true);
    }

    private OffreMobiliteResponse publier(OffreMobiliteRequest request, Organisme organisme, Utilisateur auteur) {
        OffreMobilite offre = new OffreMobilite();
        offre.setOrganisme(organisme);
        offre.setCreeePar(auteur);
        remplir(offre, request, true);
        offre = offreRepository.save(offre);
        historique.consigner(ObjetHistorique.OFFRE, offre.getId(), ActionHistorique.PUBLICATION_OFFRE, null, null, auteur.getId());
        annoncer(offre);
        return reponseComplete(offre, auteur);
    }

    private void remplir(OffreMobilite offre, OffreMobiliteRequest request, boolean creation) {
        LocalDate dateLimite = request.dateLimite();
        boolean dateChangee = creation || !dateLimite.equals(offre.getDateLimite());
        if (dateChangee && dateLimite.isBefore(aujourdhui())) {
            throw new IllegalArgumentException("La date limite de candidature ne peut pas être passée.");
        }
        String[] annees = request.anneeUniversitaire().split("-");
        if (Integer.parseInt(annees[1]) != Integer.parseInt(annees[0]) + 1) {
            throw new IllegalArgumentException("L'année universitaire couvre deux années qui se suivent, par exemple « 2027-2028 ».");
        }
        if ((request.periode() == PeriodeMobilite.SEJOUR) != (request.dureeSemaines() != null)) {
            throw new IllegalArgumentException(request.periode() == PeriodeMobilite.SEJOUR
                ? "Indiquez la durée du séjour en semaines."
                : "La durée en semaines ne s'indique que pour un séjour.");
        }
        if (request.type() == TypeMobilite.DOUBLE_DIPLOME && request.publicVise() != PublicVise.ETUDIANTS) {
            throw new IllegalArgumentException("Un double diplôme s'adresse aux étudiants.");
        }
        if (request.type() == TypeMobilite.ENSEIGNEMENT_RECHERCHE && request.publicVise() != PublicVise.ENSEIGNANTS) {
            throw new IllegalArgumentException("Un séjour d'enseignement ou de recherche s'adresse aux enseignants.");
        }
        Set<UUID> filiereIds = request.filiereIds() == null ? Set.of() : request.filiereIds();
        Set<Classe> classes = request.classes() == null ? Set.of() : request.classes();
        if (request.publicVise() == PublicVise.ENSEIGNANTS && (!filiereIds.isEmpty() || !classes.isEmpty())) {
            throw new IllegalArgumentException("Filières et classes ne s'indiquent que pour une offre ouverte aux étudiants.");
        }
        List<Filiere> filieres = filiereRepository.findAllById(filiereIds);
        if (filieres.size() != filiereIds.size() || filieres.stream().anyMatch(f -> !f.isActive())) {
            throw new IllegalArgumentException("Une des filières choisies n'existe pas ou n'est plus active.");
        }
        offre.setTitre(request.titre().trim());
        offre.setDescription(request.description().trim());
        offre.setType(request.type());
        offre.setPublicVise(request.publicVise());
        offre.setPays(request.pays().trim());
        offre.setVille(request.ville() == null || request.ville().isBlank() ? null : request.ville().trim());
        offre.setAnneeUniversitaire(request.anneeUniversitaire());
        offre.setPeriode(request.periode());
        offre.setDureeSemaines(request.dureeSemaines());
        offre.setNombrePlaces(request.nombrePlaces());
        offre.setDateLimite(dateLimite);
        offre.getFilieres().clear();
        offre.getFilieres().addAll(filieres);
        offre.getClasses().clear();
        offre.getClasses().addAll(classes);
        offre.getPiecesDemandees().clear();
        offre.getPiecesDemandees().addAll(request.piecesDemandees());
    }

    /** Champs modifiés, lisibles dans l'historique : « date limite 15/03/2027 → 31/03/2027, places 3 → 4 ». */
    private static String changements(OffreMobilite offre, OffreMobiliteRequest request) {
        List<String> lignes = new ArrayList<>();
        if (!offre.getTitre().equals(request.titre().trim())) lignes.add("titre");
        if (!offre.getDescription().equals(request.description().trim())) lignes.add("description");
        if (offre.getType() != request.type()) lignes.add("type " + offre.getType().libelle() + " → " + request.type().libelle());
        if (offre.getPublicVise() != request.publicVise()) lignes.add("public " + offre.getPublicVise() + " → " + request.publicVise());
        if (!offre.getPays().equals(request.pays().trim())) lignes.add("pays " + offre.getPays() + " → " + request.pays().trim());
        if (!offre.getAnneeUniversitaire().equals(request.anneeUniversitaire())) {
            lignes.add("année " + offre.getAnneeUniversitaire() + " → " + request.anneeUniversitaire());
        }
        if (offre.getPeriode() != request.periode() || !Objects.equals(offre.getDureeSemaines(), request.dureeSemaines())) lignes.add("période");
        if (offre.getNombrePlaces() != request.nombrePlaces()) lignes.add("places " + offre.getNombrePlaces() + " → " + request.nombrePlaces());
        if (!offre.getDateLimite().equals(request.dateLimite())) {
            lignes.add("date limite " + offre.getDateLimite().format(FORMAT_DATE) + " → " + request.dateLimite().format(FORMAT_DATE));
        }
        Set<UUID> filieres = new HashSet<>(request.filiereIds() == null ? Set.of() : request.filiereIds());
        if (!filieres.equals(new HashSet<>(offre.getFilieres().stream().map(Filiere::getId).toList()))) lignes.add("filières");
        Set<Classe> classes = request.classes() == null || request.classes().isEmpty() ? EnumSet.noneOf(Classe.class) : EnumSet.copyOf(request.classes());
        if (!classes.equals(offre.getClasses())) lignes.add("classes");
        if (!EnumSet.copyOf(request.piecesDemandees()).equals(offre.getPiecesDemandees())) lignes.add("pièces demandées");
        String texte = String.join(", ", lignes);
        return texte.length() > 500 ? texte.substring(0, 499) + "…" : texte;
    }

    /** Chaque étudiant ou enseignant concerné voit la nouvelle offre dans sa cloche (pas d'e-mail : ils sont nombreux). */
    private void annoncer(OffreMobilite offre) {
        List<TypeRole> roles = switch (offre.getPublicVise()) {
            case ETUDIANTS -> List.of(TypeRole.ETUDIANT);
            case ENSEIGNANTS -> List.of(TypeRole.PERSONNEL);
            case TOUS -> List.of(TypeRole.ETUDIANT, TypeRole.PERSONNEL);
        };
        List<UUID> filieres = offre.getFilieres().stream().map(Filiere::getId).toList();
        List<Classe> classes = List.copyOf(offre.getClasses());
        String message = offre.getOrganisme().getNom() + " propose « " + offre.getTitre() + " » (" + offre.getAnneeUniversitaire()
            + "). Candidatures jusqu'au " + offre.getDateLimite().format(FORMAT_DATE) + ".";
        String lien = "/mobilites/offres/" + offre.getId();
        offreRepository.destinatairesAnnonce(roles,
                filieres.isEmpty(), filieres.isEmpty() ? List.of(new UUID(0, 0)) : filieres,
                classes.isEmpty(), classes.isEmpty() ? List.of(Classe.TC1) : classes)
            .forEach(destinataire -> evenements.publishEvent(
                new NouvelleNotification(destinataire, TypeNotification.MOBILITE, "Nouvelle offre de mobilité", message, lien)));
    }

    private OffreMobilite verrouiller(UUID id) {
        return offreRepository.findByIdForUpdate(id).orElseThrow(OffreMobiliteIntrouvableException::new);
    }

    /** Le compte du jeton, relu : sa filière et sa classe ont pu changer depuis la connexion. */
    private Utilisateur lecteur(UtilisateurPrincipal principal) {
        return utilisateurRepository.findById(principal.getUtilisateur().getId()).orElseThrow(() -> new SecurityException("Compte introuvable."));
    }

    private static Specification<OffreMobilite> visibles() {
        return (racine, requete, cb) -> cb.and(
            cb.notEqual(racine.get("statut"), StatutOffreMobilite.RETIREE),
            cb.notEqual(racine.get("organisme").get("statutValidation"), StatutCompte.SUSPENDU));
    }

    private static Specification<OffreMobilite> duPublic(TypeRole role) {
        PublicVise propre = role == TypeRole.ETUDIANT ? PublicVise.ETUDIANTS : PublicVise.ENSEIGNANTS;
        return (racine, requete, cb) -> racine.get("publicVise").in(propre, PublicVise.TOUS);
    }

    /** Offres sans filière ou avec celle de l'étudiant, et de même pour la classe. */
    private static Specification<OffreMobilite> conditionsEtudiant(Utilisateur etudiant) {
        Filiere filiere = etudiant.getFiliere();
        Classe classe = etudiant.getClasse();
        return (racine, requete, cb) -> cb.and(
            filiere == null ? cb.isEmpty(racine.<Set<Filiere>>get("filieres"))
                : cb.or(cb.isEmpty(racine.<Set<Filiere>>get("filieres")), cb.isMember(filiere, racine.<Set<Filiere>>get("filieres"))),
            classe == null ? cb.isEmpty(racine.<Set<Classe>>get("classes"))
                : cb.or(cb.isEmpty(racine.<Set<Classe>>get("classes")), cb.isMember(classe, racine.<Set<Classe>>get("classes"))));
    }

    private static LocalDate aujourdhui() {
        return LocalDate.now(FUSEAU);
    }

    private static OffreMobiliteResponse versReponse(OffreMobilite offre, Utilisateur lecteur, boolean avecPieces) {
        Organisme organisme = offre.getOrganisme();
        boolean gestion = AccesMobilite.peutGerer(offre, lecteur);
        OffreMobiliteResponse.Eligibilite eligibilite = null;
        if (AccesMobilite.estCandidatPossible(lecteur)) {
            String raison = AccesMobilite.raisonInelegibilite(offre, lecteur);
            eligibilite = new OffreMobiliteResponse.Eligibilite(raison == null, raison);
        }
        List<OffreMobiliteResponse.PieceJointe> pieces = avecPieces
            ? offre.getPiecesJointes().stream()
                .map(piece -> new OffreMobiliteResponse.PieceJointe(piece.getId(), piece.getNomFichier(), piece.getTaille())).toList()
            : List.of();
        return new OffreMobiliteResponse(offre.getId(), offre.getTitre(), offre.getDescription(), offre.getType().name(),
            offre.getPublicVise().name(), offre.getPays(), offre.getVille(), offre.getAnneeUniversitaire(), offre.getPeriode().name(),
            offre.getDureeSemaines(), offre.getNombrePlaces(), offre.getDateLimite(), offre.candidaturesOuvertes(aujourdhui()),
            offre.getStatut().name(), gestion ? offre.getMotifRetrait() : null, offre.getPublieeLe(),
            new OffreMobiliteResponse.Organisme(organisme.getId(), organisme.getNom(), organisme.getLogoUrl(), organisme.getPays()),
            offre.getFilieres().stream().sorted(Comparator.comparing(Filiere::getNom))
                .map(f -> new OffreMobiliteResponse.Filiere(f.getId(), f.getNom())).toList(),
            offre.getClasses().stream().sorted().map(Enum::name).toList(),
            offre.getPiecesDemandees().stream().sorted().map(Enum::name).toList(),
            pieces,
            gestion && offre.getStatut() != StatutOffreMobilite.RETIREE,
            eligibilite);
    }
}

package ept.edu.sn.alumni_backend.mobilite.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.admin.PermissionAdmin;
import ept.edu.sn.alumni_backend.admin.evenement.NotificationCompte;
import ept.edu.sn.alumni_backend.annuaire.dto.PageResponse;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeOrganisme;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.filiere.entity.Filiere;
import ept.edu.sn.alumni_backend.filiere.repository.FiliereRepository;
import ept.edu.sn.alumni_backend.mobilite.ActionHistorique;
import ept.edu.sn.alumni_backend.mobilite.ObjetHistorique;
import ept.edu.sn.alumni_backend.mobilite.SensMobilite;
import ept.edu.sn.alumni_backend.mobilite.StatutMobilite;
import ept.edu.sn.alumni_backend.mobilite.TypeMobilite;
import ept.edu.sn.alumni_backend.mobilite.dto.AccueilRequest;
import ept.edu.sn.alumni_backend.mobilite.dto.EvenementHistoriqueResponse;
import ept.edu.sn.alumni_backend.mobilite.dto.FluxResponse;
import ept.edu.sn.alumni_backend.mobilite.dto.MobiliteResponse;
import ept.edu.sn.alumni_backend.mobilite.entity.Mobilite;
import ept.edu.sn.alumni_backend.mobilite.exception.ConflitMobiliteException;
import ept.edu.sn.alumni_backend.mobilite.exception.OffreMobiliteIntrouvableException;
import ept.edu.sn.alumni_backend.mobilite.repository.HistoriqueMobiliteRepository;
import ept.edu.sn.alumni_backend.mobilite.repository.MobiliteRepository;
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
 * Suivi des mobilités et flux avec les partenaires.
 * - Le chef du service mobilité fait avancer une mobilité (prévue, en cours, terminée, ou annulée avec un motif).
 * - Un institut propose les étudiants qu'il envoie à l'EPT ; le chef accepte ou refuse avec un motif. Le chef peut aussi
 *   saisir lui-même une mobilité entrante.
 * - Les flux comptent, par année universitaire, les mobilités prévues, en cours ou terminées de chaque partenaire.
 */
@Service
@RequiredArgsConstructor
public class MobilitesService {
    private static final List<StatutMobilite> COMPTEES = List.of(StatutMobilite.PREVUE, StatutMobilite.EN_COURS, StatutMobilite.TERMINEE);

    private final MobiliteRepository mobiliteRepository;
    private final HistoriqueMobiliteRepository historiqueRepository;
    private final OrganismeRepository organismeRepository;
    private final OrganismeService organismeService;
    private final FiliereRepository filiereRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final HistoriqueMobiliteService historique;
    private final ApplicationEventPublisher evenements;

    @Transactional(readOnly = true)
    public PageResponse<MobiliteResponse> listerPourChef(SensMobilite sens, UUID organismeId, StatutMobilite statut, String annee, int page, int taille) {
        Specification<Mobilite> specification = Specification.unrestricted();
        if (sens != null) specification = specification.and((r, q, cb) -> cb.equal(r.get("sens"), sens));
        if (organismeId != null) specification = specification.and((r, q, cb) -> cb.equal(r.get("organisme").get("id"), organismeId));
        if (statut != null) specification = specification.and((r, q, cb) -> cb.equal(r.get("statut"), statut));
        if (annee != null && !annee.isBlank()) {
            String valeur = annee.trim();
            specification = specification.and((r, q, cb) -> cb.equal(r.get("anneeUniversitaire"), valeur));
        }
        return PageResponse.depuis(mobiliteRepository.findAll(specification,
                PageRequest.of(page, taille, Sort.by(Sort.Order.desc("anneeUniversitaire"), Sort.Order.desc("creeeLe"))))
            .map(m -> versReponse(m, true)));
    }

    @Transactional(readOnly = true)
    public MobiliteResponse detail(UUID id) {
        return versReponse(mobiliteRepository.findDetailById(id).orElseThrow(OffreMobiliteIntrouvableException::new), true);
    }

    /** L'historique de la mobilité, de sa candidature et de son offre, dans l'ordre. */
    @Transactional(readOnly = true)
    public List<EvenementHistoriqueResponse> historique(UUID id) {
        Mobilite mobilite = mobiliteRepository.findDetailById(id).orElseThrow(OffreMobiliteIntrouvableException::new);
        List<UUID> objets = new ArrayList<>(List.of(mobilite.getId()));
        if (mobilite.getCandidature() != null) {
            objets.add(mobilite.getCandidature().getId());
            objets.add(mobilite.getCandidature().getOffre().getId());
        }
        return historiqueRepository.findByObjetIdInOrderByDateActionAsc(objets).stream()
            .map(h -> new EvenementHistoriqueResponse(h.getObjet().name(), h.getAction().name(), h.getDetails(), h.getMotif(),
                h.getAuteur().getPrenom() + " " + h.getAuteur().getNom(), h.getDateAction()))
            .toList();
    }

    @Transactional
    public MobiliteResponse changerStatut(UUID id, StatutMobilite nouveau, String motif, UtilisateurPrincipal principal) {
        Mobilite mobilite = mobiliteRepository.findByIdForUpdate(id).orElseThrow(OffreMobiliteIntrouvableException::new);
        StatutMobilite avant = mobilite.getStatut();
        boolean permis = switch (avant) {
            case PREVUE -> nouveau == StatutMobilite.EN_COURS || nouveau == StatutMobilite.ANNULEE;
            case EN_COURS -> nouveau == StatutMobilite.TERMINEE || nouveau == StatutMobilite.ANNULEE;
            default -> false;
        };
        if (!permis) {
            throw new ConflitMobiliteException("Une mobilité « " + avant + " » ne passe pas à « " + nouveau + " ».");
        }
        String texte = motif == null ? null : motif.trim();
        if (nouveau == StatutMobilite.ANNULEE && (texte == null || texte.isEmpty())) {
            throw new IllegalArgumentException("Le motif d'une annulation est obligatoire.");
        }
        LocalDate aujourdhui = LocalDate.now(OffresMobiliteService.FUSEAU);
        if (nouveau == StatutMobilite.EN_COURS && mobilite.getDateDebut() == null) mobilite.setDateDebut(aujourdhui);
        if (nouveau == StatutMobilite.TERMINEE && mobilite.getDateFin() == null) mobilite.setDateFin(aujourdhui);
        mobilite.setStatut(nouveau);
        if (nouveau == StatutMobilite.ANNULEE) mobilite.setMotif(texte);
        historique.consigner(ObjetHistorique.MOBILITE, mobilite.getId(), ActionHistorique.CHANGEMENT_STATUT_MOBILITE, avant + " → " + nouveau,
            nouveau == StatutMobilite.ANNULEE ? texte : null, principal.getUtilisateur().getId());
        Utilisateur participant = mobilite.getParticipant();
        if (nouveau == StatutMobilite.ANNULEE && participant != null && participant.getEmail() != null) {
            evenements.publishEvent(new NotificationCompte(participant.getId(), participant.getEmail(), "Mobilité annulée",
                "Bonjour, votre mobilité auprès de " + mobilite.getOrganisme().getNom() + " (" + mobilite.getAnneeUniversitaire()
                    + ") est annulée par le service mobilité. Motif : " + texte));
        }
        return versReponse(mobilite, true);
    }

    @Transactional
    public MobiliteResponse saisirEntrante(AccueilRequest request, UUID organismeId, String nomNouvelOrganisme, UtilisateurPrincipal principal) {
        Organisme organisme = organismeService.resoudreOrganisme(organismeId, nomNouvelOrganisme);
        if (organisme.getTypeOrganisme() == null) {
            organisme.setTypeOrganisme(TypeOrganisme.ETABLISSEMENT_ENSEIGNEMENT);
        } else if (organisme.getTypeOrganisme() != TypeOrganisme.ETABLISSEMENT_ENSEIGNEMENT) {
            throw new IllegalArgumentException("Une mobilité entrante vient d'un établissement d'enseignement.");
        }
        Mobilite mobilite = nouvelleEntrante(request, organisme, principal.getUtilisateur());
        mobilite.setStatut(StatutMobilite.PREVUE);
        mobilite = mobiliteRepository.save(mobilite);
        historique.consigner(ObjetHistorique.MOBILITE, mobilite.getId(), ActionHistorique.CREATION_MOBILITE, "PREVUE", null, principal.getUtilisateur().getId());
        return versReponse(mobilite, true);
    }

    @Transactional
    public MobiliteResponse proposerAccueil(AccueilRequest request, UtilisateurPrincipal principal) {
        Organisme organisme = institutValide(principal.getUtilisateur());
        Mobilite mobilite = nouvelleEntrante(request, organisme, principal.getUtilisateur());
        mobilite.setStatut(StatutMobilite.PROPOSEE);
        mobilite = mobiliteRepository.save(mobilite);
        historique.consigner(ObjetHistorique.MOBILITE, mobilite.getId(), ActionHistorique.PROPOSITION_ACCUEIL, null, null, principal.getUtilisateur().getId());
        String message = organisme.getNom() + " propose d'envoyer " + mobilite.getPrenom() + " " + mobilite.getNom() + " à l'EPT ("
            + mobilite.getAnneeUniversitaire() + ").";
        utilisateurRepository.administrateursActifsAvecUneDe(List.of(PermissionAdmin.GERER_MOBILITES, PermissionAdmin.GERER_ADMINISTRATEURS))
            .forEach(chef -> evenements.publishEvent(new NouvelleNotification(chef.getId(), TypeNotification.MOBILITE,
                "Étudiant proposé à l'EPT", message, "/admin/mobilites/suivi?statut=PROPOSEE")));
        return versReponse(mobilite, true);
    }

    /** L'institut corrige sa proposition tant que le chef ne l'a pas traitée ; une autre lui reste introuvable. */
    @Transactional
    public MobiliteResponse modifierAccueil(UUID id, AccueilRequest request, UtilisateurPrincipal principal) {
        Mobilite mobilite = mobiliteRepository.findByIdForUpdate(id)
            .filter(m -> m.getSens() == SensMobilite.ENTRANTE && estDeLInstitut(m, principal.getUtilisateur()))
            .orElseThrow(OffreMobiliteIntrouvableException::new);
        if (mobilite.getStatut() != StatutMobilite.PROPOSEE) {
            throw new ConflitMobiliteException("L'école a déjà traité cette proposition : elle ne se modifie plus.");
        }
        remplir(mobilite, request);
        historique.consigner(ObjetHistorique.MOBILITE, mobilite.getId(), ActionHistorique.MODIFICATION_ACCUEIL, null, null, principal.getUtilisateur().getId());
        return versReponse(mobilite, true);
    }

    @Transactional
    public MobiliteResponse accepterAccueil(UUID id, UtilisateurPrincipal principal) {
        Mobilite mobilite = propositionVerrouillee(id);
        mobilite.setStatut(StatutMobilite.PREVUE);
        historique.consigner(ObjetHistorique.MOBILITE, mobilite.getId(), ActionHistorique.ACCEPTATION_ACCUEIL, null, null, principal.getUtilisateur().getId());
        prevenirInstitut(mobilite, "Étudiant accepté par l'EPT", "l'EPT accueillera " + mobilite.getPrenom() + " " + mobilite.getNom()
            + " (" + mobilite.getAnneeUniversitaire() + ").");
        return versReponse(mobilite, true);
    }

    @Transactional
    public MobiliteResponse refuserAccueil(UUID id, String motif, UtilisateurPrincipal principal) {
        Mobilite mobilite = propositionVerrouillee(id);
        String texte = motif.trim();
        mobilite.setStatut(StatutMobilite.REFUSEE);
        mobilite.setMotif(texte);
        historique.consigner(ObjetHistorique.MOBILITE, mobilite.getId(), ActionHistorique.REFUS_ACCUEIL, null, texte, principal.getUtilisateur().getId());
        prevenirInstitut(mobilite, "Proposition d'accueil refusée", "l'EPT n'accueillera pas " + mobilite.getPrenom() + " " + mobilite.getNom()
            + ". Motif : " + texte);
        return versReponse(mobilite, true);
    }

    /** Mobilités qui concernent l'établissement connecté, dans les deux sens, propositions comprises. */
    @Transactional(readOnly = true)
    public List<MobiliteResponse> mobilitesDeLInstitut(UtilisateurPrincipal principal) {
        Utilisateur moi = principal.getUtilisateur();
        if (moi.getOrganisme() == null) return List.of();
        UUID organismeId = moi.getOrganisme().getId();
        Specification<Mobilite> deLInstitut = (r, q, cb) -> cb.equal(r.get("organisme").get("id"), organismeId);
        return mobiliteRepository.findAll(deLInstitut, PageRequest.of(0, 500,
                Sort.by(Sort.Order.desc("anneeUniversitaire"), Sort.Order.desc("creeeLe"))))
            .map(m -> versReponse(m, m.getSens() == SensMobilite.ENTRANTE)).getContent();
    }

    @Transactional(readOnly = true)
    public FluxResponse flux(String annee) {
        List<String> annees = mobiliteRepository.annees();
        String choisie = annee != null && !annee.isBlank() ? annee.trim() : annees.isEmpty() ? "" : annees.get(0);
        Map<UUID, long[]> parOrganisme = new LinkedHashMap<>();
        Map<UUID, String> noms = new LinkedHashMap<>();
        for (MobiliteRepository.FluxProjection ligne : mobiliteRepository.flux(choisie, COMPTEES)) {
            noms.put(ligne.getOrganismeId(), ligne.getOrganisme());
            parOrganisme.computeIfAbsent(ligne.getOrganismeId(), k -> new long[2])[ligne.getSens() == SensMobilite.SORTANTE ? 0 : 1] += ligne.getNombre();
        }
        List<FluxResponse.Ligne> lignes = parOrganisme.entrySet().stream()
            .map(e -> new FluxResponse.Ligne(e.getKey(), noms.get(e.getKey()), e.getValue()[0], e.getValue()[1])).toList();
        return new FluxResponse(choisie, annees, lignes,
            lignes.stream().mapToLong(FluxResponse.Ligne::sortantes).sum(), lignes.stream().mapToLong(FluxResponse.Ligne::entrantes).sum());
    }

    private Mobilite propositionVerrouillee(UUID id) {
        Mobilite mobilite = mobiliteRepository.findByIdForUpdate(id).orElseThrow(OffreMobiliteIntrouvableException::new);
        if (mobilite.getStatut() != StatutMobilite.PROPOSEE) {
            throw new ConflitMobiliteException("Cette proposition est déjà traitée.");
        }
        return mobilite;
    }

    private Organisme institutValide(Utilisateur auteur) {
        String refus = "Seul un établissement d'enseignement partenaire propose des étudiants à accueillir.";
        if (auteur.getRole() != TypeRole.ORGANISME || auteur.getOrganisme() == null) throw new SecurityException(refus);
        Organisme organisme = organismeRepository.findById(auteur.getOrganisme().getId()).orElseThrow(() -> new SecurityException(refus));
        if (organisme.getTypeOrganisme() != TypeOrganisme.ETABLISSEMENT_ENSEIGNEMENT) throw new SecurityException(refus);
        if (organisme.getStatutValidation() != StatutCompte.ACTIF) {
            throw new SecurityException("Votre établissement doit être validé par l'école avant de proposer un étudiant.");
        }
        return organisme;
    }

    private Mobilite nouvelleEntrante(AccueilRequest request, Organisme organisme, Utilisateur auteur) {
        Mobilite mobilite = new Mobilite();
        mobilite.setSens(SensMobilite.ENTRANTE);
        mobilite.setOrganisme(organisme);
        mobilite.setCreeePar(utilisateurRepository.getReferenceById(auteur.getId()));
        remplir(mobilite, request);
        return mobilite;
    }

    private void remplir(Mobilite mobilite, AccueilRequest request) {
        String[] annees = request.anneeUniversitaire().split("-");
        if (Integer.parseInt(annees[1]) != Integer.parseInt(annees[0]) + 1) {
            throw new IllegalArgumentException("L'année universitaire couvre deux années qui se suivent, par exemple « 2027-2028 ».");
        }
        if (request.type() == TypeMobilite.ENSEIGNEMENT_RECHERCHE) {
            throw new IllegalArgumentException("Un étudiant accueilli vient pour un échange ou un double diplôme.");
        }
        if (request.dateDebut() != null && request.dateFin() != null && request.dateFin().isBefore(request.dateDebut())) {
            throw new IllegalArgumentException("La fin du séjour ne peut pas précéder son début.");
        }
        Filiere filiere = filiereRepository.findById(request.filiereAccueilId())
            .filter(Filiere::isActive).orElseThrow(() -> new IllegalArgumentException("Cette filière n'existe pas ou n'est plus active."));
        mobilite.setPrenom(request.prenom().trim());
        mobilite.setNom(request.nom().trim());
        mobilite.setEmail(request.email() == null || request.email().isBlank() ? null : request.email().trim());
        mobilite.setProgrammeOrigine(request.programmeOrigine().trim());
        mobilite.setFiliereAccueil(filiere);
        mobilite.setType(request.type());
        mobilite.setAnneeUniversitaire(request.anneeUniversitaire());
        mobilite.setDateDebut(request.dateDebut());
        mobilite.setDateFin(request.dateFin());
    }

    private void prevenirInstitut(Mobilite mobilite, String sujet, String texte) {
        Utilisateur contact = mobilite.getOrganisme().getContact();
        if (contact != null && contact.getEmail() != null) {
            evenements.publishEvent(new NotificationCompte(contact.getId(), contact.getEmail(), sujet, "Bonjour, " + texte));
        }
    }

    private static boolean estDeLInstitut(Mobilite mobilite, Utilisateur utilisateur) {
        return utilisateur.getRole() == TypeRole.ORGANISME && utilisateur.getOrganisme() != null
            && utilisateur.getOrganisme().getId().equals(mobilite.getOrganisme().getId());
    }

    private static MobiliteResponse versReponse(Mobilite m, boolean avecEmail) {
        MobiliteResponse.Personne personne = m.getSens() == SensMobilite.SORTANTE && m.getParticipant() != null
            ? new MobiliteResponse.Personne(m.getParticipant().getId(), m.getParticipant().getPrenom(), m.getParticipant().getNom(), null)
            : new MobiliteResponse.Personne(null, m.getPrenom(), m.getNom(), avecEmail ? m.getEmail() : null);
        MobiliteResponse.Offre offre = m.getCandidature() == null ? null : new MobiliteResponse.Offre(m.getCandidature().getOffre().getId(),
            m.getCandidature().getOffre().getTitre(), m.getCandidature().getOffre().getPeriode().name());
        return new MobiliteResponse(m.getId(), m.getSens().name(), m.getStatut().name(), m.getType().name(), m.getAnneeUniversitaire(),
            m.getDateDebut(), m.getDateFin(), new MobiliteResponse.Organisme(m.getOrganisme().getId(), m.getOrganisme().getNom()), personne,
            m.getProgrammeOrigine(), m.getFiliereAccueil() == null ? null : m.getFiliereAccueil().getNom(),
            m.getFiliereAccueil() == null ? null : m.getFiliereAccueil().getId(), offre, m.getMotif(), m.getCreeeLe());
    }
}

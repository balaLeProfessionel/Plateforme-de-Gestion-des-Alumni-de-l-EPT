package ept.edu.sn.alumni_backend.emploi.service;

import ept.edu.sn.alumni_backend.admin.PermissionAdmin;
import ept.edu.sn.alumni_backend.annuaire.dto.PageResponse;
import ept.edu.sn.alumni_backend.apercu.GardeAdresse;
import ept.edu.sn.alumni_backend.competence.entity.Competence;
import ept.edu.sn.alumni_backend.competence.repository.CompetenceRepository;
import ept.edu.sn.alumni_backend.competence.service.CompetencesLanguesService;
import ept.edu.sn.alumni_backend.emploi.ModeOffreEmploi;
import ept.edu.sn.alumni_backend.emploi.StatutOffreEmploi;
import ept.edu.sn.alumni_backend.emploi.dto.OffreEmploiResponse;
import ept.edu.sn.alumni_backend.emploi.dto.OffreRelayeeRequest;
import ept.edu.sn.alumni_backend.emploi.dto.SignalementOffreRequest;
import ept.edu.sn.alumni_backend.emploi.entity.OffreEmploi;
import ept.edu.sn.alumni_backend.emploi.entity.SignalementOffreEmploi;
import ept.edu.sn.alumni_backend.emploi.exception.ConflitOffreEmploiException;
import ept.edu.sn.alumni_backend.emploi.exception.OffreEmploiIntrouvableException;
import ept.edu.sn.alumni_backend.emploi.repository.OffreEmploiRepository;
import ept.edu.sn.alumni_backend.emploi.repository.SignalementOffreEmploiRepository;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeContrat;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.filiere.entity.Filiere;
import ept.edu.sn.alumni_backend.filiere.repository.FiliereRepository;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.IdentitePublique;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collection;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Offres d'emploi (#221) : socle commun et offres relayées.
 * - Un alumni, un étudiant ou un membre du personnel actif relaie une offre vue ailleurs ; elle est publiée aussitôt.
 * - Une offre publiée est visible de tout membre connecté ; les autres, seulement de leur auteur et de
 *   l'administration (permission GERER_OFFRES_EMPLOI). Sinon : 404, pour ne pas révéler son existence.
 * - Seul l'auteur modifie, prolonge ou retire son offre, tant qu'elle est publiée ou en attente.
 * - La date d'expiration va d'aujourd'hui à 6 mois ; une offre expirée reste publiée mais sort de la liste par défaut.
 * - Un membre signale une fois une offre publiée d'un autre membre.
 */
@Service
@RequiredArgsConstructor
public class OffresEmploiService {
    private static final ZoneId FUSEAU = ZoneId.of("Africa/Dakar");
    static final int DUREE_MAX_MOIS = 6;
    private static final Set<TypeRole> ROLES_QUI_RELAIENT = EnumSet.of(TypeRole.ALUMNI, TypeRole.ETUDIANT, TypeRole.PERSONNEL);

    private final OffreEmploiRepository offreRepository;
    private final SignalementOffreEmploiRepository signalementRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final CompetenceRepository competenceRepository;
    private final FiliereRepository filiereRepository;

    @Transactional
    public OffreEmploiResponse relayer(OffreRelayeeRequest request, UtilisateurPrincipal principal) {
        Utilisateur auteur = utilisateurRepository.findById(principal.getUtilisateur().getId())
            .orElseThrow(() -> new SecurityException("Compte introuvable."));
        if (!ROLES_QUI_RELAIENT.contains(auteur.getRole())) {
            throw new SecurityException("Seuls les alumni, les étudiants et le personnel relaient une offre d'emploi.");
        }
        if (auteur.getStatutCompte() != StatutCompte.ACTIF) {
            throw new SecurityException("Votre compte doit être actif pour relayer une offre.");
        }
        OffreEmploi offre = new OffreEmploi();
        offre.setMode(ModeOffreEmploi.RELAYEE);
        offre.setAuteur(auteur);
        appliquer(offre, request);
        offre.publier();
        return versReponse(offreRepository.save(offre), auteur, false);
    }

    @Transactional
    public OffreEmploiResponse modifier(UUID id, OffreRelayeeRequest request, UtilisateurPrincipal principal) {
        OffreEmploi offre = chargerPourAuteur(id, principal.getUtilisateur());
        if (offre.getMode() != ModeOffreEmploi.RELAYEE) {
            throw new ConflitOffreEmploiException("Seule une offre relayée se modifie ici.");
        }
        appliquer(offre, request);
        return versReponse(offre, principal.getUtilisateur(), false);
    }

    /** L'auteur retire son offre, publiée ou en attente : elle disparaît de la liste des membres. */
    @Transactional
    public OffreEmploiResponse retirer(UUID id, UtilisateurPrincipal principal) {
        OffreEmploi offre = chargerPourAuteur(id, principal.getUtilisateur());
        offre.setStatut(StatutOffreEmploi.RETIREE);
        offre.setMotifDecision(null);
        return versReponse(offre, principal.getUtilisateur(), false);
    }

    @Transactional
    public void signaler(UUID id, SignalementOffreRequest request, UtilisateurPrincipal principal) {
        Utilisateur lecteur = principal.getUtilisateur();
        OffreEmploi offre = chargerVisible(id, lecteur);
        if (offre.getStatut() != StatutOffreEmploi.PUBLIEE) {
            throw new ConflitOffreEmploiException("Seule une offre publiée peut être signalée.");
        }
        if (offre.getAuteur().getId().equals(lecteur.getId())) {
            throw new ConflitOffreEmploiException("Vous ne pouvez pas signaler votre propre offre.");
        }
        if (signalementRepository.existsByOffreIdAndAuteurId(id, lecteur.getId())) {
            throw new ConflitOffreEmploiException("Vous avez déjà signalé cette offre.");
        }
        SignalementOffreEmploi signalement = new SignalementOffreEmploi();
        signalement.setOffre(offre);
        signalement.setAuteur(utilisateurRepository.getReferenceById(lecteur.getId()));
        signalement.setMotif(request.motif());
        signalement.setCommentaire(request.commentaire() == null || request.commentaire().isBlank() ? null : request.commentaire().strip());
        signalementRepository.save(signalement);
    }

    /**
     * Offres publiées, de la plus récente à la plus ancienne. Les filtres se combinent ; une filière retient les offres
     * qui la visent et celles ouvertes à toutes les filières.
     */
    @Transactional(readOnly = true)
    public PageResponse<OffreEmploiResponse> lister(String recherche, TypeContrat type, String lieu, UUID filiere,
            ModeOffreEmploi mode, boolean inclureExpirees, int page, int taille, UtilisateurPrincipal principal) {
        Specification<OffreEmploi> specification = visiblesDesMembres();
        if (recherche != null && !recherche.isBlank()) {
            String motif = contenant(recherche);
            specification = specification.and((racine, requete, cb) -> cb.or(
                cb.like(cb.lower(racine.get("titre")), motif),
                cb.like(cb.lower(racine.get("nomEntreprise")), motif),
                cb.like(cb.lower(racine.get("description")), motif)));
        }
        if (type != null) {
            specification = specification.and((racine, requete, cb) -> cb.equal(racine.get("typeContrat"), type));
        }
        if (lieu != null && !lieu.isBlank()) {
            String motif = contenant(lieu);
            specification = specification.and((racine, requete, cb) -> cb.like(cb.lower(racine.get("lieu")), motif));
        }
        if (filiere != null) {
            specification = specification.and((racine, requete, cb) -> {
                var sousRequete = requete.subquery(Integer.class);
                var offre = sousRequete.from(OffreEmploi.class);
                var visee = offre.join("filieres");
                sousRequete.select(cb.literal(1)).where(cb.equal(offre, racine), cb.equal(visee.get("id"), filiere));
                return cb.or(cb.isEmpty(racine.get("filieres")), cb.exists(sousRequete));
            });
        }
        if (mode != null) {
            specification = specification.and((racine, requete, cb) -> cb.equal(racine.get("mode"), mode));
        }
        if (!inclureExpirees) {
            LocalDate aujourdhui = aujourdhui();
            specification = specification.and((racine, requete, cb) -> cb.greaterThanOrEqualTo(racine.get("dateExpiration"), aujourdhui));
        }
        Sort tri = Sort.by(Sort.Order.desc("publieeLe"), Sort.Order.desc("creeeLe"));
        Utilisateur lecteur = principal.getUtilisateur();
        return PageResponse.depuis(offreRepository.findAll(specification, PageRequest.of(page, taille, tri))
            .map(offre -> versReponse(offre, lecteur, false)));
    }

    @Transactional(readOnly = true)
    public OffreEmploiResponse detail(UUID id, UtilisateurPrincipal principal) {
        Utilisateur lecteur = principal.getUtilisateur();
        OffreEmploi offre = chargerVisible(id, lecteur);
        boolean signalable = offre.getStatut() == StatutOffreEmploi.PUBLIEE
            && !offre.getAuteur().getId().equals(lecteur.getId())
            && !signalementRepository.existsByOffreIdAndAuteurId(id, lecteur.getId());
        return versReponse(offre, lecteur, signalable);
    }

    @Transactional(readOnly = true)
    public List<OffreEmploiResponse> mesOffres(UtilisateurPrincipal principal) {
        Utilisateur lecteur = principal.getUtilisateur();
        return offreRepository.findByAuteurIdOrderByCreeeLeDesc(lecteur.getId()).stream()
            .map(offre -> versReponse(offre, lecteur, false))
            .toList();
    }

    private static Specification<OffreEmploi> visiblesDesMembres() {
        return Specification.<OffreEmploi>unrestricted()
            .and((racine, requete, cb) -> cb.equal(racine.get("statut"), StatutOffreEmploi.PUBLIEE))
            .and((racine, requete, cb) -> cb.notEqual(racine.get("auteur").get("statutCompte"), StatutCompte.SUSPENDU));
    }

    private OffreEmploi chargerVisible(UUID id, Utilisateur lecteur) {
        OffreEmploi offre = offreRepository.findWithAuteurById(id).orElseThrow(OffreEmploiIntrouvableException::new);
        boolean visible = offre.getStatut() == StatutOffreEmploi.PUBLIEE
            && offre.getAuteur().getStatutCompte() != StatutCompte.SUSPENDU;
        if (!visible && !estAuteur(offre, lecteur) && !PermissionAdmin.accordee(lecteur, PermissionAdmin.GERER_OFFRES_EMPLOI)) {
            throw new OffreEmploiIntrouvableException();
        }
        return offre;
    }

    /** L'offre verrouillée, pour son auteur, tant qu'elle est publiée ou en attente ; sinon 404 ou 409. */
    private OffreEmploi chargerPourAuteur(UUID id, Utilisateur auteur) {
        OffreEmploi offre = offreRepository.findByIdForUpdate(id).orElseThrow(OffreEmploiIntrouvableException::new);
        if (!estAuteur(offre, auteur)) {
            throw new OffreEmploiIntrouvableException();
        }
        if (!modifiable(offre)) {
            throw new ConflitOffreEmploiException("Une offre refusée ou retirée ne se modifie plus.");
        }
        return offre;
    }

    private void appliquer(OffreEmploi offre, OffreRelayeeRequest request) {
        LocalDate aujourdhui = aujourdhui();
        if (request.dateExpiration().isBefore(aujourdhui)) {
            throw new IllegalArgumentException("La date d'expiration ne peut pas être passée.");
        }
        if (request.dateExpiration().isAfter(aujourdhui.plusMonths(DUREE_MAX_MOIS))) {
            throw new IllegalArgumentException("Une offre reste en ligne " + DUREE_MAX_MOIS + " mois au plus.");
        }
        offre.setTitre(request.titre().strip());
        offre.setDescription(request.description().strip());
        offre.setNomEntreprise(request.entreprise().strip());
        offre.setTypeContrat(request.typeContrat());
        offre.setLieu(request.lieu().strip());
        offre.setDateExpiration(request.dateExpiration());
        offre.setLienSource(GardeAdresse.normaliser(request.lienSource()).toString());
        offre.setSource(request.source() == null || request.source().isBlank() ? null : request.source().strip());
        offre.setCompetences(resoudreCompetences(request.competences()));
        offre.setFilieres(resoudreFilieres(request.filieres(), offre.getFilieres()));
    }

    /** Compétences du référentiel commun, créées à la volée comme sur les profils ; doublons fusionnés par clé. */
    private Set<Competence> resoudreCompetences(List<String> libelles) {
        if (libelles == null || libelles.isEmpty()) {
            return new LinkedHashSet<>();
        }
        Map<String, String> libellesParCle = new LinkedHashMap<>();
        for (String brut : libelles) {
            String libelle = brut.strip().replaceAll("\\s+", " ");
            String cle = CompetencesLanguesService.cle(libelle);
            if (cle.isEmpty()) {
                throw new IllegalArgumentException("Compétence invalide : " + brut);
            }
            libellesParCle.putIfAbsent(cle, libelle);
        }
        Map<String, Competence> referentiel = new HashMap<>();
        competenceRepository.findByCleIn(libellesParCle.keySet()).forEach(c -> referentiel.put(c.getCle(), c));
        Set<Competence> resultat = new LinkedHashSet<>();
        libellesParCle.forEach((cle, libelle) -> resultat.add(referentiel.computeIfAbsent(cle, k -> {
            Competence nouvelle = new Competence();
            nouvelle.setCle(k);
            nouvelle.setLibelle(libelle);
            return competenceRepository.save(nouvelle);
        })));
        return resultat;
    }

    /** Filières existantes et ouvertes ; une filière retirée depuis reste acceptée si l'offre la visait déjà. */
    private Set<Filiere> resoudreFilieres(List<UUID> ids, Collection<Filiere> actuelles) {
        if (ids == null || ids.isEmpty()) {
            return new LinkedHashSet<>();
        }
        Set<UUID> demandees = new LinkedHashSet<>(ids);
        List<Filiere> trouvees = filiereRepository.findAllById(demandees);
        Set<UUID> dejaVisees = new LinkedHashSet<>();
        actuelles.forEach(f -> dejaVisees.add(f.getId()));
        if (trouvees.size() != demandees.size()
                || trouvees.stream().anyMatch(f -> !f.isActive() && !dejaVisees.contains(f.getId()))) {
            throw new IllegalArgumentException("Une des filières choisies n'existe pas.");
        }
        return new LinkedHashSet<>(trouvees);
    }

    private OffreEmploiResponse versReponse(OffreEmploi offre, Utilisateur lecteur, boolean signalable) {
        boolean auteurOuAdmin = estAuteur(offre, lecteur) || PermissionAdmin.accordee(lecteur, PermissionAdmin.GERER_OFFRES_EMPLOI);
        Utilisateur auteur = offre.getAuteur();
        IdentitePublique identite = IdentitePublique.de(auteur);
        var auteurReponse = new OffreEmploiResponse.Auteur(auteur.getId(), identite.prenom(), identite.nom(), identite.photo(),
            auteur.getRole().name(), auteur.getAnneeSortie(), auteur.getFiliere() == null ? null : auteur.getFiliere().getNom(),
            identite.organismeId());
        List<OffreEmploiResponse.Filiere> filieres = new ArrayList<>();
        offre.getFilieres().forEach(f -> filieres.add(new OffreEmploiResponse.Filiere(f.getId(), f.getNom())));
        return new OffreEmploiResponse(
            offre.getId(),
            offre.getMode().name(),
            offre.getTitre(),
            offre.getDescription(),
            offre.entrepriseAffichee(),
            offre.getOrganisme() == null ? null : offre.getOrganisme().getId(),
            offre.getTypeContrat().name(),
            offre.getLieu(),
            offre.getDateExpiration(),
            offre.estExpiree(aujourdhui()),
            offre.getLienSource(),
            offre.getSource(),
            offre.getCompetences().stream().map(Competence::getLibelle).toList(),
            filieres,
            offre.getStatut().name(),
            auteurOuAdmin ? offre.getMotifDecision() : null,
            auteurReponse,
            offre.getPublieeLe(),
            offre.getCreeeLe(),
            estAuteur(offre, lecteur) && modifiable(offre),
            signalable);
    }

    private static boolean modifiable(OffreEmploi offre) {
        return offre.getStatut() == StatutOffreEmploi.PUBLIEE || offre.getStatut() == StatutOffreEmploi.SOUMISE;
    }

    private static boolean estAuteur(OffreEmploi offre, Utilisateur utilisateur) {
        return utilisateur != null && offre.getAuteur().getId().equals(utilisateur.getId());
    }

    private static String contenant(String texte) {
        String nettoye = texte.strip().toLowerCase(Locale.ROOT).replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
        return "%" + nettoye + "%";
    }

    static LocalDate aujourdhui() {
        return LocalDate.now(FUSEAU);
    }
}

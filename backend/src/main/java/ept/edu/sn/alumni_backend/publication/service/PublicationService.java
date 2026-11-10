package ept.edu.sn.alumni_backend.publication.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import ept.edu.sn.alumni_backend.admin.PermissionAdmin;
import ept.edu.sn.alumni_backend.apercu.ApercuLienResponse;
import ept.edu.sn.alumni_backend.apercu.ApercuLienService;
import ept.edu.sn.alumni_backend.apercu.GardeAdresse;
import ept.edu.sn.alumni_backend.apercu.LecteurMeta;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.publication.AudiencePublication;
import ept.edu.sn.alumni_backend.publication.PublicationProperties;
import ept.edu.sn.alumni_backend.publication.StatutPublication;
import ept.edu.sn.alumni_backend.publication.TypePublication;
import ept.edu.sn.alumni_backend.publication.dto.CommentairePublicationResponse;
import ept.edu.sn.alumni_backend.publication.dto.ArticlePublicationResponse;
import ept.edu.sn.alumni_backend.publication.dto.LienPublicationResponse;
import ept.edu.sn.alumni_backend.publication.dto.PagePublicationsResponse;
import ept.edu.sn.alumni_backend.publication.dto.PublicationRequest;
import ept.edu.sn.alumni_backend.publication.dto.PublicationResponse;
import ept.edu.sn.alumni_backend.publication.entity.Publication;
import ept.edu.sn.alumni_backend.publication.exception.LimiteCreationPublicationAtteinteException;
import ept.edu.sn.alumni_backend.publication.exception.PublicationIntrouvableException;
import ept.edu.sn.alumni_backend.publication.repository.PublicationRepository;
import ept.edu.sn.alumni_backend.publication.repository.CommentairePublicationRepository;
import ept.edu.sn.alumni_backend.publication.repository.CompteParPublication;
import ept.edu.sn.alumni_backend.publication.repository.JaimePublicationRepository;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.IdentitePublique;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PublicationService {
    /** Les dates limites s'entendent à l'heure de Dakar (UTC toute l'année). */
    private static final Clock HORLOGE_DAKAR = Clock.system(java.time.ZoneId.of("Africa/Dakar"));

    private final PublicationRepository publications;
    private final JaimePublicationRepository jaimes;
    private final CommentairePublicationRepository commentaires;
    private final UtilisateurRepository utilisateurs;
    private final PublicationProperties proprietes;
    private final StockageImagePublication stockageImages;
    private final ApercuLienService apercusLien;

    @Transactional
    public PublicationResponse creer(PublicationRequest demande, UtilisateurPrincipal principal) {
        return creerInterne(demande, principal, null);
    }

    @Transactional
    public PublicationResponse creerAvecImage(PublicationRequest demande, MultipartFile image, UtilisateurPrincipal principal) {
        return creerInterne(demande, principal, image);
    }

    private PublicationResponse creerInterne(PublicationRequest demande, UtilisateurPrincipal principal, MultipartFile image) {
        Utilisateur auteur = utilisateurs.findByIdForUpdate(principal.getUtilisateur().getId())
            .orElseThrow(() -> new SecurityException("Compte indisponible."));
        if (!auteur.isEmailVerifie() || (auteur.getStatutCompte() != StatutCompte.ACTIF
                && auteur.getStatutCompte() != StatutCompte.EN_ATTENTE)) {
            throw new SecurityException("Compte indisponible.");
        }
        verifierType(demande, auteur.getRole());
        if (publications.countByAuteur_IdAndPublieLeGreaterThanEqual(
                auteur.getId(), Instant.now().minus(Duration.ofHours(24))) >= proprietes.limiteCreations24h()) {
            throw new LimiteCreationPublicationAtteinteException();
        }
        Publication publication = new Publication();
        publication.setAuteur(auteur);
        publication.setType(demande.type());
        publication.setTitre(demande.titre() == null || demande.titre().isBlank() ? null : demande.titre().strip());
        publication.setContenu(demande.contenu().strip());
        publication.setAudience(demande.audience());
        publication.setDateLimite(demande.dateLimite());
        joindreLien(publication, demande.lien());
        if (image != null) {
            String identifiant = stockageImages.stocker(image);
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCompletion(int status) {
                    if (status != STATUS_COMMITTED) stockageImages.supprimer(identifiant);
                }
            });
            publication.setUrlImage("stockage:" + identifiant);
            publication.setTexteAlternatif(demande.texteAlternatif() == null || demande.texteAlternatif().isBlank()
                ? null : demande.texteAlternatif().strip());
        }
        return versResponse(publications.saveAndFlush(publication), Interactions.AUCUNE);
    }

    /**
     * L'aperçu repris est celui que le membre a vu en important le lien ; sans lui (cache expiré, lien saisi à la
     * main), on garde l'adresse et le nom du site, sans aller sur le réseau pendant la création.
     */
    private void joindreLien(Publication publication, String lien) {
        if (lien == null || lien.isBlank()) return;
        var adresse = GardeAdresse.normaliser(lien);
        ApercuLienResponse apercu = apercusLien.enCache(adresse.toString()).orElseGet(() -> ApercuLienService.minimal(adresse));
        publication.setLienUrl(adresse.toString());
        publication.setLienTitre(apercu.titre());
        publication.setLienDescription(LecteurMeta.couper(apercu.description(), 600));
        publication.setLienSite(apercu.site());
    }

    /**
     * Annonce officielle et appel à projet sont réservés à l'administration ; ils portent un titre.
     * Seul l'appel à projet a une date limite, qui ne peut pas être déjà passée.
     */
    private void verifierType(PublicationRequest demande, TypeRole role) {
        if (demande.type() == TypePublication.ARTICLE) {
            throw new IllegalArgumentException("Un article se publie depuis l'espace Articles.");
        }
        boolean officiel = estOfficiel(demande.type());
        if (officiel && !PermissionAdmin.pour(role).contains(PermissionAdmin.PUBLIER_ANNONCES)) {
            throw new SecurityException(demande.type() == TypePublication.ANNONCE_OFFICIELLE
                ? "Seule l'administration peut publier une annonce officielle."
                : "Seule l'administration peut diffuser un appel à projet.");
        }
        if (officiel && (demande.titre() == null || demande.titre().isBlank())) {
            throw new IllegalArgumentException("Donnez un titre à cette publication.");
        }
        if (demande.type() != TypePublication.APPEL_PROJET && demande.dateLimite() != null) {
            throw new IllegalArgumentException("La date limite ne concerne que les appels à projets.");
        }
        if (demande.type() == TypePublication.APPEL_PROJET) {
            if (demande.dateLimite() == null) {
                throw new IllegalArgumentException("Indiquez la date limite de réponse.");
            }
            if (demande.dateLimite().isBefore(LocalDate.now(HORLOGE_DAKAR))) {
                throw new IllegalArgumentException("La date limite de réponse est déjà passée.");
            }
        }
    }

    @Transactional(readOnly = true)
    public PagePublicationsResponse lister(UtilisateurPrincipal principal, Set<TypePublication> types, int page, int taille) {
        Utilisateur lecteur = principal.getUtilisateur();
        Specification<Publication> visible = visiblePar(lecteur);
        Specification<Publication> filtre = types == null || types.isEmpty() ? visible
            : visible.and((racine, requete, cb) -> racine.get("type").in(types));
        var tri = Sort.by(Sort.Order.desc("publieLe"), Sort.Order.desc("id"));
        Page<Publication> resultat = publications.findAll(filtre, PageRequest.of(page, taille, tri));
        Map<UUID, Interactions> resumes = interactions(resultat.map(Publication::getId).getContent(), lecteur.getId());
        return PagePublicationsResponse.depuis(resultat.map(p -> versResponse(p, resumes.get(p.getId()))));
    }

    /**
     * Candidates du fil personnalisé : publications visibles parues dans la fenêtre {@code [depuis, jusqua]},
     * les plus récentes d'abord, avec leurs interactions déjà résumées.
     */
    @Transactional(readOnly = true)
    public List<PublicationResponse> listerRecentes(UtilisateurPrincipal principal, Instant depuis, Instant jusqua, int limite) {
        Utilisateur lecteur = principal.getUtilisateur();
        Specification<Publication> fenetre = visiblePar(lecteur).and((racine, requete, cb) ->
            cb.between(racine.get("publieLe"), depuis, jusqua));
        var tri = Sort.by(Sort.Order.desc("publieLe"), Sort.Order.desc("id"));
        List<Publication> resultat = publications.findAll(fenetre, PageRequest.of(0, limite, tri)).getContent();
        Map<UUID, Interactions> resumes = interactions(resultat.stream().map(Publication::getId).toList(), lecteur.getId());
        return resultat.stream().map(p -> versResponse(p, resumes.get(p.getId()))).toList();
    }

    /** Annonce officielle et appel à projet : réservés à l'administration et mis en avant dans le fil. */
    public static boolean estOfficiel(TypePublication type) {
        return type == TypePublication.ANNONCE_OFFICIELLE || type == TypePublication.APPEL_PROJET;
    }

    /** Publiées, et dans l'audience du lecteur (ou écrites par lui) ; la modération voit tout. */
    public Specification<Publication> visiblePar(Utilisateur lecteur) {
        return (racine, requete, cb) -> {
            var publiee = cb.equal(racine.get("statut"), StatutPublication.PUBLIE);
            if (voitToutesLesAudiences(lecteur.getRole())) return publiee;
            var tous = cb.equal(racine.get("audience"), AudiencePublication.TOUS);
            var auteur = cb.equal(racine.get("auteur").get("id"), lecteur.getId());
            AudiencePublication role = audienceDuRole(lecteur.getRole());
            var audience = role == null ? cb.or(tous, auteur)
                : cb.or(tous, auteur, cb.equal(racine.get("audience"), role));
            return cb.and(publiee, audience);
        };
    }

    @Transactional(readOnly = true)
    public PublicationResponse obtenir(UUID id, UtilisateurPrincipal principal) {
        Publication publication = chargerVisible(id, principal);
        return versResponse(publication, interactions(List.of(id), principal.getUtilisateur().getId()).get(id));
    }

    @Transactional(readOnly = true)
    public Resource image(UUID id, UtilisateurPrincipal principal) {
        // La modération revoit l'image d'une publication déjà masquée, que les membres ne voient plus.
        Publication publication = voitToutesLesAudiences(principal.getUtilisateur().getRole())
            ? publications.findById(id).filter(p -> p.getStatut() != StatutPublication.SUPPRIME)
                .orElseThrow(PublicationIntrouvableException::new)
            : chargerVisible(id, principal);
        String url = publication.getUrlImage();
        if (url == null || !url.startsWith("stockage:")) throw new PublicationIntrouvableException();
        return stockageImages.lire(url.substring("stockage:".length()));
    }

    /** Publication publiée que ce lecteur a le droit de voir ; sinon 404, sans révéler qu'elle existe. */
    public Publication chargerVisible(UUID id, UtilisateurPrincipal principal) {
        Utilisateur lecteur = principal.getUtilisateur();
        return publications.findById(id)
            .filter(p -> p.getStatut() == StatutPublication.PUBLIE)
            .filter(p -> voitToutesLesAudiences(lecteur.getRole())
                || p.getAudience() == AudiencePublication.TOUS
                || p.getAudience() == audienceDuRole(lecteur.getRole())
                || p.getAuteur().getId().equals(lecteur.getId()))
            .orElseThrow(PublicationIntrouvableException::new);
    }

    /** « J'aime » et commentaires d'une page en trois requêtes groupées, jamais une par publication. */
    private Map<UUID, Interactions> interactions(Collection<UUID> ids, UUID lecteurId) {
        Map<UUID, Interactions> resultat = new HashMap<>();
        if (ids.isEmpty()) return resultat;
        Map<UUID, Long> nombreJaime = parPublication(jaimes.compter(ids));
        Map<UUID, Long> nombreCommentaires = parPublication(commentaires.compter(ids));
        Set<UUID> aimees = new HashSet<>(jaimes.aimeesPar(lecteurId, ids));
        Map<UUID, CommentairePublicationResponse> apercus = new HashMap<>();
        // Deux commentaires de la même seconde : on garde le premier rencontré.
        for (var c : commentaires.derniers(ids)) apercus.putIfAbsent(c.getPublication().getId(), CommentairePublicationResponse.depuis(c));
        for (UUID id : ids) {
            resultat.put(id, new Interactions(nombreJaime.getOrDefault(id, 0L), aimees.contains(id),
                nombreCommentaires.getOrDefault(id, 0L), apercus.get(id)));
        }
        return resultat;
    }

    private static Map<UUID, Long> parPublication(List<CompteParPublication> lignes) {
        Map<UUID, Long> resultat = new HashMap<>();
        for (var ligne : lignes) resultat.put(ligne.getPublicationId(), ligne.getNombre());
        return resultat;
    }

    private record Interactions(long nombreJaime, boolean jaime, long nombreCommentaires,
            CommentairePublicationResponse apercuCommentaire) {
        static final Interactions AUCUNE = new Interactions(0, false, 0, null);
    }

    private boolean voitToutesLesAudiences(TypeRole role) {
        return PermissionAdmin.pour(role).contains(PermissionAdmin.MODERER_PUBLICATIONS);
    }

    private AudiencePublication audienceDuRole(TypeRole role) {
        return switch (role) {
            case ALUMNI -> AudiencePublication.ALUMNI;
            case ETUDIANT -> AudiencePublication.ETUDIANTS;
            default -> null;
        };
    }

    /** Adresse servie au frontend : les images stockées passent par la route protégée par l'audience. */
    public static String urlImage(Publication p) {
        return p.getUrlImage() != null && p.getUrlImage().startsWith("stockage:")
            ? "/api/publications/" + p.getId() + "/image" : p.getUrlImage();
    }

    private PublicationResponse versResponse(Publication p, Interactions interactions) {
        Utilisateur auteur = p.getAuteur();
        IdentitePublique identite = IdentitePublique.de(auteur);
        return new PublicationResponse(p.getId(), p.getType(), p.getTitre(), p.getContenu(), p.getAudience(), urlImage(p),
            p.getTexteAlternatif(), p.getDateLimite(), p.getPublieLe(), p.getModifieLe(), auteur.getId(), identite.nom(),
            identite.prenom(), auteur.getRole(), identite.photo(), interactions.nombreJaime(), interactions.jaime(),
            interactions.nombreCommentaires(), interactions.apercuCommentaire(),
            p.getLienUrl() == null ? null
                : new LienPublicationResponse(p.getLienUrl(), p.getLienTitre(), p.getLienDescription(), p.getLienSite()),
            p.getArticle() == null ? null
                : new ArticlePublicationResponse(p.getArticle().getId(), p.getArticle().getTheme(), p.getArticle().getTempsLecture()),
            identite.organismeId());
    }
}

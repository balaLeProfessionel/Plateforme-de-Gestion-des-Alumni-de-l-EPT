package ept.edu.sn.alumni_backend.article.service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

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

import ept.edu.sn.alumni_backend.article.ArticleProperties;
import ept.edu.sn.alumni_backend.article.StatutArticle;
import ept.edu.sn.alumni_backend.article.ThemeArticle;
import ept.edu.sn.alumni_backend.article.dto.ArticleRequest;
import ept.edu.sn.alumni_backend.article.dto.ArticleResponse;
import ept.edu.sn.alumni_backend.article.dto.ArticleResumeResponse;
import ept.edu.sn.alumni_backend.article.dto.PageArticlesResponse;
import ept.edu.sn.alumni_backend.article.entity.Article;
import ept.edu.sn.alumni_backend.article.exception.ArticleIntrouvableException;
import ept.edu.sn.alumni_backend.article.exception.ConflitArticleException;
import ept.edu.sn.alumni_backend.article.repository.ArticleRepository;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.publication.PublicationProperties;
import ept.edu.sn.alumni_backend.publication.StatutPublication;
import ept.edu.sn.alumni_backend.publication.TypePublication;
import ept.edu.sn.alumni_backend.publication.dto.PublicationResponse;
import ept.edu.sn.alumni_backend.publication.entity.Publication;
import ept.edu.sn.alumni_backend.publication.exception.LimiteCreationPublicationAtteinteException;
import ept.edu.sn.alumni_backend.publication.exception.PublicationIntrouvableException;
import ept.edu.sn.alumni_backend.publication.repository.PublicationRepository;
import ept.edu.sn.alumni_backend.publication.service.PublicationService;
import ept.edu.sn.alumni_backend.publication.service.StockageImagePublication;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import lombok.RequiredArgsConstructor;

/**
 * Articles de fond. Tout membre peut écrire ; un article publié l'est tout de suite, sans relecture.
 * À la publication, une publication porteuse de type {@code ARTICLE} est créée : elle place l'article dans le fil
 * et reçoit « J'aime », commentaires et signalements. Masquer cette publication (modération) masque l'article.
 */
@Service
@RequiredArgsConstructor
public class ArticleService {
    private static final int MOTS_PAR_MINUTE = 200;
    private static final String PREFIXE_STOCKAGE = "stockage:";

    private final ArticleRepository articles;
    private final PublicationRepository publications;
    private final UtilisateurRepository utilisateurs;
    private final PublicationService publicationService;
    private final StockageImagePublication stockageImages;
    private final ArticleProperties proprietes;
    private final PublicationProperties proprietesPublications;

    // ---------- Écriture ----------

    @Transactional
    public ArticleResponse creer(ArticleRequest demande, MultipartFile couverture, UtilisateurPrincipal principal) {
        Utilisateur auteur = auteurActif(principal);
        if (articles.countByAuteur_IdAndStatut(auteur.getId(), StatutArticle.BROUILLON) >= proprietes.limiteBrouillons()) {
            throw new ConflitArticleException("Vous avez déjà " + proprietes.limiteBrouillons()
                + " brouillons : publiez-en un ou supprimez-en un avant d'en commencer un autre.");
        }
        Article article = new Article();
        article.setAuteur(auteur);
        appliquer(article, demande);
        if (couverture != null) article.setUrlCouverture(stocker(couverture));
        return versResponse(articles.saveAndFlush(article), null, principal);
    }

    @Transactional
    public ArticleResponse modifier(UUID id, ArticleRequest demande, UtilisateurPrincipal principal) {
        Article article = chargerPourAuteur(id, principal);
        appliquer(article, demande);
        Publication porteuse = porteuse(article).orElse(null);
        if (article.getStatut() == StatutArticle.PUBLIE) {
            exigerCompletPourPublier(article);
            synchroniser(article, porteuse);
        }
        articles.flush();
        return versResponse(article, porteuse, principal);
    }

    @Transactional
    public ArticleResponse changerCouverture(UUID id, MultipartFile couverture, UtilisateurPrincipal principal) {
        Article article = chargerPourAuteur(id, principal);
        article.setUrlCouverture(stocker(couverture));
        Publication porteuse = porteuse(article).orElse(null);
        synchroniser(article, porteuse);
        articles.flush();
        return versResponse(article, porteuse, principal);
    }

    @Transactional
    public ArticleResponse retirerCouverture(UUID id, UtilisateurPrincipal principal) {
        Article article = chargerPourAuteur(id, principal);
        article.setUrlCouverture(null);
        Publication porteuse = porteuse(article).orElse(null);
        synchroniser(article, porteuse);
        articles.flush();
        return versResponse(article, porteuse, principal);
    }

    /** Brouillon → publié, avec sa publication porteuse ; compte dans la limite de publications sur 24 heures. */
    @Transactional
    public ArticleResponse publier(UUID id, UtilisateurPrincipal principal) {
        Utilisateur auteur = auteurActif(principal);
        Article article = articles.findByIdForUpdate(id)
            .filter(a -> a.getAuteur().getId().equals(auteur.getId()) && a.getStatut() != StatutArticle.SUPPRIME)
            .orElseThrow(ArticleIntrouvableException::new);
        if (!article.getStatut().peutPasserA(StatutArticle.PUBLIE)) {
            throw new ConflitArticleException("Cet article est déjà publié.");
        }
        exigerCompletPourPublier(article);
        if (publications.countByAuteur_IdAndPublieLeGreaterThanEqual(
                auteur.getId(), Instant.now().minus(Duration.ofHours(24))) >= proprietesPublications.limiteCreations24h()) {
            throw new LimiteCreationPublicationAtteinteException();
        }
        article.setStatut(StatutArticle.PUBLIE);
        article.setPublieLe(Instant.now());
        Publication porteuse = new Publication();
        porteuse.setAuteur(auteur);
        porteuse.setType(TypePublication.ARTICLE);
        porteuse.setArticle(article);
        synchroniser(article, porteuse);
        publications.saveAndFlush(porteuse);
        return versResponse(article, porteuse, principal);
    }

    /** L'article et sa publication porteuse disparaissent ; les commentaires restent en base pour l'historique. */
    @Transactional
    public void supprimer(UUID id, UtilisateurPrincipal principal) {
        Article article = chargerPourAuteur(id, principal);
        article.setStatut(StatutArticle.SUPPRIME);
        porteuse(article).ifPresent(p -> p.setStatut(StatutPublication.SUPPRIME));
        articles.flush();
    }

    // ---------- Lecture ----------

    /** Bibliothèque : articles publiés que le lecteur peut voir, les plus récents d'abord. */
    @Transactional(readOnly = true)
    public PageArticlesResponse lister(UtilisateurPrincipal principal, ThemeArticle theme, String recherche, int page, int taille) {
        Specification<Publication> filtre = publicationService.visiblePar(principal.getUtilisateur())
            .and((racine, requete, cb) -> cb.equal(racine.get("type"), TypePublication.ARTICLE));
        if (theme != null) {
            filtre = filtre.and((racine, requete, cb) -> cb.equal(racine.get("article").get("theme"), theme));
        }
        String mots = recherche == null ? "" : recherche.strip().toLowerCase(java.util.Locale.ROOT);
        if (!mots.isEmpty()) {
            String motif = "%" + mots.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
            filtre = filtre.and((racine, requete, cb) -> cb.or(
                cb.like(cb.lower(racine.get("article").get("titre")), motif, '\\'),
                cb.like(cb.lower(racine.get("article").get("resume")), motif, '\\')));
        }
        var tri = Sort.by(Sort.Order.desc("publieLe"), Sort.Order.desc("id"));
        Page<Publication> resultat = publications.findAll(filtre, PageRequest.of(page, taille, tri));
        Map<UUID, Article> parId = articles.findAllById(resultat.map(p -> p.getArticle().getId()).getContent())
            .stream().collect(Collectors.toMap(Article::getId, Function.identity()));
        return PageArticlesResponse.depuis(resultat.map(p -> versResume(parId.get(p.getArticle().getId()), p.getId())));
    }

    /** Brouillons et articles publiés de l'auteur connecté, les derniers modifiés d'abord. */
    @Transactional(readOnly = true)
    public PageArticlesResponse miens(UtilisateurPrincipal principal, StatutArticle statut, int page, int taille) {
        if (statut == StatutArticle.SUPPRIME) throw new IllegalArgumentException("Les articles supprimés ne sont pas consultables.");
        var statuts = statut == null ? List.of(StatutArticle.BROUILLON, StatutArticle.PUBLIE) : List.of(statut);
        var tri = Sort.by(Sort.Order.desc("modifieLe"), Sort.Order.desc("id"));
        Page<Article> resultat = articles.findByAuteur_IdAndStatutIn(principal.getUtilisateur().getId(), statuts,
            PageRequest.of(page, taille, tri));
        return PageArticlesResponse.depuis(resultat.map(a -> versResume(a, porteuse(a).map(Publication::getId).orElse(null))));
    }

    /**
     * L'auteur voit toujours son article (brouillon compris) ; les autres seulement s'il est publié, non masqué
     * et dans leur audience. Sinon 404, sans révéler qu'il existe.
     */
    @Transactional(readOnly = true)
    public ArticleResponse obtenir(UUID id, UtilisateurPrincipal principal) {
        Article article = articles.findById(id).filter(a -> a.getStatut() != StatutArticle.SUPPRIME)
            .orElseThrow(ArticleIntrouvableException::new);
        Publication porteuse = porteuse(article).orElse(null);
        if (!estAuteur(article, principal)) visibleOuIntrouvable(article, porteuse, principal);
        return versResponse(article, porteuse, principal);
    }

    @Transactional(readOnly = true)
    public Resource couverture(UUID id, UtilisateurPrincipal principal) {
        Article article = articles.findById(id).filter(a -> a.getStatut() != StatutArticle.SUPPRIME)
            .orElseThrow(ArticleIntrouvableException::new);
        if (!estAuteur(article, principal)) visibleOuIntrouvable(article, porteuse(article).orElse(null), principal);
        String url = article.getUrlCouverture();
        if (url == null || !url.startsWith(PREFIXE_STOCKAGE)) throw new ArticleIntrouvableException();
        return stockageImages.lire(url.substring(PREFIXE_STOCKAGE.length()));
    }

    // ---------- Règles ----------

    private Utilisateur auteurActif(UtilisateurPrincipal principal) {
        Utilisateur auteur = utilisateurs.findByIdForUpdate(principal.getUtilisateur().getId())
            .orElseThrow(() -> new SecurityException("Compte indisponible."));
        if (!auteur.isEmailVerifie() || (auteur.getStatutCompte() != StatutCompte.ACTIF
                && auteur.getStatutCompte() != StatutCompte.EN_ATTENTE)) {
            throw new SecurityException("Compte indisponible.");
        }
        return auteur;
    }

    /** Seul l'auteur modifie son article ; pour les autres, l'article n'existe pas (404). */
    private Article chargerPourAuteur(UUID id, UtilisateurPrincipal principal) {
        return articles.findByIdForUpdate(id)
            .filter(a -> a.getStatut() != StatutArticle.SUPPRIME && estAuteur(a, principal))
            .orElseThrow(ArticleIntrouvableException::new);
    }

    private void visibleOuIntrouvable(Article article, Publication porteuse, UtilisateurPrincipal principal) {
        if (article.getStatut() != StatutArticle.PUBLIE || porteuse == null) throw new ArticleIntrouvableException();
        try {
            publicationService.chargerVisible(porteuse.getId(), principal);
        } catch (PublicationIntrouvableException e) {
            throw new ArticleIntrouvableException();
        }
    }

    private static boolean estAuteur(Article article, UtilisateurPrincipal principal) {
        return article.getAuteur().getId().equals(principal.getUtilisateur().getId());
    }

    private void appliquer(Article article, ArticleRequest demande) {
        article.setTitre(demande.titre().strip());
        article.setResume(demande.resume() == null || demande.resume().isBlank() ? null : demande.resume().strip());
        article.setContenu(demande.contenu() == null ? "" : demande.contenu().strip());
        article.setTheme(demande.theme());
        article.setAudience(demande.audience());
        article.setTempsLecture(tempsLecture(article.getContenu()));
    }

    private static void exigerCompletPourPublier(Article article) {
        if (article.getResume() == null) throw new IllegalArgumentException("Ajoutez un résumé avant de publier.");
        if (article.getContenu().isBlank()) throw new IllegalArgumentException("Écrivez le corps de l'article avant de publier.");
    }

    /** La carte du fil montre le titre, le résumé et la couverture de l'article, dans la même audience. */
    private static void synchroniser(Article article, Publication porteuse) {
        if (porteuse == null) return;
        porteuse.setTitre(article.getTitre());
        porteuse.setContenu(article.getResume());
        porteuse.setAudience(article.getAudience());
        porteuse.setUrlImage(article.getUrlCouverture());
    }

    static int tempsLecture(String contenu) {
        String texte = contenu == null ? "" : contenu.strip();
        int mots = texte.isEmpty() ? 0 : texte.split("\\s+").length;
        return Math.max(1, (mots + MOTS_PAR_MINUTE - 1) / MOTS_PAR_MINUTE);
    }

    /** L'image est retirée du disque si la transaction échoue. */
    private String stocker(MultipartFile couverture) {
        String identifiant = stockageImages.stocker(couverture);
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCompletion(int status) {
                if (status != STATUS_COMMITTED) stockageImages.supprimer(identifiant);
            }
        });
        return PREFIXE_STOCKAGE + identifiant;
    }

    private Optional<Publication> porteuse(Article article) {
        return article.getStatut() == StatutArticle.BROUILLON ? Optional.empty() : publications.findByArticle_Id(article.getId());
    }

    private static String urlCouverture(Article a) {
        return a.getUrlCouverture() == null ? null : "/api/articles/" + a.getId() + "/couverture";
    }

    // ---------- Réponses ----------

    private ArticleResponse versResponse(Article a, Publication porteuse, UtilisateurPrincipal principal) {
        long nombreJaime = 0, nombreCommentaires = 0;
        boolean jaime = false;
        if (porteuse != null && porteuse.getStatut() == StatutPublication.PUBLIE) {
            PublicationResponse interactions = publicationService.obtenir(porteuse.getId(), principal);
            nombreJaime = interactions.nombreJaime();
            jaime = interactions.jaime();
            nombreCommentaires = interactions.nombreCommentaires();
        }
        Utilisateur auteur = a.getAuteur();
        return new ArticleResponse(a.getId(), porteuse == null ? null : porteuse.getId(), a.getTitre(), a.getResume(),
            a.getContenu(), a.getTheme(), urlCouverture(a), a.getTempsLecture(), a.getAudience(), a.getStatut(),
            a.getCreeLe(), a.getModifieLe(), a.getPublieLe(), auteur.getId(), auteur.getNom(), auteur.getPrenom(),
            auteur.getRole(), auteur.getUrlPhoto(), estAuteur(a, principal), nombreJaime, jaime, nombreCommentaires);
    }

    private static ArticleResumeResponse versResume(Article a, UUID publicationId) {
        Utilisateur auteur = a.getAuteur();
        return new ArticleResumeResponse(a.getId(), publicationId, a.getTitre(), a.getResume(), a.getTheme(),
            urlCouverture(a), a.getTempsLecture(), a.getStatut(), a.getModifieLe(), a.getPublieLe(), auteur.getId(),
            auteur.getNom(), auteur.getPrenom(), auteur.getRole(), auteur.getUrlPhoto());
    }
}

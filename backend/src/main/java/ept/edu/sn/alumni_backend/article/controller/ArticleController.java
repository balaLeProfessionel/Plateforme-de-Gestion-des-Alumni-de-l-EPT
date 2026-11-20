package ept.edu.sn.alumni_backend.article.controller;

import java.net.URI;
import java.util.UUID;

import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import ept.edu.sn.alumni_backend.article.StatutArticle;
import ept.edu.sn.alumni_backend.article.ThemeArticle;
import ept.edu.sn.alumni_backend.article.dto.ArticleRequest;
import ept.edu.sn.alumni_backend.article.dto.ArticleResponse;
import ept.edu.sn.alumni_backend.article.dto.PageArticlesResponse;
import ept.edu.sn.alumni_backend.article.service.ArticleService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;

/** Articles de fond. « J'aime », commentaires et signalements passent par la publication porteuse. */
@RestController
@RequestMapping("/api/articles")
@Validated
@RequiredArgsConstructor
public class ArticleController {
    private final ArticleService service;

    @GetMapping
    public PageArticlesResponse lister(@AuthenticationPrincipal UtilisateurPrincipal principal,
            @RequestParam(required = false) ThemeArticle theme,
            @RequestParam(required = false) @Size(max = 100) String recherche,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "12") @Min(1) @Max(48) int taille) {
        return service.lister(principal, theme, recherche, page, taille);
    }

    @GetMapping("/miens")
    public PageArticlesResponse miens(@AuthenticationPrincipal UtilisateurPrincipal principal,
            @RequestParam(required = false) StatutArticle statut,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "12") @Min(1) @Max(48) int taille) {
        return service.miens(principal, statut, page, taille);
    }

    @GetMapping("/{id}")
    public ArticleResponse obtenir(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return service.obtenir(id, principal);
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ArticleResponse> creer(@Valid @RequestBody ArticleRequest demande,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        ArticleResponse article = service.creer(demande, null, principal);
        return ResponseEntity.created(URI.create("/api/articles/" + article.id())).body(article);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ArticleResponse> creerAvecCouverture(@Valid @RequestPart("article") ArticleRequest demande,
            @RequestPart("couverture") MultipartFile couverture, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        ArticleResponse article = service.creer(demande, couverture, principal);
        return ResponseEntity.created(URI.create("/api/articles/" + article.id())).body(article);
    }

    @PutMapping("/{id}")
    public ArticleResponse modifier(@PathVariable UUID id, @Valid @RequestBody ArticleRequest demande,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return service.modifier(id, demande, principal);
    }

    @PatchMapping("/{id}/publier")
    public ArticleResponse publier(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return service.publier(id, principal);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        service.supprimer(id, principal);
        return ResponseEntity.noContent().build();
    }

    @PutMapping(value = "/{id}/couverture", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ArticleResponse changerCouverture(@PathVariable UUID id, @RequestPart("couverture") MultipartFile couverture,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return service.changerCouverture(id, couverture, principal);
    }

    @DeleteMapping("/{id}/couverture")
    public ArticleResponse retirerCouverture(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return service.retirerCouverture(id, principal);
    }

    @GetMapping("/{id}/couverture")
    public ResponseEntity<Resource> couverture(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok().contentType(MediaType.IMAGE_PNG).cacheControl(CacheControl.noStore())
            .header("X-Content-Type-Options", "nosniff").header("X-Robots-Tag", "noindex, nofollow, noarchive")
            .body(service.couverture(id, principal));
    }
}

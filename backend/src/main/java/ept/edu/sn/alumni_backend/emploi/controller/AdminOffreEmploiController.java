package ept.edu.sn.alumni_backend.emploi.controller;

import ept.edu.sn.alumni_backend.admin.dto.MotifRequest;
import ept.edu.sn.alumni_backend.annuaire.dto.PageResponse;
import ept.edu.sn.alumni_backend.emploi.FileModerationOffres;
import ept.edu.sn.alumni_backend.emploi.dto.OffreAModererResponse;
import ept.edu.sn.alumni_backend.emploi.service.ModerationOffresEmploiService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Modération des offres d'emploi (#224) ; la permission GERER_OFFRES_EMPLOI est exigée par SecurityConfig. */
@RestController
@RequestMapping("/api/admin/offres-emploi")
@Validated
@RequiredArgsConstructor
public class AdminOffreEmploiController {
    private final ModerationOffresEmploiService moderation;

    @GetMapping
    public PageResponse<OffreAModererResponse> lister(@RequestParam(defaultValue = "A_VERIFIER") FileModerationOffres file,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(48) int taille,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return moderation.lister(file, page, taille, principal);
    }

    @GetMapping("/compteur")
    public Map<String, Long> compteur() {
        return moderation.compter();
    }

    @PatchMapping("/{id}/publier")
    public OffreAModererResponse publier(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return moderation.publier(id, principal);
    }

    @PatchMapping("/{id}/refuser")
    public OffreAModererResponse refuser(@PathVariable UUID id, @Valid @RequestBody MotifRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return moderation.refuser(id, request.motif(), principal);
    }

    @PatchMapping("/{id}/retirer")
    public OffreAModererResponse retirer(@PathVariable UUID id, @Valid @RequestBody MotifRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return moderation.retirer(id, request.motif(), principal);
    }

    @PatchMapping("/{id}/classer-signalements")
    public OffreAModererResponse classerSignalements(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return moderation.classerSignalements(id, principal);
    }
}

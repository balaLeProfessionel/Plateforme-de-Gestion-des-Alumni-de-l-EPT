package ept.edu.sn.alumni_backend.messagerie.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import ept.edu.sn.alumni_backend.annuaire.dto.AnnuaireMembreResponse;
import ept.edu.sn.alumni_backend.annuaire.dto.PageResponse;
import ept.edu.sn.alumni_backend.messagerie.dto.CommunauteResponse;
import ept.edu.sn.alumni_backend.messagerie.dto.CommunautesResponse;
import ept.edu.sn.alumni_backend.messagerie.dto.ConversationDetailResponse;
import ept.edu.sn.alumni_backend.messagerie.service.AnnuaireCommunauteService;
import ept.edu.sn.alumni_backend.messagerie.service.CommunauteService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;

/** Communautés de la messagerie : mes communautés, celles à découvrir, leur annuaire, rejoindre ; l'administration les crée (AdminCommunauteController). */
@RestController
@RequestMapping("/api/messagerie/communautes")
@RequiredArgsConstructor
@Validated
public class CommunauteController {
    private final CommunauteService communauteService;
    private final AnnuaireCommunauteService annuaireCommunaute;

    @GetMapping
    public CommunautesResponse lister(@AuthenticationPrincipal UtilisateurPrincipal principal) {
        return communauteService.lister(principal.getUtilisateur().getId());
    }

    /** Communautés à rejoindre dont le nom ou la description contient la recherche (30 au plus). */
    @GetMapping("/decouvrir")
    public List<CommunauteResponse> decouvrir(
            @RequestParam @NotBlank @Size(max = 100) String recherche,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return communauteService.rechercherADecouvrir(principal.getUtilisateur().getId(), recherche);
    }

    /** Annuaire de la communauté, pour ses membres : cartes triées par nom, recherche par nom, poste, ville, filière. */
    @GetMapping("/{id}/membres")
    public PageResponse<AnnuaireMembreResponse> membres(
            @PathVariable UUID id,
            @RequestParam(required = false) @Size(max = 100) String recherche,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "24") @Min(1) @Max(48) int taille,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return annuaireCommunaute.membres(id, principal.getUtilisateur().getId(), recherche, page, taille);
    }

    @PostMapping("/{id}/rejoindre")
    public ConversationDetailResponse rejoindre(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return communauteService.rejoindre(id, principal.getUtilisateur().getId());
    }
}

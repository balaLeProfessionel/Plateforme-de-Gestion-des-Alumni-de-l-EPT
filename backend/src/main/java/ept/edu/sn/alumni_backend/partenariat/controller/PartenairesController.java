package ept.edu.sn.alumni_backend.partenariat.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import ept.edu.sn.alumni_backend.annuaire.dto.PageResponse;
import ept.edu.sn.alumni_backend.enums.TypeOrganisme;
import ept.edu.sn.alumni_backend.partenariat.dto.PartenaireResponse;
import ept.edu.sn.alumni_backend.partenariat.dto.PartenariatPublicResponse;
import ept.edu.sn.alumni_backend.partenariat.dto.VisibiliteRequest;
import ept.edu.sn.alumni_backend.partenariat.service.PartenairesService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;

/**
 * Organismes partenaires vus par les étudiants, les alumni et le personnel ; leur visibilité, réglée par les Relations
 * extérieures. Rôles et responsabilité exigés par SecurityConfig.
 */
@RestController
@RequiredArgsConstructor
@Validated
public class PartenairesController {
    private final PartenairesService service;

    @GetMapping("/api/partenaires")
    public ResponseEntity<PageResponse<PartenaireResponse>> lister(
            @RequestParam(required = false) @Size(max = 100) String recherche,
            @RequestParam(required = false) TypeOrganisme type,
            @RequestParam(required = false) @Size(max = 100) String secteur,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "12") @Min(1) @Max(48) int taille) {
        return ResponseEntity.ok(service.lister(recherche, type, secteur, page, taille));
    }

    @GetMapping("/api/partenaires/secteurs")
    public ResponseEntity<List<String>> secteurs() {
        return ResponseEntity.ok(service.secteurs());
    }

    /** Bloc « Partenaire de l'EPT » de la fiche : 204 si l'organisme n'est pas un partenaire visible. */
    @GetMapping("/api/partenaires/{organismeId}")
    public ResponseEntity<PartenariatPublicResponse> partenariat(@PathVariable UUID organismeId) {
        return service.partenariat(organismeId).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PatchMapping("/api/admin/partenariats/organismes/{organismeId}/visibilite")
    public ResponseEntity<Map<String, Boolean>> changerVisibilite(@PathVariable UUID organismeId, @Valid @RequestBody VisibiliteRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(Map.of("visible", service.changerVisibilite(organismeId, request.visible(), principal)));
    }
}

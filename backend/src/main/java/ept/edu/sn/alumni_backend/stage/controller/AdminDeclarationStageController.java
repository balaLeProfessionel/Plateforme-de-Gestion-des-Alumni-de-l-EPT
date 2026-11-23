package ept.edu.sn.alumni_backend.stage.controller;

import java.util.Map;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import ept.edu.sn.alumni_backend.admin.dto.MotifRequest;
import ept.edu.sn.alumni_backend.annuaire.dto.PageResponse;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.stage.StatutStage;
import ept.edu.sn.alumni_backend.stage.dto.DeclarationResponse;
import ept.edu.sn.alumni_backend.stage.dto.ValidationDeclarationRequest;
import ept.edu.sn.alumni_backend.stage.service.DeclarationsStageService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;

/** File des stages déclarés (STA-10), réservée à l'administrateur Stages (SecurityConfig). */
@RestController
@RequestMapping("/api/admin/stages/declarations")
@RequiredArgsConstructor
@Validated
public class AdminDeclarationStageController {
    private final DeclarationsStageService service;

    /** statut : DECLARE (à traiter, par défaut), CONFIRME (validées) ou REFUSE. */
    @GetMapping
    public ResponseEntity<PageResponse<DeclarationResponse>> lister(
            @RequestParam(defaultValue = "DECLARE") StatutStage statut,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(48) int taille) {
        if (statut != StatutStage.DECLARE && statut != StatutStage.CONFIRME && statut != StatutStage.REFUSE) {
            throw new IllegalArgumentException("Statut de déclaration inconnu.");
        }
        return ResponseEntity.ok(service.lister(statut, page, taille));
    }

    @GetMapping("/a-traiter")
    public ResponseEntity<Map<String, Long>> nombreATraiter() {
        return ResponseEntity.ok(Map.of("nombre", service.nombreATraiter()));
    }

    @PatchMapping("/{id}/valider")
    public ResponseEntity<DeclarationResponse> valider(@PathVariable UUID id, @Valid @RequestBody ValidationDeclarationRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(service.valider(id, request.organismeId(), request.nomNouvelOrganisme(), principal));
    }

    @PatchMapping("/{id}/refuser")
    public ResponseEntity<DeclarationResponse> refuser(@PathVariable UUID id, @Valid @RequestBody MotifRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(service.refuser(id, request.motif(), principal));
    }
}

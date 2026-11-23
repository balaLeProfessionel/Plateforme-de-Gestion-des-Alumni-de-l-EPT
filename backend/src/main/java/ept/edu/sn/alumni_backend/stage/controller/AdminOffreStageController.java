package ept.edu.sn.alumni_backend.stage.controller;

import java.net.URI;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import ept.edu.sn.alumni_backend.admin.dto.MotifRequest;
import ept.edu.sn.alumni_backend.annuaire.dto.PageResponse;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.stage.StatutOffre;
import ept.edu.sn.alumni_backend.stage.dto.OffreStageResponse;
import ept.edu.sn.alumni_backend.stage.dto.SaisieOffreAdminRequest;
import ept.edu.sn.alumni_backend.stage.service.OffresStageService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;

/** Offres de stage vues par l'administrateur Stages : vérification, saisie, retrait (responsabilité Stages exigée). */
@RestController
@RequestMapping("/api/admin/stages/offres")
@RequiredArgsConstructor
@Validated
public class AdminOffreStageController {
    private final OffresStageService offresService;

    @GetMapping
    public ResponseEntity<PageResponse<OffreStageResponse>> lister(
            @RequestParam(required = false) StatutOffre statut,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(48) int taille) {
        return ResponseEntity.ok(offresService.listerPourAdministration(statut, page, taille));
    }

    @GetMapping("/a-verifier")
    public ResponseEntity<Map<String, Long>> nombreAVerifier() {
        return ResponseEntity.ok(Map.of("nombre", offresService.nombreAVerifier()));
    }

    @PostMapping
    public ResponseEntity<OffreStageResponse> saisir(@Valid @RequestBody SaisieOffreAdminRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        OffreStageResponse offre = offresService.saisirParAdministration(
            request.offre(), request.organismeId(), request.nomNouvelOrganisme(), principal);
        return ResponseEntity.created(URI.create("/api/stages/offres/" + offre.id())).body(offre);
    }

    @PatchMapping("/{id}/publier")
    public ResponseEntity<OffreStageResponse> publier(@PathVariable UUID id) {
        return ResponseEntity.ok(offresService.publierSoumise(id));
    }

    @PatchMapping("/{id}/refuser")
    public ResponseEntity<OffreStageResponse> refuser(@PathVariable UUID id, @Valid @RequestBody MotifRequest request) {
        return ResponseEntity.ok(offresService.refuser(id, request.motif()));
    }

    @PatchMapping("/{id}/retirer")
    public ResponseEntity<OffreStageResponse> retirer(@PathVariable UUID id, @Valid @RequestBody MotifRequest request) {
        return ResponseEntity.ok(offresService.retirerParAdministration(id, request.motif()));
    }
}

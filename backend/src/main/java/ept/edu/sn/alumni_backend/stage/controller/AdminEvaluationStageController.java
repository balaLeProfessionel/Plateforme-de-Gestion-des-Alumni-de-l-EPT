package ept.edu.sn.alumni_backend.stage.controller;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.stage.dto.DecisionStageRequest;
import ept.edu.sn.alumni_backend.stage.dto.EvaluationRequest;
import ept.edu.sn.alumni_backend.stage.dto.EvaluationResponse;
import ept.edu.sn.alumni_backend.stage.service.EvaluationsStageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Évaluation vue par l'administrateur Stages (STA-06) : saisie pour un organisme sans compte, réouverture, décision finale. */
@RestController
@RequestMapping("/api/admin/stages/suivi/{id}/evaluation")
@RequiredArgsConstructor
@Validated
public class AdminEvaluationStageController {
    private final EvaluationsStageService service;

    @GetMapping
    public ResponseEntity<EvaluationResponse> lire(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(service.lire(id, principal, true));
    }

    @PutMapping
    public ResponseEntity<EvaluationResponse> enregistrer(@PathVariable UUID id, @Valid @RequestBody EvaluationRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(service.enregistrer(id, request, principal, true));
    }

    @PostMapping("/soumettre")
    public ResponseEntity<EvaluationResponse> soumettre(@PathVariable UUID id, @Valid @RequestBody EvaluationRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(service.soumettre(id, request, principal, true));
    }

    @PostMapping("/rouvrir")
    public ResponseEntity<EvaluationResponse> rouvrir(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(service.rouvrir(id, principal));
    }

    @PatchMapping("/decision")
    public ResponseEntity<EvaluationResponse> decision(@PathVariable UUID id, @RequestBody DecisionStageRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(service.decider(id, request.valide(), principal));
    }
}

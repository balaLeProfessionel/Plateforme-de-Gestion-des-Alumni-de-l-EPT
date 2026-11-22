package ept.edu.sn.alumni_backend.stage.controller;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.stage.dto.EvaluationRequest;
import ept.edu.sn.alumni_backend.stage.dto.EvaluationResponse;
import ept.edu.sn.alumni_backend.stage.service.EvaluationsStageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Évaluation du stagiaire côté membres (STA-06) : saisie par l'organisme, lecture par l'encadrant et le chef de département. */
@RestController
@RequestMapping("/api/stages/suivi/{id}/evaluation")
@RequiredArgsConstructor
@Validated
public class EvaluationStageController {
    private final EvaluationsStageService service;

    @GetMapping
    public ResponseEntity<EvaluationResponse> lire(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(service.lire(id, principal, false));
    }

    @PutMapping
    public ResponseEntity<EvaluationResponse> enregistrer(@PathVariable UUID id, @Valid @RequestBody EvaluationRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(service.enregistrer(id, request, principal, false));
    }

    @PostMapping("/soumettre")
    public ResponseEntity<EvaluationResponse> soumettre(@PathVariable UUID id, @Valid @RequestBody EvaluationRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(service.soumettre(id, request, principal, false));
    }
}

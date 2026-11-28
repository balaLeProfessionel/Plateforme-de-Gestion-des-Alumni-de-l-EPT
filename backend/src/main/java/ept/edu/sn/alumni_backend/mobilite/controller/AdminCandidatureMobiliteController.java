package ept.edu.sn.alumni_backend.mobilite.controller;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ept.edu.sn.alumni_backend.mobilite.dto.CandidaturesOffreResponse;
import ept.edu.sn.alumni_backend.mobilite.dto.DecisionCandidatureRequest;
import ept.edu.sn.alumni_backend.mobilite.service.DecisionsMobiliteService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Sélection des candidats par le chef du service mobilité (responsabilité Mobilités exigée par SecurityConfig). */
@RestController
@RequestMapping("/api/admin/mobilites")
@RequiredArgsConstructor
@Validated
public class AdminCandidatureMobiliteController {
    private final DecisionsMobiliteService decisionsService;

    @GetMapping("/offres/{id}/candidatures")
    public ResponseEntity<CandidaturesOffreResponse> dossiers(@PathVariable UUID id) {
        return ResponseEntity.ok(decisionsService.dossiers(id));
    }

    @PatchMapping("/candidatures/{id}/decision")
    public ResponseEntity<CandidaturesOffreResponse> decider(@PathVariable UUID id, @Valid @RequestBody DecisionCandidatureRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(decisionsService.decider(id, request.statut(), request.rang(), principal));
    }

    @PatchMapping("/offres/{id}/liste/publier")
    public ResponseEntity<CandidaturesOffreResponse> publierListe(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(decisionsService.publierListe(id, principal));
    }

    @PatchMapping("/candidatures/{id}/promouvoir")
    public ResponseEntity<CandidaturesOffreResponse> promouvoir(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(decisionsService.promouvoir(id, principal));
    }
}

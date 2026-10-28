package ept.edu.sn.alumni_backend.parcours.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import ept.edu.sn.alumni_backend.parcours.dto.FormationRequest;
import ept.edu.sn.alumni_backend.parcours.dto.FormationResponse;
import ept.edu.sn.alumni_backend.parcours.service.FormationService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/formations")
@RequiredArgsConstructor
public class FormationController {
    private final FormationService formationService;

    @GetMapping("/me")
    public ResponseEntity<List<FormationResponse>> mesFormations(
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(formationService.listerPour(principal.getUtilisateur()));
    }

    @PostMapping
    public ResponseEntity<FormationResponse> creer(
            @AuthenticationPrincipal UtilisateurPrincipal principal,
            @Valid @RequestBody FormationRequest request) {
        FormationResponse creee = formationService.creer(principal.getUtilisateur(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(creee);
    }

    @PutMapping("/{id}")
    public ResponseEntity<FormationResponse> modifier(
            @AuthenticationPrincipal UtilisateurPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody FormationRequest request) {
        return ResponseEntity.ok(formationService.modifier(principal.getUtilisateur(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(
            @AuthenticationPrincipal UtilisateurPrincipal principal,
            @PathVariable UUID id) {
        formationService.supprimer(principal.getUtilisateur(), id);
        return ResponseEntity.noContent().build();
    }
}

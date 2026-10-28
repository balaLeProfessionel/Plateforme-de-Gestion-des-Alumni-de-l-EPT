package ept.edu.sn.alumni_backend.parcours.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import ept.edu.sn.alumni_backend.parcours.dto.ExperienceRequest;
import ept.edu.sn.alumni_backend.parcours.dto.ExperienceResponse;
import ept.edu.sn.alumni_backend.parcours.service.ExperienceService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/experiences")
@RequiredArgsConstructor
public class ExperienceController {
    private final ExperienceService experienceService;

    @GetMapping("/me")
    public ResponseEntity<List<ExperienceResponse>> mesExperiences(
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(experienceService.listerPour(principal.getUtilisateur()));
    }

    @PostMapping
    public ResponseEntity<ExperienceResponse> creer(
            @AuthenticationPrincipal UtilisateurPrincipal principal,
            @Valid @RequestBody ExperienceRequest request) {
        ExperienceResponse creee = experienceService.creer(principal.getUtilisateur(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(creee);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExperienceResponse> modifier(
            @AuthenticationPrincipal UtilisateurPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody ExperienceRequest request) {
        return ResponseEntity.ok(experienceService.modifier(principal.getUtilisateur(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(
            @AuthenticationPrincipal UtilisateurPrincipal principal,
            @PathVariable UUID id) {
        experienceService.supprimer(principal.getUtilisateur(), id);
        return ResponseEntity.noContent().build();
    }
}

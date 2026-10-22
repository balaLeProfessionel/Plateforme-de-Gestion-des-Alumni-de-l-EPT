package ept.edu.sn.alumni_backend.mentorat.controller;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ept.edu.sn.alumni_backend.mentorat.dto.ProgrammeRequest;
import ept.edu.sn.alumni_backend.mentorat.dto.ProgrammeResponse;
import ept.edu.sn.alumni_backend.mentorat.dto.StatutProgrammeRequest;
import ept.edu.sn.alumni_backend.mentorat.service.ProgrammeMentoratService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/mentorat/programmes")
@RequiredArgsConstructor
@Validated
public class ProgrammeMentoratController {
    private final ProgrammeMentoratService programmeService;

    @GetMapping("/geres")
    public ResponseEntity<List<ProgrammeResponse>> listerGeres(@AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(programmeService.listerGeres(principal));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProgrammeResponse> obtenir(
            @PathVariable UUID id,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(programmeService.obtenir(id, principal));
    }

    @PostMapping
    public ResponseEntity<ProgrammeResponse> creer(
            @Valid @RequestBody ProgrammeRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        ProgrammeResponse response = programmeService.creer(request, principal);
        return ResponseEntity.created(URI.create("/api/mentorat/programmes/" + response.id())).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProgrammeResponse> modifier(
            @PathVariable UUID id,
            @Valid @RequestBody ProgrammeRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(programmeService.modifier(id, request, principal));
    }

    @PatchMapping("/{id}/statut")
    public ResponseEntity<ProgrammeResponse> changerStatut(
            @PathVariable UUID id,
            @Valid @RequestBody StatutProgrammeRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(programmeService.changerStatut(id, request.statut(), principal));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(
            @PathVariable UUID id,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        programmeService.supprimer(id, principal);
        return ResponseEntity.noContent().build();
    }
}

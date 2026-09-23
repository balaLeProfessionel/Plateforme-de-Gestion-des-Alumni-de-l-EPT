package ept.edu.sn.alumni_backend.evenement.controller;

import java.net.URI;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import ept.edu.sn.alumni_backend.evenement.PeriodeEvenement;
import ept.edu.sn.alumni_backend.evenement.dto.EvenementRequest;
import ept.edu.sn.alumni_backend.evenement.dto.EvenementResponse;
import ept.edu.sn.alumni_backend.evenement.dto.PageEvenementsResponse;
import ept.edu.sn.alumni_backend.evenement.dto.PageParticipantsResponse;
import ept.edu.sn.alumni_backend.evenement.dto.ReponseParticipationRequest;
import ept.edu.sn.alumni_backend.evenement.dto.StatutOfficielRequest;
import ept.edu.sn.alumni_backend.evenement.service.EvenementService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/evenements")
@RequiredArgsConstructor
@Validated
public class EvenementController {
    private final EvenementService evenementService;

    @GetMapping
    public ResponseEntity<PageEvenementsResponse> lister(
            @AuthenticationPrincipal UtilisateurPrincipal principal,
            @RequestParam(defaultValue = "AVENIR") PeriodeEvenement periode,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "12") @Min(1) @Max(48) int taille) {
        return ResponseEntity.ok(evenementService.lister(principal, periode, page, taille));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EvenementResponse> obtenir(
            @PathVariable UUID id,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(evenementService.obtenir(id, principal));
    }

    @PutMapping("/{id}/participation")
    public ResponseEntity<EvenementResponse> repondre(
            @PathVariable UUID id,
            @Valid @RequestBody ReponseParticipationRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(evenementService.repondre(id, request, principal));
    }

    @GetMapping("/{id}/participants")
    public ResponseEntity<PageParticipantsResponse> listerParticipants(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "12") @Min(1) @Max(48) int taille,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(evenementService.listerParticipants(id, page, taille, principal));
    }

    @PostMapping
    public ResponseEntity<EvenementResponse> creer(
            @Valid @RequestBody EvenementRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        EvenementResponse response = evenementService.creer(request, principal);
        return ResponseEntity.created(URI.create("/api/evenements/" + response.id())).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EvenementResponse> modifier(
            @PathVariable UUID id,
            @Valid @RequestBody EvenementRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(evenementService.modifier(id, request, principal));
    }

    @PatchMapping("/{id}/annuler")
    public ResponseEntity<EvenementResponse> annuler(
            @PathVariable UUID id,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(evenementService.annuler(id, principal));
    }

    @PatchMapping("/{id}/officiel")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EvenementResponse> definirStatutOfficiel(
            @PathVariable UUID id,
            @Valid @RequestBody StatutOfficielRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(evenementService.definirStatutOfficiel(id, request, principal));
    }
}

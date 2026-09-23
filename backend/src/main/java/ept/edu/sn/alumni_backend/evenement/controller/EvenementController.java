package ept.edu.sn.alumni_backend.evenement.controller;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import ept.edu.sn.alumni_backend.evenement.PeriodeEvenement;
import ept.edu.sn.alumni_backend.evenement.dto.EvenementResponse;
import ept.edu.sn.alumni_backend.evenement.dto.PageEvenementsResponse;
import ept.edu.sn.alumni_backend.evenement.service.EvenementService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
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
}

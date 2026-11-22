package ept.edu.sn.alumni_backend.stage.controller;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import ept.edu.sn.alumni_backend.annuaire.dto.PageResponse;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.stage.TypeSollicitation;
import ept.edu.sn.alumni_backend.stage.dto.ModeleSollicitationResponse;
import ept.edu.sn.alumni_backend.stage.dto.SollicitationRequest;
import ept.edu.sn.alumni_backend.stage.dto.SollicitationResponse;
import ept.edu.sn.alumni_backend.stage.service.SollicitationsService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;

/** Sollicitation des organismes par l'administrateur Stages (STA-11). */
@RestController
@RequestMapping("/api/admin/stages/sollicitations")
@RequiredArgsConstructor
@Validated
public class AdminSollicitationController {
    private final SollicitationsService service;

    @GetMapping("/destinataires")
    public ResponseEntity<List<SollicitationResponse.DestinataireSollicitation>> destinataires() {
        return ResponseEntity.ok(service.destinatairesPossibles());
    }

    @GetMapping("/modele")
    public ResponseEntity<ModeleSollicitationResponse> modele(@RequestParam TypeSollicitation type) {
        return ResponseEntity.ok(service.modele(type));
    }

    @PostMapping
    public ResponseEntity<SollicitationResponse> envoyer(@Valid @RequestBody SollicitationRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        SollicitationResponse envoyee = service.envoyer(request, principal);
        return ResponseEntity.created(URI.create("/api/admin/stages/sollicitations/" + envoyee.id())).body(envoyee);
    }

    @GetMapping
    public ResponseEntity<PageResponse<SollicitationResponse>> historique(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(48) int taille) {
        return ResponseEntity.ok(service.historique(page, taille));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SollicitationResponse> detail(@PathVariable UUID id) {
        return ResponseEntity.ok(service.detail(id));
    }
}

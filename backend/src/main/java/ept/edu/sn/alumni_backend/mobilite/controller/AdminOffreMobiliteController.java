package ept.edu.sn.alumni_backend.mobilite.controller;

import java.net.URI;
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
import ept.edu.sn.alumni_backend.mobilite.StatutOffreMobilite;
import ept.edu.sn.alumni_backend.mobilite.dto.OffreMobiliteResponse;
import ept.edu.sn.alumni_backend.mobilite.dto.SaisieOffreMobiliteRequest;
import ept.edu.sn.alumni_backend.mobilite.service.OffresMobiliteService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;

/** Offres de mobilité vues par le chef du service mobilité (responsabilité Mobilités exigée par SecurityConfig). */
@RestController
@RequestMapping("/api/admin/mobilites/offres")
@RequiredArgsConstructor
@Validated
public class AdminOffreMobiliteController {
    private final OffresMobiliteService offresService;

    @GetMapping
    public ResponseEntity<PageResponse<OffreMobiliteResponse>> lister(
            @RequestParam(required = false) StatutOffreMobilite statut,
            @RequestParam(required = false) UUID organisme,
            @RequestParam(required = false) @Size(max = 9) String annee,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(48) int taille,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(offresService.listerPourChef(statut, organisme, annee, principal, page, taille));
    }

    @PostMapping
    public ResponseEntity<OffreMobiliteResponse> publier(@Valid @RequestBody SaisieOffreMobiliteRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        OffreMobiliteResponse offre = offresService.publierParChef(request.offre(), request.organismeId(), request.nomNouvelOrganisme(), principal);
        return ResponseEntity.created(URI.create("/api/mobilites/offres/" + offre.id())).body(offre);
    }

    @PatchMapping("/{id}/retirer")
    public ResponseEntity<OffreMobiliteResponse> retirer(@PathVariable UUID id, @Valid @RequestBody MotifRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(offresService.retirer(id, request.motif(), principal));
    }
}

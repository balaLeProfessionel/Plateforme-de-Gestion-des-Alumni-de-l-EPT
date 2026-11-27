package ept.edu.sn.alumni_backend.emploi.controller;

import ept.edu.sn.alumni_backend.annuaire.dto.PageResponse;
import ept.edu.sn.alumni_backend.emploi.ModeOffreEmploi;
import ept.edu.sn.alumni_backend.emploi.dto.OffreEmploiResponse;
import ept.edu.sn.alumni_backend.emploi.dto.OffreRelayeeRequest;
import ept.edu.sn.alumni_backend.emploi.dto.SignalementOffreRequest;
import ept.edu.sn.alumni_backend.emploi.service.OffresEmploiService;
import ept.edu.sn.alumni_backend.enums.TypeContrat;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Offres d'emploi des membres connectés (#221) ; rôles autorisés dans SecurityConfig. */
@RestController
@RequestMapping("/api/offres-emploi")
@RequiredArgsConstructor
@Validated
public class OffreEmploiController {
    private final OffresEmploiService offresService;

    @GetMapping
    public ResponseEntity<PageResponse<OffreEmploiResponse>> lister(
            @RequestParam(required = false) @Size(max = 100) String q,
            @RequestParam(required = false) TypeContrat type,
            @RequestParam(required = false) @Size(max = 100) String lieu,
            @RequestParam(required = false) UUID filiere,
            @RequestParam(required = false) ModeOffreEmploi mode,
            @RequestParam(defaultValue = "false") boolean expirees,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "12") @Min(1) @Max(48) int taille,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(offresService.lister(q, type, lieu, filiere, mode, expirees, page, taille, principal));
    }

    @GetMapping("/mes-offres")
    public ResponseEntity<List<OffreEmploiResponse>> mesOffres(@AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(offresService.mesOffres(principal));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OffreEmploiResponse> detail(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(offresService.detail(id, principal));
    }

    @PostMapping("/relayees")
    public ResponseEntity<OffreEmploiResponse> relayer(@Valid @RequestBody OffreRelayeeRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        OffreEmploiResponse offre = offresService.relayer(request, principal);
        return ResponseEntity.created(URI.create("/api/offres-emploi/" + offre.id())).body(offre);
    }

    @PutMapping("/{id}")
    public ResponseEntity<OffreEmploiResponse> modifier(@PathVariable UUID id, @Valid @RequestBody OffreRelayeeRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(offresService.modifier(id, request, principal));
    }

    @PatchMapping("/{id}/retirer")
    public ResponseEntity<OffreEmploiResponse> retirer(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(offresService.retirer(id, principal));
    }

    @PostMapping("/{id}/signalements")
    public ResponseEntity<Void> signaler(@PathVariable UUID id, @Valid @RequestBody SignalementOffreRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        offresService.signaler(id, request, principal);
        return ResponseEntity.noContent().build();
    }
}

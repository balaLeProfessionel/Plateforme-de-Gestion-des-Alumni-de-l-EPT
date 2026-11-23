package ept.edu.sn.alumni_backend.partenariat.controller;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import org.springframework.core.io.Resource;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import ept.edu.sn.alumni_backend.admin.dto.MotifRequest;
import ept.edu.sn.alumni_backend.annuaire.dto.PageResponse;
import ept.edu.sn.alumni_backend.partenariat.StatutConvention;
import ept.edu.sn.alumni_backend.partenariat.dto.ActivationConventionRequest;
import ept.edu.sn.alumni_backend.partenariat.dto.ConventionResponse;
import ept.edu.sn.alumni_backend.partenariat.dto.HistoriqueConventionResponse;
import ept.edu.sn.alumni_backend.partenariat.dto.ModificationConventionRequest;
import ept.edu.sn.alumni_backend.partenariat.dto.SaisieConventionRequest;
import ept.edu.sn.alumni_backend.partenariat.service.ConventionsPartenariatService;
import ept.edu.sn.alumni_backend.partenariat.service.PiecesConventionService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;

/** Conventions de partenariat vues par le service des Relations extérieures (responsabilité Partenariats exigée par SecurityConfig). */
@RestController
@RequestMapping("/api/admin/partenariats/conventions")
@RequiredArgsConstructor
@Validated
public class AdminConventionPartenariatController {
    private final ConventionsPartenariatService conventionsService;
    private final PiecesConventionService piecesService;

    @GetMapping
    public ResponseEntity<PageResponse<ConventionResponse>> lister(
            @RequestParam(required = false) StatutConvention statut,
            @RequestParam(required = false) UUID organisme,
            @RequestParam(required = false) @Size(max = 100) String recherche,
            @RequestParam(defaultValue = "false") boolean expireBientot,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(48) int taille,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(conventionsService.lister(statut, organisme, recherche, expireBientot, page, taille, principal));
    }

    @PostMapping
    public ResponseEntity<ConventionResponse> saisir(@Valid @RequestBody SaisieConventionRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        ConventionResponse convention = conventionsService.saisir(request, principal);
        return ResponseEntity.created(URI.create("/api/admin/partenariats/conventions/" + convention.id())).body(convention);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ConventionResponse> detail(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(conventionsService.detail(id, principal));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ConventionResponse> modifier(@PathVariable UUID id, @Valid @RequestBody ModificationConventionRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(conventionsService.modifier(id, request, principal));
    }

    @GetMapping("/{id}/historique")
    public ResponseEntity<List<HistoriqueConventionResponse>> historique(@PathVariable UUID id) {
        return ResponseEntity.ok(conventionsService.historique(id));
    }

    @PatchMapping("/{id}/examiner")
    public ResponseEntity<ConventionResponse> examiner(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(conventionsService.examiner(id, principal));
    }

    @PatchMapping("/{id}/negocier")
    public ResponseEntity<ConventionResponse> negocier(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(conventionsService.negocier(id, principal));
    }

    @PatchMapping("/{id}/activer")
    public ResponseEntity<ConventionResponse> activer(@PathVariable UUID id, @Valid @RequestBody ActivationConventionRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(conventionsService.activer(id, request, principal));
    }

    @PatchMapping("/{id}/refuser")
    public ResponseEntity<ConventionResponse> refuser(@PathVariable UUID id, @Valid @RequestBody MotifRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(conventionsService.refuser(id, request.motif(), principal));
    }

    @PatchMapping("/{id}/resilier")
    public ResponseEntity<ConventionResponse> resilier(@PathVariable UUID id, @Valid @RequestBody MotifRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(conventionsService.resilier(id, request.motif(), principal));
    }

    @PostMapping("/{id}/pieces")
    public ResponseEntity<ConventionResponse> ajouterPiece(@PathVariable UUID id, @RequestParam("fichier") MultipartFile fichier,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(piecesService.ajouter(id, fichier, principal));
    }

    @DeleteMapping("/{id}/pieces/{pieceId}")
    public ResponseEntity<ConventionResponse> retirerPiece(@PathVariable UUID id, @PathVariable UUID pieceId,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(piecesService.supprimer(id, pieceId, principal));
    }

    @GetMapping("/{id}/pieces/{pieceId}")
    public ResponseEntity<Resource> telecharger(@PathVariable UUID id, @PathVariable UUID pieceId,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return TelechargementPiece.reponse(piecesService.telecharger(id, pieceId, principal));
    }
}

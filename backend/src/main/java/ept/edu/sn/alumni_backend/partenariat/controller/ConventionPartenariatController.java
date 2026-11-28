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
import ept.edu.sn.alumni_backend.partenariat.dto.ConventionResponse;
import ept.edu.sn.alumni_backend.partenariat.dto.DemandeConventionRequest;
import ept.edu.sn.alumni_backend.partenariat.dto.HistoriqueConventionResponse;
import ept.edu.sn.alumni_backend.partenariat.service.ConventionsPartenariatService;
import ept.edu.sn.alumni_backend.partenariat.service.PiecesConventionService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Conventions de partenariat de l'organisme connecté (rôle ORGANISME exigé par SecurityConfig). */
@RestController
@RequestMapping("/api/partenariats/conventions")
@RequiredArgsConstructor
@Validated
public class ConventionPartenariatController {
    private final ConventionsPartenariatService conventionsService;
    private final PiecesConventionService piecesService;

    @GetMapping
    public ResponseEntity<List<ConventionResponse>> mesConventions(@AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(conventionsService.mesConventions(principal));
    }

    @PostMapping
    public ResponseEntity<ConventionResponse> demander(@Valid @RequestBody DemandeConventionRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        ConventionResponse convention = conventionsService.demander(request, principal);
        return ResponseEntity.created(URI.create("/api/partenariats/conventions/" + convention.id())).body(convention);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ConventionResponse> detail(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(conventionsService.detailPourOrganisme(id, principal));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ConventionResponse> modifier(@PathVariable UUID id, @Valid @RequestBody DemandeConventionRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(conventionsService.modifierDemande(id, request, principal));
    }

    @PatchMapping("/{id}/annuler")
    public ResponseEntity<ConventionResponse> annuler(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(conventionsService.annuler(id, principal));
    }

    /** Résiliation avec préavis de trois mois ; l'école en reçoit le motif. */
    @PatchMapping("/{id}/resilier")
    public ResponseEntity<ConventionResponse> resilier(@PathVariable UUID id, @Valid @RequestBody MotifRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(conventionsService.resilier(id, request.motif(), principal));
    }

    /** La partie qui a signalé la résiliation y renonce avant sa date d'effet. */
    @PatchMapping("/{id}/annuler-resiliation")
    public ResponseEntity<ConventionResponse> annulerResiliation(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(conventionsService.annulerResiliation(id, principal));
    }

    @GetMapping("/{id}/historique")
    public ResponseEntity<List<HistoriqueConventionResponse>> historique(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(conventionsService.historiquePourOrganisme(id, principal));
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

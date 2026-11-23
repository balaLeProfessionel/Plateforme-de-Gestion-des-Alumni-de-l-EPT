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
import ept.edu.sn.alumni_backend.partenariat.StatutAccord;
import ept.edu.sn.alumni_backend.partenariat.TypeAccord;
import ept.edu.sn.alumni_backend.partenariat.dto.AccordRequest;
import ept.edu.sn.alumni_backend.partenariat.dto.AccordResponse;
import ept.edu.sn.alumni_backend.partenariat.dto.HistoriqueAccordResponse;
import ept.edu.sn.alumni_backend.partenariat.service.AccordsService;
import ept.edu.sn.alumni_backend.partenariat.service.PiecesAccordService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;

/** Accords de stage et de mobilité vus par le service des Relations extérieures (responsabilité Partenariats exigée par SecurityConfig). */
@RestController
@RequestMapping("/api/admin/partenariats/accords")
@RequiredArgsConstructor
@Validated
public class AdminAccordController {
    private final AccordsService accordsService;
    private final PiecesAccordService piecesService;

    @GetMapping
    public ResponseEntity<PageResponse<AccordResponse>> lister(
            @RequestParam(required = false) TypeAccord type,
            @RequestParam(required = false) StatutAccord statut,
            @RequestParam(required = false) UUID organisme,
            @RequestParam(required = false) @Size(max = 100) String recherche,
            @RequestParam(defaultValue = "false") boolean aRepondre,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(48) int taille,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(accordsService.lister(type, statut, organisme, recherche, aRepondre, page, taille, principal));
    }

    @PostMapping
    public ResponseEntity<AccordResponse> proposer(@Valid @RequestBody AccordRequest request, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        AccordResponse accord = accordsService.proposer(request, principal);
        return ResponseEntity.created(URI.create("/api/admin/partenariats/accords/" + accord.id())).body(accord);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AccordResponse> detail(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(accordsService.detail(id, principal));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AccordResponse> modifier(@PathVariable UUID id, @Valid @RequestBody AccordRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(accordsService.modifier(id, request, principal));
    }

    @PatchMapping("/{id}/retirer")
    public ResponseEntity<AccordResponse> retirer(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(accordsService.retirer(id, principal));
    }

    @PatchMapping("/{id}/accepter")
    public ResponseEntity<AccordResponse> accepter(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(accordsService.accepter(id, principal));
    }

    @PatchMapping("/{id}/refuser")
    public ResponseEntity<AccordResponse> refuser(@PathVariable UUID id, @Valid @RequestBody MotifRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(accordsService.refuser(id, request.motif(), principal));
    }

    @PatchMapping("/{id}/resilier")
    public ResponseEntity<AccordResponse> resilier(@PathVariable UUID id, @Valid @RequestBody MotifRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(accordsService.resilier(id, request.motif(), principal));
    }

    /** La partie qui a signalé la résiliation y renonce avant sa date d'effet. */
    @PatchMapping("/{id}/annuler-resiliation")
    public ResponseEntity<AccordResponse> annulerResiliation(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(accordsService.annulerResiliation(id, principal));
    }

    @GetMapping("/{id}/historique")
    public ResponseEntity<List<HistoriqueAccordResponse>> historique(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(accordsService.historique(id, principal));
    }

    @PostMapping("/{id}/pieces")
    public ResponseEntity<AccordResponse> ajouterPiece(@PathVariable UUID id, @RequestParam("fichier") MultipartFile fichier,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(piecesService.ajouter(id, fichier, principal));
    }

    @DeleteMapping("/{id}/pieces/{pieceId}")
    public ResponseEntity<AccordResponse> retirerPiece(@PathVariable UUID id, @PathVariable UUID pieceId,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(piecesService.supprimer(id, pieceId, principal));
    }

    @GetMapping("/{id}/pieces/{pieceId}")
    public ResponseEntity<Resource> telecharger(@PathVariable UUID id, @PathVariable UUID pieceId,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return TelechargementPiece.reponse(piecesService.telecharger(id, pieceId, principal));
    }
}

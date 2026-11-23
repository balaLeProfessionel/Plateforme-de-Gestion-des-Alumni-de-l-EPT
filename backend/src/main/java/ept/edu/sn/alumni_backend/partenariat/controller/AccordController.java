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
import ept.edu.sn.alumni_backend.partenariat.dto.AccordRequest;
import ept.edu.sn.alumni_backend.partenariat.dto.AccordResponse;
import ept.edu.sn.alumni_backend.partenariat.dto.HistoriqueAccordResponse;
import ept.edu.sn.alumni_backend.partenariat.service.AccordsService;
import ept.edu.sn.alumni_backend.partenariat.service.PiecesAccordService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Accords de stage et de mobilité de l'organisme connecté (rôle ORGANISME exigé par SecurityConfig). */
@RestController
@RequestMapping("/api/partenariats/accords")
@RequiredArgsConstructor
@Validated
public class AccordController {
    private final AccordsService accordsService;
    private final PiecesAccordService piecesService;

    @GetMapping
    public ResponseEntity<List<AccordResponse>> mesAccords(@AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(accordsService.mesAccords(principal));
    }

    @PostMapping
    public ResponseEntity<AccordResponse> proposer(@Valid @RequestBody AccordRequest request, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        AccordResponse accord = accordsService.proposer(request, principal);
        return ResponseEntity.created(URI.create("/api/partenariats/accords/" + accord.id())).body(accord);
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

    /** Résiliation avec préavis de trois mois ; l'école en reçoit le motif. */
    @PatchMapping("/{id}/resilier")
    public ResponseEntity<AccordResponse> resilier(@PathVariable UUID id, @Valid @RequestBody MotifRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(accordsService.resilier(id, request.motif(), principal));
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

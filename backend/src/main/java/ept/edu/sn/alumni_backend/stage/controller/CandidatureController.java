package ept.edu.sn.alumni_backend.stage.controller;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.stage.dto.AvisCandidatureRequest;
import ept.edu.sn.alumni_backend.stage.dto.CandidatureRecueResponse;
import ept.edu.sn.alumni_backend.stage.dto.MaCandidatureResponse;
import ept.edu.sn.alumni_backend.stage.service.CandidaturesService;
import ept.edu.sn.alumni_backend.stage.service.FichiersOffreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Candidatures (STA-03) et avis de l'organisme (STA-09) ; les droits sont vérifiés par CandidaturesService. */
@RestController
@RequestMapping("/api/stages")
@RequiredArgsConstructor
@Validated
public class CandidatureController {
    private final CandidaturesService service;

    /** Candidature de l'étudiant connecté à cette offre : 204 s'il n'a pas postulé. */
    @GetMapping("/offres/{id}/ma-candidature")
    public ResponseEntity<MaCandidatureResponse> maCandidature(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return service.maCandidature(id, principal).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.noContent().build());
    }

    /** Envoi ou renvoi : le CV est obligatoire au premier envoi, facultatif au renvoi (l'ancien est gardé). */
    @PostMapping(value = "/offres/{id}/candidature", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MaCandidatureResponse> postuler(@PathVariable UUID id,
            @RequestPart(value = "cv", required = false) MultipartFile cv,
            @RequestPart(value = "lettre", required = false) String lettre,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(service.postuler(id, cv, lettre, principal));
    }

    @PatchMapping("/offres/{id}/candidature/retirer")
    public ResponseEntity<MaCandidatureResponse> retirer(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(service.retirer(id, principal));
    }

    @GetMapping("/mes-candidatures")
    public ResponseEntity<List<MaCandidatureResponse>> mesCandidatures(@AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(service.mesCandidatures(principal));
    }

    @GetMapping("/offres/{id}/candidatures")
    public ResponseEntity<List<CandidatureRecueResponse>> recues(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(service.recues(id, principal));
    }

    @PatchMapping("/candidatures/{id}/avis")
    public ResponseEntity<CandidatureRecueResponse> avis(@PathVariable UUID id, @Valid @RequestBody AvisCandidatureRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(service.donnerAvis(id, request.avis(), principal));
    }

    @GetMapping("/candidatures/{id}/cv")
    public ResponseEntity<Resource> cv(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        FichiersOffreService.Telechargement cv = service.cv(id, principal);
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(cv.nomFichier(), StandardCharsets.UTF_8).build().toString())
            .header("X-Content-Type-Options", "nosniff")
            .cacheControl(CacheControl.noStore())
            .body(cv.contenu());
    }
}

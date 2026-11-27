package ept.edu.sn.alumni_backend.emploi.controller;

import ept.edu.sn.alumni_backend.emploi.dto.DernierCvResponse;
import ept.edu.sn.alumni_backend.emploi.dto.MaCandidatureEmploiResponse;
import ept.edu.sn.alumni_backend.emploi.dto.ReponseQuestionRequest;
import ept.edu.sn.alumni_backend.emploi.service.CandidaturesEmploiService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/** Candidatures aux offres gérées (#222) ; les droits sont vérifiés par CandidaturesEmploiService. */
@RestController
@RequestMapping("/api/offres-emploi")
@RequiredArgsConstructor
public class CandidatureEmploiController {
    private final CandidaturesEmploiService service;

    /** Candidature du membre connecté à cette offre : 204 s'il n'a pas postulé. */
    @GetMapping("/{id}/ma-candidature")
    public ResponseEntity<MaCandidatureEmploiResponse> maCandidature(@PathVariable UUID id,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return service.maCandidature(id, principal).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.noContent().build());
    }

    /**
     * Envoi : CV en PDF (partie « cv ») ou reprise du dernier CV (« reprendreCv » = true), lettre facultative ou exigée,
     * réponses aux questions en JSON (partie « reponses »).
     */
    @PostMapping(value = "/{id}/candidature", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MaCandidatureEmploiResponse> postuler(@PathVariable UUID id,
            @RequestPart(value = "cv", required = false) MultipartFile cv,
            @RequestPart(value = "reprendreCv", required = false) String reprendreCv,
            @RequestPart(value = "lettre", required = false) String lettre,
            @RequestPart(value = "reponses", required = false) List<ReponseQuestionRequest> reponses,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(service.postuler(id, cv, "true".equals(reprendreCv), lettre, reponses, principal));
    }

    @PatchMapping("/{id}/candidature/retirer")
    public ResponseEntity<MaCandidatureEmploiResponse> retirer(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(service.retirer(id, principal));
    }

    @GetMapping("/mes-candidatures")
    public ResponseEntity<List<MaCandidatureEmploiResponse>> mesCandidatures(@AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(service.mesCandidatures(principal));
    }

    /** Dernier CV envoyé par le membre (stage ou emploi) : 204 s'il n'en a jamais envoyé. */
    @GetMapping("/mon-dernier-cv")
    public ResponseEntity<DernierCvResponse> dernierCv(@AuthenticationPrincipal UtilisateurPrincipal principal) {
        return service.dernierCv(principal).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/candidatures/{id}/cv")
    public ResponseEntity<Resource> cv(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        CandidaturesEmploiService.CvTelechargeable cv = service.cv(id, principal);
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(cv.nomFichier(), StandardCharsets.UTF_8).build().toString())
            .header("X-Content-Type-Options", "nosniff")
            .cacheControl(CacheControl.noStore())
            .body(cv.contenu());
    }
}

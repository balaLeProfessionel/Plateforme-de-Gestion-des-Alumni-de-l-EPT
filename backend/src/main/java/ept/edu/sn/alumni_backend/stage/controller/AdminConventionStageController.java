package ept.edu.sn.alumni_backend.stage.controller;

import java.nio.charset.StandardCharsets;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.stage.dto.ConventionRequest;
import ept.edu.sn.alumni_backend.stage.dto.ConventionResponse;
import ept.edu.sn.alumni_backend.stage.dto.SignatureRequest;
import ept.edu.sn.alumni_backend.stage.service.ConventionsStageService;
import ept.edu.sn.alumni_backend.stage.service.FichiersOffreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Convention de stage tenue par l'administrateur Stages (STA-05). */
@RestController
@RequestMapping("/api/admin/stages/suivi/{id}/convention")
@RequiredArgsConstructor
@Validated
public class AdminConventionStageController {
    private static final MediaType DOCX =
        MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document");

    private final ConventionsStageService service;

    @GetMapping
    public ResponseEntity<ConventionResponse> lire(@PathVariable UUID id) {
        return ResponseEntity.ok(service.lire(id));
    }

    @PutMapping
    public ResponseEntity<ConventionResponse> clauses(@PathVariable UUID id, @Valid @RequestBody ConventionRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(service.enregistrerClauses(id, request, principal));
    }

    @PatchMapping("/signature")
    public ResponseEntity<ConventionResponse> signature(@PathVariable UUID id, @Valid @RequestBody SignatureRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(service.signer(id, request, principal));
    }

    @PostMapping(path = "/scan", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ConventionResponse> deposerScan(@PathVariable UUID id, @RequestPart("fichier") MultipartFile fichier,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(service.deposerScan(id, fichier, principal));
    }

    /** Convention pré-remplie (.docx modifiable), à imprimer pour les trois signatures. */
    @GetMapping("/document")
    public ResponseEntity<byte[]> document(@PathVariable UUID id) {
        ConventionsStageService.DocumentGenere document = service.document(id);
        return ResponseEntity.ok()
            .contentType(DOCX)
            .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(document.nomFichier(), StandardCharsets.UTF_8).build().toString())
            .header("X-Content-Type-Options", "nosniff")
            .cacheControl(CacheControl.noStore())
            .body(document.contenu());
    }

    @GetMapping("/scan")
    public ResponseEntity<Resource> scan(@PathVariable UUID id) {
        FichiersOffreService.Telechargement scan = service.scan(id);
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(scan.nomFichier(), StandardCharsets.UTF_8).build().toString())
            .header("X-Content-Type-Options", "nosniff")
            .cacheControl(CacheControl.noStore())
            .body(scan.contenu());
    }
}

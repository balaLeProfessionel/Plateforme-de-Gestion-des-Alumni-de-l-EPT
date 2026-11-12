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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.stage.dto.RapportResponse;
import ept.edu.sn.alumni_backend.stage.service.ConventionsStageService;
import ept.edu.sn.alumni_backend.stage.service.FichiersOffreService;
import ept.edu.sn.alumni_backend.stage.service.RapportsStageService;
import lombok.RequiredArgsConstructor;

/** Documents d'un stage côté membres : rapport (STA-07) et convention signée (STA-05) : dépôt par l'étudiant, lecture par ceux qui suivent le stage. */
@RestController
@RequestMapping("/api/stages/suivi/{id}")
@RequiredArgsConstructor
public class RapportStageController {
    private final RapportsStageService service;
    private final ConventionsStageService conventions;

    @PostMapping(path = "/rapport", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<RapportResponse> deposer(@PathVariable UUID id, @RequestPart("fichier") MultipartFile fichier,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(service.deposer(id, fichier, principal));
    }

    @GetMapping("/rapport/fichier")
    public ResponseEntity<Resource> fichier(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return telecharger(service.fichier(id, principal, false));
    }

    /** Convention signée, une fois complète (STA-05). */
    @GetMapping("/convention/scan")
    public ResponseEntity<Resource> convention(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return telecharger(conventions.scanPourMembre(id, principal));
    }

    static ResponseEntity<Resource> telecharger(FichiersOffreService.Telechargement fichier) {
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(fichier.nomFichier(), StandardCharsets.UTF_8).build().toString())
            .header("X-Content-Type-Options", "nosniff")
            .cacheControl(CacheControl.noStore())
            .body(fichier.contenu());
    }
}

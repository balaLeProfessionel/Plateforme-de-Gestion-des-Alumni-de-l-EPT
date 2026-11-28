package ept.edu.sn.alumni_backend.cv.controller;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import ept.edu.sn.alumni_backend.cv.dto.DisponibiliteImportCvResponse;
import ept.edu.sn.alumni_backend.cv.dto.ImportCvResponse;
import ept.edu.sn.alumni_backend.cv.service.ImportCvService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/imports-cv")
@RequiredArgsConstructor
public class ImportCvController {
    private final ImportCvService service;

    @GetMapping("/disponibilite")
    public DisponibiliteImportCvResponse disponibilite(@AuthenticationPrincipal UtilisateurPrincipal principal) {
        return service.disponibilite(principal.getUtilisateur());
    }

    /** Dépose le CV : l'analyse continue en arrière-plan (202), l'écran suit l'état avec GET /{id}. */
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<ImportCvResponse> demarrer(
            @AuthenticationPrincipal UtilisateurPrincipal principal,
            @RequestPart("fichiers") List<MultipartFile> fichiers,
            @RequestParam(defaultValue = "false") boolean consentement) {
        ImportCvResponse reponse = service.demarrer(principal.getUtilisateur(), fichiers, consentement);
        return ResponseEntity.accepted().location(URI.create("/api/imports-cv/" + reponse.id())).body(reponse);
    }

    @GetMapping("/courant")
    public ResponseEntity<ImportCvResponse> courant(@AuthenticationPrincipal UtilisateurPrincipal principal) {
        return service.courant(principal.getUtilisateur())
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/{id}")
    public ImportCvResponse consulter(@AuthenticationPrincipal UtilisateurPrincipal principal, @PathVariable UUID id) {
        return service.consulter(principal.getUtilisateur(), id);
    }

    @PatchMapping("/{id}/valider")
    public ImportCvResponse valider(@AuthenticationPrincipal UtilisateurPrincipal principal, @PathVariable UUID id) {
        return service.valider(principal.getUtilisateur(), id);
    }

    /** Écrit le résultat dans le profil, sans écraser ce que le membre a déjà saisi. */
    @PatchMapping("/{id}/appliquer")
    public ImportCvResponse appliquer(@AuthenticationPrincipal UtilisateurPrincipal principal, @PathVariable UUID id) {
        return service.appliquer(principal.getUtilisateur(), id);
    }

    @PatchMapping("/{id}/abandonner")
    public ImportCvResponse abandonner(@AuthenticationPrincipal UtilisateurPrincipal principal, @PathVariable UUID id) {
        return service.abandonner(principal.getUtilisateur(), id);
    }
}

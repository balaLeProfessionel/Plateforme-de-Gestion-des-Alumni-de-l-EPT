package ept.edu.sn.alumni_backend.fil;

import java.time.Instant;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;

/** Fil d'actualité personnalisé : publications, événements et programmes classés pour le membre connecté. */
@RestController
@RequestMapping("/api/fil")
@Validated
@RequiredArgsConstructor
public class FilController {
    private final FilService service;

    @GetMapping
    public PageFilResponse lister(
            @RequestParam(defaultValue = "0") @Min(0) @Max(50) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(30) int taille,
            @RequestParam(required = false) Instant reference,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        // Une référence future ferait remonter des contenus pas encore parus.
        Instant maintenant = Instant.now();
        return service.lister(principal, reference == null || reference.isAfter(maintenant) ? maintenant : reference, page, taille);
    }
}

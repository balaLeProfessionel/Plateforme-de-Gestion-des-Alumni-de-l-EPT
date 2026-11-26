package ept.edu.sn.alumni_backend.competence.controller;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import ept.edu.sn.alumni_backend.competence.dto.CompetenceSuggestion;
import ept.edu.sn.alumni_backend.competence.dto.CompetencesLanguesRequest;
import ept.edu.sn.alumni_backend.competence.dto.CompetencesLanguesResponse;
import ept.edu.sn.alumni_backend.competence.service.CompetencesLanguesService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;

@RestController
@Validated
@RequiredArgsConstructor
public class CompetencesLanguesController {
    private final CompetencesLanguesService service;

    @GetMapping("/api/profil/me/competences-langues")
    public CompetencesLanguesResponse lire(@AuthenticationPrincipal UtilisateurPrincipal principal) {
        return service.lire(principal.getUtilisateur());
    }

    @PutMapping("/api/profil/me/competences-langues")
    public CompetencesLanguesResponse remplacer(
            @AuthenticationPrincipal UtilisateurPrincipal principal,
            @Valid @RequestBody CompetencesLanguesRequest request) {
        return service.remplacer(principal.getUtilisateur(), request);
    }

    /** Autocomplétion à partir du référentiel commun. */
    @GetMapping("/api/competences")
    public List<CompetenceSuggestion> suggerer(@RequestParam(defaultValue = "") @Size(max = 80) String q) {
        return service.suggerer(q);
    }
}

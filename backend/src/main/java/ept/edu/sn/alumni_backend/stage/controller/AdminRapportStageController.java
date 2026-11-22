package ept.edu.sn.alumni_backend.stage.controller;

import java.util.Map;
import java.util.UUID;

import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.stage.dto.DateLimiteRapportRequest;
import ept.edu.sn.alumni_backend.stage.service.RapportsStageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Rapports de stage pour l'administrateur Stages (STA-07) : date limite, en lot, et lecture. */
@RestController
@RequestMapping("/api/admin/stages")
@RequiredArgsConstructor
@Validated
public class AdminRapportStageController {
    private final RapportsStageService service;

    @PatchMapping("/rapports/date-limite")
    public ResponseEntity<Map<String, Integer>> dateLimite(@Valid @RequestBody DateLimiteRapportRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(Map.of("misAJour", service.fixerDateLimite(request.stageIds(), request.dateLimite(), principal)));
    }

    @GetMapping("/suivi/{id}/rapport/fichier")
    public ResponseEntity<Resource> fichier(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return RapportStageController.telecharger(service.fichier(id, principal, true));
    }
}

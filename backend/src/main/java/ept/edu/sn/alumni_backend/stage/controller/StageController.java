package ept.edu.sn.alumni_backend.stage.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.stage.dto.MonStageResponse;
import ept.edu.sn.alumni_backend.stage.dto.StagiaireResponse;
import ept.edu.sn.alumni_backend.stage.service.ListeDefinitiveService;
import lombok.RequiredArgsConstructor;

/** Stages confirmés : ceux de l'étudiant connecté, et les stagiaires d'une offre pour son organisme (STA-04). */
@RestController
@RequestMapping("/api/stages")
@RequiredArgsConstructor
public class StageController {
    private final ListeDefinitiveService service;

    @GetMapping("/mes-stages")
    public ResponseEntity<List<MonStageResponse>> mesStages(@AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(service.mesStages(principal));
    }

    @GetMapping("/offres/{id}/stagiaires")
    public ResponseEntity<List<StagiaireResponse>> stagiaires(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(service.stagiaires(id, principal));
    }
}

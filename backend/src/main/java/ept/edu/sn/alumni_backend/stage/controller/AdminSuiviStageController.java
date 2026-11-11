package ept.edu.sn.alumni_backend.stage.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import ept.edu.sn.alumni_backend.annuaire.dto.PageResponse;
import ept.edu.sn.alumni_backend.stage.dto.EncadrantRequest;
import ept.edu.sn.alumni_backend.stage.dto.PersonnelSuggestionResponse;
import ept.edu.sn.alumni_backend.stage.dto.SuiviStageResponse;
import ept.edu.sn.alumni_backend.stage.dto.TuteurRequest;
import ept.edu.sn.alumni_backend.stage.service.SuiviStagesService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;

/** Suivi des stages confirmés par l'administrateur Stages (STA-08) : encadrant interne et maître de stage. */
@RestController
@RequestMapping("/api/admin/stages")
@RequiredArgsConstructor
@Validated
public class AdminSuiviStageController {
    private final SuiviStagesService service;

    @GetMapping("/suivi")
    public ResponseEntity<PageResponse<SuiviStageResponse>> lister(
            @RequestParam(required = false) UUID filiere,
            @RequestParam(defaultValue = "false") boolean sansEncadrant,
            @RequestParam(required = false) @Size(max = 100) String q,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(48) int taille) {
        return ResponseEntity.ok(service.lister(filiere, sansEncadrant, q, page, taille));
    }

    @PatchMapping("/suivi/{id}/encadrant")
    public ResponseEntity<SuiviStageResponse> encadrant(@PathVariable UUID id, @RequestBody EncadrantRequest request) {
        return ResponseEntity.ok(service.designerEncadrant(id, request.encadrantId()));
    }

    @PatchMapping("/suivi/{id}/tuteur")
    public ResponseEntity<SuiviStageResponse> tuteur(@PathVariable UUID id, @Valid @RequestBody TuteurRequest request) {
        return ResponseEntity.ok(service.modifierTuteur(id, request));
    }

    @GetMapping("/personnel")
    public ResponseEntity<List<PersonnelSuggestionResponse>> personnel(@RequestParam("q") @Size(max = 100) String texte) {
        return ResponseEntity.ok(service.suggererPersonnel(texte));
    }
}

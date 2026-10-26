package ept.edu.sn.alumni_backend.admin.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import ept.edu.sn.alumni_backend.admin.TypeActionAdmin;
import ept.edu.sn.alumni_backend.admin.dto.EntreeJournalResponse;
import ept.edu.sn.alumni_backend.admin.dto.TableauDeBordAdminResponse;
import ept.edu.sn.alumni_backend.admin.service.JournalAdminService;
import ept.edu.sn.alumni_backend.admin.service.TableauDeBordAdminService;
import ept.edu.sn.alumni_backend.annuaire.dto.PageResponse;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;

/** Tableau de bord et journal de l'administration ; chaque route exige sa permission (SecurityConfig). */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Validated
public class AdminTableauDeBordController {
    private final TableauDeBordAdminService tableauDeBordService;
    private final JournalAdminService journalService;

    @GetMapping("/tableau-de-bord")
    public ResponseEntity<TableauDeBordAdminResponse> tableauDeBord() {
        return ResponseEntity.ok(tableauDeBordService.obtenir());
    }

    @GetMapping("/journal")
    public ResponseEntity<PageResponse<EntreeJournalResponse>> journal(
            @RequestParam(required = false) List<TypeActionAdmin> type,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(48) int taille) {
        return ResponseEntity.ok(journalService.lister(type, page, taille));
    }
}

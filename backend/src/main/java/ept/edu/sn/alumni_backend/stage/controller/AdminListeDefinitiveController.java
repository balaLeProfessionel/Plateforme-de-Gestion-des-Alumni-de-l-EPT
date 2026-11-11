package ept.edu.sn.alumni_backend.stage.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import ept.edu.sn.alumni_backend.enums.Classe;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.stage.dto.AjoutListeRequest;
import ept.edu.sn.alumni_backend.stage.dto.DatesStageRequest;
import ept.edu.sn.alumni_backend.stage.dto.EtudiantSuggestionResponse;
import ept.edu.sn.alumni_backend.stage.dto.ListeDefinitiveResponse;
import ept.edu.sn.alumni_backend.stage.dto.RetraitListeRequest;
import ept.edu.sn.alumni_backend.stage.service.ListeDefinitiveService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;

/** Listes définitives des offres (STA-04), réservées à l'administrateur Stages (SecurityConfig). */
@RestController
@RequestMapping("/api/admin/stages")
@RequiredArgsConstructor
@Validated
public class AdminListeDefinitiveController {
    private final ListeDefinitiveService service;

    @GetMapping("/offres/{id}/liste")
    public ResponseEntity<ListeDefinitiveResponse> liste(@PathVariable UUID id) {
        return ResponseEntity.ok(service.liste(id));
    }

    @PostMapping("/offres/{id}/liste")
    public ResponseEntity<ListeDefinitiveResponse> ajouter(@PathVariable UUID id, @Valid @RequestBody AjoutListeRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(service.ajouter(id, request.etudiantId(), request.dateDebut(), request.dateFin(), principal));
    }

    @PatchMapping("/offres/{id}/liste/publier")
    public ResponseEntity<ListeDefinitiveResponse> publier(@PathVariable UUID id) {
        return ResponseEntity.ok(service.publier(id));
    }

    @PatchMapping("/liste/{ligneId}/dates")
    public ResponseEntity<ListeDefinitiveResponse> dates(@PathVariable UUID ligneId, @Valid @RequestBody DatesStageRequest request) {
        return ResponseEntity.ok(service.modifierDates(ligneId, request.dateDebut(), request.dateFin()));
    }

    @PatchMapping("/liste/{ligneId}/retirer")
    public ResponseEntity<ListeDefinitiveResponse> retirer(@PathVariable UUID ligneId, @Valid @RequestBody RetraitListeRequest request) {
        return ResponseEntity.ok(service.retirer(ligneId, request.motif()));
    }

    /** Recherche par nom, classe et filière, combinables ; au moins un critère. */
    @GetMapping("/etudiants")
    public ResponseEntity<List<EtudiantSuggestionResponse>> etudiants(
            @RequestParam(value = "q", required = false) @Size(max = 100) String texte,
            @RequestParam(required = false) Classe classe,
            @RequestParam(required = false) UUID filiere) {
        return ResponseEntity.ok(service.suggererEtudiants(texte, classe, filiere));
    }
}

package ept.edu.sn.alumni_backend.emploi.controller;

import ept.edu.sn.alumni_backend.emploi.dto.CandidatureRecueEmploiResponse;
import ept.edu.sn.alumni_backend.emploi.dto.TraitementCandidatureRequests;
import ept.edu.sn.alumni_backend.emploi.service.TraitementCandidaturesEmploiService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Traitement des candidatures d'une offre gérée par le recruteur (#223) ; les droits sont vérifiés par le service. */
@RestController
@RequestMapping("/api/offres-emploi")
@RequiredArgsConstructor
public class TraitementCandidaturesEmploiController {
    private final TraitementCandidaturesEmploiService service;

    @GetMapping("/{id}/candidatures")
    public ResponseEntity<List<CandidatureRecueEmploiResponse>> recues(@PathVariable UUID id,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(service.recues(id, principal));
    }

    @PatchMapping("/candidatures/{id}/statut")
    public ResponseEntity<CandidatureRecueEmploiResponse> changerStatut(@PathVariable UUID id,
            @Valid @RequestBody TraitementCandidatureRequests.ChangementStatut request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(service.changerStatut(id, request.statut(), principal));
    }

    @PutMapping("/candidatures/{id}/note")
    public ResponseEntity<CandidatureRecueEmploiResponse> noter(@PathVariable UUID id,
            @Valid @RequestBody TraitementCandidatureRequests.Note request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(service.noter(id, request.note(), principal));
    }

    /** Clôture du recrutement ; renvoie le nombre de candidatures passées en non retenues. */
    @PostMapping("/{id}/cloturer")
    public ResponseEntity<Map<String, Integer>> cloturer(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(Map.of("nonRetenues", service.cloturer(id, principal)));
    }
}

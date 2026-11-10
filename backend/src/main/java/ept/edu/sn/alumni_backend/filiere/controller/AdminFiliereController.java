package ept.edu.sn.alumni_backend.filiere.controller;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ept.edu.sn.alumni_backend.filiere.dto.ChefDepartementRequest;
import ept.edu.sn.alumni_backend.filiere.dto.ChefPossibleResponse;
import ept.edu.sn.alumni_backend.filiere.dto.FiliereAdminResponse;
import ept.edu.sn.alumni_backend.filiere.dto.FusionFiliereRequest;
import ept.edu.sn.alumni_backend.filiere.dto.NomFiliereRequest;
import ept.edu.sn.alumni_backend.filiere.service.ChefsDepartementService;
import ept.edu.sn.alumni_backend.filiere.service.FiliereService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Écran « Filières » de l'administration : la responsabilité Comptes est exigée (SecurityConfig). Désigner ou retirer
 * un chef de département demande en plus d'être super administrateur (GardeSuperAdministrateur).
 */
@RestController
@RequestMapping("/api/admin/filieres")
@RequiredArgsConstructor
@Validated
public class AdminFiliereController {
    private final FiliereService filiereService;
    private final ChefsDepartementService chefsDepartementService;

    @GetMapping
    public ResponseEntity<List<FiliereAdminResponse>> lister() {
        return ResponseEntity.ok(filiereService.listerPourAdministration());
    }

    @PostMapping
    public ResponseEntity<FiliereAdminResponse> creer(
            @Valid @RequestBody NomFiliereRequest request, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        FiliereAdminResponse creee = filiereService.creer(request.nom(), principal);
        return ResponseEntity.created(URI.create("/api/admin/filieres/" + creee.id())).body(creee);
    }

    @PatchMapping("/{id}/nom")
    public ResponseEntity<FiliereAdminResponse> renommer(@PathVariable UUID id, @Valid @RequestBody NomFiliereRequest request) {
        return ResponseEntity.ok(filiereService.renommer(id, request.nom()));
    }

    @PatchMapping("/{id}/retirer")
    public ResponseEntity<FiliereAdminResponse> retirer(@PathVariable UUID id) {
        return ResponseEntity.ok(filiereService.changerActivite(id, false));
    }

    @PatchMapping("/{id}/proposer")
    public ResponseEntity<FiliereAdminResponse> proposer(@PathVariable UUID id) {
        return ResponseEntity.ok(filiereService.changerActivite(id, true));
    }

    /** La filière {id} disparaît : ses comptes passent dans la filière cible, qui est renvoyée. */
    @PostMapping("/{id}/fusion")
    public ResponseEntity<FiliereAdminResponse> fusionner(@PathVariable UUID id, @Valid @RequestBody FusionFiliereRequest request) {
        return ResponseEntity.ok(filiereService.fusionner(id, request.cibleId()));
    }

    @GetMapping("/chefs-possibles")
    public ResponseEntity<List<ChefPossibleResponse>> chefsPossibles() {
        return ResponseEntity.ok(chefsDepartementService.chefsPossibles());
    }

    @PutMapping("/{id}/chef")
    public ResponseEntity<FiliereAdminResponse> designerChef(@PathVariable UUID id,
            @Valid @RequestBody ChefDepartementRequest request, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(chefsDepartementService.designer(id, request.chefId(), principal));
    }

    @DeleteMapping("/{id}/chef")
    public ResponseEntity<FiliereAdminResponse> retirerChef(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(chefsDepartementService.retirer(id, principal));
    }
}

package ept.edu.sn.alumni_backend.admin.controller;

import java.net.URI;
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

import ept.edu.sn.alumni_backend.admin.dto.ActionAdminResponse;
import ept.edu.sn.alumni_backend.admin.dto.ChangementRoleRequest;
import ept.edu.sn.alumni_backend.admin.dto.CompteAdminResponse;
import ept.edu.sn.alumni_backend.admin.dto.DiplomationRequest;
import ept.edu.sn.alumni_backend.admin.dto.ImportComptesRequest;
import ept.edu.sn.alumni_backend.admin.dto.PromotionResponse;
import ept.edu.sn.alumni_backend.admin.dto.ResultatDiplomationResponse;
import ept.edu.sn.alumni_backend.admin.dto.ResultatImportResponse;
import ept.edu.sn.alumni_backend.admin.service.CreationComptesService;
import ept.edu.sn.alumni_backend.admin.service.EvolutionComptesService;
import ept.edu.sn.alumni_backend.admin.dto.FicheCompteResponse;
import ept.edu.sn.alumni_backend.admin.dto.MotifFacultatifRequest;
import ept.edu.sn.alumni_backend.admin.dto.MotifRequest;
import ept.edu.sn.alumni_backend.admin.dto.ResumeComptesResponse;
import ept.edu.sn.alumni_backend.admin.service.GestionComptesService;
import ept.edu.sn.alumni_backend.annuaire.dto.PageResponse;
import ept.edu.sn.alumni_backend.auth.dto.CompteCreeResponse;
import ept.edu.sn.alumni_backend.auth.dto.CreerCompteRequest;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;

/** Gestion des comptes par l'administration ; /api/admin/** est réservé au rôle ADMIN (SecurityConfig). */
@RestController
@RequestMapping("/api/admin/comptes")
@RequiredArgsConstructor
@Validated
public class AdminCompteController {

    private final GestionComptesService gestionComptesService;
    private final CreationComptesService creationComptesService;
    private final EvolutionComptesService evolutionComptesService;

    /** Création d'un compte (étudiant, alumni, personnel…) : le mot de passe provisoire part par e-mail. */
    @PostMapping
    public ResponseEntity<CompteCreeResponse> creerCompte(
            @Valid @RequestBody CreerCompteRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        CompteCreeResponse cree = creationComptesService.creer(request, principal);
        return ResponseEntity.created(URI.create("/api/admin/comptes/" + cree.id())).body(cree);
    }

    /** Création d'une promotion entière ; le rapport indique le résultat de chaque ligne. */
    @PostMapping("/import")
    public ResponseEntity<ResultatImportResponse> importer(
            @Valid @RequestBody ImportComptesRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(creationComptesService.importer(request, principal));
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<CompteAdminResponse> changerRole(
            @PathVariable UUID id,
            @Valid @RequestBody ChangementRoleRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(evolutionComptesService.changerRole(id, request.role(), request.motif().trim(), principal));
    }

    @PostMapping("/diplomation")
    public ResponseEntity<ResultatDiplomationResponse> marquerDiplomes(
            @Valid @RequestBody DiplomationRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(evolutionComptesService.marquerDiplomes(request.ids(), request.anneeSortie(), principal));
    }

    @GetMapping("/promotions")
    public ResponseEntity<List<PromotionResponse>> promotions() {
        return ResponseEntity.ok(evolutionComptesService.promotionsEtudiantes());
    }

    @GetMapping
    public ResponseEntity<PageResponse<CompteAdminResponse>> rechercher(
            @RequestParam(required = false) @Size(max = 100) String recherche,
            @RequestParam(required = false) TypeRole role,
            @RequestParam(required = false) StatutCompte statut,
            @RequestParam(required = false) @Min(1975) @Max(2200) Integer anneeEntree,
            @RequestParam(required = false) @Size(max = 120) String filiere,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int taille) {
        return ResponseEntity.ok(gestionComptesService.rechercher(recherche, role, statut, anneeEntree, filiere, page, taille));
    }

    @GetMapping("/resume")
    public ResponseEntity<ResumeComptesResponse> resume() {
        return ResponseEntity.ok(gestionComptesService.resume());
    }

    @GetMapping("/{id}")
    public ResponseEntity<FicheCompteResponse> fiche(@PathVariable UUID id) {
        return ResponseEntity.ok(gestionComptesService.fiche(id));
    }

    @GetMapping("/{id}/historique")
    public ResponseEntity<List<ActionAdminResponse>> historique(@PathVariable UUID id) {
        return ResponseEntity.ok(gestionComptesService.historique(id));
    }

    @PatchMapping("/{id}/valider")
    public ResponseEntity<CompteAdminResponse> valider(
            @PathVariable UUID id,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(gestionComptesService.valider(id, principal));
    }

    @PatchMapping("/{id}/refuser")
    public ResponseEntity<CompteAdminResponse> refuser(
            @PathVariable UUID id,
            @Valid @RequestBody MotifRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(gestionComptesService.refuser(id, request.motif().trim(), principal));
    }

    @PatchMapping("/{id}/suspendre")
    public ResponseEntity<CompteAdminResponse> suspendre(
            @PathVariable UUID id,
            @Valid @RequestBody MotifRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(gestionComptesService.suspendre(id, request.motif().trim(), principal));
    }

    @PatchMapping("/{id}/reactiver")
    public ResponseEntity<CompteAdminResponse> reactiver(
            @PathVariable UUID id,
            @Valid @RequestBody(required = false) MotifFacultatifRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(gestionComptesService.reactiver(id, request == null ? null : request.motif(), principal));
    }
}

package ept.edu.sn.alumni_backend.organisme.controller;

import org.springframework.web.bind.annotation.RestController;

import ept.edu.sn.alumni_backend.organisme.dto.CompleterOrganismeRequest;
import ept.edu.sn.alumni_backend.organisme.dto.OrganismeRechercheResponse;
import ept.edu.sn.alumni_backend.organisme.dto.OrganismePublicResponse;
import ept.edu.sn.alumni_backend.organisme.service.OrganismeService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;


@RestController
@RequestMapping("/api/organisme")
@RequiredArgsConstructor
public class OrganismeController {
    private final OrganismeService organismeService;

    @GetMapping("/me")
    public ResponseEntity<OrganismePublicResponse> obtenirMonProfil(
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(organismeService.obtenirMonProfil(principal));
    }

    @PatchMapping("/me")
    public ResponseEntity<OrganismePublicResponse> completerMonProfil(
            @AuthenticationPrincipal UtilisateurPrincipal principal,
            @Valid @RequestBody CompleterOrganismeRequest request) {
        return ResponseEntity.ok(this.organismeService.completerProfil(principal, request));
    }

    @GetMapping("/recherche")
    public ResponseEntity<List<OrganismeRechercheResponse>> rechercher(@RequestParam String q) {
        return ResponseEntity.ok(this.organismeService.rechercherParNom(q));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrganismePublicResponse> obtenirProfilPublic(@PathVariable UUID id) {
        return ResponseEntity.ok(organismeService.obtenirProfilPublic(id));
    }
}

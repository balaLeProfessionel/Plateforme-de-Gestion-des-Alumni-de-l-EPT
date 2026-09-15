package ept.edu.sn.alumni_backend.organisme.controller;

import org.springframework.web.bind.annotation.RestController;

import ept.edu.sn.alumni_backend.organisme.dto.CompleterOrganismeRequest;
import ept.edu.sn.alumni_backend.organisme.dto.OrganismeRechercheResponse;
import ept.edu.sn.alumni_backend.organisme.service.OrganismeService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;


@RestController
@RequestMapping("/api/organisme")
@RequiredArgsConstructor
public class OrganismeController {
    private final OrganismeService organismeService;

    @PatchMapping("/me")
    public ResponseEntity<Void> completerMonProfil(
            @AuthenticationPrincipal UtilisateurPrincipal principal,
            @Valid @RequestBody CompleterOrganismeRequest request) {
        this.organismeService.completerProfil(principal, request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/recherche")
    public ResponseEntity<List<OrganismeRechercheResponse>> rechercher(@RequestParam String q) {
        return ResponseEntity.ok(this.organismeService.rechercherParNom(q));
    }
}

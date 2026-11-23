package ept.edu.sn.alumni_backend.admin.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ept.edu.sn.alumni_backend.admin.dto.IdentiteAdminRequest;
import ept.edu.sn.alumni_backend.admin.service.MonCompteAdminService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Compte de l'administrateur connecté ; réservé au rôle ADMIN par la règle /api/admin/** de SecurityConfig. */
@RestController
@RequestMapping("/api/admin/mon-compte")
@RequiredArgsConstructor
@Validated
public class MonCompteAdminController {
    private final MonCompteAdminService service;

    @PatchMapping("/identite")
    public ResponseEntity<Void> modifierIdentite(
            @Valid @RequestBody IdentiteAdminRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        service.modifierIdentite(request, principal);
        return ResponseEntity.noContent().build();
    }
}

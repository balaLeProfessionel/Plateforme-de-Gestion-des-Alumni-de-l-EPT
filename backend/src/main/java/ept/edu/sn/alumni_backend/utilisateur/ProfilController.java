package ept.edu.sn.alumni_backend.utilisateur;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.dto.ProfilRequest;
import ept.edu.sn.alumni_backend.utilisateur.dto.ProfilResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/profil")
@RequiredArgsConstructor
public class ProfilController {
    private final UtilisateurProfilService profilService;

    @GetMapping("/me")
    public ResponseEntity<ProfilResponse> monProfil(
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(profilService.obtenirProfil(principal.getUtilisateur()));
    }

    @PatchMapping("/me")
    public ResponseEntity<ProfilResponse> mettreAJour(
            @AuthenticationPrincipal UtilisateurPrincipal principal,
            @Valid @RequestBody ProfilRequest request) {
        return ResponseEntity.ok(profilService.mettreAJour(principal.getUtilisateur(), request));
    }
}

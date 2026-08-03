package ept.edu.sn.alumni_backend.admin;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ept.edu.sn.alumni_backend.auth.AuthService;
import ept.edu.sn.alumni_backend.auth.dto.CompteCreeResponse;
import ept.edu.sn.alumni_backend.auth.dto.CreerCompteRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/comptes")
@RequiredArgsConstructor
public class AdminCompteController {

    private final AuthService authService;

    // Création d'un compte étudiant (ou autre) par l'administration.
    @PostMapping
    public ResponseEntity<CompteCreeResponse> creerCompte(
            @Valid @RequestBody CreerCompteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(authService.creerCompteParAdmin(request));
    }
}

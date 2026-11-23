package ept.edu.sn.alumni_backend.stage.controller;

import java.net.URI;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.stage.dto.DeclarationResponse;
import ept.edu.sn.alumni_backend.stage.dto.DeclarationStageRequest;
import ept.edu.sn.alumni_backend.stage.service.DeclarationsStageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Déclaration par l'étudiant d'un stage trouvé hors offre (STA-10) ; il le suit dans « Mes stages ». */
@RestController
@RequestMapping("/api/stages/declarations")
@RequiredArgsConstructor
@Validated
public class DeclarationStageController {
    private final DeclarationsStageService service;

    @PostMapping
    public ResponseEntity<DeclarationResponse> declarer(@Valid @RequestBody DeclarationStageRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        DeclarationResponse declaration = service.declarer(request, principal);
        return ResponseEntity.created(URI.create("/api/stages/declarations/" + declaration.id())).body(declaration);
    }

    @PatchMapping("/{id}/retirer")
    public ResponseEntity<Void> retirer(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        service.retirer(id, principal);
        return ResponseEntity.noContent().build();
    }
}

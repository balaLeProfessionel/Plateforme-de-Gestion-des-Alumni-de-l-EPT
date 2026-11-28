package ept.edu.sn.alumni_backend.mobilite.controller;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ept.edu.sn.alumni_backend.mobilite.dto.AccueilRequest;
import ept.edu.sn.alumni_backend.mobilite.dto.MobiliteResponse;
import ept.edu.sn.alumni_backend.mobilite.service.MobilitesService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Mobilités vues par l'institut partenaire : ses propositions d'étudiants à accueillir et ses échanges avec l'EPT (rôle ORGANISME exigé). */
@RestController
@RequestMapping("/api/mobilites")
@RequiredArgsConstructor
public class AccueilMobiliteController {
    private final MobilitesService mobilitesService;

    @GetMapping("/mes-mobilites")
    public ResponseEntity<List<MobiliteResponse>> mesMobilites(@AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(mobilitesService.mobilitesDeLInstitut(principal));
    }

    @PostMapping("/accueils")
    public ResponseEntity<MobiliteResponse> proposer(@Valid @RequestBody AccueilRequest request, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        MobiliteResponse mobilite = mobilitesService.proposerAccueil(request, principal);
        return ResponseEntity.created(URI.create("/api/mobilites/accueils/" + mobilite.id())).body(mobilite);
    }

    @PutMapping("/accueils/{id}")
    public ResponseEntity<MobiliteResponse> modifier(@PathVariable UUID id, @Valid @RequestBody AccueilRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(mobilitesService.modifierAccueil(id, request, principal));
    }
}

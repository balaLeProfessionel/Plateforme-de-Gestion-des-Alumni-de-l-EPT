package ept.edu.sn.alumni_backend.mobilite.controller;

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

import ept.edu.sn.alumni_backend.admin.dto.MotifRequest;
import ept.edu.sn.alumni_backend.annuaire.dto.PageResponse;
import ept.edu.sn.alumni_backend.mobilite.SensMobilite;
import ept.edu.sn.alumni_backend.mobilite.StatutMobilite;
import ept.edu.sn.alumni_backend.mobilite.dto.EvenementHistoriqueResponse;
import ept.edu.sn.alumni_backend.mobilite.dto.FluxResponse;
import ept.edu.sn.alumni_backend.mobilite.dto.MobiliteResponse;
import ept.edu.sn.alumni_backend.mobilite.dto.SaisieAccueilRequest;
import ept.edu.sn.alumni_backend.mobilite.dto.StatutMobiliteRequest;
import ept.edu.sn.alumni_backend.mobilite.service.MobilitesService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;

/** Suivi des mobilités et flux par le chef du service mobilité (responsabilité Mobilités exigée par SecurityConfig). */
@RestController
@RequestMapping("/api/admin/mobilites")
@RequiredArgsConstructor
@Validated
public class AdminMobiliteController {
    private final MobilitesService mobilitesService;

    @GetMapping("/mobilites")
    public ResponseEntity<PageResponse<MobiliteResponse>> lister(
            @RequestParam(required = false) SensMobilite sens,
            @RequestParam(required = false) UUID organisme,
            @RequestParam(required = false) StatutMobilite statut,
            @RequestParam(required = false) @Size(max = 9) String annee,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(48) int taille) {
        return ResponseEntity.ok(mobilitesService.listerPourChef(sens, organisme, statut, annee, page, taille));
    }

    @GetMapping("/mobilites/{id}")
    public ResponseEntity<MobiliteResponse> detail(@PathVariable UUID id) {
        return ResponseEntity.ok(mobilitesService.detail(id));
    }

    @GetMapping("/mobilites/{id}/historique")
    public ResponseEntity<List<EvenementHistoriqueResponse>> historique(@PathVariable UUID id) {
        return ResponseEntity.ok(mobilitesService.historique(id));
    }

    @PatchMapping("/mobilites/{id}/statut")
    public ResponseEntity<MobiliteResponse> changerStatut(@PathVariable UUID id, @Valid @RequestBody StatutMobiliteRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(mobilitesService.changerStatut(id, request.statut(), request.motif(), principal));
    }

    @PostMapping("/mobilites/entrantes")
    public ResponseEntity<MobiliteResponse> saisirEntrante(@Valid @RequestBody SaisieAccueilRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        MobiliteResponse mobilite = mobilitesService.saisirEntrante(request.accueil(), request.organismeId(), request.nomNouvelOrganisme(), principal);
        return ResponseEntity.created(URI.create("/api/admin/mobilites/mobilites/" + mobilite.id())).body(mobilite);
    }

    @PatchMapping("/mobilites/{id}/accepter")
    public ResponseEntity<MobiliteResponse> accepter(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(mobilitesService.accepterAccueil(id, principal));
    }

    @PatchMapping("/mobilites/{id}/refuser")
    public ResponseEntity<MobiliteResponse> refuser(@PathVariable UUID id, @Valid @RequestBody MotifRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(mobilitesService.refuserAccueil(id, request.motif(), principal));
    }

    @GetMapping("/flux")
    public ResponseEntity<FluxResponse> flux(@RequestParam(required = false) @Size(max = 9) String annee) {
        return ResponseEntity.ok(mobilitesService.flux(annee));
    }
}

package ept.edu.sn.alumni_backend.mentorat.controller;

import java.net.URI;
import java.util.List;
import java.util.Set;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import ept.edu.sn.alumni_backend.annuaire.dto.PageResponse;
import ept.edu.sn.alumni_backend.mentorat.RoleMentorat;
import ept.edu.sn.alumni_backend.mentorat.StatutMentorat;
import ept.edu.sn.alumni_backend.mentorat.dto.CompteursMentoratResponse;
import ept.edu.sn.alumni_backend.mentorat.dto.DemandeMentoratRequest;
import ept.edu.sn.alumni_backend.mentorat.dto.DomaineMentoratResponse;
import ept.edu.sn.alumni_backend.mentorat.dto.EvaluationMentoratRequest;
import ept.edu.sn.alumni_backend.mentorat.dto.EtapeSuivieResponse;
import ept.edu.sn.alumni_backend.mentorat.dto.EvaluationMentoratResponse;
import ept.edu.sn.alumni_backend.mentorat.dto.MentorResponse;
import ept.edu.sn.alumni_backend.mentorat.dto.MentoratDetailResponse;
import ept.edu.sn.alumni_backend.mentorat.dto.MentoratResponse;
import ept.edu.sn.alumni_backend.mentorat.dto.ProfilMentorRequest;
import ept.edu.sn.alumni_backend.mentorat.dto.ProfilMentorResponse;
import ept.edu.sn.alumni_backend.mentorat.dto.RefusMentoratRequest;
import ept.edu.sn.alumni_backend.mentorat.dto.SeanceMentoratRequest;
import ept.edu.sn.alumni_backend.mentorat.dto.SeanceMentoratResponse;
import ept.edu.sn.alumni_backend.mentorat.dto.SuiviSeanceRequest;
import ept.edu.sn.alumni_backend.mentorat.dto.ValidationEtapeRequest;
import ept.edu.sn.alumni_backend.mentorat.service.EtapesMentoratService;
import ept.edu.sn.alumni_backend.mentorat.service.MentoratService;
import ept.edu.sn.alumni_backend.mentorat.service.ProfilMentorService;
import ept.edu.sn.alumni_backend.mentorat.service.SuiviMentoratService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/mentorat")
@RequiredArgsConstructor
@Validated
public class MentoratController {
    private final ProfilMentorService profilMentorService;
    private final MentoratService mentoratService;
    private final SuiviMentoratService suiviService;
    private final EtapesMentoratService etapesService;

    @GetMapping("/domaines")
    public ResponseEntity<List<DomaineMentoratResponse>> listerDomaines() {
        return ResponseEntity.ok(profilMentorService.listerDomaines());
    }

    @GetMapping("/profil")
    public ResponseEntity<ProfilMentorResponse> obtenirMonProfil(
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.of(profilMentorService.obtenirMonProfil(principal));
    }

    @PutMapping("/profil")
    public ResponseEntity<ProfilMentorResponse> enregistrerMonProfil(
            @Valid @RequestBody ProfilMentorRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(profilMentorService.enregistrerMonProfil(request, principal));
    }

    @GetMapping("/mentors")
    public ResponseEntity<PageResponse<MentorResponse>> rechercherMentors(
            @RequestParam(required = false) @Size(max = 100) String recherche,
            @RequestParam(required = false) UUID domaine,
            @RequestParam(required = false) UUID programme,
            @RequestParam(defaultValue = "false") boolean disponibles,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "12") @Min(1) @Max(48) int taille,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(
            profilMentorService.rechercherMentors(recherche, domaine, programme, disponibles, page, taille, principal));
    }

    @GetMapping("/mentors/utilisateur/{utilisateurId}")
    public ResponseEntity<MentorResponse> obtenirMentor(
            @PathVariable UUID utilisateurId,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.of(profilMentorService.obtenirMentor(utilisateurId, principal));
    }

    @PostMapping("/mentorats")
    public ResponseEntity<MentoratResponse> demander(
            @Valid @RequestBody DemandeMentoratRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        MentoratResponse response = mentoratService.demander(request, principal);
        return ResponseEntity.created(URI.create("/api/mentorat/mentorats/" + response.id())).body(response);
    }

    @GetMapping("/mentorats")
    public ResponseEntity<PageResponse<MentoratResponse>> lister(
            @RequestParam RoleMentorat role,
            @RequestParam(required = false) Set<StatutMentorat> statut,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "12") @Min(1) @Max(48) int taille,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(mentoratService.lister(role, statut, page, taille, principal));
    }

    @GetMapping("/mentorats/compteurs")
    public ResponseEntity<CompteursMentoratResponse> compter(
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(mentoratService.compter(principal));
    }

    @GetMapping("/mentorats/{id}")
    public ResponseEntity<MentoratDetailResponse> obtenir(
            @PathVariable UUID id,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(suiviService.obtenir(id, principal));
    }

    @PatchMapping("/mentorats/{id}/accepter")
    public ResponseEntity<MentoratResponse> accepter(
            @PathVariable UUID id,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(mentoratService.accepter(id, principal));
    }

    @PatchMapping("/mentorats/{id}/refuser")
    public ResponseEntity<MentoratResponse> refuser(
            @PathVariable UUID id,
            @Valid @RequestBody RefusMentoratRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(mentoratService.refuser(id, request.motif(), principal));
    }

    @PatchMapping("/mentorats/{id}/annuler")
    public ResponseEntity<MentoratResponse> annuler(
            @PathVariable UUID id,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(mentoratService.annuler(id, principal));
    }

    @PatchMapping("/mentorats/{id}/terminer")
    public ResponseEntity<MentoratResponse> terminer(
            @PathVariable UUID id,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(mentoratService.terminer(id, principal));
    }

    @PostMapping("/mentorats/{id}/seances")
    public ResponseEntity<SeanceMentoratResponse> planifierSeance(
            @PathVariable UUID id,
            @Valid @RequestBody SeanceMentoratRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        SeanceMentoratResponse response = suiviService.planifier(id, request, principal);
        return ResponseEntity
            .created(URI.create("/api/mentorat/mentorats/" + id + "/seances/" + response.id()))
            .body(response);
    }

    @PutMapping("/mentorats/{id}/seances/{seanceId}")
    public ResponseEntity<SeanceMentoratResponse> modifierSeance(
            @PathVariable UUID id,
            @PathVariable UUID seanceId,
            @Valid @RequestBody SeanceMentoratRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(suiviService.modifier(id, seanceId, request, principal));
    }

    @PatchMapping("/mentorats/{id}/seances/{seanceId}")
    public ResponseEntity<SeanceMentoratResponse> suivreSeance(
            @PathVariable UUID id,
            @PathVariable UUID seanceId,
            @Valid @RequestBody SuiviSeanceRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(suiviService.suivre(id, seanceId, request, principal));
    }

    /** Valide une étape du programme (mentor ou mentoré, dans n'importe quel ordre). */
    @PutMapping("/mentorats/{id}/etapes/{etapeId}")
    public ResponseEntity<EtapeSuivieResponse> validerEtape(
            @PathVariable UUID id,
            @PathVariable UUID etapeId,
            @Valid @RequestBody(required = false) ValidationEtapeRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        String commentaire = request != null ? request.commentaire() : null;
        return ResponseEntity.ok(etapesService.valider(id, etapeId, commentaire, principal));
    }

    @DeleteMapping("/mentorats/{id}/etapes/{etapeId}")
    public ResponseEntity<EtapeSuivieResponse> annulerValidationEtape(
            @PathVariable UUID id,
            @PathVariable UUID etapeId,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(etapesService.annulerValidation(id, etapeId, principal));
    }

    @PostMapping("/mentorats/{id}/evaluation")
    public ResponseEntity<EvaluationMentoratResponse> evaluer(
            @PathVariable UUID id,
            @Valid @RequestBody EvaluationMentoratRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.status(201).body(suiviService.evaluer(id, request, principal));
    }
}

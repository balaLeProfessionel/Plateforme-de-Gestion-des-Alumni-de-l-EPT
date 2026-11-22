package ept.edu.sn.alumni_backend.mobilite.controller;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import ept.edu.sn.alumni_backend.annuaire.dto.PageResponse;
import ept.edu.sn.alumni_backend.mobilite.PeriodeMobilite;
import ept.edu.sn.alumni_backend.mobilite.TypeMobilite;
import ept.edu.sn.alumni_backend.mobilite.dto.OffreMobiliteRequest;
import ept.edu.sn.alumni_backend.mobilite.dto.OffreMobiliteResponse;
import ept.edu.sn.alumni_backend.mobilite.service.FichiersOffreMobiliteService;
import ept.edu.sn.alumni_backend.mobilite.service.OffresMobiliteService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;

/**
 * Offres de mobilité pour les étudiants et les enseignants, et pour l'institut qui les publie. Modifier, clôturer et
 * gérer les documents sont aussi ouverts au chef du service mobilité (contrôlé par le service).
 */
@RestController
@RequestMapping("/api/mobilites")
@RequiredArgsConstructor
@Validated
public class OffreMobiliteController {
    private final OffresMobiliteService offresService;
    private final FichiersOffreMobiliteService fichiersService;

    @GetMapping("/offres")
    public ResponseEntity<PageResponse<OffreMobiliteResponse>> lister(
            @RequestParam(required = false) TypeMobilite type,
            @RequestParam(required = false) @Size(max = 100) String pays,
            @RequestParam(required = false) PeriodeMobilite periode,
            @RequestParam(required = false) @Size(max = 9) String annee,
            @RequestParam(defaultValue = "false") boolean eligibles,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "12") @Min(1) @Max(48) int taille,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(offresService.listerPourCandidat(type, pays, periode, annee, eligibles, principal, page, taille));
    }

    @GetMapping("/offres/{id}")
    public ResponseEntity<OffreMobiliteResponse> detail(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(offresService.detail(id, principal));
    }

    @PutMapping("/offres/{id}")
    public ResponseEntity<OffreMobiliteResponse> modifier(@PathVariable UUID id, @Valid @RequestBody OffreMobiliteRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(offresService.modifier(id, request, principal));
    }

    @PatchMapping("/offres/{id}/cloturer")
    public ResponseEntity<OffreMobiliteResponse> cloturer(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(offresService.cloturer(id, principal));
    }

    @PostMapping(value = "/offres/{id}/pieces-jointes", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<OffreMobiliteResponse> ajouterPiece(@PathVariable UUID id, @RequestPart("fichier") MultipartFile fichier,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(fichiersService.ajouter(id, fichier, principal));
    }

    @DeleteMapping("/offres/{id}/pieces-jointes/{pieceId}")
    public ResponseEntity<OffreMobiliteResponse> supprimerPiece(@PathVariable UUID id, @PathVariable UUID pieceId,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(fichiersService.supprimer(id, pieceId, principal));
    }

    @GetMapping("/offres/{id}/pieces-jointes/{pieceId}")
    public ResponseEntity<Resource> telecharger(@PathVariable UUID id, @PathVariable UUID pieceId,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        FichiersOffreMobiliteService.Telechargement piece = fichiersService.telecharger(id, pieceId, principal);
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(piece.nomFichier(), StandardCharsets.UTF_8).build().toString())
            .header("X-Content-Type-Options", "nosniff")
            .cacheControl(CacheControl.noStore())
            .body(piece.contenu());
    }

    /** Offres de l'institut connecté, tous statuts confondus (rôle ORGANISME exigé par SecurityConfig). */
    @GetMapping("/mes-offres")
    public ResponseEntity<List<OffreMobiliteResponse>> mesOffres(@AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(offresService.mesOffres(principal));
    }

    @PostMapping("/mes-offres")
    public ResponseEntity<OffreMobiliteResponse> publier(@Valid @RequestBody OffreMobiliteRequest request,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        OffreMobiliteResponse offre = offresService.publierParInstitut(request, principal);
        return ResponseEntity.created(URI.create("/api/mobilites/offres/" + offre.id())).body(offre);
    }
}

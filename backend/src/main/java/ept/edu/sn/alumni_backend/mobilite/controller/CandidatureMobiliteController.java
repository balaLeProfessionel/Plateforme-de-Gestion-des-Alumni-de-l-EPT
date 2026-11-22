package ept.edu.sn.alumni_backend.mobilite.controller;

import java.nio.charset.StandardCharsets;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;

import ept.edu.sn.alumni_backend.mobilite.TypePiece;
import ept.edu.sn.alumni_backend.mobilite.dto.CandidatureMobiliteResponse;
import ept.edu.sn.alumni_backend.mobilite.service.CandidaturesMobiliteService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import lombok.RequiredArgsConstructor;

/** Candidatures aux offres de mobilité : dépôt et suivi par le candidat, lecture des pièces selon les droits. */
@RestController
@RequestMapping("/api/mobilites")
@RequiredArgsConstructor
public class CandidatureMobiliteController {
    private final CandidaturesMobiliteService candidaturesService;

    /** Sa candidature à l'offre ; 204 s'il n'en a pas. */
    @GetMapping("/offres/{id}/ma-candidature")
    public ResponseEntity<CandidatureMobiliteResponse> maCandidature(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return candidaturesService.maCandidature(id, principal).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.noContent().build());
    }

    /** Dossier en multipart : une partie par pièce, nommée d'après son type (LETTRE_MOTIVATION, RELEVES_NOTES…). */
    @PostMapping(value = "/offres/{id}/candidature", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CandidatureMobiliteResponse> soumettre(@PathVariable UUID id, MultipartHttpServletRequest requete,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        Map<TypePiece, MultipartFile> fichiers = new EnumMap<>(TypePiece.class);
        for (Map.Entry<String, MultipartFile> partie : requete.getFileMap().entrySet()) {
            TypePiece type;
            try {
                type = TypePiece.valueOf(partie.getKey());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Pièce inconnue : « " + partie.getKey() + " ».");
            }
            fichiers.put(type, partie.getValue());
        }
        return ResponseEntity.ok(candidaturesService.soumettre(id, fichiers, principal));
    }

    @PatchMapping("/offres/{id}/candidature/retirer")
    public ResponseEntity<CandidatureMobiliteResponse> retirer(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(candidaturesService.retirer(id, principal));
    }

    @GetMapping("/mes-candidatures")
    public ResponseEntity<List<CandidatureMobiliteResponse>> mesCandidatures(@AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(candidaturesService.mesCandidatures(principal));
    }

    @GetMapping("/candidatures/{id}/pieces/{pieceId}")
    public ResponseEntity<Resource> telecharger(@PathVariable UUID id, @PathVariable UUID pieceId,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        CandidaturesMobiliteService.Telechargement piece = candidaturesService.telecharger(id, pieceId, principal);
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(piece.nomFichier(), StandardCharsets.UTF_8).build().toString())
            .header("X-Content-Type-Options", "nosniff")
            .cacheControl(CacheControl.noStore())
            .body(piece.contenu());
    }
}

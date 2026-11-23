package ept.edu.sn.alumni_backend.partenariat.controller;

import java.nio.charset.StandardCharsets;

import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import ept.edu.sn.alumni_backend.partenariat.service.PiecesConventionService;

/** Réponse de téléchargement d'un PDF de convention ou d'accord, commune à l'organisme et à l'administration. */
final class TelechargementPiece {
    private TelechargementPiece() {
    }

    static ResponseEntity<Resource> reponse(PiecesConventionService.Telechargement piece) {
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(piece.nomFichier(), StandardCharsets.UTF_8).build().toString())
            .header("X-Content-Type-Options", "nosniff")
            .cacheControl(CacheControl.noStore())
            .body(piece.contenu());
    }
}

package ept.edu.sn.alumni_backend.stage.controller;

import java.util.concurrent.TimeUnit;

import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ept.edu.sn.alumni_backend.stage.service.StockageFichiersOffre;
import lombok.RequiredArgsConstructor;

/**
 * Images d'offre, servies sans jeton pour qu'une balise <img> les affiche (comme les images d'événement) :
 * leur nom aléatoire ne se devine pas, et une image ne change jamais (un remplacement crée un nouveau nom).
 */
@RestController
@RequestMapping("/api/offre-images")
@RequiredArgsConstructor
public class ImageOffreController {
    private final StockageFichiersOffre stockage;

    @GetMapping("/{nom}")
    public ResponseEntity<Resource> lire(@PathVariable String nom) {
        return ResponseEntity.ok()
            .contentType(MediaType.IMAGE_JPEG)
            .cacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic().immutable())
            .header("X-Robots-Tag", "noindex, nofollow, noarchive")
            .body(stockage.getImages().lire(nom));
    }
}

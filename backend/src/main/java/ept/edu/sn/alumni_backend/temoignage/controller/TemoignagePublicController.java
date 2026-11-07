package ept.edu.sn.alumni_backend.temoignage.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ept.edu.sn.alumni_backend.temoignage.dto.TemoignagePublicResponse;
import ept.edu.sn.alumni_backend.temoignage.service.TemoignageService;
import lombok.RequiredArgsConstructor;

/** Accessible sans compte (voir `SecurityConfig`). */
@RestController
@RequestMapping("/api/public/temoignages")
@RequiredArgsConstructor
public class TemoignagePublicController {
    private final TemoignageService temoignageService;

    @GetMapping
    public ResponseEntity<List<TemoignagePublicResponse>> lister() {
        return ResponseEntity.ok(temoignageService.listerPublies());
    }
}

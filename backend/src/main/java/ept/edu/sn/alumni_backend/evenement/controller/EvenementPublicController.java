package ept.edu.sn.alumni_backend.evenement.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ept.edu.sn.alumni_backend.evenement.dto.EvenementPublicResponse;
import ept.edu.sn.alumni_backend.evenement.service.EvenementService;
import lombok.RequiredArgsConstructor;

/** Accessible sans compte (voir `SecurityConfig`) ; le reste des événements demande une connexion. */
@RestController
@RequestMapping("/api/public/evenements")
@RequiredArgsConstructor
public class EvenementPublicController {
    private final EvenementService evenementService;

    @GetMapping
    public ResponseEntity<List<EvenementPublicResponse>> prochains() {
        return ResponseEntity.ok(evenementService.prochainsPublics());
    }
}

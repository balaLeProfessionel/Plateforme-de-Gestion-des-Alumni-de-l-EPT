package ept.edu.sn.alumni_backend.filiere.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ept.edu.sn.alumni_backend.filiere.dto.FiliereResponse;
import ept.edu.sn.alumni_backend.filiere.service.FiliereService;
import lombok.RequiredArgsConstructor;

/** Filières proposées, lisibles sans compte : la page d'inscription en a besoin. */
@RestController
@RequestMapping("/api/public/filieres")
@RequiredArgsConstructor
public class FiliereController {
    private final FiliereService filiereService;

    @GetMapping
    public ResponseEntity<List<FiliereResponse>> lister() {
        return ResponseEntity.ok(filiereService.listerActives());
    }
}

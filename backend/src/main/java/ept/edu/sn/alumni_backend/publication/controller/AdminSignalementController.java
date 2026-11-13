package ept.edu.sn.alumni_backend.publication.controller;

import java.util.Map;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import ept.edu.sn.alumni_backend.publication.dto.PageSignalementsResponse;
import ept.edu.sn.alumni_backend.publication.dto.SignalementResponse;
import ept.edu.sn.alumni_backend.publication.service.SignalementPublicationService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;

/** File de modération ; la permission MODERER_PUBLICATIONS est exigée par SecurityConfig. */
@RestController
@RequestMapping("/api/admin/signalements")
@Validated
@RequiredArgsConstructor
public class AdminSignalementController {
    private final SignalementPublicationService signalements;

    @GetMapping
    public PageSignalementsResponse lister(@RequestParam(defaultValue = "false") boolean traites,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(48) int taille) {
        return signalements.lister(traites, page, taille);
    }

    @GetMapping("/compteur")
    public Map<String, Long> compteur() {
        return Map.of("enAttente", signalements.compterEnAttente());
    }

    @PatchMapping("/{id}/masquer")
    public SignalementResponse masquer(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return signalements.masquerPublication(id, principal);
    }

    @PatchMapping("/{id}/rejeter")
    public SignalementResponse rejeter(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return signalements.rejeter(id, principal);
    }
}

package ept.edu.sn.alumni_backend.notification;

import java.util.Map;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;

/** Notifications du membre connecté : chacun ne voit et ne modifie que les siennes. */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Validated
public class NotificationController {
    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<PageNotificationsResponse> lister(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(50) int taille,
            @RequestParam(defaultValue = "false") boolean nonLues,
            @AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(notificationService.lister(principal.getUtilisateur().getId(), nonLues, page, taille));
    }

    /** Appel léger, répété régulièrement pour la pastille de la cloche. */
    @GetMapping("/non-lues")
    public ResponseEntity<Map<String, Long>> compterNonLues(@AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(Map.of("nombre", notificationService.compterNonLues(principal.getUtilisateur().getId())));
    }

    @PostMapping("/{id}/lue")
    public ResponseEntity<Void> marquerLue(@PathVariable UUID id, @AuthenticationPrincipal UtilisateurPrincipal principal) {
        notificationService.marquerLue(id, principal.getUtilisateur().getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/lues")
    public ResponseEntity<Void> toutMarquerLu(@AuthenticationPrincipal UtilisateurPrincipal principal) {
        notificationService.toutMarquerLu(principal.getUtilisateur().getId());
        return ResponseEntity.noContent().build();
    }
}

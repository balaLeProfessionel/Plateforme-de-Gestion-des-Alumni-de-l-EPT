package ept.edu.sn.alumni_backend.partenariat.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import ept.edu.sn.alumni_backend.partenariat.dto.MonPartenariatResponse;
import ept.edu.sn.alumni_backend.partenariat.dto.TableauPartenariatsResponse;
import ept.edu.sn.alumni_backend.partenariat.service.TableauPartenariatsService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import lombok.RequiredArgsConstructor;

/** Indicateurs des partenariats : responsabilité Partenariats ou rôle ORGANISME, exigés par SecurityConfig. */
@RestController
@RequiredArgsConstructor
public class TableauPartenariatsController {
    private final TableauPartenariatsService service;

    @GetMapping("/api/admin/partenariats/tableau-de-bord")
    public ResponseEntity<TableauPartenariatsResponse> tableau() {
        return ResponseEntity.ok(service.tableau());
    }

    @GetMapping("/api/partenariats/mon-partenariat")
    public ResponseEntity<MonPartenariatResponse> monPartenariat(@AuthenticationPrincipal UtilisateurPrincipal principal) {
        return ResponseEntity.ok(service.monPartenariat(principal));
    }
}

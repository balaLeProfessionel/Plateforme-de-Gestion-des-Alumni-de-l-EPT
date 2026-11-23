package ept.edu.sn.alumni_backend.admin.service;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.admin.PermissionAdmin;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import lombok.RequiredArgsConstructor;

/**
 * Bases créées avant les responsabilités (TRA-13) : chaque administrateur avait tout pouvoir, il devient super
 * administrateur pour ne rien perdre. N'agit que si aucune responsabilité n'est encore enregistrée : ensuite, un
 * administrateur sans responsabilité est un choix d'un super administrateur, et n'est jamais promu.
 */
@Component
@RequiredArgsConstructor
public class MigrationPermissionsAdmin implements ApplicationRunner {
    private static final Logger LOGGER = LoggerFactory.getLogger(MigrationPermissionsAdmin.class);

    private final UtilisateurRepository utilisateurRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments arguments) {
        if (utilisateurRepository.existeUneResponsabiliteEnregistree()) {
            return;
        }
        List<Utilisateur> administrateurs = utilisateurRepository.findByRole(TypeRole.ADMIN);
        administrateurs.forEach(admin -> admin.getPermissionsAdmin().add(PermissionAdmin.GERER_ADMINISTRATEURS));
        if (!administrateurs.isEmpty()) {
            LOGGER.info("{} administrateur(s) existant(s) devenu(s) super administrateur(s).", administrateurs.size());
        }
    }
}

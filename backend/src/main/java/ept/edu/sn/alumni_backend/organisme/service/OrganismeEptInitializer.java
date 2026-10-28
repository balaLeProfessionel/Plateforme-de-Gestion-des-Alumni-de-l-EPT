package ept.edu.sn.alumni_backend.organisme.service;

import java.util.stream.Stream;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.organisme.entity.Organisme;
import ept.edu.sn.alumni_backend.organisme.repository.OrganismeRepository;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class OrganismeEptInitializer implements ApplicationRunner {
    public static final String NOM_OFFICIEL = "École Polytechnique de Thiès (EPT)";

    private final OrganismeRepository organismeRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (organismeRepository.findFirstByEtablissementEptTrue().isPresent()) {
            return;
        }

        Organisme ept = Stream.of(
                NOM_OFFICIEL,
                "École Polytechnique de Thiès",
                "Ecole Polytechnique de Thies",
                "EPT"
            )
            .map(organismeRepository::findByNomIgnoreCase)
            .flatMap(java.util.Optional::stream)
            .findFirst()
            .orElseGet(Organisme::new);
        ept.setNom(NOM_OFFICIEL);
        ept.setEtablissementEpt(true);
        ept.setStatutValidation(StatutCompte.ACTIF);
        organismeRepository.save(ept);
    }
}

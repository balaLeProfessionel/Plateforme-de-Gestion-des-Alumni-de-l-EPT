package ept.edu.sn.alumni_backend.mentorat.service;

import java.util.List;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.mentorat.entity.DomaineMentorat;
import ept.edu.sn.alumni_backend.mentorat.repository.DomaineMentoratRepository;
import lombok.RequiredArgsConstructor;

/**
 * Crée les domaines de départ s'ils manquent. Sans outil de migration, c'est le point unique
 * où le référentiel initial est défini ; un domaine ajouté ensuite en base est conservé.
 */
@Component
@RequiredArgsConstructor
public class DomainesMentoratInitializer implements ApplicationRunner {
    private static final List<DomaineInitial> DOMAINES_INITIAUX = List.of(
        new DomaineInitial("DEV_LOGICIEL", "Développement logiciel"),
        new DomaineInitial("DATA_IA", "Data & IA"),
        new DomaineInitial("RESEAUX_TELECOMS", "Réseaux & Télécoms"),
        new DomaineInitial("CYBERSECURITE", "Cybersécurité"),
        new DomaineInitial("GENIE_CIVIL", "Génie civil"),
        new DomaineInitial("ELECTROMECANIQUE", "Électromécanique"),
        new DomaineInitial("ENTREPRENEURIAT", "Entrepreneuriat"),
        new DomaineInitial("GESTION_PROJET", "Gestion de projet"),
        new DomaineInitial("CARRIERE_INSERTION", "Carrière & insertion"),
        new DomaineInitial("CONCOURS_ETUDES", "Concours & poursuite d'études")
    );

    private final DomaineMentoratRepository domaineRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        for (int ordre = 0; ordre < DOMAINES_INITIAUX.size(); ordre++) {
            DomaineInitial domaine = DOMAINES_INITIAUX.get(ordre);
            if (domaineRepository.existsByCode(domaine.code())) {
                continue;
            }
            DomaineMentorat nouveau = new DomaineMentorat();
            nouveau.setCode(domaine.code());
            nouveau.setLibelle(domaine.libelle());
            nouveau.setOrdre((short) ordre);
            domaineRepository.save(nouveau);
        }
    }

    private record DomaineInitial(String code, String libelle) {
    }
}

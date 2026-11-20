package ept.edu.sn.alumni_backend.stage.service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.admin.evenement.NotificationCompte;
import ept.edu.sn.alumni_backend.annuaire.dto.PageResponse;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.organisme.entity.Organisme;
import ept.edu.sn.alumni_backend.organisme.repository.OrganismeRepository;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.stage.TypeSollicitation;
import ept.edu.sn.alumni_backend.stage.dto.ModeleSollicitationResponse;
import ept.edu.sn.alumni_backend.stage.dto.SollicitationRequest;
import ept.edu.sn.alumni_backend.stage.dto.SollicitationResponse;
import ept.edu.sn.alumni_backend.stage.dto.SollicitationResponse.DestinataireSollicitation;
import ept.edu.sn.alumni_backend.stage.entity.Sollicitation;
import ept.edu.sn.alumni_backend.stage.exception.OffreStageIntrouvableException;
import ept.edu.sn.alumni_backend.stage.repository.SollicitationRepository;
import lombok.RequiredArgsConstructor;

/**
 * Sollicitation des organismes par l'administrateur Stages (STA-11) : sujets de PFE (octobre) ou offres de stage (mars).
 * Sont proposés les organismes non suspendus, hors EPT, qui ont une adresse : la leur, sinon celle de leur contact.
 * Un e-mail part à chaque destinataire après validation de la transaction ; l'envoi est enregistré.
 */
@Service
@RequiredArgsConstructor
public class SollicitationsService {
    private final OrganismeRepository organismeRepository;
    private final SollicitationRepository sollicitationRepository;
    private final ApplicationEventPublisher evenements;

    @Transactional(readOnly = true)
    public List<DestinataireSollicitation> destinatairesPossibles() {
        return organismeRepository.findAll().stream()
            .filter(o -> !o.isEtablissementEpt() && o.getStatutValidation() != StatutCompte.SUSPENDU)
            .map(o -> adresse(o).map(email -> new DestinataireSollicitation(o.getId(), o.getNom(), email)).orElse(null))
            .filter(d -> d != null)
            .sorted(Comparator.comparing(d -> d.nom().toLowerCase()))
            .toList();
    }

    public ModeleSollicitationResponse modele(TypeSollicitation type) {
        int annee = LocalDate.now(OffresStageService.FUSEAU).getYear();
        return switch (type) {
            case SUJETS_PFE -> new ModeleSollicitationResponse("Proposition de sujets de projet de fin d'études " + annee + "-" + (annee + 1),
                """
                Madame, Monsieur,

                L'École polytechnique de Thiès prépare les projets de fin d'études de ses élèves ingénieurs en dernière année (DIC3) et de ses étudiants de Master 2.

                Nous vous invitons à nous proposer des sujets de stage de fin d'études, d'une durée de quatre à six mois. Vous pouvez les publier directement sur la plateforme EPT Alumni, rubrique Stages, ou nous répondre par retour de message.

                Nous vous remercions de votre collaboration.

                L'administration des stages de l'EPT""");
            case OFFRES_STAGE -> new ModeleSollicitationResponse("Offres de stage pour l'été " + annee,
                """
                Madame, Monsieur,

                L'École polytechnique de Thiès recherche des stages pour ses étudiants cet été : stages ouvriers (TC2 et DIC1) et stages de maîtrise (DIC2 et Master 1).

                Si vous pouvez accueillir des stagiaires, publiez vos offres sur la plateforme EPT Alumni, rubrique Stages, ou répondez-nous par retour de message.

                Nous vous remercions de votre collaboration.

                L'administration des stages de l'EPT""");
        };
    }

    @Transactional
    public SollicitationResponse envoyer(SollicitationRequest request, UtilisateurPrincipal principal) {
        Map<UUID, DestinataireSollicitation> possibles = destinatairesPossibles().stream()
            .collect(Collectors.toMap(DestinataireSollicitation::organismeId, Function.identity()));
        List<UUID> ids = request.organismeIds().stream().distinct().toList();
        if (!possibles.keySet().containsAll(new HashSet<>(ids))) {
            throw new IllegalArgumentException("Un des organismes choisis n'a pas d'adresse e-mail ou ne peut plus être sollicité.");
        }
        Sollicitation sollicitation = new Sollicitation();
        sollicitation.setType(request.type());
        sollicitation.setObjet(request.objet().strip());
        sollicitation.setMessage(request.message().strip());
        sollicitation.setEnvoyeePar(principal.getUtilisateur());
        ids.forEach(id -> {
            DestinataireSollicitation d = possibles.get(id);
            sollicitation.getDestinataires().add(new Sollicitation.Destinataire(d.organismeId(), d.nom(), d.email()));
        });
        Sollicitation enregistree = sollicitationRepository.saveAndFlush(sollicitation);
        enregistree.getDestinataires().forEach(d ->
            evenements.publishEvent(new NotificationCompte(null, d.getEmail(), enregistree.getObjet(), enregistree.getMessage())));
        return versReponse(enregistree, true);
    }

    @Transactional(readOnly = true)
    public PageResponse<SollicitationResponse> historique(int page, int taille) {
        return PageResponse.depuis(sollicitationRepository.findAllByOrderByEnvoyeeLeDesc(PageRequest.of(page, taille)).map(s -> versReponse(s, false)));
    }

    @Transactional(readOnly = true)
    public SollicitationResponse detail(UUID id) {
        return sollicitationRepository.findById(id).map(s -> versReponse(s, true)).orElseThrow(OffreStageIntrouvableException::new);
    }

    private static Optional<String> adresse(Organisme o) {
        if (o.getEmail() != null && !o.getEmail().isBlank()) return Optional.of(o.getEmail().strip());
        return Optional.ofNullable(o.getContact()).map(c -> c.getEmail()).filter(e -> !e.isBlank());
    }

    private static SollicitationResponse versReponse(Sollicitation s, boolean avecDestinataires) {
        return new SollicitationResponse(s.getId(), s.getType().name(), s.getObjet(), s.getMessage(), s.getDestinataires().size(),
            avecDestinataires ? s.getDestinataires().stream().map(d -> new DestinataireSollicitation(d.getOrganismeId(), d.getNom(), d.getEmail())).toList()
                : List.of(),
            s.getEnvoyeePar().getPrenom() + " " + s.getEnvoyeePar().getNom(), s.getEnvoyeeLe());
    }
}

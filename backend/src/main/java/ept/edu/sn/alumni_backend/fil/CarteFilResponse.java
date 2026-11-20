package ept.edu.sn.alumni_backend.fil;

import ept.edu.sn.alumni_backend.evenement.dto.EvenementResponse;
import ept.edu.sn.alumni_backend.mentorat.dto.ProgrammeResponse;
import ept.edu.sn.alumni_backend.publication.dto.PublicationResponse;

/**
 * Une carte du fil : selon {@code type}, un seul des trois contenus est renseigné.
 * {@code raison} explique pourquoi elle est proposée (« De votre promotion 2020 ») ; absente sans signal personnel.
 */
public record CarteFilResponse(TypeCarteFil type, PublicationResponse publication, EvenementResponse evenement,
        ProgrammeResponse programme, String raison) {

    public enum TypeCarteFil { PUBLICATION, EVENEMENT, PROGRAMME }
}

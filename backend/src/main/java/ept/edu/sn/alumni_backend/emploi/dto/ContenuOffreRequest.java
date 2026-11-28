package ept.edu.sn.alumni_backend.emploi.dto;

import ept.edu.sn.alumni_backend.enums.TypeContrat;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Champs communs aux offres relayées et gérées : ce que voit tout membre. */
public interface ContenuOffreRequest {
    String titre();

    String description();

    TypeContrat typeContrat();

    String lieu();

    LocalDate dateExpiration();

    List<String> competences();

    List<UUID> filieres();
}

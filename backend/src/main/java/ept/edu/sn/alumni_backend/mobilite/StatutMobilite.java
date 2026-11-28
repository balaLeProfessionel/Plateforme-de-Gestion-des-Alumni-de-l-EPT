package ept.edu.sn.alumni_backend.mobilite;

/**
 * Cycle d'une mobilité. Une sortante naît PREVUE à la publication de la liste définitive ; une entrante proposée par
 * un institut naît PROPOSEE et devient PREVUE ou REFUSEE selon le chef du service mobilité.
 */
public enum StatutMobilite {
    PROPOSEE,
    REFUSEE,
    PREVUE,
    EN_COURS,
    TERMINEE,
    ANNULEE
}

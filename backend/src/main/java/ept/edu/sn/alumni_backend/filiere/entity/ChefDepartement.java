package ept.edu.sn.alumni_backend.filiere.entity;

import java.time.Instant;
import java.util.UUID;

import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Chef du département d'une filière (TRA-14) : un compte du personnel, un seul par filière. Il verra les stages et
 * les évaluations des étudiants de sa filière. Le désigner à nouveau remplace la ligne ; le journal garde l'historique.
 */
@Entity
@Table(name = "chef_departement")
@Getter
@Setter
@NoArgsConstructor
public class ChefDepartement {
    @Id
    @Column(name = "filiere_id")
    private UUID filiereId;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "filiere_id")
    private Filiere filiere;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "chef_id", nullable = false)
    private Utilisateur chef;

    @Column(name = "designe_le", nullable = false)
    private Instant designeLe;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "designe_par_id", nullable = false)
    private Utilisateur designePar;

    public ChefDepartement(Filiere filiere, Utilisateur chef, Utilisateur designePar) {
        this.filiere = filiere;
        designer(chef, designePar);
    }

    public void designer(Utilisateur nouveauChef, Utilisateur auteur) {
        this.chef = nouveauChef;
        this.designePar = auteur;
        this.designeLe = Instant.now();
    }
}

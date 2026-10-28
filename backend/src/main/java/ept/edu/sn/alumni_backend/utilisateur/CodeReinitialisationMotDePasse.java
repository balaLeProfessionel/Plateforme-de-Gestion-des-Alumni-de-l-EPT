package ept.edu.sn.alumni_backend.utilisateur;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class CodeReinitialisationMotDePasse {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String code;

    @Column(nullable = false)
    private LocalDateTime expiration;

    private int tentatives;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_id", nullable = false, unique = true)
    private Utilisateur utilisateur;

    public CodeReinitialisationMotDePasse(
            String code,
            LocalDateTime expiration,
            Utilisateur utilisateur) {
        this.code = code;
        this.expiration = expiration;
        this.utilisateur = utilisateur;
    }

    public boolean estExpire() {
        return expiration.isBefore(LocalDateTime.now());
    }
}

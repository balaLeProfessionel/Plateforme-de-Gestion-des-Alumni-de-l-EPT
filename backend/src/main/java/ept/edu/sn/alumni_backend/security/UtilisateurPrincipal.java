package ept.edu.sn.alumni_backend.security;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import ept.edu.sn.alumni_backend.admin.PermissionAdmin;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class UtilisateurPrincipal implements UserDetails {
    private final Utilisateur utilisateur;

    /** Le rôle (ROLE_…) et les permissions d'administration qu'il accorde. */
    public Collection<? extends GrantedAuthority> getAuthorities() {
        List<GrantedAuthority> autorites = new ArrayList<>();
        autorites.add(new SimpleGrantedAuthority("ROLE_" + this.utilisateur.getRole().name()));
        PermissionAdmin.pour(this.utilisateur.getRole())
            .forEach(permission -> autorites.add(new SimpleGrantedAuthority(permission.name())));
        return autorites;
    }

    public String getPassword() {
        return this.utilisateur.getPassword();
    }

    public String getUsername() {
        return this.utilisateur.getEmail();
    }

    public Utilisateur getUtilisateur() {
        return this.utilisateur;
    }

    public boolean isEnabled() {
        return this.utilisateur.getStatutCompte() != StatutCompte.SUSPENDU
            && this.utilisateur.isEmailVerifie();
    }

    public boolean isAccountNonExpired() {
        return true;
    }

    public boolean isAccountNonLocked() {
        return this.utilisateur.getStatutCompte() != StatutCompte.SUSPENDU;
    }
}

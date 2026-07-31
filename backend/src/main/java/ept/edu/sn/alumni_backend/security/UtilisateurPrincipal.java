package ept.edu.sn.alumni_backend.security;

import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class UtilisateurPrincipal implements UserDetails {
    private final Utilisateur utilisateur;

    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(
            new SimpleGrantedAuthority(
                "ROLE_" + utilisateur.getRole().name()
            )
        );
    }

    public String getPassword() {
        return utilisateur.getPassword();
    }

    public String getUsername() {
        return utilisateur.getEmail();
    }

    public boolean isEnabled() {
        return true;
    }
}

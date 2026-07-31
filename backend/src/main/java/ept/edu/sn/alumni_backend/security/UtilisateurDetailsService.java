package ept.edu.sn.alumni_backend.security;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UtilisateurDetailsService implements UserDetailsService {
    private final UtilisateurRepository utilisateurRepository;

    public UserDetails loadUserByUsername(String email) {
        Utilisateur utilisateur = this.utilisateurRepository.findByEmail(email)
            .orElseThrow(
                () -> new UsernameNotFoundException("Utilisateur introuvable")
            );

        return new UtilisateurPrincipal(utilisateur);
    }
}

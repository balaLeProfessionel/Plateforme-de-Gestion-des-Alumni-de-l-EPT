package ept.edu.sn.alumni_backend.security;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Set;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class PremiereConnexionFilter extends OncePerRequestFilter {
    private static final Set<String> ROUTES_AUTORISEES = Set.of(
        "/api/auth/changer-mot-de-passe-initial",
        "/api/auth/logout",
        "/api/auth/refresh",
        "/api/auth/me"
    );

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null
                && authentication.getPrincipal() instanceof UtilisateurPrincipal principal
                && principal.getUtilisateur().isDoitChangerMotDePasse()
                && !ROUTES_AUTORISEES.contains(request.getRequestURI())) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.getWriter().write(
                "{\"message\":\"Vous devez définir votre nouveau mot de passe avant de continuer.\"}"
            );
            return;
        }
        filterChain.doFilter(request, response);
    }
}

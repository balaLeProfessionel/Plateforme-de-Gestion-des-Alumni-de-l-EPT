package ept.edu.sn.alumni_backend.parcours.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.parcours.entity.ExperienceProfessionelle;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;

@Repository
public interface ExperienceRepository extends JpaRepository<ExperienceProfessionelle, UUID> {
    List<ExperienceProfessionelle> findByUtilisateurOrderByDateDebutDesc(Utilisateur utilisateur);

    /** Organismes du parcours de plusieurs membres à la fois, en une requête. */
    @Query("""
        select e.utilisateur.id as utilisateurId, o.id as organismeId, o.secteurActivite as secteur
        from ExperienceProfessionelle e join e.organisme o where e.utilisateur.id in :membres""")
    List<OrganismeDuMembre> organismesDe(@Param("membres") Collection<UUID> membres);

    /**
     * Membres visibles passés par un organisme, une ligne par personne : ceux qui y sont encore
     * d'abord, puis les départs les plus récents. Mêmes règles de visibilité que l'annuaire.
     * {@code enPoste} : 1 pour ceux qui y sont encore, 0 pour les anciens, null pour tous ;
     * {@code motif} : motif LIKE en minuscules sur « prénom nom », ou null.
     */
    @Query("""
        select u.id from ExperienceProfessionelle e join e.utilisateur u
        where e.organisme.id = :organisme and e.estValide = true
          and u.emailVerifie = true and u.statutCompte in :statuts and u.role in :roles
          and (:motif is null or cast(function('translate', lower(concat(coalesce(u.prenom, ''), ' ', u.nom)),
            'àáâãäåçèéêëìíîïñòóôõöùúûüýÿ', 'aaaaaaceeeeiiiinooooouuuuyy') as String) like :motif escape '\\')
        group by u.id
        having (:enPoste is null or max(case when e.dateFin is null then 1 else 0 end) = :enPoste)
        order by max(case when e.dateFin is null then 1 else 0 end) desc,
          max(coalesce(e.dateFin, e.dateDebut)) desc, u.id""")
    List<UUID> membresDe(@Param("organisme") UUID organisme, @Param("statuts") Collection<StatutCompte> statuts,
                         @Param("roles") Collection<TypeRole> roles, @Param("enPoste") Integer enPoste,
                         @Param("motif") String motif, Pageable pagination);

    @Query("""
        select count(distinct u.id) from ExperienceProfessionelle e join e.utilisateur u
        where e.organisme.id = :organisme and e.estValide = true
          and u.emailVerifie = true and u.statutCompte in :statuts and u.role in :roles
          and (:motif is null or cast(function('translate', lower(concat(coalesce(u.prenom, ''), ' ', u.nom)),
            'àáâãäåçèéêëìíîïñòóôõöùúûüýÿ', 'aaaaaaceeeeiiiinooooouuuuyy') as String) like :motif escape '\\')""")
    long compterMembres(@Param("organisme") UUID organisme, @Param("statuts") Collection<StatutCompte> statuts,
                        @Param("roles") Collection<TypeRole> roles, @Param("motif") String motif);

    @Query("""
        select count(distinct u.id) from ExperienceProfessionelle e join e.utilisateur u
        where e.organisme.id = :organisme and e.estValide = true
          and u.emailVerifie = true and u.statutCompte in :statuts and u.role in :roles
          and (:motif is null or cast(function('translate', lower(concat(coalesce(u.prenom, ''), ' ', u.nom)),
            'àáâãäåçèéêëìíîïñòóôõöùúûüýÿ', 'aaaaaaceeeeiiiinooooouuuuyy') as String) like :motif escape '\\')
          and e.dateFin is null""")
    long compterMembresActuels(@Param("organisme") UUID organisme, @Param("statuts") Collection<StatutCompte> statuts,
                               @Param("roles") Collection<TypeRole> roles, @Param("motif") String motif);

    @Query("""
        select e from ExperienceProfessionelle e join fetch e.utilisateur
        where e.organisme.id = :organisme and e.estValide = true and e.utilisateur.id in :membres""")
    List<ExperienceProfessionelle> experiencesChez(@Param("organisme") UUID organisme,
                                                   @Param("membres") Collection<UUID> membres);
}

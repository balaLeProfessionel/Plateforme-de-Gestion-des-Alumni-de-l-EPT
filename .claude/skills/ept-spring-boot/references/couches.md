# Exemples par couche (tirés du module mentorat)

## Sommaire
1. Énumération avec transitions
2. Entité
3. Repository
4. Service : règle métier, verrou, notification
5. Composant d'accès
6. Contrôleur
7. DTO
8. Initialiseur de référentiel

---

## 1. Énumération avec transitions
Les transitions autorisées vivent dans l'enum : une seule source de vérité, testable.

```java
public enum StatutMentorat {
    EN_ATTENTE, ACCEPTEE, REFUSEE, ANNULEE, TERMINEE;

    public static final Set<StatutMentorat> EN_COURS = Set.of(EN_ATTENTE, ACCEPTEE);

    public boolean peutPasserA(StatutMentorat cible) {
        return switch (this) {
            case EN_ATTENTE -> cible == ACCEPTEE || cible == REFUSEE || cible == ANNULEE;
            case ACCEPTEE -> cible == TERMINEE;
            case REFUSEE, ANNULEE, TERMINEE -> false;
        };
    }
}
```

## 2. Entité

```java
@Entity
@Table(name = "evaluations_mentorat", uniqueConstraints = @UniqueConstraint(
    name = "uk_evaluation_mentorat_auteur", columnNames = {"mentorat_id", "auteur_id"}))
@Check(name = "ck_evaluation_mentorat_note", constraints = "note between 1 and 5")
@Getter
@Setter
public class EvaluationMentorat {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "mentorat_id", nullable = false)
    private Mentorat mentorat;

    @Column(nullable = false)
    private int note;

    @Column(length = 1000)
    private String commentaire;

    @Column(nullable = false, updatable = false)
    private Instant creeLe;

    @PrePersist
    void initialiserDate() {
        creeLe = Instant.now();
    }
}
```

- Une ligne qui porte tout un cycle de vie (demande → acceptée → terminée) plutôt que deux tables.
- Colonnes de date par étape (`creeLe`, `reponduLe`, `clotureLe`) : suffisent pour afficher un historique.
- Association facultative (`programme_id` vide pour un mentorat libre) : `@ManyToOne` sans `optional = false`.

## 3. Repository

```java
@Repository
public interface ProfilMentorRepository
        extends JpaRepository<ProfilMentor, UUID>, JpaSpecificationExecutor<ProfilMentor> {

    @Override
    @EntityGraph(attributePaths = "utilisateur")
    Page<ProfilMentor> findAll(Specification<ProfilMentor> specification, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select profil from ProfilMentor profil where profil.id = :id")
    Optional<ProfilMentor> findByIdForUpdate(@Param("id") UUID id);
}
```

Comptage groupé pour une page de résultats :

```java
@Query("""
    select mentorat.profilMentor.id as profilMentorId, count(mentorat.id) as nombre
    from Mentorat mentorat
    where mentorat.profilMentor.id in :profilIds and mentorat.statut = :statut
    group by mentorat.profilMentor.id
    """)
List<NombreParProfilProjection> compterParProfils(@Param("profilIds") Collection<UUID> profilIds,
                                                  @Param("statut") StatutMentorat statut);

interface NombreParProfilProjection { UUID getProfilMentorId(); Long getNombre(); }
```

Filtre facultatif : retourner `Specification.unrestricted()` quand le critère est vide.

## 4. Service : règle métier, verrou, notification

```java
@Transactional
public MentoratResponse accepter(UUID mentoratId, UtilisateurPrincipal principal) {
    Mentorat mentorat = acces.chargerPourParticipant(mentoratId, principal);   // 404 sinon
    exigerRole(mentorat, principal, RoleMentorat.MENTOR, "Seul le mentor peut accepter cette demande.");
    exigerTransition(mentorat, StatutMentorat.ACCEPTEE);                       // 409 sinon
    ProfilMentor profil = profilMentorRepository.findByIdForUpdate(mentorat.getProfilMentor().getId())
        .orElseThrow(() -> new MentoratIntrouvableException("Ce mentorat est introuvable."));
    if (placesRestantes(profil) <= 0) {
        throw new ConflitMentoratException("Vous avez atteint votre nombre maximum de mentorés.");
    }
    mentorat.setStatut(StatutMentorat.ACCEPTEE);
    mentorat.setReponduLe(Instant.now());
    evenements.publishEvent(new NotificationMentorat(mentorat.getMentore().getEmail(),
        "Demande de mentorat acceptée", "…"));
    return mapper.versResponse(mentorat, principal.getUtilisateur().getId());
}
```

- Ordre : charger (avec contrôle d'accès) → vérifier le rôle → vérifier la transition →
  verrouiller → vérifier la capacité → modifier → notifier → mapper.
- Pas de `save()` sur une entité gérée : la transaction écrit les modifications.
- Références sans chargement : `utilisateurRepository.getReferenceById(id)`.
- Texte libre : `trim()`, et `null` si vide.

Écouteur :

```java
@Component
@RequiredArgsConstructor
public class NotificationMentoratListener {
    private final EmailService emailService;

    @TransactionalEventListener   // phase AFTER_COMMIT par défaut
    public void notifier(NotificationMentorat notification) {
        emailService.envoyerNotification(notification.destinataire(), notification.sujet(), notification.message());
    }
}
```

## 5. Composant d'accès
Méthodes **publiques** dans un `@Component` séparé : un service qui appelle une méthode
package-private d'un autre service passe par un proxy CGLIB et perd ses garanties.

```java
public Mentorat chargerPourParticipant(UUID mentoratId, UtilisateurPrincipal principal) {
    UUID moi = principal.getUtilisateur().getId();
    return mentoratRepository.findById(mentoratId)
        .filter(m -> m.getMentore().getId().equals(moi) || mentorDe(m).getId().equals(moi))
        .orElseThrow(() -> new MentoratIntrouvableException("Ce mentorat est introuvable."));
}
```

## 6. Contrôleur

```java
@PostMapping("/mentorats")
public ResponseEntity<MentoratResponse> demander(@Valid @RequestBody DemandeMentoratRequest request,
                                                 @AuthenticationPrincipal UtilisateurPrincipal principal) {
    MentoratResponse response = mentoratService.demander(request, principal);
    return ResponseEntity.created(URI.create("/api/mentorat/mentorats/" + response.id())).body(response);
}

@GetMapping("/profil")   // 404 quand le profil n'existe pas encore
public ResponseEntity<ProfilMentorResponse> obtenirMonProfil(@AuthenticationPrincipal UtilisateurPrincipal principal) {
    return ResponseEntity.of(profilMentorService.obtenirMonProfil(principal));
}
```

## 7. DTO

```java
public record ProfilMentorRequest(
    @Size(max = 600) String presentation,
    @NotNull Boolean disponible,
    @Min(1) @Max(10) int capaciteMax,
    @NotEmpty(message = "Choisissez au moins un domaine")
    @Size(max = 5, message = "Choisissez au plus 5 domaines")
    Set<@NotNull UUID> domaineIds
) {}
```

Validation qui croise deux champs : méthode `@AssertTrue` dans le record
(voir `EvenementRequest.isChronologieValide()`).

## 8. Initialiseur de référentiel

```java
@Component
@RequiredArgsConstructor
public class DomainesMentoratInitializer implements ApplicationRunner {
    private static final List<DomaineInitial> DOMAINES_INITIAUX = List.of(
        new DomaineInitial("DATA_IA", "Data & IA") /* … */);

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        for (int ordre = 0; ordre < DOMAINES_INITIAUX.size(); ordre++) {
            DomaineInitial domaine = DOMAINES_INITIAUX.get(ordre);
            if (domaineRepository.existsByCode(domaine.code())) continue;   // idempotent
            /* créer */
        }
    }

    private record DomaineInitial(String code, String libelle) {}
}
```

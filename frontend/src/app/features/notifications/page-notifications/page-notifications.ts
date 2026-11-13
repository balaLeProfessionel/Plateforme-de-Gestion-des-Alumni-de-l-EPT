import { afterNextRender, Component, computed, ElementRef, inject, Injector, signal } from '@angular/core';
import { NotificationService } from '../../../core/services/notifications/notifications';
import { Notification } from '../../../core/services/models/notification.model';
import { LigneNotification } from '../ligne-notification/ligne-notification';

type Filtre = 'toutes' | 'non-lues';

interface GroupeNotifications {
  libelle: string;
  notifications: Notification[];
}

const TAILLE_PAGE = 20;
const JOUR = 24 * 60 * 60 * 1000;

/** Historique complet des notifications, regroupées par période, avec un filtre « Non lues ». */
@Component({
  selector: 'app-page-notifications',
  imports: [LigneNotification],
  templateUrl: './page-notifications.html',
  styleUrl: './page-notifications.scss',
})
export class PageNotifications {
  private readonly notificationService = inject(NotificationService);
  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injecteur = inject(Injector);
  private requete = 0;

  protected readonly filtre = signal<Filtre>('toutes');
  protected readonly notifications = signal<readonly Notification[]>([]);
  protected readonly page = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly chargement = signal(true);
  protected readonly charge = signal(false);
  protected readonly erreur = signal('');
  protected readonly erreurAction = signal('');
  protected readonly nonLues = this.notificationService.nonLues;
  private readonly maintenant = signal(new Date());

  protected readonly resume = computed(() => {
    const nombre = this.nonLues();
    if (nombre === 0) return 'Vous êtes à jour.';
    return `${nombre} notification${nombre > 1 ? 's' : ''} non lue${nombre > 1 ? 's' : ''}.`;
  });

  /** La liste arrive triée de la plus récente à la plus ancienne : les groupes suivent cet ordre. */
  protected readonly groupes = computed<GroupeNotifications[]>(() => {
    const aujourdhui = debutJour(this.maintenant());
    const groupes: GroupeNotifications[] = [];
    for (const notification of this.notifications()) {
      const libelle = periode(Math.round((aujourdhui - debutJour(new Date(notification.creeLe))) / JOUR));
      const dernier = groupes.at(-1);
      if (dernier?.libelle === libelle) dernier.notifications.push(notification);
      else groupes.push({ libelle, notifications: [notification] });
    }
    return groupes;
  });

  constructor() {
    this.charger(0);
  }

  protected choisirFiltre(filtre: Filtre): void {
    if (this.filtre() === filtre) return;
    this.filtre.set(filtre);
    this.notifications.set([]);
    this.charger(0);
  }

  protected charger(page: number): void {
    const requete = ++this.requete;
    this.chargement.set(true);
    this.erreur.set('');
    this.notificationService.lister(page, TAILLE_PAGE, this.filtre() === 'non-lues').subscribe({
      next: (resultat) => {
        if (requete !== this.requete) return;
        const dejaAffichees = page === 0 ? 0 : this.notifications().length;
        this.maintenant.set(new Date());
        this.notifications.update((actuelles) =>
          page === 0 ? resultat.contenu : [...actuelles, ...resultat.contenu]);
        this.page.set(resultat.page);
        this.totalPages.set(resultat.totalPages);
        this.chargement.set(false);
        this.charge.set(true);
        if (page > 0 && resultat.contenu.length > 0) this.focaliserLigne(dejaAffichees);
      },
      error: () => {
        if (requete !== this.requete) return;
        this.erreur.set('Les notifications n’ont pas pu être chargées.');
        this.chargement.set(false);
      },
    });
  }

  /** Une notification ouverte reste affichée, même sous « Non lues », pour ne pas faire sauter la liste. */
  protected ouvrir(notification: Notification): void {
    if (notification.lue) return;
    this.notificationService.marquerLue(notification.id).subscribe({ error: () => undefined });
    this.notifications.update((liste) =>
      liste.map((element) => (element.id === notification.id ? { ...element, lue: true } : element)));
  }

  protected toutMarquerLu(): void {
    this.erreurAction.set('');
    this.notificationService.toutMarquerLu().subscribe({
      next: () => this.notifications.update((liste) => liste.map((element) => ({ ...element, lue: true }))),
      error: () => this.erreurAction.set('Les notifications n’ont pas pu être marquées comme lues.'),
    });
  }

  /** Après « Afficher plus », le focus passe à la première notification ajoutée. */
  private focaliserLigne(index: number): void {
    afterNextRender({
      write: () => this.hote.nativeElement.querySelectorAll<HTMLElement>('.element')[index]?.focus(),
    }, { injector: this.injecteur });
  }
}

function debutJour(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function periode(jours: number): string {
  if (jours <= 0) return 'Aujourd’hui';
  if (jours === 1) return 'Hier';
  if (jours < 7) return 'Cette semaine';
  return 'Plus anciennes';
}

import { Component, computed, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NotificationService } from '../../../core/services/notifications/notifications';
import { Notification } from '../../../core/services/models/notification.model';
import { LigneNotification } from '../../notifications/ligne-notification/ligne-notification';

/** Le panneau n’est qu’un aperçu : l’historique complet est sur la page « Notifications ». */
const TAILLE_APERCU = 6;

/**
 * Cloche de l’en-tête avec la pastille des non lues. Sur ordinateur, elle ouvre un aperçu
 * des dernières notifications ; sur mobile (`mode="lien"`), elle mène directement à la page.
 */
@Component({
  selector: 'app-cloche-notifications',
  imports: [RouterLink, RouterLinkActive, LigneNotification],
  templateUrl: './cloche-notifications.html',
  styleUrl: './cloche-notifications.scss',
  host: {
    '(document:click)': 'clicExterieur($event)',
    // Au document : le focus peut être sorti de la cloche quand on appuie sur Échap.
    '(document:keydown.escape)': 'fermer(true)',
  },
})
export class ClocheNotifications {
  private readonly notificationService = inject(NotificationService);
  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly bouton = viewChild<ElementRef<HTMLButtonElement>>('bouton');
  /** Deux cloches coexistent (bureau et mobile) : chacune a son propre identifiant de panneau. */
  readonly identifiant = input.required<string>();
  readonly mode = input<'panneau' | 'lien'>('panneau');

  protected readonly ouvert = signal(false);
  protected readonly notifications = signal<readonly Notification[]>([]);
  protected readonly chargement = signal(false);
  protected readonly erreur = signal('');
  protected readonly nonLues = this.notificationService.nonLues;
  protected readonly badge = computed(() => (this.nonLues() > 99 ? '99+' : String(this.nonLues())));
  protected readonly libelle = computed(() => {
    const nombre = this.nonLues();
    if (nombre === 0) return 'Notifications';
    return `Notifications, ${nombre} non lue${nombre > 1 ? 's' : ''}`;
  });

  protected basculer(): void {
    if (this.ouvert()) {
      this.fermer(false);
      return;
    }
    this.ouvert.set(true);
    this.charger();
  }

  fermer(rendreFocus: boolean): void {
    if (!this.ouvert()) return;
    this.ouvert.set(false);
    if (rendreFocus) this.bouton()?.nativeElement.focus();
  }

  clicExterieur(evenement: MouseEvent): void {
    const cible = evenement.target;
    if (cible instanceof Node && !this.hote.nativeElement.contains(cible)) this.fermer(false);
  }

  protected charger(): void {
    this.chargement.set(true);
    this.erreur.set('');
    this.notificationService.lister(0, TAILLE_APERCU).subscribe({
      next: (resultat) => {
        this.notifications.set(resultat.contenu);
        this.chargement.set(false);
      },
      error: () => {
        this.erreur.set('Les notifications n’ont pas pu être chargées.');
        this.chargement.set(false);
      },
    });
  }

  /** Ouvrir une notification la marque lue ; un lien mène ensuite à la page concernée. */
  protected ouvrir(notification: Notification): void {
    if (!notification.lue) {
      this.notificationService.marquerLue(notification.id).subscribe({ error: () => undefined });
      this.notifications.update((liste) =>
        liste.map((element) => (element.id === notification.id ? { ...element, lue: true } : element)));
    }
    if (notification.lien) this.ouvert.set(false);
  }

  protected toutMarquerLu(): void {
    this.notificationService.toutMarquerLu().subscribe({
      next: () => this.notifications.update((liste) => liste.map((element) => ({ ...element, lue: true }))),
      error: () => this.erreur.set('Les notifications n’ont pas pu être marquées comme lues.'),
    });
  }
}

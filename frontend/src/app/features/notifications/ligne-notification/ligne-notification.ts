import { booleanAttribute, Component, computed, inject, input, LOCALE_ID, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Notification, TypeNotification } from '../../../core/services/models/notification.model';
import { dateRelative } from '../../../shared/dates/date-relative';

const ICONES: Record<TypeNotification, string> = {
  MENTORAT: 'pi-sitemap',
  EVENEMENT: 'pi-calendar',
  COMPTE: 'pi-user',
};

/**
 * Une notification : lien vers la page concernée, ou simple bouton quand elle n’en a pas.
 * Titre et date sur la même ligne, message court en dessous ; une non lue porte un point.
 */
@Component({
  selector: 'app-ligne-notification',
  imports: [RouterLink, NgTemplateOutlet],
  templateUrl: './ligne-notification.html',
  styleUrl: './ligne-notification.scss',
  host: { '[class.non-lue]': '!notification().lue' },
})
export class LigneNotification {
  private readonly locale = inject(LOCALE_ID);
  readonly notification = input.required<Notification>();
  /** Panneau de la cloche : message sur une ligne ; page : sur deux. */
  readonly compacte = input(false, { transform: booleanAttribute });
  readonly ouverte = output<Notification>();

  protected readonly icone = computed(() => `pi ${ICONES[this.notification().type]}`);
  protected readonly typeCss = computed(() => this.notification().type.toLowerCase());
  /** « 10 h », « hier », « 12 oct. » : la forme courte tient à côté du titre. */
  protected readonly quand = computed(() =>
    dateRelative(this.notification().creeLe, new Date(), this.locale).replace(/^il y a /, ''));
}

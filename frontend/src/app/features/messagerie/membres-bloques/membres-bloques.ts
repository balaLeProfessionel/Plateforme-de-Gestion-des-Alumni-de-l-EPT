import { DatePipe } from '@angular/common';
import { afterNextRender, Component, effect, ElementRef, inject, Injector, input, output, signal, viewChild } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MessagerieService } from '../../../core/services/messagerie/messagerie';
import { MembreBloque } from '../../../core/services/models/messagerie.model';
import { AvatarMembre } from '../../../shared/images/avatar-membre';
import { SqueletteLignes } from '../squelettes';
import { EtatConversations } from '../etat-conversations';
import { messageServeur } from '../message-erreur';

/**
 * Fenêtre « Membres bloqués » : la liste des personnes que j’ai bloquées, avec « Débloquer » pour chacune.
 * Débloquer se défait en bloquant de nouveau : pas de confirmation.
 */
@Component({
  selector: 'app-membres-bloques',
  imports: [AvatarMembre, DatePipe, SqueletteLignes],
  templateUrl: './membres-bloques.html',
  styleUrl: './membres-bloques.scss',
})
export class MembresBloques {
  private readonly messagerie = inject(MessagerieService);
  private readonly etat = inject(EtatConversations);
  private readonly injector = inject(Injector);
  private readonly dialogue = viewChild.required<ElementRef<HTMLDialogElement>>('dialogue');
  readonly ouverte = input(false);
  readonly fermee = output<void>();

  protected readonly membres = signal<MembreBloque[]>([]);
  protected readonly chargement = signal(false);
  protected readonly erreurChargement = signal<string | null>(null);
  protected readonly enCours = signal<string | null>(null);
  protected readonly erreur = signal<string | null>(null);
  protected readonly confirmation = signal<string | null>(null);

  constructor() {
    effect(() => {
      const dialogue = this.dialogue().nativeElement;
      if (this.ouverte()) {
        if (!dialogue.open) {
          dialogue.showModal();
          void this.charger();
        }
      } else if (dialogue.open) {
        dialogue.close();
      }
    });
  }

  protected async charger(): Promise<void> {
    this.chargement.set(true);
    this.erreurChargement.set(null);
    this.erreur.set(null);
    this.confirmation.set(null);
    try {
      this.membres.set(await firstValueFrom(this.messagerie.listerBlocages()));
    } catch {
      this.erreurChargement.set('Impossible de charger les membres bloqués. Réessayez.');
    } finally {
      this.chargement.set(false);
    }
  }

  protected async debloquer(membre: MembreBloque): Promise<void> {
    const indice = this.membres().indexOf(membre);
    this.enCours.set(membre.id);
    this.erreur.set(null);
    this.confirmation.set(null);
    try {
      await firstValueFrom(this.messagerie.debloquer(membre.id), { defaultValue: undefined });
      this.membres.update((liste) => liste.filter((autre) => autre.id !== membre.id));
      this.confirmation.set(`Vous avez débloqué ${membre.nomAffiche} : vous pouvez de nouveau vous écrire.`);
      this.etat.actualiser();
      this.focaliserApres(indice);
    } catch (erreur) {
      this.erreur.set(messageServeur(erreur, 'Le déblocage a échoué. Réessayez.'));
    } finally {
      this.enCours.set(null);
    }
  }

  /** La ligne débloquée disparaît : le focus va au membre suivant, sinon au précédent, sinon au titre. */
  private focaliserApres(indice: number): void {
    afterNextRender(() => {
      const dialogue = this.dialogue().nativeElement;
      const boutons = dialogue.querySelectorAll<HTMLElement>('.membres button');
      const cible = boutons[Math.min(indice, boutons.length - 1)] ?? dialogue.querySelector<HTMLElement>('#titre-bloques');
      cible?.focus();
    }, { injector: this.injector });
  }
}

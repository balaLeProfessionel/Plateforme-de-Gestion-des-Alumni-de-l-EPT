import { DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { Message } from '../../../core/services/models/messagerie.model';
import { TEXTE_DEPART, texteSysteme } from '../apercu';

/** Message du système dans le fil (« Awa Diop a rejoint la communauté. », « … a quitté … ») : une pastille centrée, sans bulle. */
@Component({
  selector: 'app-message-systeme',
  imports: [DatePipe],
  template: `
    <p>
      <i class="pi" [class]="depart() ? 'pi-user-minus' : 'pi-user-plus'" aria-hidden="true"></i>
      <span>{{ texte() }}</span>
      <time [attr.datetime]="message().envoyeLe">{{ message().envoyeLe | date: 'HH:mm' }}</time>
    </p>
  `,
  styles: `
    :host { display: flex; justify-content: center; margin: 0.5rem 0; }
    p {
      display: inline-flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 0.2rem 0.4rem;
      max-width: 90%;
      margin: 0;
      padding: 0.3rem 0.8rem;
      border-radius: 999px;
      background: var(--ept-surface);
      color: var(--ept-text-secondary);
      font-size: 0.8rem;
      text-align: center;
    }
    i { color: var(--ept-primary); font-size: 0.8rem; }
    time { font-size: 0.72rem; }
  `,
})
export class MessageSysteme {
  readonly message = input.required<Message>();

  protected readonly depart = computed(() => this.message().contenu === TEXTE_DEPART);
  protected readonly texte = computed(() => {
    const message = this.message();
    return texteSysteme(message.contenu, message.auteurNom, message.deMoi);
  });
}

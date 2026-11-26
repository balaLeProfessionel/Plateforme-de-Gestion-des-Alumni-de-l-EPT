import { afterNextRender, Component, DestroyRef, ElementRef, inject, input, output, viewChild } from '@angular/core';
import { FORMAT_PUBLICATION } from '../../images/recadrage';
import { RecadreurImage } from '../../images/recadreur-image';

/**
 * Fenêtre de recadrage d'une image de publication (format vertical 4:5). Elle s'ouvre en modale
 * dès son affichage et se ferme quand le parent la retire.
 */
@Component({
  selector: 'app-dialogue-recadrage-publication',
  imports: [RecadreurImage],
  templateUrl: './dialogue-recadrage-publication.html',
  styleUrl: './dialogue-recadrage-publication.scss'
})
export class DialogueRecadragePublication {
  readonly image = input.required<HTMLImageElement>();
  readonly recadree = output<File>();
  readonly annulee = output<void>();

  protected readonly formatPublication = FORMAT_PUBLICATION;
  private readonly dialogue = viewChild.required<ElementRef<HTMLDialogElement>>('dialogue');

  constructor() {
    afterNextRender(() => {
      const dialogue = this.dialogue().nativeElement;
      if (!dialogue.open) dialogue.showModal();
    });
    inject(DestroyRef).onDestroy(() => {
      const dialogue = this.dialogue().nativeElement;
      if (dialogue.open) dialogue.close();
    });
  }
}

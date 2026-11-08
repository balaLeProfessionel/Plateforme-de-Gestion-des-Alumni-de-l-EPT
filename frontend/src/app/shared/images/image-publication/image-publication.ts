import { HttpClient } from '@angular/common/http';
import { Component, effect, inject, input, signal } from '@angular/core';

@Component({
  selector: 'app-image-publication',
  template: `@if (source()) { <img [src]="source()" [alt]="description()" loading="lazy" /> }
    @else if (erreur()) { <p>Image indisponible</p> }`,
  styles: `:host { display: block; width: 100%; height: 100%; overflow: hidden; border-radius: var(--ept-radius-sm); background: var(--ept-bg); }
    img { display: block; width: 100%; height: 100%; object-fit: contain; }
    p { padding: 1rem; }`,
})
export class ImagePublication {
  readonly url = input.required<string>();
  /** Texte alternatif ; l’appelant fournit un repli quand l’auteur n’a pas décrit son image. */
  readonly description = input('Image jointe à la publication');
  protected readonly source = signal('');
  protected readonly erreur = signal(false);
  private readonly http = inject(HttpClient);

  constructor() {
    effect((onCleanup) => {
      const url = this.url();
      this.source.set('');
      this.erreur.set(false);
      if (!/^\/api\/(publications\/[0-9a-f-]{36}\/image|articles\/[0-9a-f-]{36}\/couverture)$/i.test(url)) {
        this.source.set(url);
        return;
      }
      let objectUrl = '';
      const abonnement = this.http.get(url, { responseType: 'blob' }).subscribe({
        next: (image) => { objectUrl = URL.createObjectURL(image); this.source.set(objectUrl); },
        error: () => this.erreur.set(true),
      });
      onCleanup(() => { abonnement.unsubscribe(); if (objectUrl) URL.revokeObjectURL(objectUrl); });
    });
  }
}

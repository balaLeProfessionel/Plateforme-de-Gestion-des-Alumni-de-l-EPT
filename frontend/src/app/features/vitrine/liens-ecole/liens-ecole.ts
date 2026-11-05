import { booleanAttribute, Component, input } from '@angular/core';
import { LIENS_ECOLE } from '../contenu-vitrine';

/** Réseaux sociaux et e-mail de l'école, en icônes. */
@Component({
  selector: 'app-liens-ecole',
  templateUrl: './liens-ecole.html',
  styleUrl: './liens-ecole.scss',
  host: { '[class.sombre]': 'sombre()' },
})
export class LiensEcole {
  readonly sombre = input(false, { transform: booleanAttribute });

  protected readonly liens = LIENS_ECOLE.map((lien) => {
    const courriel = lien.url.startsWith('mailto:');
    return {
      ...lien,
      externe: !courriel,
      libelle: courriel ? `Écrire à l’EPT (${lien.url.slice('mailto:'.length)})` : `${lien.nom} de l’EPT (nouvel onglet)`
    };
  });
}

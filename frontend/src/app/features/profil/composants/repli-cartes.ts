import { DOCUMENT } from '@angular/common';
import { afterNextRender, effect, inject, Injector, Signal, untracked, WritableSignal } from '@angular/core';
import { EtatCartes } from './etat-carte.model';

/**
 * Cartes repliées (« Modifier mon profil ») : une seule carte ouverte à la fois, refermée dès
 * qu'elle est enregistrée. Le focus suit : premier champ à l'ouverture, bouton « Modifier » à la fermeture.
 * À appeler dans le constructeur d'une liste ; `premierChamp` est le suffixe de l'id du premier champ.
 */
export function repliCartes(ouverte: WritableSignal<string | null>, etat: Signal<EtatCartes>, premierChamp: string) {
  const injector = inject(Injector);
  const document = inject(DOCUMENT);
  let dernierEtat = untracked(etat);

  const focaliser = (id: string) =>
    afterNextRender({ read: () => document.getElementById(id)?.focus() }, { injector });

  const fermer = (cle: string) => {
    ouverte.set(null);
    focaliser(`modifier-${cle}`);
  };

  // Seul un nouvel état (réponse du serveur) referme la carte : rouvrir une carte déjà enregistrée la laisse ouverte.
  effect(() => {
    const courant = etat();
    if (courant === dernierEtat) return;
    dernierEtat = courant;
    const cle = untracked(ouverte);
    if (cle && courant.messages[cle]?.type === 'succes') untracked(() => fermer(cle));
  });

  return {
    ouvrir: (cle: string) => {
      ouverte.set(cle);
      focaliser(`${cle}-${premierChamp}`);
    },
    fermer
  };
}

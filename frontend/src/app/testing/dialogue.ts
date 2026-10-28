/**
 * Simule `<dialog>` (absent de l’environnement de test) pour toutes les specs, à l’identique :
 * `showModal()` ouvre, `close()` ferme puis émet `close` comme le navigateur.
 * Toujours assignée (pas de `??=`) : sinon la première spec exécutée imposerait sa version aux
 * autres, et les tests qui attendent l’événement `close` échoueraient selon l’ordre d’exécution.
 */
export function simulerDialogue(): void {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    if (!this.open) return;
    this.open = false;
    this.dispatchEvent(new Event('close'));
  };
}

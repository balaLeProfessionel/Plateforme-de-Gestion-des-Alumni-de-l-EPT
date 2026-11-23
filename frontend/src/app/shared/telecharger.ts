/** Propose au navigateur d’enregistrer un fichier reçu par HttpClient, sous le nom donné. */
export function enregistrerFichier(document: Document, contenu: Blob, nom: string): void {
  const url = URL.createObjectURL(contenu);
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = nom;
  lien.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

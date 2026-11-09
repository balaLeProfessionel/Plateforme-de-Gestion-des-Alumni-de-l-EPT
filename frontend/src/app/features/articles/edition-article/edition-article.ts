import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  afterNextRender, Component, computed, DestroyRef, ElementRef, inject, Injector, OnDestroy, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormField, form, maxLength, required, validate } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonDirective, ButtonIcon, ButtonLabel } from 'primeng/button';
import { Message } from 'primeng/message';
import { Skeleton } from 'primeng/skeleton';
import { debounceTime, filter, firstValueFrom } from 'rxjs';
import { RetourNavigation } from '../../../core/navigation/retour-navigation';
import { Article, ArticleService, DemandeArticle, LIMITES_ARTICLE, ThemeArticle } from '../../../core/services/articles/article';
import { AudiencePublication } from '../../../core/services/publications/publication';
import { ContenuArticle } from '../../../shared/articles/contenu-article';
import { focaliserPremiereErreur } from '../../../shared/formulaires/focus-premiere-erreur';
import { CouvertureArticle } from './couverture-article';
import { DialoguePublication } from './dialogue-publication';
import { appliquerMiseEnForme, OutilMiseEnForme } from './mise-en-forme';

interface Modele {
  titre: string;
  resume: string;
  contenu: string;
}

type EtatSauvegarde = 'vierge' | 'modifie' | 'enCours' | 'enregistre' | 'erreur';

/** Pause de frappe après laquelle un brouillon s’enregistre tout seul. */
const DELAI_ENREGISTREMENT_MS = 1500;

const OUTILS: readonly { outil: OutilMiseEnForme; libelle: string; icone?: string; texte?: string }[] = [
  { outil: 'intertitre', libelle: 'Intertitre', texte: 'H' },
  { outil: 'gras', libelle: 'Gras', texte: 'B' },
  { outil: 'italique', libelle: 'Italique', texte: 'I' },
  { outil: 'liste', libelle: 'Liste à puces', icone: 'pi-list' },
  { outil: 'lien', libelle: 'Lien', icone: 'pi-link' },
];

/**
 * Rédaction d’un article sur une page blanche : titre, résumé et texte, enregistrés automatiquement en brouillon privé.
 * Le thème et le public se choisissent au moment de publier ; la mise en ligne est immédiate, sans relecture.
 */
@Component({
  selector: 'app-edition-article',
  imports: [FormField, ButtonDirective, ButtonIcon, ButtonLabel, Message, Skeleton, ContenuArticle, CouvertureArticle, DialoguePublication],
  templateUrl: './edition-article.html',
  styleUrl: './edition-article.scss',
})
export class EditionArticle implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly retour = inject(RetourNavigation);
  private readonly service = inject(ArticleService);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly champContenu = viewChild<ElementRef<HTMLTextAreaElement>>('champContenu');

  protected readonly outils = OUTILS;
  protected readonly limites = LIMITES_ARTICLE;
  protected readonly article = signal<Article | null>(null);
  protected readonly chargement = signal(!!this.route.snapshot.paramMap.get('id'));
  protected readonly echecChargement = signal<string | null>(null);
  protected readonly publie = computed(() => this.article()?.statut === 'PUBLIE');
  protected readonly apercu = signal(false);

  protected readonly theme = signal<ThemeArticle>('PARCOURS');
  protected readonly audience = signal<AudiencePublication>('TOUS');
  protected readonly dialogueOuvert = signal(false);
  protected readonly erreurPublication = signal<string | null>(null);
  protected readonly publicationEnCours = signal(false);

  protected readonly etat = signal<EtatSauvegarde>('vierge');
  protected readonly libelleEtat = computed(() => {
    switch (this.etat()) {
      case 'enCours': return 'Enregistrement…';
      case 'enregistre': return this.publie() ? 'Publié' : 'Brouillon enregistré';
      case 'erreur': return 'Enregistrement impossible';
      case 'modifie': return this.publie() ? 'Modifications non enregistrées' : 'Brouillon non enregistré';
      default: return this.publie() ? 'Publié' : 'Brouillon privé';
    }
  });
  protected readonly messageErreur = signal<string | null>(null);

  private readonly fichierCouverture = signal<File | null>(null);
  private readonly suppressionCouverture = signal(false);
  private urlLocale: string | null = null;
  private readonly apercuLocal = signal<string | null>(null);
  protected readonly apercuCouverture = computed(() => this.apercuLocal()
    ?? (this.suppressionCouverture() ? null : this.article()?.urlCouverture ?? null));

  /** Le résumé et le texte ne sont exigés que pour publier, ou pour garder complet un article publié. */
  private readonly exigerCompletude = signal(false);
  protected readonly modele = signal<Modele>({ titre: '', resume: '', contenu: '' });
  protected readonly formulaire = form(this.modele, (champ) => {
    required(champ.titre, { message: 'Donnez un titre à votre article.' });
    maxLength(champ.titre, LIMITES_ARTICLE.titre, { message: `Le titre ne peut pas dépasser ${LIMITES_ARTICLE.titre} caractères.` });
    maxLength(champ.resume, LIMITES_ARTICLE.resume, { message: `Le résumé ne peut pas dépasser ${LIMITES_ARTICLE.resume} caractères.` });
    maxLength(champ.contenu, LIMITES_ARTICLE.contenu, { message: 'L’article est trop long (40 000 caractères au plus).' });
    validate(champ.resume, ({ value }) => this.exigerCompletude() && !value().trim()
      ? { kind: 'resume-requis', message: 'Ajoutez un résumé : il s’affiche dans le fil et la bibliothèque.' } : undefined);
    validate(champ.contenu, ({ value }) => this.exigerCompletude() && !value().trim()
      ? { kind: 'contenu-requis', message: 'Écrivez le texte de l’article avant de le publier.' } : undefined);
  });
  /** Le compteur n’apparaît qu’à l’approche de la limite. */
  protected readonly resteResume = computed(() => LIMITES_ARTICLE.resume - this.modele().resume.length);

  /** Incrémenté à chaque changement à enregistrer (texte, réglages, couverture). */
  private readonly version = signal(0);
  private versionEnregistree = 0;
  private enregistrement: Promise<void> | null = null;

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.charger(id);
    toObservable(this.version).pipe(
      filter((version) => version > this.versionEnregistree),
      debounceTime(DELAI_ENREGISTREMENT_MS),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => { if (!this.publie()) void this.enregistrerBrouillon(); });
  }

  ngOnDestroy(): void {
    this.libererApercu();
  }

  private charger(id: string): void {
    this.service.obtenir(id).subscribe({
      next: (article) => {
        if (!article.estAuteur) this.echecChargement.set('Seul l’auteur d’un article peut le modifier.');
        else this.remplir(article);
        this.chargement.set(false);
      },
      error: (erreur: HttpErrorResponse) => {
        this.echecChargement.set(erreur.status === 404 ? 'Cet article n’est pas disponible.' : 'Impossible de charger l’article.');
        this.chargement.set(false);
      },
    });
  }

  private remplir(article: Article): void {
    this.article.set(article);
    this.exigerCompletude.set(article.statut === 'PUBLIE');
    this.modele.set({ titre: article.titre, resume: article.resume ?? '', contenu: article.contenu });
    this.theme.set(article.theme);
    this.audience.set(article.audience);
    this.etat.set('enregistre');
  }

  /** Toute saisie marque l’article comme modifié et relance le compte à rebours de l’enregistrement. */
  protected modifie(): void {
    this.etat.set('modifie');
    this.version.update((v) => v + 1);
  }

  protected couvertureChoisie(fichier: File): void {
    this.libererApercu();
    this.urlLocale = URL.createObjectURL(fichier);
    this.apercuLocal.set(this.urlLocale);
    this.fichierCouverture.set(fichier);
    this.suppressionCouverture.set(false);
    this.modifie();
  }

  protected couvertureRetiree(): void {
    this.libererApercu();
    this.fichierCouverture.set(null);
    this.suppressionCouverture.set(!!this.article()?.urlCouverture);
    this.modifie();
  }

  /** Entrée dans le titre passe au résumé : un titre tient sur une ligne. */
  protected passerAuResume(event: Event, resume: HTMLTextAreaElement): void {
    event.preventDefault();
    resume.focus();
  }

  protected appliquer(outil: OutilMiseEnForme): void {
    const champ = this.champContenu()?.nativeElement;
    if (!champ) return;
    const resultat = appliquerMiseEnForme({ texte: this.modele().contenu, debut: champ.selectionStart, fin: champ.selectionEnd }, outil);
    this.modele.update((m) => ({ ...m, contenu: resultat.texte }));
    this.modifie();
    afterNextRender(() => {
      champ.focus();
      champ.setSelectionRange(resultat.debut, resultat.fin);
    }, { injector: this.injector });
  }

  /** Vérifie que l’article est complet, puis ouvre la fenêtre du thème et du public. */
  protected preparerPublication(): void {
    this.exigerCompletude.set(true);
    this.formulaire.titre().markAsTouched();
    this.formulaire.resume().markAsTouched();
    this.formulaire.contenu().markAsTouched();
    if (this.formulaire().invalid()) {
      // Les erreurs restent affichées jusqu’à ce que l’auteur complète les champs.
      this.apercu.set(false);
      focaliserPremiereErreur(this.hote.nativeElement, this.injector);
      return;
    }
    this.erreurPublication.set(null);
    this.dialogueOuvert.set(true);
  }

  protected async publier(): Promise<void> {
    if (this.publicationEnCours()) return;
    this.publicationEnCours.set(true);
    this.erreurPublication.set(null);
    try {
      await this.enregistrement;
      let article = await this.sauvegarder();
      if (article.statut === 'BROUILLON') article = await firstValueFrom(this.service.publier(article.id));
      // Plus rien à enregistrer automatiquement : l’article est en ligne.
      this.versionEnregistree = this.version();
      this.article.set(article);
      this.dialogueOuvert.set(false);
      await this.router.navigate(['/articles', article.id], { replaceUrl: true });
    } catch (erreur) {
      this.erreurPublication.set(this.message(erreur));
    } finally {
      this.publicationEnCours.set(false);
    }
  }

  protected fermerDialogue(): void {
    this.dialogueOuvert.set(false);
    if (!this.publie()) this.exigerCompletude.set(false);
  }

  /** ✕ : un brouillon en attente est enregistré avant de quitter. */
  protected async fermer(): Promise<void> {
    if (!this.publie() && this.etat() === 'modifie' && this.modele().titre.trim()) await this.enregistrerBrouillon();
    const article = this.article();
    this.retour.retourner(article?.statut === 'PUBLIE' ? `/articles/${article.id}` : '/articles?vue=mes');
  }

  private async enregistrerBrouillon(): Promise<void> {
    if (!this.modele().titre.trim() || this.formulaire.titre().invalid()) return;
    if (this.enregistrement) { await this.enregistrement; if (this.versionEnregistree >= this.version()) return; }
    const version = this.version();
    this.etat.set('enCours');
    this.enregistrement = this.sauvegarder().then((article) => {
      this.article.set(article);
      this.versionEnregistree = version;
      this.etat.set(this.version() > version ? 'modifie' : 'enregistre');
      this.messageErreur.set(null);
    }).catch((erreur: unknown) => {
      this.etat.set('erreur');
      this.messageErreur.set(this.message(erreur));
    }).finally(() => { this.enregistrement = null; });
    await this.enregistrement;
  }

  private async sauvegarder(): Promise<Article> {
    const demande = this.demande();
    const existant = this.article();
    if (!existant) {
      const cree = await firstValueFrom(this.service.creer(demande, this.fichierCouverture() ?? undefined));
      this.fichierCouverture.set(null);
      // Les enregistrements suivants modifient ce brouillon ; l’URL permet de le rouvrir sans recharger l’éditeur.
      this.location.replaceState(`/articles/${cree.id}/modifier`);
      return cree;
    }
    let article = await firstValueFrom(this.service.modifier(existant.id, demande));
    if (this.fichierCouverture()) {
      article = await firstValueFrom(this.service.changerCouverture(existant.id, this.fichierCouverture()!));
    } else if (this.suppressionCouverture()) {
      article = await firstValueFrom(this.service.retirerCouverture(existant.id));
    }
    this.fichierCouverture.set(null);
    this.suppressionCouverture.set(false);
    return article;
  }

  private demande(): DemandeArticle {
    const m = this.modele();
    return { titre: m.titre.trim(), resume: m.resume.trim() || null, contenu: m.contenu.trim(),
      theme: this.theme(), audience: this.audience() };
  }

  private message(erreur: unknown): string {
    return erreur instanceof HttpErrorResponse && erreur.error?.message
      ? erreur.error.message : 'L’enregistrement a échoué. Vérifiez votre connexion et réessayez.';
  }

  private libererApercu(): void {
    if (this.urlLocale) URL.revokeObjectURL(this.urlLocale);
    this.urlLocale = null;
    this.apercuLocal.set(null);
  }
}

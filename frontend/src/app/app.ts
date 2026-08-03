import { Component, signal } from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { RouterOutlet } from "@angular/router";
// import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('Alumni EPT');
}

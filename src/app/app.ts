import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {SaveCardComponent} from './components/save-card/save-card.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SaveCardComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('integrate-tap-payment');
}

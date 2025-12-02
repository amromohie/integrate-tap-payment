import { Routes } from '@angular/router';
import { SaveCardComponent } from './components/save-card/save-card.component';

export const routes: Routes = [
  {
    path: 'save-card',
    component: SaveCardComponent
  },
  {
    path: '',
    redirectTo: '/save-card',
    pathMatch: 'full'
  }
];

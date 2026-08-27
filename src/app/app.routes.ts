import { Routes } from '@angular/router';
import { ShowroomComponent } from './components/showroom/showroom.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '3d-showroom',
    pathMatch: 'full',
  },
  {
    path: '3d-showroom',
    component: ShowroomComponent,
    title: 'WebMCP Showroom - 3D Digital Twin',
  },
  {
    path: 'enterprise-bi',
    loadComponent: () =>
      import('./components/enterprise-bi/enterprise-bi.component').then(
        (m) => m.EnterpriseBiComponent
      ),
    title: 'WebMCP Enterprise BI - Data Intelligence',
  },
  {
    path: 'judge-guide',
    loadComponent: () =>
      import('./components/judge-guide/judge-guide.component').then(
        (m) => m.JudgeGuideComponent
      ),
    title: 'WebMCP - Judge & Contest Guide',
  },
  {
    path: '**',
    redirectTo: '3d-showroom',
  },
];


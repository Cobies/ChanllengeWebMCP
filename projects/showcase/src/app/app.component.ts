import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  WebMcpService,
  WebmcpViewportCaptureService,
  WebmcpThreeSceneBridge,
  WebmcpFormRunnerService,
} from '@webmcp/angular';
import { HeaderComponent } from './components/header/header.component';
import { Visualizer3dComponent } from './components/visualizer-3d/visualizer-3d.component';
import { CustomizerFormComponent } from './components/customizer-form/customizer-form.component';
import { InspectorComponent } from './components/inspector/inspector.component';
import { JudgeGuideComponent } from './components/judge-guide/judge-guide.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    Visualizer3dComponent,
    CustomizerFormComponent,
    InspectorComponent,
    JudgeGuideComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: [],
})
export class AppComponent {
  readonly webmcp = inject(WebMcpService);
  // Inject services to trigger automatic tool registration
  readonly viewportCapture = inject(WebmcpViewportCaptureService);
  readonly sceneBridge = inject(WebmcpThreeSceneBridge);
  readonly formRunner = inject(WebmcpFormRunnerService);
}

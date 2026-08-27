import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { WebMcpService } from '@webmcp/angular';
import { HeaderComponent } from './components/header/header.component';
import { CopilotChatComponent } from './components/copilot-chat/copilot-chat.component';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    CopilotChatComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly webmcp = inject(WebMcpService);
}


import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'ngx-document-editor',
  imports: [RouterOutlet],
  template: ` <router-outlet></router-outlet> `,
})
export class App {}

// 👇 **IMPORTANT FOR DYMANIC LOADING**
export default App;

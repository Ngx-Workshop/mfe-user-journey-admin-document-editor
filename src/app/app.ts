import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'ngx-document-editor',
  imports: [RouterOutlet],
  template: `
    <h1>Welcome to ngx-seed-mfe!</h1>
    <router-outlet></router-outlet>
    <h3>Happy coding 🚀</h3>
  `,
})
export class App {}

// 👇 **IMPORTANT FOR DYMANIC LOADING**
export default App;

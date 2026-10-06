import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'optimizeCloudinaryUrl' })
export class OptimizeCloudinaryUrlPipe implements PipeTransform {
  transform(url: string): string {
    if (!/^https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//.test(url)) {
      return url;
    }
    const parts = url.split('/upload/');
    return `${parts[0]}/upload/w_650,q_auto:best,f_auto/${parts[1]}`;
  }
}

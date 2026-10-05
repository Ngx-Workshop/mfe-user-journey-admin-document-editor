import { Injectable, inject } from '@angular/core';
import { ASSET_DATA_SOURCE, AssetFolder } from '@tmdjr/ngx-asset-manager';
import { map } from 'rxjs';

export class DocumentsAssetFolderNotFoundError extends Error {
  constructor() {
    super('The documents asset folder is unavailable. Create it in Asset Manager, then retry.');
  }
}

/** The admin shell supplies the authenticated uploader adapter. */
@Injectable({ providedIn: 'root' })
export class DocumentAssetsService {
  private readonly source = inject(ASSET_DATA_SOURCE);

  findDocumentsFolder() {
    return this.source.listFolders().pipe(
      map((folders): AssetFolder => {
        const folder = folders.find(item => item.name.trim().toLowerCase() === 'documents');
        if (!folder) throw new DocumentsAssetFolderNotFoundError();
        return folder;
      }),
    );
  }
}

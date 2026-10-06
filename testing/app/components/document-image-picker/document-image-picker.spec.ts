import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Asset, provideAssetManager } from '@tmdjr/ngx-asset-manager';
import { DocumentImagePickerButtonComponent } from '../../../../src/app/components/document-image-picker/document-image-picker-button.component';
import { DocumentImagePickerDialogComponent } from '../../../../src/app/components/document-image-picker/document-image-picker-dialog.component';

describe('Document image picker dialog', () => {
  let fixture: ComponentFixture<DocumentImagePickerButtonComponent>;
  let http: HttpTestingController;
  let dialogs: MatDialog;
  let selected: string[];
  const folder = { _id: 'documents-id', name: 'Documents', version: 0, createdAt: '', updatedAt: '' };
  const asset: Asset = {
    _id: 'image-id',
    folderId: folder._id,
    name: 'photo.png',
    storageUrl: '/photo.png',
    mediaType: 'image/png',
    storageStatus: 'READY',
    tags: [],
    archived: false,
    version: 0,
    createdAt: '',
    updatedAt: '',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAssetManager(),
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    dialogs = TestBed.inject(MatDialog);
    fixture = TestBed.createComponent(DocumentImagePickerButtonComponent);
    fixture.componentRef.setInput('label', 'Choose thumbnail image');
    selected = [];
    fixture.componentInstance.imageSelected.subscribe((url) => selected.push(url));
    await fixture.whenStable();
  });

  afterEach(async () => {
    dialogs.closeAll();
    await fixture.whenStable();
    http.verify();
  });

  function trigger(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button');
  }

  function open(): MatDialogRef<DocumentImagePickerDialogComponent, string> {
    trigger().focus();
    trigger().click();
    return dialogs.openDialogs[0];
  }

  async function resolveFolder(assets: Asset[] = [asset]): Promise<void> {
    const request = http.expectOne('/api/uploader/folders');
    expect(request.request.withCredentials).toBeTrue();
    request.flush([folder]);
    await fixture.whenStable();
    http.expectOne('/api/uploader/folders').flush([folder]);
    const gallery = http.expectOne((r) => r.url === '/api/uploader');
    expect(gallery.request.params.get('folderId')).toBe(folder._id);
    expect(gallery.request.params.get('archived')).toBe('false');
    expect(gallery.request.params.has('root')).toBeFalse();
    expect(gallery.request.withCredentials).toBeTrue();
    gallery.flush(assets);
    await fixture.whenStable();
  }

  it('defers requests until the labelled action opens one full, folder-scoped dialog', async () => {
    http.expectNone('/api/uploader/folders');
    expect(trigger().getAttribute('aria-label')).toBe('Choose thumbnail image');
    expect(trigger().type).toBe('button');
    open();
    fixture.componentInstance.open();
    expect(dialogs.openDialogs.length).toBe(1);
    await resolveFolder();
    expect(document.querySelector('mat-dialog-container ngx-asset-manager')).not.toBeNull();
    expect(document.querySelector('mat-dialog-container h2')?.textContent).toBe('Choose a document image');
    expect(document.querySelector('mat-dialog-container')?.getAttribute('role')).toBe('dialog');
    expect(document.querySelector('mat-dialog-container')?.getAttribute('aria-modal')).toBe('true');
    const pane = document.querySelector('.cdk-overlay-pane') as HTMLElement;
    expect(pane.getBoundingClientRect().width).toBeLessThanOrEqual(window.innerWidth - 32);
  });

  it('returns a usable gallery URL only after close and restores trigger focus', async () => {
    const ref = open();
    await resolveFolder();
    let beforeClose: string | undefined;
    ref.beforeClosed().subscribe((url) => beforeClose = url);
    (document.querySelector('button[aria-label="Select photo.png"]') as HTMLButtonElement).click();
    expect(beforeClose).toBe('/photo.png');
    expect(selected).toEqual([]);
    await fixture.whenStable();
    expect(selected).toEqual(['/photo.png']);
    expect(dialogs.openDialogs.length).toBe(0);
    expect(document.activeElement).toBe(trigger());
  });

  for (const method of ['cancel', 'escape', 'backdrop'] as const) {
    it(`returns no result on ${method} and can reopen`, async () => {
      open();
      await resolveFolder();
      if (method === 'cancel') {
        (document.querySelector('mat-dialog-actions button') as HTMLButtonElement).click();
      } else if (method === 'escape') {
        (document.querySelector('mat-dialog-container') as HTMLElement).dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true })
        );
      } else {
        (document.querySelector('.cdk-overlay-backdrop') as HTMLElement).click();
      }
      await fixture.whenStable();
      expect(dialogs.openDialogs.length).toBe(0);
      expect(selected).toEqual([]);
      expect(document.activeElement).toBe(trigger());
      open();
      http.expectOne('/api/uploader/folders').flush([]);
      await fixture.whenStable();
      expect(dialogs.openDialogs.length).toBe(1);
    });
  }

  it('shows missing-folder recovery without a root fallback', async () => {
    const ref = open();
    http.expectOne('/api/uploader/folders').flush([]);
    await fixture.whenStable();
    expect(ref.componentInstance.error()).toContain('documents asset folder');
    expect(document.querySelector('ngx-asset-manager')).toBeNull();
    http.expectNone((r) => r.url === '/api/uploader');
    const retry = Array.from(document.querySelectorAll('mat-dialog-content button'))
      .find((button) => button.textContent?.includes('Retry loading images')) as HTMLButtonElement;
    retry.click();
    await resolveFolder();
    expect(ref.componentInstance.error()).toBe('');
  });

  it('shows permission errors in the dialog and permits retry', async () => {
    const ref = open();
    http.expectOne('/api/uploader/folders').flush({}, { status: 403, statusText: 'Forbidden' });
    await fixture.whenStable();
    expect(ref.componentInstance.error()).toContain('permission');
    expect(ref.componentInstance.loading()).toBeFalse();
    ref.componentInstance.loadFolder();
    await resolveFolder();
    expect(ref.componentInstance.error()).toBe('');
  });

  it('keeps the modal open for unusable URLs and allows another image selection', async () => {
    const ref = open();
    await resolveFolder([{ ...asset, storageUrl: undefined }, { ...asset, _id: 'valid', name: 'valid.png' }]);
    (document.querySelector('button[aria-label="Select photo.png"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(dialogs.openDialogs.length).toBe(1);
    expect(ref.componentInstance.error()).toContain('no usable URL');
    expect(document.querySelector('mat-dialog-container [role="alert"]')?.textContent).toContain('no usable URL');
    expect(selected).toEqual([]);
    (document.querySelector('button[aria-label="Select valid.png"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(selected).toEqual(['/photo.png']);
  });

  it('uploads only images to the documents folder and closes with the returned URL', async () => {
    open();
    await resolveFolder();
    const input = document.querySelector('mat-dialog-container input[type="file"]') as HTMLInputElement;
    expect(input.accept).toBe('image/*');
    const setFile = (file: File) => {
      const transfer = new DataTransfer();
      transfer.items.add(file);
      input.files = transfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    };
    setFile(new File(['pdf'], 'notes.pdf', { type: 'application/pdf' }));
    await fixture.whenStable();
    const upload = Array.from(document.querySelectorAll('ngx-asset-upload button'))
      .find((button) => button.textContent?.includes('Upload file')) as HTMLButtonElement;
    expect(upload.disabled).toBeTrue();
    http.expectNone('/api/uploader/upload');
    setFile(new File(['image'], 'photo.png', { type: 'image/png' }));
    await fixture.whenStable();
    upload.click();
    await fixture.whenStable();
    const request = http.expectOne('/api/uploader/upload');
    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBeTrue();
    expect((request.request.body as FormData).get('folderId')).toBe(folder._id);
    request.flush(asset);
    await fixture.whenStable();
    for (const refresh of http.match((r) => r.url === '/api/uploader' || r.url === '/api/uploader/folders')) {
      expect(refresh.cancelled).toBeTrue();
    }
    expect(dialogs.openDialogs.length).toBe(0);
    expect(selected).toEqual(['/photo.png']);
    http.expectNone('/api/documents/uploader/image-upload');
  });

  it('prevents disabled opening and discards a result when the origin becomes disabled', async () => {
    fixture.componentRef.setInput('disabled', true);
    await fixture.whenStable();
    fixture.componentInstance.open();
    expect(dialogs.openDialogs.length).toBe(0);
    http.expectNone('/api/uploader/folders');
    fixture.componentRef.setInput('disabled', false);
    await fixture.whenStable();
    const ref = open();
    await resolveFolder();
    ref.close('/photo.png');
    fixture.componentRef.setInput('disabled', true);
    await fixture.whenStable();
    expect(selected).toEqual([]);
    expect(dialogs.openDialogs.length).toBe(0);
  });

  it('closes an open modal when the origin is disabled', async () => {
    open();
    await resolveFolder();
    fixture.componentRef.setInput('disabled', true);
    await fixture.whenStable();
    expect(dialogs.openDialogs.length).toBe(0);
    expect(selected).toEqual([]);
  });

  it('cancels pending folder loading when its origin is destroyed', async () => {
    open();
    const request = http.expectOne('/api/uploader/folders');
    fixture.destroy();
    await fixture.whenStable();
    expect(request.cancelled).toBeTrue();
    expect(dialogs.openDialogs.length).toBe(0);
    expect(selected).toEqual([]);
  });
});

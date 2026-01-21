import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { UpdateWorkshopDto } from '@tmdjr/document-contracts';
import {
  BehaviorSubject,
  combineLatest,
  map,
  mergeMap,
  take,
  takeUntil,
  tap,
} from 'rxjs';
import { KeyValue } from '../../../../../interfaces/common.interface';
import { NavigationService } from '../../../../../services/navigation.service';
import { WorkshopEditorService } from '../../../../../services/workshops.service';

interface CreateWorkshopFormValue extends UpdateWorkshopDto {
  image?: File | null;
  imageURLOrUpload?: 'url' | 'upload';
}

type CreateWorkshopFormControls = {
  sectionId: FormControl<string>;
  sortId: FormControl<number>;
  name: FormControl<string>;
  summary: FormControl<string>;
  imageURLOrUpload: FormControl<'url' | 'upload'>;
  thumbnail: FormControl<string>;
  image: FormControl<File | null>;
};

@Component({
  selector: 'ngx-create-workshop-modal',
  templateUrl: './create-workshop-modal.component.html',
  styleUrls: ['./create-workshop-modal.component.scss'],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatRadioModule,
  ],
})
export class CreateWorkshopModalComponent {
  private workshopEditorService = inject(WorkshopEditorService);
  private navigationService = inject(NavigationService);
  private dialogRef = inject(
    MatDialogRef<CreateWorkshopModalComponent>
  );
  private formBuilder = inject(FormBuilder);
  private selectedImage: File | null = null;

  createWorkshopFormLevelMessage$ = new BehaviorSubject<
    string | undefined
  >(undefined);
  errorMessages: KeyValue = {
    required: 'Required',
    httpFailure: 'Server error',
  };
  createWorkshopControlsErrorMessage: KeyValue = {
    name: '',
    summary: '',
  };

  loading$ = new BehaviorSubject<boolean>(false);
  formGroup$ = combineLatest({
    section: inject(NavigationService).getCurrentSection(),
    workshops: inject(NavigationService).getWorkshops(),
  }).pipe(
    map(({ section, workshops }) => {
      return this.formBuilder.group<CreateWorkshopFormControls>({
        sectionId: this.formBuilder.control(section?._id ?? '', {
          nonNullable: true,
        }),
        sortId: this.formBuilder.control(workshops.length, {
          nonNullable: true,
        }),
        name: this.formBuilder.control('', {
          nonNullable: true,
          validators: [Validators.required],
        }),
        summary: this.formBuilder.control('', {
          nonNullable: true,
          validators: [Validators.required],
        }),
        imageURLOrUpload: this.formBuilder.control<'url' | 'upload'>(
          'url',
          {
            nonNullable: true,
          }
        ),
        thumbnail: this.formBuilder.control<string>('', {
          nonNullable: true,
        }),
        image: this.formBuilder.control<File | null>(null, {
          nonNullable: true,
        }),
      });
    })
  );

  viewModel$ = combineLatest({
    formGroup: this.formGroup$.pipe(
      tap((formGroup) => {
        formGroup.statusChanges
          .pipe(takeUntil(this.dialogRef.afterClosed()))
          .subscribe(() => {
            this.workshopEditorService.ifErrorsSetMessages(
              formGroup,
              this.createWorkshopControlsErrorMessage,
              this.errorMessages
            );
          });
      })
    ),
    loading: this.loading$.pipe(
      tap((loading) => (this.dialogRef.disableClose = loading))
    ),
    createWorkshopFormLevelMessage:
      this.createWorkshopFormLevelMessage$,
  });

  onCreateWorkshop({
    image,
    imageURLOrUpload,
    ...createWorkshopDto
  }: CreateWorkshopFormValue) {
    this.workshopEditorService
      .createWorkshop(createWorkshopDto)
      .pipe(
        tap(() => this.loading$.next(true)),
        mergeMap(() =>
          this.navigationService.getCurrentSection().pipe(take(1))
        )
      )
      .subscribe({
        next: (section) => {
          this.loading$.next(false);
          this.navigationService
            .navigateToSection(section?._id ?? '', true)
            .pipe(
              take(1),
              tap(() => this.dialogRef.close())
            )
            .subscribe();
        },
        error: () =>
          this.createWorkshopFormLevelMessage$.next(
            this.errorMessages['httpFailure']
          ),
      });
  }

  onFileSelected(event: Event, formGroup: FormGroup) {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;
    if (fileList && fileList.length > 0) {
      this.selectedImage = fileList[0];
      const formData = new FormData();
      formData.append('image', this.selectedImage);

      this.loading$.next(true);
      this.workshopEditorService
        .uploadImage(formData)
        .pipe(take(1))
        .subscribe({
          next: ({ success }) => {
            this.loading$.next(false);
            formGroup.get('thumbnail')?.setValue(success?.secure_url);
            formGroup.get('imageURLOrUpload')?.setValue('url');
          },
          error: () =>
            this.createWorkshopFormLevelMessage$.next(
              this.errorMessages['httpFailure']
            ),
        });
    }
  }
}

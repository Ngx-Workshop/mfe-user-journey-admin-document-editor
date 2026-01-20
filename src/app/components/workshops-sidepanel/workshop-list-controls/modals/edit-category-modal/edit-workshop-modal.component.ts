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
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  BehaviorSubject,
  combineLatest,
  mergeMap,
  of,
  take,
  takeUntil,
  tap,
} from 'rxjs';

import { MatRadioModule } from '@angular/material/radio';
import {
  CreateWorkshopFormValue,
  KeyValue,
} from '../../../../../navigation.interface';
import { NavigationService } from '../../../../../services/navigation.service';
import { WorkshopEditorService } from '../../../../../services/workshops.service';

@Component({
  selector: 'ngx-edit-workshop-modal',
  templateUrl: './edit-workshop-modal.component.html',
  styleUrls: ['./edit-workshop-modal.component.scss'],
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
export class EditWorkshopModalComponent {
  private workshopEditorService = inject(WorkshopEditorService);
  private navigationService = inject(NavigationService);
  private dialogRef = inject(
    MatDialogRef<EditWorkshopModalComponent>
  );
  protected workshop = inject(MAT_DIALOG_DATA);
  private formBuilder = inject(FormBuilder);
  private selectedImage: File | null = null;

  editWorkshopFormLevelMessage$ = new BehaviorSubject<
    string | undefined
  >(undefined);
  errorMessages: KeyValue = {
    required: 'Required',
  };
  editWorkshopControlsErrorMessages: KeyValue = {
    name: '',
    summary: '',
  };

  loading$ = new BehaviorSubject<boolean>(false);
  formGroup$ = of(
    this.formBuilder.group({
      _id: [this.workshop.workshop?._id],
      name: [this.workshop.workshop?.name, [Validators.required]],
      summary: [
        this.workshop.workshop?.summary,
        [Validators.required],
      ],
      imageURLOrUpload: ['url'],
      thumbnail: [
        this.workshop.workshop?.thumbnail,
        [Validators.required],
      ],
      image: new FormControl<File | null>(null),
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
              this.editWorkshopControlsErrorMessages,
              this.errorMessages
            );
          });
      })
    ),
    loading: this.loading$.pipe(
      tap((loading) => (this.dialogRef.disableClose = loading))
    ),
    editWorkshopFormLevelMessage: this.editWorkshopFormLevelMessage$,
  });

  onEditWorkshop(formGroupValue: unknown): void {
    this.workshopEditorService
      .editWorkshopNameAndSummary(
        formGroupValue as CreateWorkshopFormValue
      )
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
          this.editWorkshopFormLevelMessage$.next(
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
            this.editWorkshopFormLevelMessage$.next(
              this.errorMessages['httpFailure']
            ),
        });
    }
  }
}

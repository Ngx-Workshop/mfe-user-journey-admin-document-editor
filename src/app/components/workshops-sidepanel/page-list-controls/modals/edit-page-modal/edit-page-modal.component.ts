import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import {
  FormBuilder,
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
  EditPageNameUpdateWorkshopDto,
  WorkshopPageDto,
} from '@tmdjr/document-contracts';
import {
  BehaviorSubject,
  combineLatest,
  map,
  mergeMap,
  switchMap,
  take,
  takeUntil,
  tap,
} from 'rxjs';
import { KeyValue } from '../../../../../interfaces/common.interface';
import { NavigationService } from '../../../../../services/navigation.service';
import { WorkshopEditorService } from '../../../../../services/workshops.service';

@Component({
  selector: 'ngx-edit-page-modal',
  templateUrl: './edit-page-modal.component.html',
  styleUrls: ['./edit-page-modal.component.scss'],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditPageModalComponent {
  data = inject<{
    workshopDocument: WorkshopPageDto;
  }>(MAT_DIALOG_DATA);

  private workshopEditorService = inject(WorkshopEditorService);
  private navigationService = inject(NavigationService);
  private dialogRef = inject(MatDialogRef<EditPageModalComponent>);
  private formBuilder = inject(FormBuilder);

  editPageFormLevelMessage$ = new BehaviorSubject<string | undefined>(
    undefined
  );
  errorMessages: KeyValue = {
    required: 'Required',
    httpFailure: 'Server error',
  };
  editPageControlsErrorMessages: KeyValue = { name: '', summary: '' };

  loading$ = new BehaviorSubject<boolean>(false);
  formGroup$ = this.navigationService.getCurrentWorkshop().pipe(
    map((workshop) => {
      return this.formBuilder.group({
        _id: [this.data.workshopDocument._id],
        workshopGroupId: [workshop?._id],
        name: [
          this.data.workshopDocument.name,
          [Validators.required],
        ],
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
              this.editPageControlsErrorMessages,
              this.errorMessages
            );
          });
      })
    ),
    loading: this.loading$.pipe(
      tap((loading) => (this.dialogRef.disableClose = loading))
    ),
    editPageFormLevelMessage: this.editPageFormLevelMessage$,
  });

  onEditPage(formGroupValue: unknown) {
    this.workshopEditorService
      .editPageName(formGroupValue as EditPageNameUpdateWorkshopDto)
      .pipe(
        tap(() => this.loading$.next(true)),
        mergeMap(() =>
          this.navigationService.getCurrentWorkshop().pipe(take(1))
        )
      )
      .subscribe({
        next: (workshop) => {
          this.navigationService
            .navigateToSection(workshop?.sectionId ?? '', true)
            .pipe(
              take(1),
              switchMap(() =>
                this.navigationService.navigateToWorkshop(
                  workshop?.workshopDocumentGroupId ?? ''
                )
              ),
              tap(() => this.dialogRef.close())
            )
            .subscribe();
        },
        error: () =>
          this.editPageFormLevelMessage$.next(
            this.errorMessages['httpFailure']
          ),
      });
  }
}

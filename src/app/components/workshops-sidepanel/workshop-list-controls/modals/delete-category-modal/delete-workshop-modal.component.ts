import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
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
  BehaviorSubject,
  combineLatest,
  mergeMap,
  of,
  take,
  takeUntil,
  tap,
} from 'rxjs';
import { MatchStringValidator } from '../../../../../form-validators/match-string.validator';
import { KeyValue } from '../../../../../interfaces/common.interface';
import { NavigationService } from '../../../../../services/navigation.service';
import { WorkshopEditorService } from '../../../../../services/workshops.service';

@Component({
  selector: 'ngx-delete-workshop-modal',
  templateUrl: './delete-workshop-modal.component.html',
  styleUrls: ['./delete-workshop-modal.component.scss'],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
  ],
})
export class DeleteWorkshopModalComponent {
  private dialogRef = inject(
    MatDialogRef<DeleteWorkshopModalComponent>
  );
  private workshopEditorService = inject(WorkshopEditorService);
  private navigationService = inject(NavigationService);
  protected workshop = inject(MAT_DIALOG_DATA);

  deleteWorkshopFormLevelMessage$ = new BehaviorSubject<
    string | undefined
  >(undefined);
  errorMessages: KeyValue = {
    required: 'Required',
    matchString: 'Name does NOT match.',
    httpFailure: 'Server error',
  };
  deleteWorkshopControlsErrorMessages: KeyValue = { name: '' };

  loading$ = new BehaviorSubject<boolean>(false);
  formGroup$ = of(
    inject(FormBuilder).group(
      { name: ['', [Validators.required]] },
      {
        validators: MatchStringValidator(
          'name',
          this.workshop.workshop.name
        ),
      }
    )
  );

  viewModel$ = combineLatest({
    formGroup: this.formGroup$.pipe(
      tap((formGroup) => {
        formGroup.statusChanges
          .pipe(takeUntil(this.dialogRef.afterClosed()))
          .subscribe(() => {
            this.workshopEditorService.ifErrorsSetMessages(
              formGroup,
              this.deleteWorkshopControlsErrorMessages,
              this.errorMessages
            );
          });
      })
    ),
    loading: this.loading$.pipe(
      tap((loading) => (this.dialogRef.disableClose = loading))
    ),
    deleteWorkshopFormLevelMessage:
      this.deleteWorkshopFormLevelMessage$,
  });

  onDeleteWorkshop() {
    this.workshopEditorService
      .deleteWorkshop(this.workshop.workshop._id)
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
          this.deleteWorkshopFormLevelMessage$.next(
            this.errorMessages['httpFailure']
          ),
      });
  }
}

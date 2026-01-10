import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Inject,
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
  BehaviorSubject,
  combineLatest,
  map,
  mergeMap,
  switchMap,
  take,
  takeUntil,
  tap,
} from 'rxjs';
import { MatchStringValidator } from '../../../../../match-string.validator';
import {
  KeyValue,
  WorkshopDocument,
} from '../../../../../navigation.interface';
import { NavigationService } from '../../../../../services/navigation.service';
import { WorkshopEditorService } from '../../../../../services/workshops.service';

@Component({
  selector: 'ngx-delete-page-modal',
  templateUrl: './delete-page-modal.component.html',
  styleUrls: ['./delete-page-modal.component.scss'],
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
export class DeletePageModalComponent {
  private workshopEditorService = inject(WorkshopEditorService);
  private navigationService = inject(NavigationService);
  private dialogRef = inject(MatDialogRef<DeletePageModalComponent>);
  private formBuilder = inject(FormBuilder);
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { workshopDocument: WorkshopDocument }
  ) {}

  deletePageFormLevelMessage$ = new BehaviorSubject<
    string | undefined
  >(undefined);
  errorMessages: KeyValue = {
    required: 'Required',
    matchString: 'Name does NOT match.',
    httpFailure: 'Server error',
  };
  deletePageControlsErrorMessages: KeyValue = { name: '' };

  loading$ = new BehaviorSubject<boolean>(false);
  formGroup$ = this.navigationService.getCurrentWorkshop().pipe(
    map((workshop) => {
      return this.formBuilder.group(
        {
          _id: [this.data.workshopDocument._id],
          workshopId: [workshop?._id],
          name: ['', [Validators.required]],
        },
        {
          validators: MatchStringValidator(
            'name',
            this.data.workshopDocument.name
          ),
        }
      );
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
              this.deletePageControlsErrorMessages,
              this.errorMessages
            );
          });
      })
    ),
    loading: this.loading$.pipe(
      tap((loading) => (this.dialogRef.disableClose = loading))
    ),
    deletePageFormLevelMessage: this.deletePageFormLevelMessage$,
  });

  onDeletePage(formGroupValue: unknown) {
    const { workshopId } = formGroupValue as { workshopId: string };
    this.workshopEditorService
      .deletePage(formGroupValue as WorkshopDocument, workshopId)
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
          this.deletePageFormLevelMessage$.next(
            this.errorMessages['httpFailure']
          ),
      });
  }
}

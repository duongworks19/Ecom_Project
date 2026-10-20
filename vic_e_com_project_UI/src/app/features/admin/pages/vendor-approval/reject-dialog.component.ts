import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'vic-vendor-reject-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Từ chối hồ sơ</h2>
    <mat-dialog-content>
      <p class="dialog-intro">Cho {{ data.businessName }} biết lý do hồ sơ chưa được chấp thuận.</p>
      <div class="suggestions" aria-label="Gợi ý lý do">
        @for (suggestion of suggestions; track suggestion) {
          <button type="button" class="suggestion" (click)="useSuggestion(suggestion)">{{ suggestion }}</button>
        }
      </div>
      <mat-form-field appearance="outline" class="reason-field">
        <mat-label>Lý do từ chối</mat-label>
        <textarea matInput [formControl]="reason" rows="4" maxlength="500" aria-describedby="reason-hint"></textarea>
        <mat-hint id="reason-hint" align="end">{{ reason.value.trim().length }}/500</mat-hint>
        @if (reason.hasError('minlength') || reason.hasError('required') || tooShort || (reason.value.length >= 10 && reason.value.trim().length < 10)) {
          <mat-error>Lý do cần tối thiểu 10 ký tự.</mat-error>
        }
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" class="cancel-button" (click)="dialogRef.close()">Quay lại</button>
      <button mat-button type="button" class="reject-button" [disabled]="!valid" (click)="submit()">Từ chối hồ sơ</button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host { display: block; color: var(--color-body); }
    .dialog-intro { margin: 0 0 16px; }
    .suggestions { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
    .suggestion { min-height: 40px; padding: 8px 14px; border-radius: 9999px; background: var(--color-surface-card); font-size: 13px; }
    .reason-field { width: 100%; }
    mat-dialog-actions { gap: 8px; padding: 16px 24px 24px; }
    .cancel-button, .reject-button { min-height: 44px; border-radius: 9999px; padding: 0 18px; }
    .reject-button { background: var(--color-ink); color: white; }
    .reject-button:disabled { background: var(--color-surface-card); color: var(--color-ash); }
  `],
})
export class RejectDialogComponent {
  readonly data = inject<{ businessName: string }>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<RejectDialogComponent, string>);
  readonly reason = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(10), Validators.maxLength(500)] });
  readonly suggestions = [
    'Giấy tờ KYC bị mờ',
    'Thông tin không khớp giấy tờ',
    'Tên shop vi phạm chính sách',
    'Thiếu địa chỉ kho',
  ];
  tooShort = false;

  get valid(): boolean {
    return this.reason.valid && this.reason.value.trim().length >= 10;
  }

  useSuggestion(suggestion: string): void {
    this.reason.setValue(suggestion);
    this.tooShort = false;
  }

  submit(): void {
    this.tooShort = this.reason.value.trim().length < 10;
    if (this.valid) this.dialogRef.close(this.reason.value.trim());
  }
}

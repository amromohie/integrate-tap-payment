import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SanitizationService } from '../../core/services/sanitization.service';

/**
 * Safe HTML Pipe
 * Sanitizes HTML content before rendering
 * Usage: {{ someHtmlString | safeHtml }}
 */
@Pipe({
  name: 'safeHtml',
  standalone: true
})
export class SafeHtmlPipe implements PipeTransform {
  private readonly sanitizationService = inject(SanitizationService);

  transform(value: string): SafeHtml {
    if (!value) {
      return '';
    }
    return this.sanitizationService.sanitizeHtml(value);
  }
}

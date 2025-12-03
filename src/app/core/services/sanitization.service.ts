import { Injectable, inject } from '@angular/core';
import { DomSanitizer, SafeHtml, SafeUrl, SafeResourceUrl } from '@angular/platform-browser';

/**
 * Sanitization service wrapper
 * In production, consider using DOMPurify for more robust sanitization
 * Install: npm install dompurify @types/dompurify
 * 
 * For now, we use Angular's built-in DomSanitizer
 * which provides basic XSS protection
 */
@Injectable({
  providedIn: 'root'
})
export class SanitizationService {
  private readonly sanitizer = inject(DomSanitizer);

  /**
   * Sanitize HTML content
   * Use this when you need to display HTML from untrusted sources
   * @param html HTML string to sanitize
   * @returns SafeHtml object that can be used with [innerHTML]
   */
  sanitizeHtml(html: string): SafeHtml {
    // Angular's DomSanitizer provides basic XSS protection
    // For production, consider using DOMPurify for more robust sanitization:
    // import DOMPurify from 'dompurify';
    // const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p'] });
    // return this.sanitizer.sanitize(SecurityContext.HTML, clean);
    
    return this.sanitizer.sanitize(1, html) as SafeHtml; // SecurityContext.HTML = 1
  }

  /**
   * Sanitize URL
   * Use this for links from untrusted sources
   * @param url URL string to sanitize
   * @returns SafeUrl object
   */
  sanitizeUrl(url: string): SafeUrl {
    return this.sanitizer.sanitize(2, url) as SafeUrl; // SecurityContext.URL = 2
  }

  /**
   * Sanitize resource URL (for iframes, scripts, etc.)
   * @param url URL string to sanitize
   * @returns SafeResourceUrl object
   */
  sanitizeResourceUrl(url: string): SafeResourceUrl {
    return this.sanitizer.sanitize(4, url) as SafeResourceUrl; // SecurityContext.RESOURCE_URL = 4
  }

  /**
   * Bypass sanitization (USE WITH EXTREME CAUTION)
   * Only use when you are absolutely certain the content is safe
   * @param html HTML string
   * @returns Trusted HTML
   */
  bypassSecurityTrustHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  /**
   * Bypass sanitization for URLs
   * Only use when you are absolutely certain the URL is safe
   */
  bypassSecurityTrustUrl(url: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  /**
   * Bypass sanitization for resource URLs
   * Only use when you are absolutely certain the URL is safe
   */
  bypassSecurityTrustResourceUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}

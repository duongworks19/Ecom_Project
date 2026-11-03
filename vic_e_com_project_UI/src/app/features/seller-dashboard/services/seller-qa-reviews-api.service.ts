import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SellerQaReviewsApiService {
  private readonly http = inject(HttpClient);
  private readonly reviewsUrl = `${environment.apiUrl}/seller/reviews`;
  private readonly questionsUrl = `${environment.apiUrl}/seller/questions`;

  getReviews(): Observable<any> {
    return this.http.get<any>(this.reviewsUrl);
  }

  replyReview(reviewId: number, reply: string): Observable<any> {
    return this.http.post<any>(`${this.reviewsUrl}/${reviewId}/reply`, { reply });
  }

  getQuestions(): Observable<any> {
    return this.http.get<any>(this.questionsUrl);
  }

  replyQuestion(questionId: number, reply: string): Observable<any> {
    return this.http.post<any>(`${this.questionsUrl}/${questionId}/reply`, { reply });
  }
}

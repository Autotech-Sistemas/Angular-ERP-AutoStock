import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PagedResponse } from '../../shared/interfaces/models.interface';

@Injectable({ providedIn: 'root' })
export class ApiService {
  readonly BASE = 'http://localhost:8889/api';

  constructor(private http: HttpClient) {}

  getAll<T>(path: string, page = 0, size = 12): Observable<PagedResponse<T>> {
    const params = new HttpParams().set('page', page).set('size', size).set('direction', 'asc');
    return this.http.get<PagedResponse<T>>(`${this.BASE}${path}`, { params });
  }

  getById<T>(path: string, id: string): Observable<T> {
    return this.http.get<T>(`${this.BASE}${path}/${id}`);
  }

  create<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.BASE}${path}`, body);
  }

  update<T>(path: string, id: string, body: unknown): Observable<T> {
    return this.http.patch<T>(`${this.BASE}${path}/${id}`, body);
  }

  remove(path: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE}${path}/${id}`);
  }

  uploadFile(file: File): Observable<unknown> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post(`${this.BASE}/file/upload-file`, fd);
  }
}

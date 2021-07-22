import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { Step } from './step';
import { Path } from './path';

const api = '/api';

@Injectable()
export class StepService {
  constructor(private http: HttpClient) {}

  scrapeContent(url: string){
    return this.http.put(`${api}/url`, { "url": url });
  }

  getSteps() {
    var test = window.location.href.includes("?testing");
    return this.http.get<Array<Step>>( test ?`${api}/steps?testing` : `${api}/steps`);
  }

  deleteStep(step: Step) {
    return this.http.delete(`${api}/step/${step.uid}`);
  }

  addStep(step: Step) {
    var test = window.location.href.includes("?testing");
    return this.http.post<Step>( test ? `${api}/step?testing` : `${api}/step`, step);
  }

  savePath(path: Path) {
    var test = window.location.href.includes("?testing");
    return this.http.put<Step>( test ? `${api}/path/${path.uid}?testing`: `${api}/path/${path.uid}`, path);
  }

  deletePath(uid: String) {
    return this.http.delete<Step>(`${api}/path/${uid}`);
  }

  uploadThumb(uid: String,  file: File){
    const formData = new FormData()
    formData.append('logo', file)
    var o =  this.http.put(`${api}/thumb/${uid}`, formData)
    return o;
  }

}

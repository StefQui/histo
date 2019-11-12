import { Injectable } from '@angular/core';
import { from, interval, of, range, Subject } from 'rxjs';
import { fromArray } from 'rxjs/internal/observable/fromArray';
import { map, switchMap, take } from 'rxjs/operators';
import { mapTo } from 'rxjs/internal/operators';
import { endWith } from 'rxjs/internal/operators/endWith';

@Injectable({
  providedIn: 'root'
})
export class HistoService {

  histos: any;
  histoSubjectMap: any;

  histoDataNextSubject: any;
  histoDataCompleteSubject: any;

  constructor() {
    this.histoSubjectMap = {};
    this.histoDataNextSubject = new Subject();
    this.histoDataCompleteSubject = new Subject();
  }

  startHisto(scope: string) {
    console.log('start histo ', scope);
    if (!this.histoSubjectMap[scope]) {
      this.histoSubjectMap[scope] = new Subject();
      this.histoSubjectMap[scope].pipe(
        switchMap(() => this.buildData(scope).pipe(endWith('theend')))
      ).subscribe(data => {
          console.log('next', data);
          if (data === 'theend') {
            this.histoDataCompleteSubject.next();
            return;
          }
          this.histoDataNextSubject.next(data);
        });
    }
    this.histoSubjectMap[scope].next();
  }

  private buildData(scope: string) {
    return interval(1000).pipe(
      take(14),
      map(i => this.getTen(i)),
      map((arr: number[]) => this.transform(scope, arr)));
  }

  private transform(scope: string, arr: number[]): any[] {
    return arr.map(it => {
      return {
        id: it,
        name: scope + it
      };
    });
  }

  private getTen(i: any): number[] {
    const result = [];
    range(i * 10, 10).subscribe((aa) => {
      result.push(aa);
    });
    return result;
  }
}

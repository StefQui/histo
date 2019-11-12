import { Injectable } from '@angular/core';
import { from, interval, merge, of, range, Subject } from 'rxjs';
import { fromArray } from 'rxjs/internal/observable/fromArray';
import { map, switchMap, take } from 'rxjs/operators';
import { mapTo, tap } from 'rxjs/internal/operators';
import { endWith } from 'rxjs/internal/operators/endWith';

@Injectable({
  providedIn: 'root'
})
export class HistoService {

  histos: any;
  histoSubjectMap: any;
  histoStreamerMap: any;

  histoDataNextSubject: any;
  histoDataCompleteSubject: any;
  histoDataStreamerSubject: Subject<any>;

  constructor() {
    this.histoSubjectMap = {};
    this.histoStreamerMap = {};
    this.histoDataNextSubject = new Subject();
    this.histoDataCompleteSubject = new Subject();
    this.histoDataStreamerSubject = new Subject();
  }

  startHisto(scope: string) {
    console.log('start histo ', scope);
    if (!this.histoSubjectMap[scope]) {
      console.log('creating subject ', scope);
      this.histoSubjectMap[scope] = new Subject();
      this.histoSubjectMap[scope].pipe(
        switchMap(() => this.buildData(scope).pipe(endWith('theend')))
      ).subscribe(data => {
        console.log('next', data);
        if (data === 'theend') {
          this.histoDataCompleteSubject.next({
            scope
          });
          return;
        }
        this.histoDataNextSubject.next({
          data,
          scope
        });
      });
    }
    this.histoSubjectMap[scope].next();

    if (!this.histoStreamerMap[scope]) {
      console.log('creating streamer ', scope);
      this.histoStreamerMap[scope] = new Subject();
      this.histoStreamerMap[scope].pipe(
        switchMap(() => this.streamData(scope))
      ).subscribe(data => {
        console.log('next stream', data);
        if (data === 'stream') {
          this.histoDataStreamerSubject.next({
            scope
          });
          return;
        }
      });
    }
    this.histoStreamerMap[scope].next();
  }

  private buildData(scope: string) {
    return interval(1000).pipe(
      take(14),
      map(i => this.getTen(i)),
      map((arr: number[]) => this.transform(scope, arr)));
  }

  private streamData(scope: string) {
    return interval(1500).pipe(
      map((arr) => 'stream'));
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

import { Injectable } from '@angular/core';
import {interval, of, Subject} from 'rxjs';
import {fromArray} from 'rxjs/internal/observable/fromArray';
import {map, switchMap, take} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class HistoService {

  histos: any;
  histoSubjectMap: any;

  constructor() {
    this.histoSubjectMap = {};
  }

  startHisto(scope: string) {
    console.log('start histo ', scope);
    if (!this.histoSubjectMap[scope]) {
      this.histoSubjectMap[scope] = new Subject();
      this.histoSubjectMap[scope].pipe(switchMap(() => this.buildData(scope))).subscribe((data => {
        console.log(data);
      }));
    }
    this.histoSubjectMap[scope].next();
    // this.histos.scope = interval(1000).pipe(
    //   take(5),
    //   map(i => {
    //     return {
    //     id: i,
    //     name: scope + i
    //   };
    //   })
    // );
    // this.histos.scope.subscribe(
    //   (aa) => console.log('obs ', aa)
    // );
  }

  private buildData(scope: string) {
    return interval(1000).pipe(
      take(5),
      map(i => {
        return {
          id: i,
          name: scope + i
        };
      })
    );
  }
}

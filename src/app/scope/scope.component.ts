import { Component, Input, OnInit } from '@angular/core';
import { HistoService } from '../histo.service';
import { iif, merge, Observable, Subscription } from 'rxjs/index';
import { filter, map, mergeMap, startWith, tap } from 'rxjs/internal/operators';
import 'ag-grid-enterprise';

@Component({
  selector: 'app-scope',
  templateUrl: './scope.component.html',
  styleUrls: ['./scope.component.scss']
})
export class ScopeComponent implements OnInit {

  private gridApi;
  private gridColumnApi;
  @Input() scope: string;
  private defaultColDef;
  private rowModelType;
  private cacheBlockSize;
  private maxBlocksInCache;
  private data = [];
  private dataIsLoaded = false;

  columnDefs = [];
  private dataFetcher: Observable<any>;
  private streamFetcher: Observable<any>;
  private datasource: { getRows: ((params) => any) };
  private server: any;

  constructor(private histoService: HistoService) {
    this.defaultColDef = {
      width: 120,
      resizable: true
    };
    this.rowModelType = 'serverSide';
    this.cacheBlockSize = 40;
    this.maxBlocksInCache = 10;
  }

  ngOnInit() {
    // this.startHisto();
    // this.histoService.histoDataNextSubject.asObservable()
    //   .subscribe((lines) => this.data.push(lines));
    // this.histoService.histoDataCompleteSubject.asObservable()
    //   .subscribe((lines) => this.dataIsLoaded = true);
    this.dataFetcher = merge(
      this.histoService.histoDataNextSubject.asObservable().pipe(
        filter(event => event.scope === this.scope),
        map((event) => event.data),
        tap((lines) => console.log('lines received ', this.scope)),
        map((lines) => {
          return {
            type: 'lines',
            scope: this.scope,
            lines
          };
        })
      ),
      this.histoService.histoDataCompleteSubject.asObservable().pipe(
        // tap(() => this.dataIsLoaded = true),
        filter(event => event.scope === this.scope),
        map(() => {
          return {
            type: 'end',
            scope: this.scope
          };
        })
      )
    );
    this.streamFetcher = this.histoService.histoDataStreamerSubject.asObservable().pipe(
      filter(event => event.scope === this.scope),
      map(() => {
        return {
          type: 'stream',
          scope: this.scope
        };
      })
    );

    this.server = this.FakeServer(this.dataFetcher, this.scope);
    this.datasource = this.ServerSideDatasource(this.server, this.scope);
    this.server.emptyAll(true);

  }

  startHisto() {
    this.data = [];
    this.dataIsLoaded = false;
    this.server.reset();
    this.server.emptyAll(false);
    this.streamFetcher.pipe(
      filter(event => event.scope === this.scope),
      tap(() => console.log('dataIsSTreamed', this.scope)),
      tap(() => this.server.updateData()),
      tap(() => this.gridApi.purgeServerSideCache())
    ).subscribe();

    this.histoService.startHisto(this.scope);
    this.gridApi.purgeServerSideCache();
    // this.gridApi.batchUpdateRowData();
  }

  onGridReady(params) {
    console.log('ongread ready');
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
    // const datasource = this.ServerSideDatasource(this.FakeServer(this.dataFetcher));
    params.api.setServerSideDatasource(this.datasource);
  }

  dataState() {
    return {
      dataIsLoaded: this.dataIsLoaded,
      data: this.data
    };
  }

  ServerSideDatasource(fakeServer, scope: string) {
    return {
      getRows(params) {
        return fakeServer.getResponse(params, scope);
      }
    };
  }

  FakeServer(dataFetcher: Observable<any>, scope: string) {
    let loaded = false;
    let data = [];
    let isFirst = true;
    let sub: Subscription;
    let isEmpty = false;
    let columnsAreSet = false;
    return {
      updateData() {
        const index = Math.floor( Math.random() * 15 );
        if (data.length >= index) {
          data[index].name = new Date();
        }
      },
      emptyAll(empty: boolean) {
        isEmpty = empty;
      },
      reset() {
        loaded = false;
        data = [];
        isFirst = true;
      },
      getResponse(params) {
        console.log('------------------asking for rows: ' + params.request.startRow + ' to ' + params.request.endRow + ' loaded=' +
          loaded + ' data.length' + data.length + ' scope=' + scope, params);
        if (isEmpty) {
          params.successCallback([], 0);
        }
        if (params.request.endRow < data.length) {
          const res = data.slice(params.request.startRow, params.request.endRow);
          params.successCallback(res, loaded ? data.length : -1);
          return;
        }
        if (loaded) {
          if (params.request.startRow < data.length) {
            const res = data.slice(params.request.startRow, data.length);
            params.successCallback(res, data.length);
          } else {
            params.successCallback([], data.length);
          }
          return;
        }
        if (sub) {
          sub.unsubscribe();
        }
        let alreadyFetched = false;
        sub = dataFetcher.pipe(
          filter(event => event.scope === scope),
          tap( (res) => {
            if (!columnsAreSet) {
              params.parentNode.gridApi.setColumnDefs([
                {headerName: 'Id', field: 'id'},
                {headerName: 'Name2', field: 'name'}
              ]);
              columnsAreSet = true;
            }
            console.log('before...', res);
            if (res.type === 'lines') {
              data.push(...res.lines);
            } else {
              loaded = true;
            }
          }),
          tap((res) => console.log('datafetcher', res, params.request, alreadyFetched, scope, res.scope)),
          ).subscribe((res) => {
          if (params.request.endRow < data.length && ! alreadyFetched) {
            const res1 = data.slice(params.request.startRow, params.request.endRow);
            console.log('**************** loaded = ', loaded);
            params.successCallback(res1, data.length);
            alreadyFetched = true;
            return;
          }
          if (loaded) {
            if (params.request.startRow < data.length) {
              const res1 = data.slice(params.request.startRow, data.length);
              params.successCallback(res1, data.length);
            } else {
              params.successCallback([], data.length);
            }
            return;
          }
        });
      }
    };
  }
}

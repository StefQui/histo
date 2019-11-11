import {Component, Input, OnInit} from '@angular/core';
import {HistoService} from '../histo.service';

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

  columnDefs = [
    {headerName: 'Make', field: 'make'},
    {headerName: 'Model', field: 'model'},
    {headerName: 'Price', field: 'price'}
  ];

  allData = [
    {make: 'Toyota', model: 'Celica', price: 35000},
    {make: 'Ford', model: 'Mondeo', price: 32000},
    {make: 'Porsche', model: 'Boxter', price: 72000}
  ];

  constructor(private histoService: HistoService) {
    this.defaultColDef = {
      width: 120,
      resizable: true
    };
    this.rowModelType = 'serverSide';
    this.cacheBlockSize = 100;
    this.maxBlocksInCache = 10;
  }

  ngOnInit() {
    this.startHisto();
  }

  startHisto() {
    this.histoService.startHisto(this.scope);
  }

  onGridReady(params) {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
    const server = this.FakeServer([]);
    const datasource = this.ServerSideDatasource(server);
    params.api.setServerSideDatasource(datasource);
  }

  ServerSideDatasource(server) {
    return {
      getRows(params) {
        setTimeout(() => {
          const response = server.getResponse(params.request);
          if (response.success) {
            params.successCallback(response.rows, response.lastRow);
          } else {
            params.failCallback();
          }
        }, 500);
      }
    };
  }

  FakeServer(allData) {
    return {
      getResponse(request) {
        console.log('asking for rows: ' + request.startRow + ' to ' + request.endRow);
        const rowsThisPage = allData.slice(request.startRow, request.endRow);
        const lastRow = allData.length <= request.endRow ? allData.length : -1;
        return {
          success: true,
          rows: rowsThisPage,
          lastRow
        };
      }
    };
  }
}

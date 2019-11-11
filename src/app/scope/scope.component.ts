import {Component, Input, OnInit} from '@angular/core';
import {HistoService} from '../histo.service';

@Component({
  selector: 'app-scope',
  templateUrl: './scope.component.html',
  styleUrls: ['./scope.component.scss']
})
export class ScopeComponent implements OnInit {

  @Input() scope: string;

  columnDefs = [
    {headerName: 'Make', field: 'make' },
    {headerName: 'Model', field: 'model' },
    {headerName: 'Price', field: 'price'}
  ];

  rowData = [
    { make: 'Toyota', model: 'Celica', price: 35000 },
    { make: 'Ford', model: 'Mondeo', price: 32000 },
    { make: 'Porsche', model: 'Boxter', price: 72000 }
  ];
  constructor(private histoService: HistoService) { }

  ngOnInit() {
    this.startHisto();
  }

  startHisto() {
    this.histoService.startHisto(this.scope);
  }
}

import { Component, OnInit } from '@angular/core';
import { WebsocketService } from './backend/backend.service';
import { map, debounce } from 'rxjs/operators';
import { pipe, timer } from 'rxjs';

interface IMessage {
  name: string;
  price: number;
  param: any;
  time: any;
  timestamp: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'LiveStocks';
  private URL = 'ws://stocks.mnet.website';
  stocksArray: Array<any>;

  constructor(private webSvc: WebsocketService) {
    this.stocksArray = [];
  }

  ngOnInit() {
    this.webSvc.connect(this.URL)
      // .pipe(
      //   debounce(() => timer(1000))
      // )
      .subscribe(val => {
        if (val['data']) {
          const data: Array<any> = JSON.parse(val.data);
          let arr = [];
          data.map(v => {
            const item: IMessage = {
              name: v[0],
              price: v[1].toFixed(2),
              param: null,
              time: this.getTime(),
              timestamp: Date.now()
            };
            arr.push(item);
          });
          //console.log(arr, 'old');
          arr = arr.filter((v: IMessage, i) => arr.map((_v: IMessage) => _v.name).lastIndexOf(v.name) === i);
          //console.log(arr, 'new');
          this.calculateStocks(arr);
        }
      }, error => {
        console.error(error);
      });
  }

  private calculateStocks(data: Array<IMessage>) {
    const newDataArr = [];
    let stocksArrayRef = this.stocksArray;


    if (this.stocksArray.length === 0) {
      this.stocksArray = data;
    } else {
      data.map((v: IMessage) => {
        const index = stocksArrayRef.findIndex((_v: IMessage) => _v.name === v.name);
        if (index > -1) {
          stocksArrayRef[index].param = (v.price > stocksArrayRef[index].price) ? true : false;
          stocksArrayRef[index].price = v.price;
          stocksArrayRef[index].time = v.time;
          stocksArrayRef[index].timestamp = v.timestamp;
        } else {
          newDataArr.push(v);
        }
      });

      if (newDataArr.length > 0) {
        stocksArrayRef = stocksArrayRef.concat(newDataArr);
      }
      this.stocksArray = stocksArrayRef.sort((a, b) => b.timestamp - a.timestamp);
      console.log(this.stocksArray, 'new');
    }
  }

  private getTime() {
    const d = new Date();
    const amOrPm = (d.getHours() < 12) ? 'AM' : 'PM';
    const min = (d.getMinutes() < 10) ? '0' + d.getMinutes() : d.getMinutes();
    const hour = (d.getHours() < 12) ? d.getHours() : d.getHours() - 12;
    const sec = (d.getSeconds() < 10) ? '0' + d.getSeconds() : d.getSeconds();
    return hour + ':' + + min + ':' + sec + ' ' + amOrPm;
  }
}

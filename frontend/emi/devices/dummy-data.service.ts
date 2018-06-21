import { Injectable } from '@angular/core';
import { range } from 'rxjs/observable/range';

@Injectable()
export class DummyDataService {
  dummyData= [];
  constructor() {        
  }
  //TODO: Datos dummy se debe elminar cuando se pueda obtener los datos reales
  generateDummyData(count) {
    const values = [];
    return new Promise((resolve, reject) => {
      range(1, count).subscribe(
        result => {
          values.push({ 
            id: result,
            name: this.makePlate(),
            deviceType: 'OMVZ7',
            ramStatus: {
              totalValue: 1026448,
              currentValue: Math.floor(Math.random() * 1026448),
              unitInformation: 'Kib'
            },
            sdStatus: {
              totalValue: 7446,
              currentValue: Math.floor(Math.random() * 7446),
              unitInformation: 'MiB'
            },
            flashStatus: {
              totalValue: 7446,
              currentValue: Math.floor(Math.random() * 7446),
              unitInformation: 'MiB'
            },
            volt: { currentValue: 12.096, highestValue: 12.176, lowestValue: 11.952 },
            cpuStatus: [Math.floor(Math.random() * 100), Math.floor(Math.random() * 100), Math.floor(Math.random() * 100)],
            upTime: '17:40:47 up 3 days,  2:52,  load average: 0.13, 0.16, 0.20',
            sn_dev: 'sn0001-0001-TEST',
            sn_modem: 'sn0001-0001-TEST-MODEM',
            sn_display: 'sn0001-0001-DISP',
            timeStamp: 1521240047,
            simStatus: Math.floor(Math.random() * 100) < 80,
            simImei: '359072061270035',
            sn_wifi: 'sn0001-0001-TEST-WiFi',
            mac: '00:01:02:03:04:05',
            dns: '192.168.188.188',
            appTablesVers: {
              tablaTrayectos: 139,
              listaNegra: 5378
            },
            appVers: {
              libparamoperacioncliente: "17.10.27.1",
              libcontrolregistros: "17.10.31.1",
              "embedded.libgestionhardware": "18.02.13.3",
              libcontrolconsecutivos: "13.07.19.1",
              AppUsosTrasnporte: "18.02.07.1",
              libcommonentities: "17.12.21.1",
              libcontrolmensajeria: "17.10.31.1",
              libgestionhardware: "15.05.22.01"
            },
            ipMaskMap: {
              "lo": [
                "127.0.0.1/8",
                "::1/128"
              ],
              "eth1": [
                "172.28.99.216/28",
                "fe80::d82a:bdff:fe31:e408/64"
              ],
              "eth0": [
                "192.168.188.197/24",
                "fe80::201:2ff:fe03:405/64"
              ]
            },
            band: "WCDMA",
            mode: "WCDMA",
            sn_cn: 'sn0001-0001-TEST-CN',
            gateway: '192.168.188.188',
            temperature: Math.floor(Math.random() * 100),
            online: Math.floor(Math.random() * 100) < 80
          });
        },
        error => {},
        () => {
          this.dummyData = values;
          resolve(values);
        }
      );
    });
  }

  makePlate() {
    var text = '';
    var letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    for (var i = 0; i < 3; i++)
      text += letters.charAt(Math.floor(Math.random() * letters.length));

    for (var i = 0; i < 3; i++) text += Math.floor(Math.random() * 9);

    return text;
  }
}

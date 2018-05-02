import gql from 'graphql-tag';

export const getDeviceState = gql`
  query getDeviceState($id: ID!) {
    getDeviceDetail(id: $id) {
      id
      deviceStatus {
        devSn
        displaySn
        connectorSn
        hostname
        deviceDataList {
          totalValue
          currentValue
          memoryUnitInformation
          memorytype
        }
        ram {
          totalValue
          currentValue
          memoryUnitInformation
        }
        voltage {
          currentValue
          highestValue
          lowestValue
        }
        upTime
        temperature
        cpuStatus
        online
      }
      appStatus {
        appTablesVersion {
          farePolicy
          blackList
        }
        appVersions {
          name
          version
        }
        timestamp
      }
      deviceNetwork {
        simImei
        simStatus
      }
    }
  }
`;

export const getDeviceNetwork = gql`
  query getDeviceNetwork($id: ID!) {
    getDeviceDetail(id: $id) {
      id
      deviceNetwork {
        modemSn
        gateway
        wifiSn
        mac
        dns
        ipMaskMap {
          name
          addresses
        }
        band
        mode
      }
    }
  }
`;

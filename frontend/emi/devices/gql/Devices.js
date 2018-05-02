import gql from 'graphql-tag';

// We use the gql tag to parse our query string into a query document
export const getDevices = gql`
  query getDevices($page: Int!, $count: Int!) {
    getDevices(page: $page, count: $count) {
      id
      deviceStatus {
        devSn
        online
        hostname
        ram {
          currentValue
          totalValue
          memoryUnitInformation
        }
        deviceDataList {
          totalValue
          currentValue
          memorytype
        }
      }
    }
  }
`;

export const getDeviceTableSize = gql`
  query {
    getDeviceTableSize
  }
`;

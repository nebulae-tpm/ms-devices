import gql from 'graphql-tag';

// We use the gql tag to parse our query string into a query document
export const getDevices = gql`
  query getDevices($page: Int!, $count: Int!, $filterText: String) {
    getDevices(page: $page, count: $count, filter: $filterText) {
      id
      deviceStatus {
        devSn
        online
        hostname
        type
        groupName
        temperature
        currentCpuStatus
        ram {
          currentValue
          totalValue
          memoryUnitInformation
        }
        sdStatus {
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

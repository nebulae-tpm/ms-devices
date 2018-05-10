import gql from 'graphql-tag';

// We use the gql tag to parse our query string into a query document
export const getDevices = gql`
  query getDevices($page: Int!, $count: Int!, $filterText: String, $sortColumn: String, $sortOrder: String) {
    getDevices(page: $page, count: $count, filter: $filterText, sortColumn: $sortColumn, sortOrder: $sortOrder) {
      id
      deviceStatus {
        devSn
        online
        hostname
        type
        groupName
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

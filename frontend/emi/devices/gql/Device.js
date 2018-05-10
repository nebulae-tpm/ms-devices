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
        type
        groupName
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
        simImei
        simStatus
      }
    }
  }
`;


export const getRamAvgInRangeOfTime = gql`
  query getRamAvgInRangeOfTime(
    $initTime: BigInt
    $endTime: BigInt
    $deviceId: String
    $deltaTime: Int
  ) {
    getRamAvgInRangeOfTime(
      initTime: $initTime
      endTime: $endTime
      deltaTime: $deltaTime
      deviceId: $deviceId
    ) {
      grouped_data
      interval
    }
  }
`;

export const getVolumeAvgInRangeOfTime = gql`
  query getVolumeAvgInRangeOfTime(
  $initTime: BigInt
  $endTime: BigInt
  $deviceId: String
  $type: String
  $deltaTime: Int
) {
  getVolumeAvgInRangeOfTime(
    initTime: $initTime
    endTime: $endTime
    volumeType:$type
    deltaTime: $deltaTime
    deviceId: $deviceId
  ) {
    grouped_data
    interval
  }
}
`;

export const getCpuAvgInRangeOfTime = gql`
  query getCpuAvgInRangeOfTime(
    $initTime: BigInt
    $endTime: BigInt
    $deviceId: String
    $deltaTime: Int
  ) {
    getCpuAvgInRangeOfTime(
      initTime: $initTime
      endTime: $endTime
      deltaTime: $deltaTime
      deviceId: $deviceId
    ) {
      grouped_data
      interval
    }
  }
`;

export const getVoltageInRangeOfTime = gql`
  query getVoltageInRangeOfTime(
    $initTime: BigInt
    $endTime: BigInt
    $deviceId: String
    $deltaTime: Int
  ) {
    getVoltageInRangeOfTime(
      initTime: $initTime
      endTime: $endTime
      deltaTime: $deltaTime
      deviceId: $deviceId
    ) {
      currentValue
      lowestValue
      highestValue
      interval
    }
  }
`;

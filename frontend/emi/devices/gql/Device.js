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
  ) {
    getRamAvgInRangeOfTime(
      initTime: $initTime
      endTime: $endTime
      deviceId: $deviceId
    ) {
      timestamp
      deviceStatus {
        ram {
          totalValue
          currentValue
          memoryUnitInformation
          memorytype
        }
      }
    }
  }
`;

export const getVolumeAvgInRangeOfTime = gql`
  query getVolumeAvgInRangeOfTime(
    $initTime: BigInt
    $endTime: BigInt
    $deviceId: String
    $type: String
  ) {
    getVolumeAvgInRangeOfTime(
      initTime: $initTime
      endTime: $endTime
      volumeType: $type
      deviceId: $deviceId
    ) {
      timestamp
      value
    }
  }
`;

export const getCpuAvgInRangeOfTime = gql`
  query getCpuAvgInRangeOfTime(
    $initTime: BigInt
    $endTime: BigInt
    $deviceId: String
  ) {
    getCpuAvgInRangeOfTime(
      initTime: $initTime
      endTime: $endTime
      deviceId: $deviceId
    ) {
      value
      timestamp
    }
  }
`;

export const getVoltageInRangeOfTime = gql`
  query getVoltageInRangeOfTime(
    $initTime: BigInt
    $endTime: BigInt
    $deviceId: String
  ) {
    getVoltageInRangeOfTime(
      initTime: $initTime
      endTime: $endTime
      deviceId: $deviceId
    ) {
      deviceStatus {
        voltage {
          currentValue
          highestValue
          lowestValue
        }
      }
      timestamp
    }
  }
`;

export const getDeviceAlarmThresholds = gql`
  query {
    getDeviceAlarmThresholds {
      ramThreshold
      cpuThreshold
      sdThreshold
      tempThreshold
    }
  }
`;

export const getDeviceAlarms = gql`
  query getDeviceAlarms(
    $deviceId: String!
    $alarmType: AlarmType!
    $initTime: BigInt!
    $endTime: BigInt,
    $page: Int!,
    $count: Int!
  ) {
    getDeviceAlarms(
      deviceId: $deviceId
      alarmType: $alarmType
      initTime: $initTime
      endTime: $endTime
      page: $page,
      count: $count
    ) {
      value
      unit
      timestamp
      deviceId
      active
      type
    }
  }
`;


export const getAlarmTableSize = gql`
  query {
    getAlarmTableSize
  }
`;

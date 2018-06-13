![NebulaE](docs/images/nebula.png "Nebula Engineering SAS")

# Devices Report MicroService
The general purpose of this service is to listen, store and show the general information of devices reported by the microservice ms-device-report.
This process is handle by three subprocess:
 * device backend: listen to incoming reports from ms-device-report throught the PubSub Topic, then format and store the data in the materialized view then then publish this data to device api.  
 * device api: this service is a bridge between the backend and the forntend, this api use the Graphql api, here is hosted the Queries and the subscribtions consumed by the frontend.

 * device frontend: show the stored info of devices using a client-side aplication based on angular core and angular materials

 _This MicroService is built on top of NebulaE MicroService Framework.  Please see the [FrameWork project](https://github.com/NebulaEngineering/nebulae) to understand the full concept_**.

 ![Intro](docs/images/ms-devices-report_intro.png "Intro")
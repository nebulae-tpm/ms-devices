![NebulaE](docs/images/nebula.png "Nebula Engineering SAS")

# Devices Report MicroService
The general purpose of this service is to listen, store and show the general information of devices reported by the microservice [ms-device-report](https://github.com/nebulae-tpm/ms-devices-report).
This process is handle by three subprocess:
 * device backend: listen to incoming reports from [ms-device-report](https://github.com/nebulae-tpm/ms-devices-report) throught the [PubSub](https://cloud.google.com/pubsub/docs/apis) PubSub Topic, then format and store the data in the materialized view then then publish this data to device api.  
 * device api: this service is a bridge between the backend and the frontend, this api use the [Apollo Graphql api](https://www.apollographql.com/docs/apollo-server/), here is hosted the Queries and the subscribtions consumed by the frontend.

 * device frontend: show the stored info of devices using a client-side aplication based on 
 [Angular core](https://angular.io/) as the basis of the project and [angular materials](https://material.angular.io/) as a visual framework. 

 _This MicroService is built on top of NebulaE MicroService Framework.  Please see the [FrameWork project](https://github.com/NebulaEngineering/nebulae) to understand the full concept_**.

 ![Intro](docs/images/ms-devices-report_intro.png "Intro")

 # Table of Contents
  * [Project Structure](#structure)
  * [FrontEnd](#frontend) - not yet available  
    *  [Environment variables](#frontend_env_vars) - not yet available  
  * [API](#api)
    * [GraphQL throught Gateway API](#api_gateway_graphql)
  * [BackEnd](#backend)
    *  [Recepcionist](#backend_recepcionist)
        *  [Environment variables](#backend_recepcionist_env_vars)
        *  [Event Sourcing](#backend_recepcionist_eventsourcing)
    *  [Handler](#backend_handler)
        *  [Environment variables](#backend_handler_env_vars)
        *  [CronJobs](#backend_handler_cronjobs)
        *  [Event Sourcing](#backend_handler_eventsourcing)
  * [Prepare development environment](#prepare_dev_env)
  * [License](#license)

# Project structure <a name="structure"></a>

```
.
├── frontend                            => Micro-FrontEnds - not yet available  
│   └── emi                             => Micro-FrontEnd for [EMI FrontEnd](https://github.com/nebulae-tpm/emi) - not yet available  
├── api                                 => Micro-APIs  
│   └── gateway                         => Micro-API for [Gateway API](https://github.com/nebulae-tpm/gateway)  
├── backend                             => Micro-BackEnds  
│   ├── devices                         => Micro-BackEnd responsible for store and publish device info incomming from ms-device-report 
├── etc                                 => Micro-Service config Files.  
├── deployment                          => Automatic deployment strategies  
│   ├── compose                         => Docker-Compose environment for local development  
│   └── gke                             => Google Kubernetes Engine deployment file descriptors  
│   └── mapi-setup.json                 => Micro-API setup file  
├── .circleci                           => CircleCI v2. config directory
│   ├── config.yml
│   └── scripts
├── docs                                => Documentation resources  
│   └── images  
├── README.md                           => This doc
```
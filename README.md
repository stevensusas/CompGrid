# CompGrid

## Usage
http://k8s-default-frontend-9a8b339ea2-3f40a0d41ad2dad1.elb.us-east-1.amazonaws.com/

#### Owner Login:
Username: steven
Password: steven

#### User Login:
Username: wendy
Password: 123456

## Motivation
Pitch deck: [CompGrid.pdf](https://github.com/user-attachments/files/17822533/CompGrid.pdf)

Behind every life science discovery are hardware and computing infrastructure that supports the computational cost. You cannot have a powerful deep learning model for predicting protein folding without the GPU required for inference and training, and you cannot have a powerful sequence alignment algorithm without the necessary data storage and distributed computing infrastructure, for example.

When bioinformatics researchers needs access to computing resources beyong their personal machines, they turn to third-party cloud computing service providers like AWS, GCP and Azure as well as their local research institution's computing cores. In many cases, they are not allowed to use third-party cloud computing service providers due to information sensitivity--for example, HIPAA-protected patient information involved in biomedical research cannot be stored on third-party servers. Therefore, most of the time researchers utilize their own institution's computing cluster for additioal computing resources.

However, management of local computing clusters for these research institutions poses challenges involving multiple stakeholders. Cluster owners encounter difficulties in setting up clusters and creating custom management interfaces, while cluster users struggle with resource allocation, usage monitoring, and technical troubleshooting. Additionally, billing processes are inefficient, relying on manual methods like emails, phone calls, and forms, along with grant budget codes and manual tracking of resource usage, making the system cumbersome and error-prone.

The goal of CompGrid is to provide a unified platform that simplifies the local computing resource management process.

## Engineering Specs
<img width="1121" alt="image" src="https://github.com/user-attachments/assets/873228b0-8d85-443d-91a4-855165d8c2a3">

### Cluster Simulation

Since we don't have a physical cluster and bare metal instances to work with, we used **UTM** to spin up a series of ArchLinux virtual machines to simulate bare metal instances. These cluster of virtual machines help us demo our project. Additionally, we used **FastAPI** to create a python middleware with endpoints exposed through **ngrok** to manage our UTM cluster remotely.

### Full Stack Development

Our backend is built with **NodeJS** and **ExpressJS**. Additionally, we used JWT to create an authentication middleware responsible for user authentication and login functionalities. Our frontend is buit with **React**, and is deployed in a production setting through **Nginx** to optimize static file serving, SPA fallbacks, and client-side performance.

### Data Storage

I used **PostgreSQL** hosted on **AWS RDS** for persistent, relational data storage. I also used **Redis** for data caching, specifically for enabling the feature of robustly storing users' instance usage logs.

### DevOps

#### Docker Compose

#### Cloud Services

#### Kubernetes

#### Load Balancers

#### Autoscaling

#### Infrastructure as Code



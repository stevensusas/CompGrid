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

Behind every life science discovery are hardware and computing infrastructure that supports the computational cost. You cannot have a poIrful deep learning model for predicting protein folding without the GPU required for inference and training, and you cannot have a poIrful sequence alignment algorithm without the necessary data storage and distributed computing infrastructure, for example.

When bioinformatics researchers needs access to computing resources beyong their personal machines, they turn to third-party cloud computing service providers like AWS, GCP and Azure as Ill as their local research institution's computing cores. In many cases, they are not alloId to use third-party cloud computing service providers due to information sensitivity--for example, HIPAA-protected patient information involved in biomedical research cannot be stored on third-party servers. Therefore, most of the time researchers utilize their own institution's computing cluster for additioal computing resources.

However, management of local computing clusters for these research institutions poses challenges involving multiple stakeholders. Cluster owners encounter difficulties in setting up clusters and creating custom management interfaces, while cluster users struggle with resource allocation, usage monitoring, and technical troubleshooting. Additionally, billing processes are inefficient, relying on manual methods like emails, phone calls, and forms, along with grant budget codes and manual tracking of resource usage, making the system cumbersome and error-prone.

The goal of CompGrid is to provide a unified platform that simplifies the local computing resource management process.

## Engineering Specs
<img width="1121" alt="image" src="https://github.com/user-attachments/assets/873228b0-8d85-443d-91a4-855165d8c2a3">

### Cluster Simulation

Since I don't have a physical cluster and bare metal instances to work with, I used **UTM** to spin up a series of ArchLinux virtual machines to simulate bare metal instances. These cluster of virtual machines help us demo our project. Additionally, I used **FastAPI** to create a python middleware with endpoints exposed through **ngrok** to manage our UTM cluster remotely.

### Full Stack Development

The backend is built with **NodeJS** and **ExpressJS**. Additionally, I used JWT to create an authentication middleware responsible for user authentication and login functionalities. Our frontend is buit with **React**, and is deployed in a production setting through **Nginx** to optimize static file serving, SPA fallbacks, and client-side performance.

### Data Storage

I used **PostgreSQL** hosted on **AWS RDS** for persistent, relational data storage. I also used **Redis** for data caching, specifically for enabling the feature of robustly storing users' instance usage logs and other user session data.

### DevOps

#### Docker Compose

To optimize the developmental build process of the entire Ib application, I created containers for the frontend application, backend application and the redis instance with proper port exposure. Then, I used docker compose to orchestrate the containers so that I can spin up the entire application for developmental testing in one line of commandline.

#### Cloud Services

In the deployment of this project I extensively used cloud services, mainly AWS. I used **AWS ECR** to store the containerized frontend and backend application. I used **AWS EKS** to host a cloud Kubernetes cluster of vertically scalable EC2 instances with add-on services including network load balancing and auto-scaling. I also used **AWS Load Balancer** to implement load balancing services in the EKS cluster. Finally, the application's database is hosted on **AWS RDS**.

#### Kubernetes, Load Balancing, and Auto-scaling

Kubernetes provide my project with horizontal scalability. I used manifests to define the k8s deployments from frontend and backend images stored in ECR, and the k8s services -- the internet-facing network load balancers that provides my frontend and backend with stable DNS. I also set up auto-scaling with the replicas, such that high demands on the backend/frontend servers can trigger spinning up of new pods within the service and handle the surge in requests.

I also used ConfigMaps and SecretManager to manage the environmental variables in my k8s cluster.

#### Infrastructure as Code

I used **Terraform** to manage the complex cloud infrastructure involved in this project, namely AWS RDS, AWS EKS, AWS ECR, and AWS Load Balancer.

#### CI/CD

I used **Github Actions** to automate the deployment pipeline after changes have be pushed to main. Specifically, the CI/CD pipeline rebuild the frontend and backend containers, push them to AWS ECR, and rollout & restart the frontend and backend deployments automatically upon changes in the codebase.



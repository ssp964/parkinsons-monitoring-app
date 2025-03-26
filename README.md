# Parkinson's Monitoring System

A comprehensive medical tracking system for monitoring Parkinson's disease patients, featuring a web dashboard for doctors, real-time data processing, and secure data storage.

## System Architecture

The system consists of several microservices:

- **Web Dashboard** ([`web_app`](web_app/)) - Next.js frontend for doctors
- **Backend API** ([`backend`](backend/)) - FastAPI service handling authentication and data
- **Processing Service** ([`processing`](processing/)) - ML-based analysis of patient data
- **Database** ([`database`](database/)) - PostgreSQL database with medical records
- **Nginx** ([`nginx`](nginx/)) - Reverse proxy for routing requests

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 19+ (for local development)
- Python 3.9+ (for local development)
- PostgreSQL 13+ (for local development)

### Installation

1. Clone the repository:
```sh
git clone git@github.com:ssp964/parkinsons-monitoring-app.git
cd parkinsons-monitoring-app
```

2. Start the services using Docker Compose:
```sh
cd backend
docker-compose build
docker-compose up -d
```

3. The following services will be available:
- Web Dashboard: http://localhost:3000
- Backend API: http://localhost:8000
- Database: localhost:5432

### Development Setup

#### Web Dashboard

```sh
cd web_app
npm install
npm run dev
```



## Features

- **Doctor Dashboard**
  - Patient management
  - Real-time data visualization
  - Test results tracking
  - Secure authentication

- **Patient Data Processing**
  - Clock Drawing Test (CDT) analysis
  - Speech processing
  - Movement analysis
  - Real-time scoring

- **Security**
  - JWT-based authentication
  - Role-based access control 
  - Encrypted data storage

## API Documentation

The backend API documentation is available at:
- Swagger UI: http://localhost:8000/docs

## Database Schema

The PostgreSQL database includes tables for:
- Doctors
- Patients
- Test Records
- Images

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## About Me

I'm a data enthusiast passionate about transforming raw data into meaningful insights. With hands-on experience in data engineering, data science and analytics. I enjoy building scalable pipelines, designing efficient data models and uncovering patterns through advanced SQL and statistical techniques.

Currently exploring the modern data stack and applying best practices across the data lifecycle.

<p align="left">
  <a href="https://linkedin.com/in/supritspatil" target="_blank">
    <img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"/>
  </a>
  <a href="https://www.supritpatil.co/" target="_blank">
    <img src="https://img.shields.io/badge/Website-FF6F00?style=for-the-badge&logo=Google-Chrome&logoColor=white" alt="Website"/>
  </a>
  <a href="https://github.com/ssp964" target="_blank">
    <img src="https://img.shields.io/badge/GitHub-24292E?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"/>
  </a>
</p>

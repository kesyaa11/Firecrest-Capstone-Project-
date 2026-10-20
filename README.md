# Firecrest-Capstone-Project-
Cross-Team Scheduling and Delivery Management System
# CI Test
# Testing GitHub Actions CI
# Testing GitHub Actions CI 2
# Testing GitHub Actions CI 3

## Deployment Guide

This readme file explains how to run this web application locally with use of docker, along with information on startup login information, known bugs, and future additions we recommend

## Prerequisites

Before deploying this application, install the following:

- Docker Desktop
- Node.js and npm

Docker Desktop must be running before starting the application.

Download Docker Desktop here:

https://www.docker.com/products/docker-desktop/

Installation instructions:

- Windows: https://docs.docker.com/desktop/setup/install/windows-install/
- Mac: https://docs.docker.com/desktop/setup/install/mac-install/
- Linux: https://docs.docker.com/desktop/setup/install/linux/

## Clone the Repository

Open a terminal and clone the repository:

```bash
git clone https://github.com/kesyaa11/Firecrest-Capstone-Project-.git
```

## Initial Setup

Once cloned go into the root directory and create a `.env` file with the following variables with whatever variables you see fit

```
DB_USER = test_user
DB_PASSWORD = firecrest_test47176
```

Then open up the frontend folder and create another `.env` file this time with

```
VITE_API_BASE_URL=http://localhost:5050
```

The VITE_APP_BASE_URL directs the frontend to talk to backend

Now back in the main directory 

```bash
cd Firecrest-Capstone-Project-
```

## Start the container

From the root of the project, run in the terminal:

```bash
docker compose up -d --build
```

You can test / operate API endpoints with swagger at this location

```
http://localhost:5050/swagger/index.html
```

## Start Frontend

Open the frontend folder and run in the terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will now be available at http://localhost:5173

## Initial Login information

************************

## Stoping the container
To stop the database container without deleting stored data, run:

```bash
docker compose down
```

If you need to reset the database and re-run the init script, remove the volume as well however be warned this will reset all data within the database as if it never existed with no ways of getting it back.

```bash
docker compose down -v
```

## Known Bugs
- IDE1006, currently the API models (*.cs) are using snake_case instead of PascalCase

- Add field of email or some sort of unique identifier such as employee ID to change the unique constraint of a user to as currently if someone has the same role, same name, same country it will prevent their creation

- If a duplicate entry were to be inputted into the database it is not handled nicely, it causes an internal server error 500 instead of returning an error message

## Recommended Future Additions
- Change password is not implemented
- Mass import has not been implemented
- Authentication and Encryption on User passwords
- Dark mode and other customization options for each individual user
- Notifications to alert users when a handoff has been notified
- Monthly view
- On the dashboard have a next day worked on for the user, if they have been set on a project they should see the next shift they have allocated for that project

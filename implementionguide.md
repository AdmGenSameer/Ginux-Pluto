Product Vision
Project Name:
CloudDeploy (temporary)

Tagline:
Deploy applications in one click.

Powered internally by Dokploy.

Customer never sees Dokploy.
Overall Architecture
                            Internet
                                │
                        ┌──────────────────┐
                        │   Next.js UI     │
                        │  (Customer App)  │
                        └────────┬─────────┘
                                 │
                       HTTPS REST API
                                 │
                    ┌─────────────────────┐
                    │ Express.js Backend  │
                    │ Deployment Gateway  │
                    └────────┬────────────┘
                             │
                    Dokploy REST API
                             │
                  ┌────────────────────┐
                  │     Dokploy        │
                  │                    │
                  │ Docker             │
                  │ Traefik            │
                  │ GitHub Provider    │
                  └────────┬───────────┘
                           │
                    GitHub Repository
Folder Structure
frontend/

app/

components/

components/ui

components/deployment

components/projects

components/layout

components/logs

lib/

types/

services/

backend/

src/

controllers/

services/

routes/

middleware/

dokploy/

config/

Pages

Only build these.

Login
Simple login

Email

Password

Sign In
Dashboard
--------------------------------------------------

Deployments

+ New Application

--------------------------------------------------

Hospital Management

Running

main

2 minutes ago

Open

Redeploy

Logs

--------------------------------------------------

Portfolio

Building

--------------------------------------------------

New Application
Application Name

Repository

Branch

Build Type

Environment Variables

Deploy
Deployment Logs
Deployment Logs

--------------------------------

Cloning repository...

Running npm install...

Building Docker image...

Starting container...

Deployment Complete

--------------------------------
Settings

Only

API Token

Logout

Nothing more.

Backend API

Never expose Dokploy.

Frontend calls only these.

GET /api/projects

POST /api/projects

GET /api/repositories

GET /api/branches

POST /api/deploy

POST /api/redeploy

GET /api/logs/:id

GET /api/status/:id

Backend converts these into Dokploy API calls.

Dokploy Mapping
POST /project.create

↓

POST /application.create

↓

GET /github.getGithubRepositories

↓

GET /github.getGithubBranches

↓

POST /application.saveGithubProvider

↓

POST /application.deploy

↓

GET /application.readLogs
Data Flow
User clicks

Deploy

↓

Frontend

↓

Backend

↓

Create Project

↓

Create Application

↓

Attach GitHub Provider

↓

Deploy

↓

Receive deploymentId

↓

Poll Logs

↓

Show Status

UI Theme

Modern SaaS

Dark

Like

Vercel
Railway
Linear
Render

NOT

Enterprise dashboard.

Color Palette
Background

#09090B

Card

#111111

Border

#27272A

Primary

#FFFFFF

Secondary

#A1A1AA

Green

#22C55E

Red

#EF4444

Blue

#3B82F6
Sidebar
Logo

Deployments

Projects

Logs

Settings

Profile
Dashboard Cards

Each application card

Status

Application Name

Repository

Branch

Last Deploy

Buttons

Open

Logs

Redeploy
New Application Flow
Step 1

Application Name

↓

Step 2

Repository Dropdown

↓

Step 3

Branch Dropdown

↓

Step 4

Environment Variables

↓

Step 5

Deploy
Loading States
Connecting...

Fetching repositories...

Creating application...

Deploying...

Waiting for logs...

Every API request should have loading animations.

Logs

Auto-scroll

Monospace

Black terminal

Green success

Red errors

Timestamp

Exactly like Railway.

Components
Sidebar

Navbar

DeploymentCard

RepositoryDropdown

BranchDropdown

EnvironmentEditor

DeployButton

StatusBadge

LogViewer

LoadingOverlay

SearchBar

Tech Stack

Frontend

Next.js 15

React 19

TypeScript

Tailwind

shadcn/ui

React Query

Axios

React Hook Form

Zod

Lucide Icons

Backend

Express.js

TypeScript

Axios

JWT

dotenv

API Service Layer

Never call Axios inside components.

services/

deployment.ts

github.ts

projects.ts

logs.ts

State Management

Use

TanStack Query

No Redux.

Authentication

For tomorrow

Just

JWT

or

single demo user
Error Handling

Toast notifications

Deployment Failed

Retry

Repository not found

Branch unavailable

Unable to reach Dokploy
Animations

Use Framer Motion.

Very subtle.

Fade

Scale

Slide

Nothing flashy.


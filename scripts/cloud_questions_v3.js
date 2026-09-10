// ============================================================================
// PILLAR 6: AZURE DEVOPS, DOCKER & CI/CD (18 Questions)
// Sourced directly from User's Layer 4 PDF Guide and modern Cloud/.NET DevOps standards
// ============================================================================

const cloudQuestions = [
  {
    title: "What is the difference between Continuous Integration (CI), Continuous Delivery (CD), and Continuous Deployment?",
    seniority: "Mid-to-Senior",
    tags: ["DevOps", "CI/CD", "Azure Pipelines", "Automation", "Architecture"],
    pitch: "Continuous Integration (CI) is the practice of automatically building and running automated tests whenever code is merged into the shared repository. Continuous Delivery (CD) automatically packages and prepares release-ready build artifacts and deploys them to staging environments, with production deployment requiring a manual approval gate. Continuous Deployment takes it one step further by automatically releasing every passing change directly into production with zero human intervention.",
    analogy: "A bakery: CI is the kitchen mixing the dough and checking oven temperatures for every batch. Continuous Delivery is putting freshly baked bread into boxes on the delivery shelf, waiting for the store manager to stamp 'Approved for Sale'. Continuous Deployment is an automated conveyor belt that sends the bread straight into the customer's grocery bag the instant it comes out of the oven.",
    deepDive: `Pipeline Progression Matrix:
1. Continuous Integration (CI):
   - Trigger: PR creation or commit to main/develop.
   - Tasks: 'dotnet restore', 'dotnet build --no-restore', 'dotnet test', static code analysis (SonarQube).
   - Output: Immutable build drop / container image pushed to Azure Container Registry (ACR).
2. Continuous Delivery (CD):
   - Deploys automatically to Dev, QA, and Staging.
   - Deploys to Production only after a Human Approval Gate (e.g. Lead Engineer or Release Manager signs off).
3. Continuous Deployment:
   - Full automated pipeline from commit to Production, guarded by automated smoke tests, canary metrics, and synthetic monitoring.`,
    codeSnippet: `# Conceptual Azure DevOps Pipeline Flow
trigger:
  branches:
    include:
      - main

stages:
- stage: BuildAndTest # CI Stage
  displayName: 'Continuous Integration'
  jobs:
  - job: Compile
    steps:
    - task: DotNetCoreCLI@2
      inputs:
        command: 'build'
    - task: DotNetCoreCLI@2
      inputs:
        command: 'test'

- stage: DeployStaging # CD Stage (Automated)
  displayName: 'Continuous Delivery to Staging'
  dependsOn: BuildAndTest

- stage: DeployProduction # CD (Manual Approval) or Continuous Deployment (Automatic)
  displayName: 'Deploy to Production'
  dependsOn: DeployStaging
  # Configured with Azure DevOps Environment Approval Check`,
    redFlags: [
      "Confusing Continuous Delivery (has manual production gate) with Continuous Deployment (fully autonomous production release).",
      "Running CI builds only once a week or manually before releases.",
      "Skipping unit tests during CI builds to make the pipeline run faster."
    ],
    proTips: [
      "Most enterprise financial and healthcare companies practice Continuous Delivery rather than Continuous Deployment because regulatory compliance (SOC2, HIPAA, PCI-DSS) requires explicit audit trails and human approval gates before production releases."
    ]
  },
  {
    title: "How do you structure Azure DevOps Pipeline Stages, Jobs, and Steps for a .NET application?",
    seniority: "Mid-to-Senior",
    tags: ["Azure DevOps", "YAML", "Pipelines", "Architecture", "CI/CD"],
    pitch: "An Azure DevOps pipeline follows a clear hierarchy: Stages represent major lifecycle phases (Build, Staging, Production) and act as environment and approval boundaries; Jobs run inside a stage and execute concurrently on dedicated build agents; and Steps are sequential tasks, scripts, or tool commands executed within a single job. Breaking pipelines into discrete stages allows parallel agent execution, artifact reuse, and granular rollback control.",
    analogy: "A multi-stage rocket: The 1st Stage launches the rocket (Build & Test). The 2nd Stage enters low orbit (Staging Deploy). The 3rd Stage docks at the space station (Production Deploy). Each stage contains multiple astronauts doing specific jobs simultaneously.",
    deepDive: `Hierarchy and Execution Rules:
1. Pipeline -> Stage -> Job -> Step:
   - Pipeline: The complete root workflow defined in 'azure-pipelines.yml'.
   - Stage: Boundary for approvals and environments. Stages can depend on previous stages ('dependsOn: Build').
   - Job: Allocates a fresh virtual machine (or container) agent. Multiple jobs within a stage run in PARALLEL by default.
   - Step: Lowest level; runs sequentially on the agent (e.g. 'script', 'task: DotNetCoreCLI@2').
2. Agent Workspace Isolation:
   - Each Job starts on a clean VM disk. Files created in Job A do NOT exist in Job B unless explicitly published and downloaded via Pipeline Artifacts!`,
    codeSnippet: `stages:
- stage: Build
  displayName: 'Build & Unit Test'
  jobs:
  - job: BuildJob
    pool:
      vmImage: 'ubuntu-latest'
    steps:
    - task: UseDotNet@2
      inputs:
        version: '8.0.x'
    - script: dotnet build --configuration Release
      displayName: 'dotnet build'
    - script: dotnet test --configuration Release --logger trx
      displayName: 'dotnet test'
    - task: PublishBuildArtifacts@1
      inputs:
        PathtoPublish: '$(Build.ArtifactStagingDirectory)'
        ArtifactName: 'drop'

- stage: DeployProd
  displayName: 'Deploy to Production'
  dependsOn: Build
  condition: succeeded()
  jobs:
  - deployment: DeployWeb
    environment: 'production' # Triggers Azure DevOps Approvals
    strategy:
      runOnce:
        deploy:
          steps:
          - download: current
            artifact: drop
          - script: echo "Deploying artifact to Azure App Service..."`,
    redFlags: [
      "Putting build, test, staging, and production deployment into a single monolithic script step.",
      "Assuming files created in one Job are automatically available in another Job without publishing artifacts.",
      "Not setting 'condition: succeeded()' on deployment stages."
    ],
    proTips: [
      "Use 'deployment' jobs rather than standard 'job' definitions when deploying to environments. Deployment jobs integrate with Azure DevOps Environments, providing audit history, health checks, and automated rollback strategies."
    ]
  },
  {
    title: "Why should teams choose YAML Pipelines over Classic UI Release Pipelines in Azure DevOps?",
    seniority: "Mid-to-Senior",
    tags: ["Azure DevOps", "YAML", "Pipelines-as-Code", "Best Practices"],
    pitch: "YAML pipelines implement 'Pipeline as Code', storing the pipeline definition directly in Git alongside the application code. This provides full version control, branch isolation (pipeline changes can be tested on a feature branch without breaking main), Pull Request reviews for infrastructure changes, and easy disaster recovery. Classic UI pipelines are configured via web browser clicks, cannot be branch-versioned, and make tracking configuration history painful.",
    analogy: "YAML pipelines are a recipe printed directly on the food box: if you change the recipe for a new flavor, the instructions travel with the box. Classic UI pipelines are sticky notes posted on the kitchen refrigerator: someone can accidentally change them without anyone knowing who did it or when.",
    deepDive: `Key Advantages of Pipeline-as-Code (YAML):
1. Branching & Testing:
   - When migrating to .NET 8, you update 'azure-pipelines.yml' on your feature branch to test the build. Main branch continues running .NET 7 unaffected!
2. Pull Request Auditing:
   - Every change to build scripts, environment variables, or deploy steps requires a code review approval before merging.
3. Disaster Recovery & Cloning:
   - Recreating a pipeline in a new Azure DevOps organization takes 30 seconds: just point the pipeline to the existing YAML file.
4. Microsoft Direction:
   - Classic pipelines are legacy and in maintenance mode. All modern features (environments, templates, container jobs) are YAML-first.`,
    codeSnippet: `# Reusable YAML Template Pattern
# templates/build-dotnet.yml
parameters:
  - name: projectPath
    type: string

steps:
- task: DotNetCoreCLI@2
  displayName: 'Build \${{ parameters.projectPath }}'
  inputs:
    command: 'build'
    projects: '\${{ parameters.projectPath }}'

# Main azure-pipelines.yml consuming the template:
steps:
- template: templates/build-dotnet.yml
  parameters:
    projectPath: 'src/Api/Api.csproj'`,
    redFlags: [
      "Configuring new production pipelines using Classic Web UI in modern projects.",
      "Hardcoding secrets or environment-specific passwords directly into YAML files.",
      "Not modularizing complex pipelines using YAML templates."
    ],
    proTips: [
      "Leverage YAML Templates ('template: templates/step.yml'). Templates let your platform engineering team define standardized security scanning and testing steps that every microservice repo includes with 2 lines of code."
    ]
  },
  {
    title: "How do Build Artifacts work in CI/CD, and why must they be immutable?",
    seniority: "Mid-to-Senior",
    tags: ["DevOps", "Build Artifacts", "Immutability", "Pipelines"],
    pitch: "A Build Artifact is a compiled, versioned, deployable package (such as a zip file of compiled .NET binaries or a tagged Docker container image) produced once during the CI build stage. Immutability means the exact same artifact is promoted sequentially through Dev, QA, Staging, and Production without ever being recompiled. Recompiling per environment introduces non-deterministic risks where subtle code drifts, dependency updates, or compiler differences cause Staging and Production to behave differently.",
    analogy: "A passport: The government prints and seals your physical passport booklet once (immutable artifact). When you travel from airport to airport (Dev, Staging, Production), border guards stamp your passport to grant entry, but nobody ever cuts open your passport and reprints your pages in each country.",
    deepDive: `The 'Build Once, Deploy Anywhere' Golden Rule:
1. Why Recompilation is an Anti-Pattern:
   - If you run 'dotnet build' on Dev, and then run 'dotnet build' on Prod 3 days later, an unpinned NuGet dependency or floating patch could introduce a breaking bug only on Prod!
2. How to Handle Environment Differences:
   - Separate code from configuration.
   - The compiled DLLs/container image remain IDENTICAL across all environments.
   - Environment-specific settings (database connection strings, API keys) are injected at RUNTIME via environment variables or Azure App Service Configuration.`,
    codeSnippet: `# 1. CI Stage: Package immutable drop
- task: DotNetCoreCLI@2
  inputs:
    command: 'publish'
    publishWebProjects: true
    arguments: '--configuration Release --output $(Build.ArtifactStagingDirectory)'

- task: PublishPipelineArtifact@1
  inputs:
    targetPath: '$(Build.ArtifactStagingDirectory)'
    artifact: 'ProductionReadyDrop'

# 2. CD Stage: Download and deploy THE EXACT SAME DROP to multiple environments
- stage: DeployProd
  jobs:
  - job: Deploy
    steps:
    - download: current
      artifact: 'ProductionReadyDrop'
    - task: AzureWebApp@1
      inputs:
        appType: 'webApp'
        appName: 'my-production-app'
        package: '$(Pipeline.Workspace)/ProductionReadyDrop/**/*.zip'`,
    redFlags: [
      "Running 'dotnet publish' separately inside each deployment stage for Dev, Staging, and Production.",
      "Baking environment-specific connection strings directly into appsettings.json inside the compiled artifact.",
      "Modifying files directly inside the compiled drop folder before deployment."
    ],
    proTips: [
      "Follow the 12-Factor App methodology: Strictly separate configuration from code. Inject configuration via Azure App Configuration, Azure Key Vault, or Kubernetes ConfigMaps at runtime."
    ]
  },
  {
    title: "How do Branch Policies and Pull Request Gates enforce code quality in Azure Repos / GitHub?",
    seniority: "Mid-to-Senior",
    tags: ["Azure DevOps", "Branch Policies", "Pull Requests", "Code Quality", "Governance"],
    pitch: "Branch policies protect critical branches (like `main` and `release/*`) by blocking direct commits and requiring code to pass through Pull Request gates before merging. Standard policies include: requiring a minimum number of peer code reviewers, enforcing linked work items for traceability, requiring all reviewer comment threads to be explicitly resolved, and running automated Build Validation pipelines that ensure the code builds cleanly and passes all unit tests.",
    analogy: "A bank vault with dual-key access: No single employee can walk into the vault and take money alone. Opening the door requires two authorized keys turned at the exact same time (peer reviews) and a log entry detailing why the vault was accessed (linked work item).",
    deepDive: `Essential Branch Policy Checklist:
1. Minimum Number of Reviewers:
   - Require at least 1 or 2 approvals; automatically reset approvals when new commits are pushed to the PR branch.
2. Build Validation:
   - Azure DevOps automatically triggers the CI pipeline against a simulated merge commit of the PR branch into main. If tests fail, merge button is disabled!
3. Check for Linked Work Items:
   - Enforces that every line of code traces back to an approved user story or bug ticket in Azure Boards.
4. Comment Resolution:
   - Prevents merging while questions or change requests remain open.
5. Merge Strategy:
   - Enforce Squash Merge (keeps main branch history linear and clean) or Semi-linear Merge.`,
    codeSnippet: `# Azure CLI script to programmatically configure Branch Policies on 'main':
az repos policy required-reviewer create \
  --branch main \
  --enabled true \
  --minimum-approver-count 2 \
  --repository-id $REPO_ID

az repos policy build create \
  --branch main \
  --build-definition-id $BUILD_DEF_ID \
  --display-name "PR Build Validation" \
  --enabled true \
  --queue-build-on-commit true \
  --repository-id $REPO_ID

az repos policy comment-resolution create \
  --branch main \
  --enabled true \
  --repository-id $REPO_ID`,
    redFlags: [
      "Allowing developers (even admins) to push commits directly to the 'main' branch without a PR.",
      "Not resetting approvals when a developer pushes subsequent commits to an already approved PR.",
      "Ignoring build validation failures and bypassing PR gates to 'push fixes quickly'."
    ],
    proTips: [
      "Enable 'Automatically include code reviewers' based on file paths. For example, automatically add the Senior Database Architect whenever any file under 'src/Database/Migrations/*' is touched in a PR."
    ]
  },
  {
    title: "How do you securely handle Secrets and integrate Azure Key Vault into CI/CD pipelines?",
    seniority: "Mid-to-Senior",
    tags: ["Azure DevOps", "Security", "Azure Key Vault", "Secrets Management"],
    pitch: "Secrets (passwords, connection strings, API tokens) must never be stored in plaintext in Git repositories or pipeline YAML files. In Azure DevOps, secrets are stored either as Secret Variables (which are automatically masked in build logs with '***'), Variable Groups linked directly to Azure Key Vault, or fetched dynamically during pipeline execution using Managed Identities or Workload Identity Federation with the AzureKeyVault task.",
    analogy: "A hotel safety deposit box: Instead of leaving your passport and jewelry sitting on the bed, you lock them in the safe. The front desk gives you a temporary, expiring keycard (managed identity) that opens the safe only while you are an active guest.",
    deepDive: `Security Architecture:
1. Azure Key Vault Integration:
   - Link an Azure DevOps Variable Group directly to an Azure Key Vault instance.
   - Azure DevOps authenticates using an Azure Service Principal or Workload Identity.
   - Pipeline reads secrets as variables (e.g. '$(DbPassword)').
2. Secret Masking:
   - Azure DevOps scans pipeline logs and replaces any printed secret values with '***'.
   - Warning: If a secret is base64-encoded or split across lines, log masking can be bypassed!
3. Zero-Trust Access:
   - Build agents should only have read access (GET/LIST) on specific Key Vault secrets, never administrative or delete permissions.`,
    codeSnippet: `# Fetch secrets dynamically from Azure Key Vault in pipeline:
steps:
- task: AzureKeyVault@2
  displayName: 'Retrieve Production Secrets'
  inputs:
    azureSubscription: 'Azure-Production-ServiceConnection'
    KeyVaultName: 'kv-ecommerce-prod'
    SecretsFilter: 'DatabaseConnectionString, StripeApiKey'
    RunAsPreJob: true

# Consuming secrets in subsequent task:
- task: AzureWebApp@1
  inputs:
    azureSubscription: 'Azure-Production-ServiceConnection'
    appName: 'my-payment-api'
    appSettings: '-ConnectionStrings:DefaultConnection "$(DatabaseConnectionString)" -Stripe:SecretKey "$(StripeApiKey)"'`,
    redFlags: [
      "Committing appsettings.Production.json with live database passwords into Git.",
      "Echoing secrets into pipeline logs using 'echo $(SecretVariable)'.",
      "Using personal access tokens (PATs) that never expire instead of Managed Identities."
    ],
    proTips: [
      "Migrate your Azure DevOps Service Connections to 'Workload Identity Federation'. This eliminates client secrets and certificates entirely by using short-lived OIDC tokens exchanged between Azure DevOps and Microsoft Entra ID."
    ]
  },
  {
    title: "How do you configure Multi-Stage Environments and Manual Approval Gates in Azure Pipelines?",
    seniority: "Mid-to-Senior",
    tags: ["Azure DevOps", "Environments", "Approvals", "Governance", "CD"],
    pitch: "Azure DevOps Environments represent physical or logical deployment targets (Dev, QA, Staging, Production). You configure Environment Checks—such as required human approvals, business hours restrictions, Azure Monitor alert checks, and branch controls—directly on the Environment in the Azure DevOps portal. When a pipeline's deployment job targets that environment, the pipeline automatically pauses, sends approval notifications, and verifies gates before proceeding.",
    analogy: "A rocket launch countdown: Before the booster fires, the Flight Director polls each station ('Propulsion? Go. Telemetry? Go. Medical? Go.'). If any station says 'No' or fails to respond, the launch is automatically halted.",
    deepDive: `Environment Governance Capabilities:
1. Approvals:
   - Specify designated approvers (e.g. Lead Developer, QA Lead, Product Owner).
   - Require approvers to be different from the person who submitted the PR (separation of duties).
2. Branch Control Checks:
   - Ensure that deployments to the 'Production' environment can ONLY originate from the 'main' or 'release/*' branches.
3. Business Hours Restriction:
   - Prevent deployments during high-traffic peak hours (e.g. allow prod deployments only Tuesdays to Thursdays between 6 PM and 10 PM).
4. Invoke REST API / Azure Monitor Alerts:
   - Query Azure Monitor to ensure staging CPU and error rates are healthy for 15 minutes before permitting production deployment.`,
    codeSnippet: `# azure-pipelines.yml targeting protected environment
- stage: DeployProduction
  displayName: 'Production Deployment'
  dependsOn: DeployStaging
  jobs:
  - deployment: ProductionDeploy
    displayName: 'Deploy to Production App Service'
    pool:
      vmImage: 'ubuntu-latest'
    # 'production' environment has Approvals and Branch Checks configured in Azure Portal:
    environment: 'production' 
    strategy:
      runOnce:
        deploy:
          steps:
          - script: echo "Pipeline paused until approver clicks Approve in Azure DevOps UI!"
          - script: echo "Deploying to live production..."`,
    redFlags: [
      "Deploying straight from developer feature branches directly to Production.",
      "Having zero manual approval gates or smoke tests between Staging and Production.",
      "Allowing the developer who wrote the code to unilaterally approve their own deployment to production without peer review."
    ],
    proTips: [
      "Combine Manual Approvals with 'Azure Monitor Alert' checks. If an active P1 alert is currently firing in Azure Monitor, the environment check will automatically fail and block the deployment until the incident is resolved."
    ]
  },
  {
    title: "How do you systematically triage and diagnose a broken CI/CD pipeline?",
    seniority: "Mid-to-Senior",
    tags: ["DevOps", "Troubleshooting", "Pipeline Failures", "Debugging"],
    pitch: "I diagnose pipeline failures through a systematic 4-step triage process: 1) Identify the failure category (Code/Test failure vs Infrastructure/Agent issue vs Network/Permission error); 2) Inspect the raw task logs and enable system diagnostics ('system.debug=true'); 3) Reproduce locally by running the exact CLI commands on the same operating system and .NET SDK version; and 4) If infrastructure-related, verify agent disk space, expired service connection credentials, or package registry outages.",
    analogy: "A factory assembly line that stopped moving: First check if a defective part jammed a machine (test failure), then check if the power went out in the building (agent outage), then check if the delivery truck carrying raw materials was delayed (NuGet/NPM feed timeout).",
    deepDive: `The 4 Failure Archetypes & Diagnosis:
1. Code / Unit Test Failures (70% of issues):
   - Symptoms: 'dotnet build' or 'dotnet test' exits with code 1.
   - Action: Check test output in the Azure DevOps 'Tests' tab. Look for failed assertions or environment-specific path bugs (e.g. Linux path separator '/' vs Windows '\\').
2. Authentication / Permission Failures (15%):
   - Symptoms: 'HTTP 401 Unauthorized' or 'HTTP 403 Forbidden' when downloading packages or pushing to ACR.
   - Action: Check if Azure Service Connection secret or Entra App Registration expired.
3. Transient Network / Feed Failures (10%):
   - Symptoms: Timeout connecting to nuget.org or npmjs.com.
   - Action: Implement retry logic or use Azure Artifacts upstream caching.
4. Agent Disk / Resource Exhaustion (5%):
   - Symptoms: 'No space left on device'.
   - Action: Clean temporary files, prune old Docker images, or increase agent disk size.`,
    codeSnippet: `# Enable System Diagnostics in Pipeline definition:
variables:
  system.debug: 'true' # Outputs verbose debug logging for all tasks

# Local Reproduction Steps (matching pipeline container/agent):
# 1. Pull exact SDK container used by agent:
# docker run -it --rm -v \${PWD}:/app -w /app mcr.microsoft.com/dotnet/sdk:8.0 bash

# 2. Run the exact pipeline commands inside Linux:
# dotnet restore
# dotnet build --configuration Release --no-restore
# dotnet test --configuration Release --no-build`,
    redFlags: [
      "Randomly pushing 10 'test fix' commits to main without reading the failure logs.",
      "Developing exclusively on Windows without checking if Linux build agents handle case-sensitive file paths.",
      "Assuming a failure is 'just a flaky pipeline' without investigating the root cause."
    ],
    proTips: [
      "Remember that Microsoft-hosted Ubuntu agents have CASE-SENSITIVE file systems. A C# project referencing 'MyModel.cs' when the file is named 'mymodel.cs' compiles perfectly on Windows laptops but fails immediately on Linux CI agents!"
    ]
  },
  {
    title: "How do Zero-Downtime Rollback Strategies work (Blue/Green, Canary, Slot Swaps)?",
    seniority: "Senior",
    tags: ["DevOps", "Deployment Strategies", "Zero-Downtime", "Blue-Green", "Canary", "Rollback"],
    pitch: "Zero-downtime deployment strategies eliminate service interruptions during releases and provide instant rollback capabilities. In Blue/Green deployments, two identical production environments exist; the new version is deployed to 'Green' and fully verified before router traffic is instantly switched from 'Blue'. Azure App Service Deployment Slots implement Blue/Green via Slot Swaps with zero downtime. Canary deployments route a small percentage of user traffic (e.g. 5%) to the new version to monitor error rates before expanding rollout.",
    analogy: "A high-speed train switching tracks: The railway maintenance team builds a brand new parallel track (Green). Once safety inspections pass, the switchman flips a single lever to route the oncoming train onto the new track without the train ever having to slow down or stop.",
    deepDive: `Mechanics of Azure App Service Slot Swaps:
1. Pre-Swap Warmup:
   - The new build deploys to the 'Staging' slot.
   - Azure warms up the app: triggers HTTP requests to your health check endpoint ('/healthz') to compile JIT code and prime database connection pools.
2. The Atomic IP / Virtual Router Swap:
   - Once healthy, Azure flips the virtual IP routing rules.
   - The Staging slot becomes Production, and previous Production becomes Staging.
3. Instant 10-Second Rollback:
   - If unexpected errors occur in production, execute another Slot Swap! The old, proven version is immediately restored with zero rebuild delay.
4. Database Backward-Compatibility Requirement:
   - Database migrations must support BOTH versions simultaneously (Expand and Contract pattern). Never drop columns in a release!`,
    codeSnippet: `# Azure App Service Slot Swap Pipeline Task
- task: AzureAppServiceManage@0
  displayName: 'Deploy to Staging Slot & Warm Up'
  inputs:
    azureSubscription: 'Azure-Production-Connection'
    Action: 'Swap Slots'
    WebAppName: 'ecommerce-api-prod'
    ResourceGroupName: 'rg-ecommerce-prod'
    SourceSlot: 'staging'
    SwapWithProduction: true
    # Azure warms up the application before traffic routing flips!`,
    redFlags: [
      "Deploying database schema changes that break the previous version of the application before the slot swap is verified.",
      "Deploying directly to production during business hours without warmup, causing the first 100 users to suffer 15-second cold-start latency.",
      "Not testing the instant rollback procedure regularly."
    ],
    proTips: [
      "Use the 'Expand and Contract' (Parallel Run) database pattern: Phase 1: Add new nullable column. Phase 2: Deploy new app writing to both. Phase 3: Backfill old data. Phase 4: Deprecate and drop old column in a future release."
    ]
  },
  {
    title: "What is the difference between a Docker Image and a Docker Container?",
    seniority: "Mid-to-Senior",
    tags: ["Docker", "Containers", "Virtualization", "Linux Internals"],
    pitch: "A Docker Image is a read-only, immutable template or snapshot composed of layered file systems containing the application code, runtime libraries, environment variables, and dependencies. A Docker Container is a live, running instance of an image executed in an isolated process sandbox using Linux kernel primitives: Namespaces (which isolate process IDs, networking, and mount points) and Control Groups (cgroups, which limit CPU and memory consumption).",
    analogy: "An Image is a blueprint for a house printed on paper. A Container is the actual physical house built from that blueprint where people are living and using electricity.",
    deepDive: `Under the Hood (Linux Kernel Primitives):
1. Docker Image:
   - Composed of read-only Union File System layers (Overlay2).
   - Once built and tagged with a SHA256 digest, it can never be altered.
2. Docker Container:
   - Docker adds a thin, read-write 'Container Layer' on top of the read-only image layers.
   - Any files modified while the container is running are stored in this ephemeral layer (discarded on container destroy).
3. Namespaces vs Cgroups:
   - Namespaces isolate what a container can SEE (Process tree, IP address, hostname, filesystem mounts).
   - Cgroups limit what a container can USE (Max 2 CPU cores, Max 4GB RAM).`,
    codeSnippet: `# 1. Build an immutable Image from Dockerfile:
# docker build -t my-dotnet-api:v1.0 .

# 2. Inspect Image layers and size:
# docker image history my-dotnet-api:v1.0

# 3. Instantiate a live, isolated Container with CPU and memory cgroup limits:
# docker run -d \
#   --name api-instance-1 \
#   -p 8080:8080 \
#   --cpus="1.5" \
#   --memory="1g" \
#   my-dotnet-api:v1.0

# 4. View running containers and resource metrics:
# docker ps
# docker stats api-instance-1`,
    redFlags: [
      "Believing a Docker container is a full virtual machine with its own guest OS kernel (containers share the host OS kernel).",
      "Treating containers as persistent virtual machines by logging into them and manually modifying configuration files.",
      "Not placing memory and CPU limits on containers in production."
    ],
    proTips: [
      "Because containers share the host Linux kernel, container startup takes milliseconds compared to minutes for VMs. This lightweight isolation is what enables instantaneous auto-scaling in Kubernetes and Azure Container Apps."
    ]
  },
  {
    title: "How does Dockerfile Layer Caching work, and how do you optimize instruction order to speed up builds?",
    seniority: "Mid-to-Senior",
    tags: ["Docker", "Dockerfile", "Layer Caching", "Build Optimization"],
    pitch: "Each instruction in a Dockerfile (RUN, COPY, ADD) creates a cached, read-only filesystem layer. When rebuilding an image, Docker reuses previously cached layers unless the instruction or the files copied into it have changed. Once a layer's cache is invalidated, every subsequent layer after it must be rebuilt from scratch. To maximize build speed, order instructions from least frequently changing (base images, OS packages, NuGet restore) to most frequently changing (application source code).",
    analogy: "Packing a layered lasagna: You lay down the pasta sheets and cheese at the bottom once (rarely change). You only swap out the fresh garnishes on top at the very end. If you stir the bottom sauce layer, you have to rebuild the entire lasagna from scratch.",
    deepDive: `The Cache Invalidation Domino Effect:
1. Cache Invalidation Rules:
   - For 'RUN', Docker checks if the exact command string matches the cache.
   - For 'COPY', Docker calculates a checksum of the files being copied.
2. The Anti-Pattern:
   - 'COPY . .' before 'RUN dotnet restore' invalidates the NuGet restore cache on EVERY single character typed in a C# file!
   - Result: 3-minute build time on every commit.
3. The Optimized Pattern:
   - Copy ONLY '.csproj' and '.sln' files first.
   - Run 'dotnet restore'.
   - THEN copy the remaining source code ('COPY . .').
   - Result: NuGet packages are cached; rebuild takes 4 seconds!`,
    codeSnippet: `# ❌ BAD DOCKERFILE: Copies everything before restore
# COPY . .
# RUN dotnet restore # Re-downloads NuGet packages on EVERY code change!

# ✅ HIGHLY OPTIMIZED DOCKERFILE:
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Step 1: Copy ONLY project files (changes rarely)
COPY ["src/Api/Api.csproj", "src/Api/"]
COPY ["src/Core/Core.csproj", "src/Core/"]

# Step 2: Restore NuGet dependencies (Cached unless .csproj changes!)
RUN dotnet restore "src/Api/Api.csproj"

# Step 3: Copy source code (changes frequently)
COPY . .
WORKDIR "/src/src/Api"
RUN dotnet build "Api.csproj" -c Release -o /app/build`,
    redFlags: [
      "Copying the entire source repository before running dependency restore ('COPY . .').",
      "Running 'apt-get update' and 'apt-get install' in separate RUN instructions (can result in stale package caches).",
      "Not including a '.dockerignore' file, causing 'bin/', 'obj/', and '.git/' to be copied into the image."
    ],
    proTips: [
      "Always maintain a clean '.dockerignore' file containing '**/bin', '**/obj', '.git', and '*.user'. This prevents local machine build artifacts from polluting the container build context."
    ]
  },
  {
    title: "Why are Multi-Stage Docker Builds essential for .NET applications, and how do they reduce image size and attack surface?",
    seniority: "Mid-to-Senior",
    tags: ["Docker", "Multi-Stage", "Security", "Optimization", ".NET 8"],
    pitch: "Multi-Stage builds use multiple `FROM` instructions in a single Dockerfile. A heavy build stage (using the full .NET SDK ~800MB) compiles the code, executes tests, and publishes binaries; a minimal runtime stage (using the lightweight ASP.NET Core Runtime or Chiseled Ubuntu ~100MB) copies only the final published DLLs. This shrinks the production image size by over 80%, eliminates compilers and package managers from production, and drastically reduces the security attack surface and CVE vulnerabilities.",
    analogy: "A construction crane on a building site: You need massive scaffolding, heavy cranes, and cement mixers to build a skyscraper. Once the building is finished, you remove all the construction machinery; tenants don't need a 50-ton crane sitting in their living room.",
    deepDive: `Architectural Benefits:
1. Image Size Reduction:
   - .NET SDK Image: ~850 MB.
   - .NET ASP.NET Runtime: ~220 MB.
   - .NET Chiseled (Distroless): ~100 MB!
2. Security Hardening:
   - No compiler ('csc' / 'dotnet build') in production.
   - No package managers ('apt', 'yum', 'npm') that attackers can use to install malware after a remote code execution exploit.
   - Runs as a non-root user by default in .NET 8+.
3. Portability:
   - The entire build environment is containerized; developers don't even need the .NET SDK installed on their host machines to build the app.`,
    codeSnippet: `# Stage 1: Heavy Build Environment (.NET SDK)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build-env
WORKDIR /app

COPY *.csproj ./
RUN dotnet restore

COPY . ./
RUN dotnet publish -c Release -o /app/out --no-restore

# Stage 2: Minimal Production Runtime (Distroless / Non-Root)
FROM mcr.microsoft.com/dotnet/aspnet:8.0-jammy-chiseled AS runtime
WORKDIR /app
COPY --from=build-env /app/out .

# Runs as non-root user 'app' (UID 1654) by default in .NET 8!
USER app
EXPOSE 8080
ENTRYPOINT ["dotnet", "MyApi.dll"]`,
    redFlags: [
      "Shipping the entire .NET SDK image to production.",
      "Running production containers as the 'root' user.",
      "Leaving source code, git metadata, and build tools inside the production container."
    ],
    proTips: [
      "In .NET 8+, use the Microsoft 'chiseled' images ('mcr.microsoft.com/dotnet/aspnet:8.0-jammy-chiseled'). They contain zero package managers and zero shell binaries ('/bin/sh' does not exist!), completely neutralizing shell injection attacks."
    ]
  },
  {
    title: "What is the difference between EXPOSE in a Dockerfile and Port Mapping (-p host:container)?",
    seniority: "Mid-to-Senior",
    tags: ["Docker", "Networking", "Ports", "EXPOSE", "Port Mapping"],
    pitch: "EXPOSE is documentation metadata inside the Dockerfile indicating which port the application inside the container is listening on; it does NOT publish or open the port to the outside world. Port Mapping (-p hostPort:containerPort) is an active Docker runtime command that configures host network routing and firewall iptables rules, actively forwarding incoming traffic from a physical host port into the container's private IP network.",
    analogy: "EXPOSE is painting 'Main Entrance on 5th Street' on your building wall (informational sign). Port Mapping is unlocking the front door, stationing a doorman, and connecting a private pedestrian bridge from 5th Street directly into your lobby.",
    deepDive: `Networking Mechanics:
1. Dockerfile 'EXPOSE 8080':
   - Functions as documentation for developers and container orchestrators.
   - Does NOT make the port accessible from the host machine browser.
2. Runtime '-p 5000:8080':
   - Tells Docker engine to bind port 5000 on the host machine network interface.
   - When a browser hits 'http://localhost:5000', Docker bridges the request to port 8080 inside the container's isolated network namespace.
3. .NET 8 Port Change:
   - In .NET 8+, ASP.NET Core default HTTP port changed from port 80 to port 8080 to enable non-root user execution (ports below 1024 require Linux root privileges).`,
    codeSnippet: `# In Dockerfile:
# Tells Docker and Azure that the app listens on 8080
EXPOSE 8080

# Shell execution to run container and map host port 5000 -> container port 8080:
# docker run -d -p 5000:8080 --name myapi my-dotnet-api:latest

# Verifying port forwarding rules:
# docker port myapi
# Output: 8080/tcp -> 0.0.0.0:5000`,
    redFlags: [
      "Assuming adding 'EXPOSE 8080' to a Dockerfile automatically makes the container accessible on 'http://localhost:8080' without port mapping.",
      "Binding production containers to host port 80 without SSL/TLS termination at the reverse proxy or ingress controller.",
      "Trying to bind multiple containers to the exact same host port simultaneously (Port conflict error)."
    ],
    proTips: [
      "Always remember the '-p host:container' order: Left is where you connect from on your computer (Host), Right is where the service listens inside Docker (Container)."
    ]
  },
  {
    title: "How does Container Data Persistence work (Volumes vs Bind Mounts vs Ephemeral Storage)?",
    seniority: "Mid-to-Senior",
    tags: ["Docker", "Storage", "Volumes", "Bind Mounts", "Statefulness"],
    pitch: "By default, container storage is ephemeral: any data written to the container's writable layer is permanently destroyed when the container is deleted. Docker Volumes are directories managed entirely by Docker on the host filesystem—they are isolated from host OS details, support backup/encryption, and are the standard for databases and persistent application state. Bind Mounts map an exact file or directory path from the host machine directly into the container—ideal for local development hot-reloading.",
    analogy: "Ephemeral storage is writing on a hotel room notepad: when you check out, the maid throws it in the trash. A Bind Mount is opening a window to your own house across the street to grab a folder. A Docker Volume is renting a climate-controlled private storage locker managed by professional staff.",
    deepDive: `Storage Mechanism Breakdown:
1. Ephemeral Container Layer:
   - Copy-on-Write (CoW) layer. High write latency, destroyed on 'docker rm'.
2. Docker Volumes ('-v volume_name:/data'):
   - Stored in '/var/lib/docker/volumes/' on Linux.
   - Independent of container lifecycle: container can be destroyed and recreated; data remains intact.
   - Recommended for SQL Server, PostgreSQL, Redis persistence.
3. Bind Mounts ('-v /host/path:/container/path'):
   - Relies on host folder structure.
   - Great for mounting source code into containers during local development ('dotnet watch').
4. 12-Factor Stateless Rule:
   - For web APIs, containers should be 100% STATELESS. Store files in Azure Blob Storage / AWS S3, not on local disks.`,
    codeSnippet: `# 1. Named Volume for SQL Server Database Persistence:
# docker volume create sqlserver_data
# docker run -d \
#   --name mssql \
#   -e "ACCEPT_EULA=Y" \
#   -e "MSSQL_SA_PASSWORD=P@ssword123!" \
#   -v sqlserver_data:/var/opt/mssql \
#   -p 1433:1433 \
#   mcr.microsoft.com/mssql/server:2022-latest

# 2. Bind Mount for Local Development Hot-Reload:
# docker run -it --rm \
#   -v \${PWD}:/app \
#   -w /app \
#   mcr.microsoft.com/dotnet/sdk:8.0 \
#   dotnet watch run`,
    redFlags: [
      "Storing persistent files (e.g. uploaded user PDFs or avatars) inside the ephemeral container file system.",
      "Using bind mounts in production Kubernetes/Azure Container Apps environments.",
      "Hardcoding Windows-specific file paths inside Docker volume mounts."
    ],
    proTips: [
      "In cloud-native microservices, treat containers as disposable cattle, not pets. Never rely on container local disk persistence for application state; offload all files to object storage (Azure Blob Storage) and state to managed databases."
    ]
  },
  {
    title: "How do you implement Container Health Checks and capture diagnostic logs effectively?",
    seniority: "Mid-to-Senior",
    tags: ["Docker", "Health Checks", "Logging", "Observability", "ASP.NET Core"],
    pitch: "A container health check allows the container runtime and orchestrators to determine whether the application inside the container is actively healthy, degraded, or dead. In ASP.NET Core, we expose a `/healthz` endpoint using `Microsoft.Extensions.Diagnostics.HealthChecks` and register a `HEALTHCHECK` command in the Dockerfile. For logging, applications must write structured JSON logs directly to `stdout` and `stderr`; Docker captures this output into its logging driver without requiring file I/O.",
    analogy: "A submarine sonar ping: The control tower sends a ping every 30 seconds. If the submarine responds with an authentic status tone, the mission continues. If the submarine stops answering, the system automatically launches an emergency rescue buoy (orchestrator restarts the container).",
    deepDive: `Health Checks & Logging Architecture:
1. HEALTHCHECK Directive:
   - Parameters: '--interval=30s --timeout=3s --start-period=5s --retries=3'.
   - Status transitions from starting -> healthy -> unhealthy.
   - Unhealthy containers are marked for automatic recycling by Kubernetes/Azure Container Apps.
2. Logging to stdout / stderr (12-Factor Principle XI):
   - Never write application logs to internal text files ('C:\\logs\\app.log').
   - Writing to console allows Docker, Azure Log Analytics, Datadog, or Fluentd to stream and aggregate logs centrally without disk contention.`,
    codeSnippet: `// 1. ASP.NET Core Program.cs Health Checks Setup
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHealthChecks()
    .AddSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")!)
    .AddCheck("Self", () => HealthCheckResult.Healthy());

var app = builder.Build();

app.MapHealthChecks("/healthz");
app.Run();

# 2. Dockerfile HEALTHCHECK instruction
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \\
  CMD curl -f http://localhost:8080/healthz || exit 1`,
    redFlags: [
      "Writing application logs to physical disk files inside the container instead of stdout.",
      "Exposing health check endpoints that perform heavy database queries without caching or timeouts, causing false-positive pod restarts.",
      "Not configuring a 'start-period' on health checks, causing slow-starting apps to be killed prematurely."
    ],
    proTips: [
      "Separate Liveness checks ('Am I alive and not deadlocked?') from Readiness checks ('Are my database migrations finished and am I ready to receive user traffic?'). In ASP.NET Core, you can map separate endpoints: '/healthz/live' and '/healthz/ready'."
    ]
  },
  {
    title: "How do you deploy containerized .NET applications to Azure (Container Apps vs App Service)?",
    seniority: "Mid-to-Senior",
    tags: ["Azure", "Azure Container Apps", "App Service", "Deployment", "Architecture"],
    pitch: "Azure Container Apps (ACA) is a serverless container platform built on Kubernetes (KEDA + Envoy + Dapr); it is ideal for microservices, background event-driven workers, and apps requiring scale-to-zero cost savings. Azure App Service for Containers is an enterprise PaaS offering ideal for standalone web applications that require simple deployment slots, integrated custom domains, and traditional enterprise networking without orchestrator complexity.",
    analogy: "Azure App Service is renting an apartment in a luxury high-rise: everything is fully furnished, utilities are included, and maintenance is handled for you. Azure Container Apps is renting a modular shipping container home in an eco-village: it expands or shrinks automatically based on how many friends visit, and costs nothing when you are away.",
    deepDive: `Decision Matrix:
1. Azure Container Apps (ACA):
   - Built on top of managed Kubernetes and KEDA (Kubernetes Event-driven Autoscaling).
   - Can scale to ZERO replicas (zero cost when idle!).
   - Native microservice features: Dapr service-to-service communication, internal ingress, revision management.
2. Azure App Service (Containers):
   - Traditional PaaS.
   - Minimum 1 running VM instance (incurring fixed monthly cost).
   - Best for traditional monolithic ASP.NET Core web apps with deployment slots and straightforward SSL bindings.`,
    codeSnippet: `# Azure CLI deployment to Azure Container Apps
# 1. Create Azure Container Registry (ACR) & Container App Environment
az acr create --resource-group rg-microservices --name acrmyapi --sku Basic

# 2. Build and push image to ACR:
az acr build --registry acrmyapi --image ecommerce-api:v1.0 .

# 3. Deploy to serverless Azure Container App:
az containerapp create \
  --name ecommerce-api \
  --resource-group rg-microservices \
  --environment my-env \
  --image acrmyapi.azurecr.io/ecommerce-api:v1.0 \
  --target-port 8080 \
  --ingress 'external' \
  --min-replicas 0 \
  --max-replicas 10 \
  --cpu 0.5 --memory 1.0Gi`,
    redFlags: [
      "Deploying complex microservices suites with 15 interconnected APIs directly onto monolithic App Service plans.",
      "Leaving container images in public Docker Hub instead of private Azure Container Registry (ACR).",
      "Not configuring min/max replica boundaries on autoscaling container apps."
    ],
    proTips: [
      "In Azure Container Apps, use KEDA autoscalers. You can scale your background worker containers automatically based on the number of unread messages in an Azure Service Bus queue, scaling up to 50 workers during sales and down to 0 when empty."
    ]
  },
  {
    title: "How do you explain Kubernetes and Container Orchestration honestly without overclaiming in an interview?",
    seniority: "Senior",
    tags: ["Kubernetes", "Architecture", "Interview Strategy", "Containers", "DevOps"],
    pitch: "As a Senior .NET Developer, my core expertise is designing cloud-native, 12-factor containerized microservices, writing optimized Dockerfiles, configuring health endpoints, and setting up CI/CD pipelines. While I understand Kubernetes architecture—Pods as the atomic unit of execution, Deployments managing desired replica state, Services routing internal traffic, and Ingress controllers handling SSL termination—I work closely with dedicated Platform/DevOps engineers who manage the production cluster infrastructure, Helm charts, and network policies.",
    analogy: "A commercial airline pilot: You are an expert at flying the plane, navigating the instruments, and communicating with air traffic control. You don't claim to have personally manufactured the jet engine turbines or laid down the concrete runway tarmac.",
    deepDive: `The Senior 'Honest Fallback' Formula:
1. Acknowledge the Architecture Confidently:
   - Pod: The smallest deployable unit; wraps one or more containers sharing an IP and network localhost.
   - Deployment: Manages replica sets, declarative updates, and rolling rollbacks.
   - Service (ClusterIP / LoadBalancer): Provides a permanent virtual IP and DNS name across ephemeral pod lifecycles.
   - Ingress: Reverse proxy (Nginx, Traefik) routing external HTTP/HTTPS traffic to internal services.
2. State Your Exact Practical Boundaries:
   - 'In my projects, I build and debug the containerized services, configure KEDA triggers, inspect pod logs via 'kubectl logs', and write deployment YAML manifests, while our SRE team handles cluster upgrades and security admission controllers.'`,
    codeSnippet: `# Standard Kubernetes Deployment Manifest for a .NET API
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
  labels:
    app: order-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: order-service
  template:
    metadata:
      labels:
        app: order-service
    spec:
      containers:
      - name: api
        image: acrmyapi.azurecr.io/orders:v1.0
        ports:
        - containerPort: 8080
        resources:
          limits:
            cpu: "1"
            memory: "512Mi"
          requests:
            cpu: "250m"
            memory: "256Mi"
        livenessProbe:
          httpGet:
            path: /healthz
            port: 8080
          initialDelaySeconds: 15
          periodSeconds: 20`,
    redFlags: [
      "Overclaiming full CKA (Certified Kubernetes Administrator) expertise when you only know how to run 'docker run'.",
      "Claiming you manage bare-metal Kubernetes clusters single-handedly on top of writing 100% of full-stack code.",
      "Not knowing the difference between a Pod and a Container."
    ],
    proTips: [
      "Interviewers respect honesty. Saying 'I know the core Kubernetes workload concepts (Pods, Deployments, Services, ConfigMaps) and can troubleshoot applications via kubectl, but my specialty is application development rather than cluster networking' earns massive credibility."
    ]
  },
  {
    title: "What is Infrastructure as Code (IaC), and why should .NET teams use Bicep or Terraform?",
    seniority: "Mid-to-Senior",
    tags: ["DevOps", "IaC", "Azure Bicep", "Terraform", "Cloud Architecture"],
    pitch: "Infrastructure as Code (IaC) defines and provisions cloud resources (App Services, SQL Databases, Key Vaults) using declarative code files rather than manual Azure portal clicks. Bicep is Microsoft's domain-specific language for Azure, offering zero-state management, day-zero Azure feature support, and clean syntax. Terraform is cloud-agnostic and maintains an external state file. IaC guarantees consistent, reproducible environments, eliminates configuration drift, and allows infrastructure changes to be audited through Pull Requests.",
    analogy: "A 3D printer file for car parts: Instead of a mechanic manually hammering and bending sheet metal by hand differently for every single car (portal clicks), you send an exact CAD blueprint to the 3D printer. Every single part produced is 100% mathematically identical.",
    deepDive: `Bicep vs Terraform for .NET on Azure:
1. Azure Bicep:
   - Native to Azure; compiles down to ARM templates.
   - Day-Zero Support: Every new Azure feature is supported immediately on launch day.
   - No State File: Azure itself represents the live state engine.
2. Terraform:
   - Multi-cloud (Azure, AWS, GCP).
   - Requires managing a 'terraform.tfstate' file (locked in remote storage with concurrency protection).
3. Core IaC Benefits:
   - Spin up an identical ephemeral testing environment for a PR in 5 minutes and tear it down automatically.
   - Disaster recovery: Rebuild an entire cloud region if a datacenter goes dark.`,
    codeSnippet: `// Azure Bicep definition: Provisioning an App Service & Key Vault
param location string = resourceGroup().location
param appName string = 'ecommerce-api-\${uniqueString(resourceGroup().id)}'

resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: '\${appName}-plan'
  location: location
  sku: {
    name: 'B1'
    tier: 'Basic'
  }
}

resource appService 'Microsoft.Web/sites@2022-09-01' = {
  name: appName
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      netFrameworkVersion: 'v8.0'
      appSettings: [
        {
          name: 'ASPNETCORE_ENVIRONMENT'
          value: 'Production'
        }
      ]
    }
  }
}`,
    redFlags: [
      "Provisioning production cloud infrastructure by clicking manually in the Azure Portal (ClickOps).",
      "Storing Terraform state files unencrypted in public repositories.",
      "Not reviewing infrastructure code changes in Pull Requests."
    ],
    proTips: [
      "If your stack is exclusively on Microsoft Azure, choose Azure Bicep over Terraform. Bicep has zero state-locking headaches, offers first-class VS Code intellisense, and guarantees immediate support for all Azure preview features."
    ]
  }
];

console.log('Total Cloud questions:', cloudQuestions.length);

module.exports = { cloudQuestions };

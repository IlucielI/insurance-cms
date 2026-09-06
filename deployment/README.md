# Deployment

This folder contains a two-step Docker setup optimized for faster local rebuilds, mirroring the architecture of `insurance-core-api`.

## Base Image

`Dockerfile.base` installs Node.js and npm dependencies only. Rebuild it when `package.json` or `package-lock.json` changes.

```bash
./deployment/build-base.sh
```

## Application Image

`Dockerfile` uses the prebuilt base image, copies the current source code, injects build metadata (`APP_VERSION`, `GIT_HASH`), runs Next.js standalone build, and produces a minimal Alpine production runner.

```bash
./deployment/build-cms.sh
```

You can override the version and git hash:

```bash
APP_VERSION=0.1.0 GIT_HASH=abc1234 ./deployment/build-cms.sh
```

`GIT_HASH` is automatically resolved from `git rev-parse --short HEAD`. If the repo has no commit yet, it falls back to `dev`.

## Docker Compose

Compose runs the CMS container on port 3000. It does not build `cms-base`, so it will not pull from Docker Hub.

```bash
docker compose -f deployment/docker-compose.yaml up -d
```

## Typical Flow

```bash
./deployment/build-base.sh
./deployment/build-cms.sh
docker compose -f deployment/docker-compose.yaml up -d
```

If only source code changes, rerun `./deployment/build-cms.sh`. If npm dependencies change, rerun both build scripts.

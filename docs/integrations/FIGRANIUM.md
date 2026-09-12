# Figranium integration

Upstream: https://github.com/figranium/figranium
Pinned commit: `4b49c8de0c2ec7497601c7a6f6c81c0049818174`

Figranium is kept as an isolated Git submodule under `tools/figranium` so TheCareers can use it for browser-based source collection without copying or modifying the upstream project.

## Intended use in TheCareers

- Run deterministic browser workflows for job boards and employer career pages.
- Expose saved browser tasks through Figranium's task API.
- Feed structured results into TheCareers ingestion/verification pipeline.
- Keep site-specific browser automation outside the main app runtime.

## Local checkout

```bash
git submodule update --init --recursive
```

Do not place provider credentials or proxy passwords in Git. Configure them only in the deployment environment.

## Deployment boundary

Figranium should run as a separate service/container. The main TheCareers app should call it over an authenticated server-to-server endpoint. Do not expose its control plane publicly without authentication.

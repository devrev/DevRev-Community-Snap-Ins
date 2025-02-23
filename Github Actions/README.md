# DevRev Snap-in Tutorial

This tutorial guides you through installing the DevRev CLI and creating/deploying a snap-in.

## Installing DevRev CLI

### Debian/Linux
```bash
# For amd64
sudo dpkg -i devrev_0.4.0-linux_amd64.deb

# For arm64
sudo dpkg -i devrev_0.4.0-linux_arm64.deb

# Install completions
wget https://raw.githubusercontent.com/devrev/cli/main/install_completions.sh && sh install_completions.sh /usr/local/bin/devrev
```

## Prerequisites

Before starting:
- Install DevRev CLI (steps above)
- Install `jq` for JSON processing
- Create a dev organization in DevRev

## Step-by-Step Guide

### 1. Authentication
```bash
devrev profiles authenticate -o <dev-org-slug> -u <youremail@yourdomain.com>
```

### 2. Initialize Snap-in Template
```bash
devrev snap_in_version init
```

This creates a new directory structure:
```
devrev-snaps-typescript-template/
├── code
│   ├── babel.config.js
│   ├── jest.config.js
│   ├── nodemon.json
│   ├── package.json
│   ├── src
│   │   ├── fixtures
│   │   ├── function-factory.ts
│   │   ├── functions
│   │   ├── index.ts
│   │   ├── main.ts
│   │   └── test-runner
│   ├── tsconfig.eslint.json
│   └── tsconfig.json
├── manifest.yaml
└── README.md
```

### 3. Create Snap-in Package
```bash
# Create package with unique slug
devrev snap_in_package create-one --slug my-first-snap-in | jq .
```

Note: If the slug is already taken, you'll need to choose a different one.

### 4. Create Snap-in Version
```bash
devrev snap_in_version create-one --path ./devrev-snaps-typescript-template
```

Expected output:
```json
{
    "id": "don:integration:dvrv-us-1:devo/fOFb0IdZ:snap_in_package/...",
    "state": "draft"
}
```

Important: A non-published package can only have one snap-in version.

### 5. Manage Snap-in Versions

List versions:
```bash
devrev snap_in_version list
```

Delete version:
```bash
devrev snap_in_version delete-one
```

### 6. Install Snap-in
```bash
devrev snap_in draft
```

### 7. Deploy Snap-in
```bash
# Update snap-in configuration (if needed)
devrev snap_in update

# Activate the snap-in
devrev snap_in activate
```

## Common Operations

### View Snap-in Versions
```bash
devrev snap_in_version list
```

### Upgrade Snap-in Version
```bash
devrev snap_in_version upgrade --manifest <path-to-manifest> --testing-url <updated-url>
```

For non-patch compatible updates:
```bash
devrev snap_in_version upgrade --force --manifest <path-to-manifest> --testing-url <updated-url>
```

### Uninstall DevRev CLI

Debian/Linux:
```bash
sudo dpkg -r devrev
```

MacOS:
```bash
brew uninstall devrev/tools/devrev
```



## Additional Resources

- [Snap-in Manifest Documentation](https://docs.devrev.ai/snap-ins/references/manifest)
- [DevRev CLI Reference](https://docs.devrev.ai/cli)
- [Snap-in Development Guide](https://docs.devrev.ai/snap-ins)

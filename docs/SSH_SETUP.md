# SSH Setup for FinFlow Tracker Repository

## Current SSH Key

An SSH key is already generated and available in the development environment:

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAILSvNIboDvqB2Uq8U2I82DWud0ZI9DHZwEVl5mZ2qFWJ dev@finflow-tracker
```

## Setup Instructions

### Option 1: Add SSH Key to GitHub (Recommended for Long-term Development)

1. Copy the SSH public key above
2. Go to [GitHub SSH Keys Settings](https://github.com/settings/keys)
3. Click "New SSH key"
4. Give it a title (e.g., "FinFlow Tracker Dev Environment")
5. Paste the key in the "Key" field
6. Click "Add SSH key"

Once added, the repository will automatically use SSH for all Git operations.

### Option 2: Use GitHub Access Token (For Temporary Access)

If you cannot add the SSH key to GitHub, you can use a temporary access token:

```bash
# Fetch a new access token (valid for 1 hour)
# Use the fetch_github_access_token tool with repository_name: "Fern-Labs-Open-Source/finflow-tracker"

# Then update the remote URL
git remote set-url origin https://x-access-token:YOUR_TOKEN@github.com/Fern-Labs-Open-Source/finflow-tracker.git
```

## Current Configuration

The environment is pre-configured for SSH authentication:

- **SSH Key Location**: `~/.ssh/id_ed25519`
- **SSH Config**: Already configured in `~/.ssh/config`
- **Repository Remote**: Set to use SSH URL `git@github.com:Fern-Labs-Open-Source/finflow-tracker.git`

## Testing SSH Connection

Once the SSH key is added to GitHub, test the connection:

```bash
ssh -T git@github.com
```

You should see: "Hi USERNAME! You've successfully authenticated..."

## Switching Between SSH and HTTPS

```bash
# To use SSH (recommended)
git remote set-url origin git@github.com:Fern-Labs-Open-Source/finflow-tracker.git

# To use HTTPS with token
git remote set-url origin https://x-access-token:TOKEN@github.com/Fern-Labs-Open-Source/finflow-tracker.git

# Check current remote URL
git remote -v
```

## Troubleshooting

### Permission Denied (publickey)
- Ensure the SSH key is added to your GitHub account
- Check that you're using the correct GitHub account
- Verify the SSH key fingerprint matches

### SSH Key Not Working
- The SSH key might need to be associated with a GitHub account that has access to the repository
- Contact the repository owner to grant access if needed

## Development Workflow

Once SSH is set up:

1. All git operations will use SSH authentication automatically
2. No need to enter passwords or tokens
3. Pushes and pulls will work seamlessly
4. The setup persists across development sessions

## Note for Future Developers

This development environment comes with a pre-generated SSH key specifically for the FinFlow Tracker project. To use it:

1. Add the public key to your GitHub account (see instructions above)
2. All Git operations will then work automatically
3. No additional configuration needed

The SSH setup is preferred over token authentication because:
- It doesn't expire (tokens expire after 1 hour)
- It's more secure for long-term development
- It works seamlessly with all Git operations

# Git Authentication Setup Summary

## ✅ Current Setup Status

The FinFlow Tracker development environment is configured with flexible Git authentication options:

### 1. **SSH Key (Recommended)**
- ✅ SSH key generated at `~/.ssh/id_ed25519`
- ✅ SSH config configured at `~/.ssh/config`
- ⚠️ SSH key needs to be added to GitHub account to work
- Once added, all Git operations will use SSH automatically

**SSH Public Key:**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAILSvNIboDvqB2Uq8U2I82DWud0ZI9DHZwEVl5mZ2qFWJ dev@finflow-tracker
```

### 2. **Token Authentication (Currently Active)**
- Currently using GitHub App access tokens
- Tokens are valid for 1 hour
- Can be refreshed using the `fetch_github_access_token` tool

## 🛠️ Available Tools

### Setup Script
```bash
./scripts/setup-git-auth.sh
```
- Detects existing SSH key
- Helps configure authentication
- Guides through GitHub setup

### Git Aliases
The repository includes helpful Git aliases:
```bash
git use-ssh              # Switch to SSH authentication
git use-token <TOKEN>    # Switch to token authentication  
git remote -v           # Check current remote URL
```

### Documentation
- `docs/SSH_SETUP.md` - Detailed SSH setup instructions
- `.gitconfig.local` - Local Git configuration with aliases
- `scripts/setup-git-auth.sh` - Interactive setup script

## 🔄 Switching Between Authentication Methods

### To Use SSH:
1. Add the SSH key to your GitHub account
2. Run: `git use-ssh` or `git remote set-url origin git@github.com:Fern-Labs-Open-Source/finflow-tracker.git`

### To Use Token:
1. Fetch a token using the tool or create a PAT
2. Run: `git use-token YOUR_TOKEN` or update remote manually

## 📝 For Future Developers

When starting development:

1. **Check current authentication:**
   ```bash
   git remote -v
   ```

2. **If using SSH (recommended):**
   - Add the provided SSH key to your GitHub account
   - Authentication will work permanently

3. **If using tokens:**
   - Use the `fetch_github_access_token` tool
   - Refresh token every hour as needed

4. **Run the setup script for guidance:**
   ```bash
   ./scripts/setup-git-auth.sh
   ```

## 🔐 Security Notes

- SSH keys don't expire and are more secure for long-term development
- Tokens expire after 1 hour for security
- Never commit tokens or credentials to the repository
- The `.gitconfig.local` file is safe to commit (contains no secrets)

## 📂 Repository Location

**Always work in:** `/root/finflow-tracker`

This is the canonical location for the FinFlow Tracker repository in this development environment.

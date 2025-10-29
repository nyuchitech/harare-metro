# Harare Metro Documentation Guides

This folder contains specialized guides for developing and operating Harare Metro.

---

## 📚 Available Guides

### Development & Setup
- **[Local Development Guide](LOCAL_DEVELOPMENT.md)** - Setting up the development environment
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Production deployment instructions

### Features & Components
- **[Role System](ROLE_SYSTEM.md)** - User roles and authentication system
- **[Icon Components Guide](ICON_COMPONENTS_GUIDE.md)** - Using icon components in the app
- **[Analytics Guide](ANALYTICS_GUIDE.md)** - Analytics implementation and usage
- **[Analytics Datasets](analytics_datasets.md)** - Dataset structure and configuration

### Security
- **[Security Guide](SECURITY.md)** - Security best practices and policies

---

## 🚀 Quick Start for New Developers

**Recommended reading order**:

1. **[../README.md](../README.md)** - Project overview and tech stack
2. **[../CLAUDE.md](../CLAUDE.md)** - Development workflow and conventions
3. **[LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md)** - Get your environment running
4. **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - How to deploy changes
5. **[../LOGGING-AND-MONITORING.md](../LOGGING-AND-MONITORING.md)** - Monitor and debug

---

## 📖 Core Documentation (Root Directory)

### Essential Reading
- **[README.md](../README.md)** - Project overview, installation, getting started
- **[CLAUDE.md](../CLAUDE.md)** - **START HERE** - Development guide, architecture, workflows
- **[PROJECT-STATUS.md](../PROJECT-STATUS.md)** - Current phase status and completion
- **[CHANGELOG.md](../CHANGELOG.md)** - Project history and version changes

### Operations & Planning
- **[PHASE-2-COMPLETION-PLAN.md](../PHASE-2-COMPLETION-PLAN.md)** - Current phase roadmap
- **[LOGGING-AND-MONITORING.md](../LOGGING-AND-MONITORING.md)** - Production monitoring
- **[SECURITY.md](../SECURITY.md)** - Security policies

---

## 📋 Documentation Hierarchy

```
/harare-metro/
├── README.md                      # 🔵 START: Project overview
├── CLAUDE.md                      # 🔵 START: Development guide (READ THIS FIRST!)
├── CHANGELOG.md                   # 📜 Project history
├── PROJECT-STATUS.md              # 📊 Current status
├── PHASE-2-COMPLETION-PLAN.md     # 🎯 Current phase plan
├── LOGGING-AND-MONITORING.md      # 🔍 Operations guide
├── SECURITY.md                    # 🔒 Security policies
│
└── guides/                        # 📁 Specialized guides
    ├── README.md                  # This file
    ├── LOCAL_DEVELOPMENT.md       # Dev environment setup
    ├── DEPLOYMENT_GUIDE.md        # Deployment instructions
    ├── ROLE_SYSTEM.md             # Authentication & roles
    ├── ANALYTICS_GUIDE.md         # Analytics implementation
    ├── ICON_COMPONENTS_GUIDE.md   # UI component guide
    └── SECURITY.md                # Security best practices
```

---

## 🎯 When to Use Which Doc

| Need to... | Read This |
|------------|-----------|
| Understand the project | [README.md](../README.md) |
| Start development | [CLAUDE.md](../CLAUDE.md) |
| Check current status | [PROJECT-STATUS.md](../PROJECT-STATUS.md) |
| See what changed | [CHANGELOG.md](../CHANGELOG.md) |
| Complete current phase | [PHASE-2-COMPLETION-PLAN.md](../PHASE-2-COMPLETION-PLAN.md) |
| Set up locally | [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md) |
| Deploy to production | [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) |
| Monitor logs | [LOGGING-AND-MONITORING.md](../LOGGING-AND-MONITORING.md) |
| Understand auth | [ROLE_SYSTEM.md](ROLE_SYSTEM.md) |
| Track analytics | [ANALYTICS_GUIDE.md](ANALYTICS_GUIDE.md) |

---

## ⚠️ Documentation Management

**Rules for creating new docs** (from CLAUDE.md):

1. ✅ **Do**: Add to existing docs when possible
2. ✅ **Do**: Update CHANGELOG.md for all changes
3. ✅ **Do**: Archive outdated docs to `archive/docs/`
4. ❌ **Don't**: Create temporary summary documents
5. ❌ **Don't**: Duplicate information across files
6. ❌ **Don't**: Keep outdated plan documents

**See [CLAUDE.md](../CLAUDE.md#documentation-management-rules-critical) for full rules.**

---

## 🔄 Recently Updated

- **2025-10-29**: Documentation cleanup, CHANGELOG.md created
- **2025-10-28**: Architecture simplified to 2-worker system
- **2025-10-28**: Phase status corrected to honest metrics
- **2025-10-24**: Initial guides organization

See [CHANGELOG.md](../CHANGELOG.md) for full history.

---

## 📞 Getting Help

1. **Read the docs** - Start with [CLAUDE.md](../CLAUDE.md)
2. **Check status** - See [PROJECT-STATUS.md](../PROJECT-STATUS.md)
3. **Review changes** - Read [CHANGELOG.md](../CHANGELOG.md)
4. **Create issue** - GitHub Issues for bugs/features

---

**Last Updated**: 2025-10-29
**Maintained By**: Bryan Fawcett + Claude Code

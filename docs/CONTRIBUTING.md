# Contributing to NY AI Chatbot

## Pre-Deployment Checklist

Before deploying to production, always run:

```bash
pnpm pre-deploy
```

This script validates:

### ✅ Required Files

- [ ] `package.json` with name, version, and scripts
- [ ] `LICENSE` file with actual license content
- [ ] `README.md` with title, description, installation, and usage
- [ ] `.gitignore` ignoring node_modules, .env files, and build output
- [ ] Lockfile (pnpm-lock.yaml, package-lock.json, or yarn.lock)

### 📚 Documentation (Recommended)

- [ ] `ROADMAP.md` with development phases
- [ ] `RELEASE_NOTES.md` with version history
- [ ] `/docs` folder with documentation
- [ ] `docs/INDEX.md` as documentation hub
- [ ] `.env.example` without real secrets

### ⚙️ Configuration

- [ ] `tsconfig.json` with strict mode enabled
- [ ] `next.config.ts` or `next.config.js`
- [ ] `/migrations` folder for database migrations

### 🔒 Security

- [ ] `.env.example` contains no real API keys or secrets
- [ ] `.gitignore` properly excludes sensitive files
- [ ] `SECURITY.md` (optional but recommended)

---

## Development Workflow

### 1. Local Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Run migrations
pnpm db:migrate

# Create admin user
pnpm create-admin
```

### 2. Before Committing

```bash
# Format code
pnpm format

# Lint code
pnpm lint

# Run tests
pnpm test

# Run pre-deploy checks
pnpm pre-deploy
```

### 3. Deployment

```bash
# Push to GitHub (triggers Vercel deployment)
git push origin main

# Or manual Vercel deployment
vercel --prod
```

---

## Code Standards

### File Organization

```
ny-ai-chatbot/
├── app/                    # Next.js app directory
├── components/             # React components
├── lib/                    # Utilities and libraries
├── migrations/             # Database migrations
├── scripts/                # Utility scripts
├── docs/                   # Documentation
├── ROADMAP.md             # Product roadmap
├── RELEASE_NOTES.md       # Version history
├── README.md              # Project overview
├── LICENSE                # License file
└── .env.example           # Environment template
```

### Naming Conventions

- **Components:** PascalCase (`AdminPanel.tsx`)
- **Utilities:** camelCase (`formatDate.ts`)
- **Constants:** UPPER_SNAKE_CASE (`API_URL`)
- **Files:** kebab-case for non-components (`pre-deploy-check.ts`)

### Commit Messages

Follow conventional commits:

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
chore: Update dependencies
refactor: Refactor code
test: Add tests
```

---

## Documentation Standards

### Required Documentation Files

#### 1. README.md

Must include:

- Project title and description
- Installation instructions
- Usage examples
- Configuration guide
- Link to full documentation
- License information

#### 2. ROADMAP.md

Must include:

- Current phase and status
- Completed features
- Planned features
- Timeline estimates
- Decision log

#### 3. RELEASE_NOTES.md

Must include:

- Version number
- Release date
- New features
- Bug fixes
- Breaking changes

#### 4. LICENSE

Must include:

- Valid license text (MIT, Apache, etc.)
- Copyright information
- Not a placeholder

#### 5. .env.example

Must include:

- All required environment variables
- Example values (not real secrets!)
- Comments explaining each variable

### Documentation Best Practices

1. **Keep it updated** - Update docs with code changes
2. **Be specific** - Provide exact commands and examples
3. **Use examples** - Show real-world usage
4. **Link between docs** - Cross-reference related docs
5. **Version docs** - Note which version docs apply to

---

## AI Development Guidelines

When using AI assistants (like Windsurf/Cascade):

### Pre-Deployment Checks

Always ask AI to:

1. Verify all required files exist
2. Check documentation is complete
3. Validate no secrets in committed files
4. Ensure proper .gitignore configuration
5. Run `pnpm pre-deploy` before pushing

### Standard Checklist for AI

```markdown
Before deploying, verify:

- [ ] README.md is comprehensive
- [ ] ROADMAP.md exists and is current
- [ ] LICENSE file has real content
- [ ] .env.example has no real secrets
- [ ] .gitignore excludes sensitive files
- [ ] package.json has all required scripts
- [ ] Documentation is up to date
- [ ] No console.log or debug code
- [ ] All tests pass
- [ ] Pre-deploy script passes
```

---

## Release Process

### 1. Prepare Release

```bash
# Update version in package.json
npm version patch|minor|major

# Update RELEASE_NOTES.md
# Add new version section with changes

# Update ROADMAP.md
# Mark completed features, add new plans

# Run pre-deploy checks
pnpm pre-deploy
```

### 2. Commit and Tag

```bash
git add .
git commit -m "chore: Release v2.1.0"
git tag v2.1.0
git push origin main --tags
```

### 3. Deploy

```bash
# Automatic via GitHub push
# Or manual:
vercel --prod
```

### 4. Post-Deployment

- Test all features in production
- Monitor error logs
- Update documentation if needed
- Announce release

---

## Testing Guidelines

### Before Every Deployment

1. **Unit tests** - `pnpm test`
2. **Manual testing** - Test critical paths
3. **Pre-deploy checks** - `pnpm pre-deploy`
4. **Build test** - `pnpm build`

### Critical Test Areas

- Admin panel (all 9 tabs)
- Chatbot functionality
- RAG retrieval
- Database operations
- Authentication
- Analytics tracking

---

## Security Guidelines

### Environment Variables

- ✅ **DO:** Use .env.local for secrets
- ✅ **DO:** Add all vars to .env.example (with placeholders)
- ❌ **DON'T:** Commit .env files
- ❌ **DON'T:** Put secrets in code

### API Keys

- ✅ **DO:** Store in Vercel environment variables
- ✅ **DO:** Rotate regularly
- ❌ **DON'T:** Hardcode in files
- ❌ **DON'T:** Share in documentation

### Database

- ✅ **DO:** Use connection pooling
- ✅ **DO:** Sanitize inputs
- ❌ **DON'T:** Expose credentials
- ❌ **DON'T:** Skip migrations

---

## Getting Help

- **Documentation:** `/docs/INDEX.md`
- **Issues:** GitHub Issues
- **Roadmap:** `ROADMAP.md`
- **Release Notes:** `RELEASE_NOTES.md`

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

# DentaMind Developer Onboarding

## Prerequisites
- [ ] Install [Node.js](https://nodejs.org/) (v20.x)
- [ ] Install [Git](https://git-scm.com/)
- [ ] Install [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)
- [ ] Install [Git LFS](https://git-lfs.github.com/)
- [ ] Install [VS Code](https://code.visualstudio.com/) or your preferred IDE

## Initial Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/dentamind.git
cd dentamind
```

### 2. Install Git LFS
```bash
git lfs install
```

### 3. Environment Setup
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your local settings
# Note: Do not commit .env to version control
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Database Setup
```bash
# Start the database
docker compose up -d db

# Run migrations
npm run db:push
```

### 6. Start Development Server
```bash
npm run dev
```

## Security Setup

### 1. Generate Security Keys
```bash
# Generate JWT secret
openssl rand -base64 32 > .jwt_secret

# Generate session secret
openssl rand -base64 32 > .session_secret
```

### 2. Configure Email
- Set up your email credentials in `.env`
- Test email sending with `npm run test:email`

### 3. Configure AI Services
- Add your OpenAI API key to `.env`
- Configure other AI services as needed

## Development Workflow

### 1. Branch Naming
- Feature branches: `feature/description`
- Bug fixes: `fix/description`
- Documentation: `docs/description`
- Security: `security/description`

### 2. Commit Messages
- Use conventional commits
- Reference issues with `#issue-number`
- Keep commits focused and atomic

### 3. Pull Requests
- Create PRs from feature branches
- Include tests and documentation
- Request reviews from team members

## Security Best Practices

### 1. Environment Variables
- Never commit `.env` files
- Use `.env.example` as a template
- Keep secrets secure

### 2. Code Security
- Run security scans before committing
- Follow security guidelines in `SECURITY.md`
- Report security issues immediately

### 3. Data Protection
- Use Git LFS for large files
- Follow data handling procedures
- Protect sensitive information

## Testing

### 1. Run Tests
```bash
# Run all tests
npm test

# Run specific test
npm test -- path/to/test
```

### 2. Code Quality
```bash
# Run linter
npm run lint

# Run type checker
npm run typecheck
```

## Deployment

### 1. Staging
- Use `staging` branch
- Follow deployment checklist
- Test thoroughly

### 2. Production
- Use `main` branch
- Follow security protocols
- Monitor deployment

## Support

### 1. Documentation
- Read `README.md`
- Review `SECURITY.md`
- Check `docs/` directory

### 2. Team Resources
- Slack channel: #dentamind-dev
- Email: dev@dentamind.com
- Emergency: security@dentamind.com

### 3. Tools
- [Project Dashboard](https://dashboard.dentamind.com)
- [CI/CD Pipeline](https://ci.dentamind.com)
- [Monitoring](https://monitor.dentamind.com)

## Checklist

### Day 1
- [ ] Complete prerequisites
- [ ] Set up development environment
- [ ] Run test suite
- [ ] Review documentation

### Week 1
- [ ] Complete first task
- [ ] Submit first PR
- [ ] Attend team meeting
- [ ] Set up monitoring

### Month 1
- [ ] Complete security training
- [ ] Deploy first feature
- [ ] Review performance
- [ ] Update documentation 
# Contributing to DentaMind

Thank you for your interest in contributing to DentaMind! This document provides guidelines and instructions for contributing to the project.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Testing](#testing)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and considerate of others.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/dentamind.git`
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## Development Workflow

1. Create a new branch for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes
3. Run tests:
   ```bash
   npm test
   ```
4. Commit your changes:
   ```bash
   git commit -m "feat: add your feature"
   ```
5. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

## Code Style

- Use TypeScript for all new code
- Follow the ESLint configuration
- Use Prettier for code formatting
- Write meaningful commit messages following conventional commits
- Include JSDoc comments for all functions and classes

## Testing

- Write unit tests for all new features
- Ensure test coverage remains above 80%
- Run tests before submitting a pull request
- Include integration tests for API endpoints

## Documentation

- Update README.md for significant changes
- Document new API endpoints
- Add comments for complex logic
- Keep type definitions up to date

## Pull Request Process

1. Ensure your branch is up to date with main
2. Submit a pull request with a clear description
3. Include relevant tests and documentation
4. Address any review comments
5. Wait for approval before merging

## Release Process

1. Update version in package.json
2. Update CHANGELOG.md
3. Create a release tag
4. Deploy to staging for testing
5. Deploy to production after approval

## Questions?

Feel free to open an issue or contact the maintainers for any questions. 
#!/usr/bin/env tsx

/**
 * Pre-Deployment Checklist Script
 * 
 * Validates project readiness before deployment
 * Run with: pnpm pre-deploy
 */

import { existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

const results: CheckResult[] = [];
const rootDir = process.cwd();

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function addResult(
  name: string,
  passed: boolean,
  message: string,
  severity: 'error' | 'warning' | 'info' = 'error'
) {
  results.push({ name, passed, message, severity });
}

function checkFileExists(filePath: string, description: string, required = true) {
  const fullPath = join(rootDir, filePath);
  const exists = existsSync(fullPath);
  
  addResult(
    description,
    exists,
    exists ? `✓ ${filePath} exists` : `✗ ${filePath} is missing`,
    required ? 'error' : 'warning'
  );
  
  return exists;
}

function checkFileNotEmpty(filePath: string, description: string) {
  const fullPath = join(rootDir, filePath);
  
  if (!existsSync(fullPath)) {
    addResult(description, false, `✗ ${filePath} does not exist`, 'error');
    return false;
  }
  
  const stats = statSync(fullPath);
  const isEmpty = stats.size === 0;
  
  addResult(
    description,
    !isEmpty,
    isEmpty ? `✗ ${filePath} is empty` : `✓ ${filePath} has content`,
    'error'
  );
  
  return !isEmpty;
}

function checkPackageJson() {
  const pkgPath = join(rootDir, 'package.json');
  
  if (!existsSync(pkgPath)) {
    addResult('package.json', false, '✗ package.json not found', 'error');
    return;
  }
  
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    
    // Check required fields
    const requiredFields = ['name', 'version', 'scripts'];
    for (const field of requiredFields) {
      const exists = field in pkg;
      addResult(
        `package.json.${field}`,
        exists,
        exists ? `✓ ${field} is defined` : `✗ ${field} is missing`,
        'error'
      );
    }
    
    // Check required scripts
    const requiredScripts = ['build', 'start', 'dev'];
    for (const script of requiredScripts) {
      const exists = pkg.scripts && script in pkg.scripts;
      addResult(
        `package.json script: ${script}`,
        exists,
        exists ? `✓ ${script} script exists` : `✗ ${script} script missing`,
        'error'
      );
    }
    
    // Check for pre-deploy script
    const hasPreDeploy = pkg.scripts && 'pre-deploy' in pkg.scripts;
    addResult(
      'package.json script: pre-deploy',
      hasPreDeploy,
      hasPreDeploy ? '✓ pre-deploy script exists' : '⚠ pre-deploy script missing (recommended)',
      'warning'
    );
    
  } catch (error) {
    addResult('package.json', false, `✗ Invalid JSON: ${error}`, 'error');
  }
}

function checkLicense() {
  const licenseExists = checkFileExists('LICENSE', 'License file');
  
  if (licenseExists) {
    const licensePath = join(rootDir, 'LICENSE');
    const content = readFileSync(licensePath, 'utf-8');
    
    // Check if it's a real license (not placeholder)
    const hasContent = content.length > 100;
    addResult(
      'License content',
      hasContent,
      hasContent ? '✓ License has content' : '✗ License appears to be placeholder',
      'warning'
    );
  }
}

function checkReadme() {
  const readmeExists = checkFileExists('README.md', 'README.md');
  
  if (readmeExists) {
    const readmePath = join(rootDir, 'README.md');
    const content = readFileSync(readmePath, 'utf-8');
    
    // Check for key sections
    const sections = [
      { name: 'Title', pattern: /^#\s+.+/m },
      { name: 'Description', pattern: /.{50,}/m },
      { name: 'Installation', pattern: /(install|setup|getting started)/i },
      { name: 'Usage', pattern: /(usage|how to|example)/i },
    ];
    
    for (const section of sections) {
      const hasSection = section.pattern.test(content);
      addResult(
        `README.md: ${section.name}`,
        hasSection,
        hasSection ? `✓ ${section.name} section found` : `⚠ ${section.name} section missing`,
        'warning'
      );
    }
  }
}

function checkRoadmap() {
  const roadmapExists = checkFileExists('ROADMAP.md', 'Roadmap file', false);
  
  if (roadmapExists) {
    const roadmapPath = join(rootDir, 'ROADMAP.md');
    const content = readFileSync(roadmapPath, 'utf-8');
    
    const hasPhases = /phase/i.test(content);
    addResult(
      'Roadmap content',
      hasPhases,
      hasPhases ? '✓ Roadmap has phases/milestones' : '⚠ Roadmap missing structure',
      'info'
    );
  }
}

function checkGitignore() {
  const gitignoreExists = checkFileExists('.gitignore', '.gitignore file');
  
  if (gitignoreExists) {
    const gitignorePath = join(rootDir, '.gitignore');
    const content = readFileSync(gitignorePath, 'utf-8');
    
    // Check for critical patterns
    const criticalPatterns = [
      { name: 'node_modules', pattern: /node_modules/ },
      { name: '.env files', pattern: /\.env/ },
      { name: 'build output', pattern: /(dist|build|\.next|out)/ },
    ];
    
    for (const { name, pattern } of criticalPatterns) {
      const hasPattern = pattern.test(content);
      addResult(
        `.gitignore: ${name}`,
        hasPattern,
        hasPattern ? `✓ Ignores ${name}` : `✗ Missing ${name} pattern`,
        'error'
      );
    }
  }
}

function checkEnvExample() {
  const envExampleExists = checkFileExists('.env.example', 'Environment example', false);
  
  if (envExampleExists) {
    const envExamplePath = join(rootDir, '.env.example');
    const content = readFileSync(envExamplePath, 'utf-8');
    
    // Check that it doesn't contain real secrets
    const hasRealSecrets = /sk-[a-zA-Z0-9]{20,}|postgres:\/\/.*@.*\.com/.test(content);
    addResult(
      '.env.example security',
      !hasRealSecrets,
      hasRealSecrets ? '✗ .env.example contains real secrets!' : '✓ No real secrets in .env.example',
      hasRealSecrets ? 'error' : 'info'
    );
  }
}

function checkDocumentation() {
  // Check for docs folder
  const docsExists = existsSync(join(rootDir, 'docs'));
  addResult(
    'Documentation folder',
    docsExists,
    docsExists ? '✓ /docs folder exists' : '⚠ /docs folder missing',
    'warning'
  );
  
  if (docsExists) {
    // Check for index
    const indexExists = existsSync(join(rootDir, 'docs', 'INDEX.md'));
    addResult(
      'Documentation index',
      indexExists,
      indexExists ? '✓ docs/INDEX.md exists' : '⚠ docs/INDEX.md missing',
      'info'
    );
  }
}

function checkTypeScript() {
  const tsconfigExists = checkFileExists('tsconfig.json', 'TypeScript config', false);
  
  if (tsconfigExists) {
    try {
      const tsconfigPath = join(rootDir, 'tsconfig.json');
      const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'));
      
      const hasStrict = tsconfig.compilerOptions?.strict === true;
      addResult(
        'TypeScript strict mode',
        hasStrict,
        hasStrict ? '✓ Strict mode enabled' : '⚠ Strict mode disabled',
        'info'
      );
    } catch (error) {
      addResult('tsconfig.json', false, `✗ Invalid JSON: ${error}`, 'warning');
    }
  }
}

function checkNextConfig() {
  const nextConfigExists = existsSync(join(rootDir, 'next.config.ts')) || 
                           existsSync(join(rootDir, 'next.config.js')) ||
                           existsSync(join(rootDir, 'next.config.mjs'));
  
  addResult(
    'Next.js config',
    nextConfigExists,
    nextConfigExists ? '✓ Next.js config exists' : '⚠ Next.js config missing',
    'warning'
  );
}

function checkDependencies() {
  const lockfileExists = existsSync(join(rootDir, 'pnpm-lock.yaml')) ||
                         existsSync(join(rootDir, 'package-lock.json')) ||
                         existsSync(join(rootDir, 'yarn.lock'));
  
  addResult(
    'Lockfile',
    lockfileExists,
    lockfileExists ? '✓ Lockfile exists' : '✗ No lockfile found',
    'error'
  );
}

function checkSecurityFiles() {
  // Check for common security files
  const securityFiles = [
    { file: 'SECURITY.md', desc: 'Security policy', required: false },
    { file: '.nvmrc', desc: 'Node version', required: false },
  ];
  
  for (const { file, desc, required } of securityFiles) {
    checkFileExists(file, desc, required);
  }
}

function checkMigrations() {
  const migrationsDir = join(rootDir, 'migrations');
  const migrationsExist = existsSync(migrationsDir);
  
  addResult(
    'Database migrations',
    migrationsExist,
    migrationsExist ? '✓ Migrations folder exists' : '⚠ No migrations folder',
    'info'
  );
}

function checkReleaseNotes() {
  const releaseNotesExists = checkFileExists('RELEASE_NOTES.md', 'Release notes', false);
  
  if (releaseNotesExists) {
    const releaseNotesPath = join(rootDir, 'RELEASE_NOTES.md');
    const content = readFileSync(releaseNotesPath, 'utf-8');
    
    const hasVersion = /v?\d+\.\d+\.\d+/.test(content);
    addResult(
      'Release notes version',
      hasVersion,
      hasVersion ? '✓ Release notes have version info' : '⚠ No version info in release notes',
      'info'
    );
  }
}

function printResults() {
  console.log('\n' + colors.cyan + '═'.repeat(70) + colors.reset);
  console.log(colors.cyan + '  Pre-Deployment Checklist' + colors.reset);
  console.log(colors.cyan + '═'.repeat(70) + colors.reset + '\n');
  
  const errors = results.filter(r => !r.passed && r.severity === 'error');
  const warnings = results.filter(r => !r.passed && r.severity === 'warning');
  const infos = results.filter(r => !r.passed && r.severity === 'info');
  const passed = results.filter(r => r.passed);
  
  // Print errors
  if (errors.length > 0) {
    console.log(colors.red + '✗ ERRORS (' + errors.length + '):' + colors.reset);
    for (const result of errors) {
      console.log(colors.red + '  ' + result.message + colors.reset);
    }
    console.log('');
  }
  
  // Print warnings
  if (warnings.length > 0) {
    console.log(colors.yellow + '⚠ WARNINGS (' + warnings.length + '):' + colors.reset);
    for (const result of warnings) {
      console.log(colors.yellow + '  ' + result.message + colors.reset);
    }
    console.log('');
  }
  
  // Print info
  if (infos.length > 0) {
    console.log(colors.blue + 'ℹ INFO (' + infos.length + '):' + colors.reset);
    for (const result of infos) {
      console.log(colors.blue + '  ' + result.message + colors.reset);
    }
    console.log('');
  }
  
  // Print summary
  console.log(colors.cyan + '─'.repeat(70) + colors.reset);
  console.log(colors.green + `✓ Passed: ${passed.length}` + colors.reset);
  console.log(colors.red + `✗ Errors: ${errors.length}` + colors.reset);
  console.log(colors.yellow + `⚠ Warnings: ${warnings.length}` + colors.reset);
  console.log(colors.blue + `ℹ Info: ${infos.length}` + colors.reset);
  console.log(colors.cyan + '─'.repeat(70) + colors.reset + '\n');
  
  // Final verdict
  if (errors.length === 0) {
    console.log(colors.green + '✓ READY FOR DEPLOYMENT!' + colors.reset + '\n');
    return 0;
  } else {
    console.log(colors.red + '✗ NOT READY FOR DEPLOYMENT' + colors.reset);
    console.log(colors.red + `  Fix ${errors.length} error(s) before deploying.` + colors.reset + '\n');
    return 1;
  }
}

// Run all checks
async function main() {
  console.log(colors.cyan + '\nRunning pre-deployment checks...\n' + colors.reset);
  
  // Core files
  checkPackageJson();
  checkLicense();
  checkReadme();
  checkGitignore();
  
  // Documentation
  checkRoadmap();
  checkDocumentation();
  checkReleaseNotes();
  
  // Configuration
  checkEnvExample();
  checkTypeScript();
  checkNextConfig();
  
  // Dependencies
  checkDependencies();
  
  // Database
  checkMigrations();
  
  // Security
  checkSecurityFiles();
  
  // Print results
  const exitCode = printResults();
  process.exit(exitCode);
}

main().catch((error) => {
  console.error(colors.red + 'Error running pre-deployment checks:' + colors.reset, error);
  process.exit(1);
});

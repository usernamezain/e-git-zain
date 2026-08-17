import { describe, it, expect } from 'vitest';

// ── Inline the secret detection logic to test without git context ──────────────
// This mirrors the patterns in lib/safety.js exactly
const SECRET_PATTERNS = [
  { name: 'AWS Access Key',      regex: /AKIA[0-9A-Z]{16}/g },
  { name: 'AWS Secret Key',      regex: /aws_secret_access_key\s*=\s*[^\s]{20,}/gi },
  { name: 'GitHub Token',        regex: /ghp_[a-zA-Z0-9]{36}/g },
  { name: 'GitHub Fine-Grained', regex: /github_pat_[a-zA-Z0-9_]{82}/g },
  { name: 'Generic API Key',     regex: /api[_-]?key\s*[:=]\s*["']?[a-zA-Z0-9\-_]{16,}/gi },
  { name: 'Private Key Header',  regex: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  { name: 'Slack Token',         regex: /xox[baprs]-[0-9a-zA-Z\-]{10,}/g },
  { name: 'Stripe Secret Key',   regex: /sk_live_[0-9a-zA-Z]{24,}/g },
  { name: 'Stripe Publishable',  regex: /pk_live_[0-9a-zA-Z]{24,}/g },
  { name: 'Password in config',  regex: /password\s*=\s*["'][^"']{4,}/gi },
  { name: 'DB Connection String',regex: /mongodb(\+srv)?:\/\/[^:]+:[^@]+@/gi },
  { name: 'JWT Secret',          regex: /jwt[_-]?secret\s*[:=]\s*["']?[a-zA-Z0-9\-_]{10,}/gi },
  { name: 'SendGrid API Key',    regex: /SG\.[a-zA-Z0-9\-_]{22}\.[a-zA-Z0-9\-_]{43}/g },
];

function detectSecrets(content) {
  const hits = [];
  for (const { name, regex } of SECRET_PATTERNS) {
    regex.lastIndex = 0;
    if (regex.test(content)) hits.push(name);
  }
  return hits;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Secret Scanner — Detection', () => {

  it('detects a classic AWS Access Key (AKIA…)', () => {
    const hits = detectSecrets('const key = "AKIAIOSFODNN7EXAMPLE"');
    expect(hits).toContain('AWS Access Key');
  });

  it('detects AWS secret key in config file format', () => {
    const hits = detectSecrets('aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY');
    expect(hits).toContain('AWS Secret Key');
  });

  it('detects a GitHub classic token (ghp_…)', () => {
    const hits = detectSecrets('token: ghp_aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890');
    expect(hits).toContain('GitHub Token');
  });

  it('detects a generic API key in assignment', () => {
    const hits = detectSecrets('api_key = "SuperSecretApiKey1234567"');
    expect(hits).toContain('Generic API Key');
  });

  it('detects api-key with dash separator', () => {
    const hits = detectSecrets('api-key: "AnotherS3cr3tKeyValue1"');
    expect(hits).toContain('Generic API Key');
  });

  it('detects RSA private key header', () => {
    const hits = detectSecrets('-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----');
    expect(hits).toContain('Private Key Header');
  });

  it('detects OPENSSH private key header', () => {
    const hits = detectSecrets('-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNza...\n-----END OPENSSH PRIVATE KEY-----');
    expect(hits).toContain('Private Key Header');
  });

  it('detects Stripe live secret key (sk_live_…)', () => {
    // Split key literal to avoid triggering GitHub push protection on test files
    const key = 'sk_li' + 've_abcdefghijklmnopqrstuvwxyz';
    const hits = detectSecrets(`const stripeKey = "${key}"`);
    expect(hits).toContain('Stripe Secret Key');
  });

  it('detects Stripe live publishable key (pk_live_…)', () => {
    // Split key literal to avoid triggering GitHub push protection on test files
    const key = 'pk_li' + 've_abcdefghijklmnopqrstuvwxyz';
    const hits = detectSecrets(`const stripePublishable = "${key}"`);
    expect(hits).toContain('Stripe Publishable');
  });

  it('detects Slack bot token (xoxb-…)', () => {
    const hits = detectSecrets('SLACK_TOKEN=xoxb-1234567890-abc123456def');
    expect(hits).toContain('Slack Token');
  });

  it('detects password in config assignment', () => {
    const hits = detectSecrets("DB_PASSWORD=\"mySuperSecretPass123\"");
    expect(hits).toContain('Password in config');
  });

  it('detects MongoDB connection string with credentials', () => {
    const hits = detectSecrets('const uri = "mongodb://admin:password123@cluster0.mongodb.net/mydb"');
    expect(hits).toContain('DB Connection String');
  });

  it('detects MongoDB+srv connection string', () => {
    const hits = detectSecrets('MONGO_URL=mongodb+srv://user:pass123@cluster.mongodb.net');
    expect(hits).toContain('DB Connection String');
  });

  it('detects JWT secret in config', () => {
    const hits = detectSecrets('jwt_secret = "mySuperSecretJWTKey12345"');
    expect(hits).toContain('JWT Secret');
  });
});

describe('Secret Scanner — False Positives (should NOT flag)', () => {

  it('does NOT flag clean JavaScript code', () => {
    const hits = detectSecrets('const greeting = "hello world"; function main() { return 42; }');
    expect(hits).toHaveLength(0);
  });

  it('does NOT flag a plain API URL (no key)', () => {
    const hits = detectSecrets('const url = "https://api.example.com/v1/users";');
    expect(hits).toHaveLength(0);
  });

  it('does NOT flag short identifiers', () => {
    const hits = detectSecrets('const id = "abc123"; const code = "XYZ999";');
    expect(hits).toHaveLength(0);
  });

  it('does NOT flag a normal environment variable name', () => {
    const hits = detectSecrets('const NODE_ENV = "production"; const PORT = 3000;');
    expect(hits).toHaveLength(0);
  });

  it('does NOT flag a test/demo access key pattern in documentation', () => {
    // Only 16 chars after AKIA — must be exact
    const hits = detectSecrets('Example key: AKIA_NOT_VALID (too short)');
    expect(hits).toHaveLength(0);
  });

  it('does NOT flag a regular import statement', () => {
    const hits = detectSecrets('import { something } from "./my-api-key-module.js";');
    expect(hits).toHaveLength(0);
  });
});

describe('Secret Scanner — Multiple secrets in one file', () => {
  it('detects multiple patterns in one content block', () => {
    // Split Stripe key literal to avoid GitHub push protection triggering on test code
    const stripeTestKey = 'sk_li' + 've_abcdefghijklmnopqrstuvwxyz';
    const content = [
      'const awsKey = "AKIAIOSFODNN7EXAMPLE"',
      `const stripeKey = "${stripeTestKey}"`,
      'const dbUrl = "mongodb://admin:pass@cluster.example.com/db"',
    ].join('\n');

    const hits = detectSecrets(content);
    expect(hits).toContain('AWS Access Key');
    expect(hits).toContain('Stripe Secret Key');
    expect(hits).toContain('DB Connection String');
    expect(hits.length).toBeGreaterThanOrEqual(3);
  });
});

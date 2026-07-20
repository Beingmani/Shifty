// Pre-flight guard before publishing a GitHub Release.
// Fails if a release for package.json's version already exists.

const fs = require('node:fs');
const https = require('node:https');

const REPO = 'Beingmani/Shifty';

function readVersion() {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  return pkg.version;
}

function checkRelease(version, token) {
  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'api.github.com',
        path: `/repos/${REPO}/releases/tags/v${version}`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'shifty-release-check',
          Accept: 'application/vnd.github+json',
        },
      },
      (res) => {
        res.on('data', () => {});
        res.on('end', () => resolve(res.statusCode));
      }
    );
    req.on('error', () => resolve(null));
    req.end();
  });
}

(async () => {
  const version = readVersion();
  const token = process.env.GH_TOKEN;
  if (!token) {
    console.warn('[release-check] GH_TOKEN not set — skipping pre-flight.');
    process.exit(0);
  }

  const status = await checkRelease(version, token);
  if (status === 404) {
    console.log(`[release-check] v${version} is fresh — proceeding.`);
    process.exit(0);
  }
  if (status === 200) {
    console.error('');
    console.error('  ✖  Cannot release.');
    console.error(`     v${version} already exists on https://github.com/${REPO}/releases`);
    console.error('     Bump the version in package.json first.');
    console.error('');
    process.exit(1);
  }
  if (status === 401) {
    console.error('[release-check] GH_TOKEN is invalid or revoked.');
    process.exit(1);
  }
  console.warn(`[release-check] unexpected status ${status ?? 'network-error'} — proceeding anyway.`);
  process.exit(0);
})();

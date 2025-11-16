const core = require('@actions/core');
const exec = require('@actions/exec');
const tc = require('@actions/tool-cache');
const { Octokit } = require("@octokit/rest");

const baseDownloadURL = "https://github.com/deckrun/deck-cli/releases/download";
const fallbackVersion = "v1.0.5";
const octokit = new Octokit();

async function downloadDoctl(version, type, architecture) {
  var platform = 'Linux';
  var arch = 'x86_64';
  var extension = 'tar.gz';

  switch (type) {
    case 'darwin':
      platform = 'Darwin';
      break;
    case 'win32':
      platform = 'Windows';
      extension = 'zip'
      break;
    case 'linux':
      platform = 'Linux';
      break;
    default:
      core.warning(`unknown platform: ${type}; defaulting to ${platform}`);
      break;
  }

  switch (architecture) {
    case 'arm64':
      arch = 'arm64';
      break;
    case 'x64':
      arch = 'x86_64';
      break;
    case 'ia32':
      arch = '386';
      break;
    default:
      core.warning(`unknown architecture: ${architecture}; defaulting to ${arch}`);
      break;
  }

  const downloadURL = `${baseDownloadURL}/v${version}/deck_${platform}_${arch}.${extension}`;
  core.debug(`deck download url: ${downloadURL}`);
  const deckDownload = await tc.downloadTool(downloadURL);

  return tc.extractTar(deckDownload);
}

async function run() {
  try {
    var version = core.getInput('version');
    if ((!version) || (version.toLowerCase() === 'latest')) {
      version = await octokit.repos.getLatestRelease({
        owner: 'deckrun',
        repo: 'deck-cli'
      }).then(result => {
        return result.data.name;
      }).catch(error => {
        // GitHub rate-limits are by IP address and runners can share IPs.
        // This mostly effects macOS where the pool of runners seems limited.
        // Fallback to a known version if API access is rate limited.
        core.warning(`${error.message}

Failed to retrieve latest version; falling back to: ${fallbackVersion}`);
        return fallbackVersion;
      });
    }
    if (version.charAt(0) === 'v') {
      version = version.substr(1);
    }

    var path = tc.find("deck", version);
    if (!path) {
      const installPath = await downloadDoctl(version, process.platform, process.arch);
      path = await tc.cacheDir(installPath, 'deck', version);
    }
    core.addPath(path);
    core.info(`>>> deck version v${version} installed to ${path}`);

    // Skip authentication if requested
    // for workflows where auth isn't necessary (e.g. deck app spec validate --schema-only)
    var noAuth = core.getInput('no_auth');
    if (noAuth.toLowerCase() === 'true') {
      core.info('>>> Skipping deck auth');
      return;
    }

    var token = core.getInput('token', { required: true });
    core.setSecret(token);
    var deckArgs = ['auth', 'init', '-t', token];

    var teamId = core.getInput('team_id');
    if (teamId) {
      core.info(`>>> Using team ID: ${teamId}`);
      deckArgs.push('--team', teamId);
    }

    await exec.exec('deck', deckArgs);
    core.info('>>> Successfully logged into deck');
  }
  catch (error) {
    core.setFailed(error.message);
  }
}

run();

#!/usr/bin/env node

const CLI_VERSION = '0.36.2';

const fs = require('node:fs/promises');
const extractZip = require('extract-zip');
const tar = require('tar');
const { tmpdir } = require('node:os');
const path = require('node:path');

const download = async (url, dest) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`unexpected response ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  await fs.writeFile(dest, Buffer.from(buffer));
};

const downloadAndExtract = async (url, file, dest, archiveSuffix, extract) => {
  const tmpDir = await fs.mkdtemp(path.join(tmpdir(), 'vscode-humanitec-'));
  try {
    const archiveFile = `${tmpDir}/archive${archiveSuffix}`;
    await download(url, archiveFile);
    await extract(archiveFile, tmpDir);
    await fs.copyFile(`${tmpDir}/${file}`, dest);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
};

const downloadAndExtractGzip = (url, file, dest) => {
  return downloadAndExtract(url, file, dest, '.tar.gz', (archiveFile, tmpDir) =>
    tar.extract({
      file: archiveFile,
      cwd: tmpDir,
    })
  );
};

const downloadAndExtractZip = async (url, file, dest) => {
  return downloadAndExtract(url, file, dest, '.zip', (archiveFile, tmpDir) =>
    extractZip(archiveFile, { dir: tmpDir })
  );
};

const main = async () => {
  const humctlDir = './humctl';
  await fs.rm(humctlDir, { recursive: true, force: true });
  await fs.mkdir(humctlDir, { recursive: true });

  const prefix = `https://github.com/humanitec/cli/releases/download/v${CLI_VERSION}/cli_${CLI_VERSION}`;

  await Promise.all([
    downloadAndExtractGzip(
      `${prefix}_darwin_amd64.tar.gz`,
      'humctl',
      `${humctlDir}/cli_${CLI_VERSION}_darwin_x64`
    ),
    downloadAndExtractGzip(
      `${prefix}_darwin_arm64.tar.gz`,
      'humctl',
      `${humctlDir}/cli_${CLI_VERSION}_darwin_arm64`
    ),
    downloadAndExtractGzip(
      `${prefix}_linux_amd64.tar.gz`,
      'humctl',
      `${humctlDir}/cli_${CLI_VERSION}_linux_x64`
    ),
    downloadAndExtractGzip(
      `${prefix}_linux_arm64.tar.gz`,
      'humctl',
      `${humctlDir}/cli_${CLI_VERSION}_linux_arm64`
    ),
    downloadAndExtractZip(
      `${prefix}_windows_amd64.zip`,
      'humctl.exe',
      `${humctlDir}/cli_${CLI_VERSION}_win32_x64.exe`
    ),
  ]);
};

main().catch(err => {
  console.error(err);
  process.exit(1);
});

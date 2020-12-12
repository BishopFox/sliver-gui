// ES6 version using asynchronous iterators, compatible with node v10.0+

import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

import { logger } from '../logs';


export async function* walk(dir: string): string|AsyncGenerator<any, any, any> {
  for await (const d of await fs.promises.opendir(dir)) {
    const entry = path.join(dir, d.name);
    if (d.isDirectory()) {
      yield* walk(entry);
    } else if (d.isFile()) {
      yield entry;
    }
  }
}

export async function downloadSliverAsset(url: string, assetName: string, goos: string, saveTo: string, progressCallback: CallableFunction) {
  const latest = await githubAPIRequest(url);
  const asset = latest.assets.filter(asset => {
    const downloadUrl = new URL(asset.browser_download_url);
    const fileName = path.basename(downloadUrl.pathname);
    // Filter looking for a name like "sliver-server_linux.zip"
    return fileName.startsWith(`sliver-${assetName}`) && fileName.endsWith(`_${goos}.zip`);
  })[0];
  if (asset === undefined) {
    throw new Error(`Asset '${assetName}' not found`);
  }
  const downloadUrl = new URL(asset.browser_download_url);
  const fileName = path.basename(downloadUrl.pathname);
  if (!fs.existsSync(saveTo) || !fs.lstatSync(saveTo).isDirectory()) {
    throw new Error(`${saveTo} is not a directory`);
  }
  let savePath = path.join(saveTo, fileName);
  let count = 0;
  while (fs.existsSync(savePath)) {
    const name = path.basename(fileName, ".zip");
    savePath = path.join(saveTo, `${name} (${++count}).zip`);
  }
  const file = fs.createWriteStream(savePath, {encoding: 'binary'});
  const progress = {
    bytesPerSecond: 0,
    percent: 0,
    transferred: 0,
    total: asset.size,
    delta: 0,
  };
  const start = new Date();
  const cdnUrl = await githubDownloadURL(downloadUrl);
  https.get(cdnUrl, resp => {
    resp.on('data', async (chunk: Buffer) => {
      file.write(chunk);
      progress.transferred += chunk.length;
      progress.delta = chunk.length;
      progress.percent = (progress.transferred / progress.total) * 100.0;
      const seconds = (new Date().getTime() - start.getTime()) / 1000;
      progress.bytesPerSecond = progress.transferred / seconds;
      progressCallback(progress);
    });
    resp.on('end', async () => {
      file.close();
      if (progress.percent < 100.0) {
        progress.percent = 100.0; // It's important we always send 100% to the callback
        progressCallback(progress);
      }
    });
  }).on('error', (err) => {
    throw err.message;
  });
}

// GitHub redirects to their CDN, so we need to get the redirect location first
export async function githubDownloadURL(downloadUrl: URL): Promise<string> {
  const options = {
    headers: { 'User-Agent': 'Awesome-Octocat-App' },
  };
  return new Promise((resolve, reject) => {
    https.get(downloadUrl.toString(), options, (resp) => {
      if (300 <= resp.statusCode && resp.statusCode < 400) {
        logger.debug(`Redirect to: ${resp.headers.location}`);
        resolve(resp.headers.location);
      }
      reject(`Status ${resp.statusCode}, expected redirect`);
    });
  });
}

export async function githubAPIRequest(url: string): Promise<any> {
  const options = {
    headers: { 'User-Agent': 'Awesome-Octocat-App' },
  };
  return new Promise((resolve, reject) => {
    https.get(url, options, (resp) => {
      let data = '';
      resp.on('data', (chunk) => {
        data += chunk;
      });
      resp.on('end', () => {
        logger.debug(`JSON API Response: ${data}`);
        resolve(JSON.parse(data));
      });
    }).on('error', (err) => {
      logger.warn(`JSON API Error: ${err}`);
      reject(err.message);
    });
  });
}
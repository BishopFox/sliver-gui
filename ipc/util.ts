// ES6 version using asynchronous iterators, compatible with node v10.0+

import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

enum Asset {
  Server = 'server',
  Client = 'client'
}

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
  const latest = await jsonAPIRequest(url);
  latest.assets.forEach(asset => {
    const downloadUrl = new URL(asset.browser_download_url);
    const fileName = path.basename(downloadUrl.pathname);
    if (fileName.startsWith(`sliver-${assetName}`) && fileName.endsWith(`_${goos}.zip`)) {
      console.log(`Download: ${downloadUrl}`);
    }
  });

}

export async function jsonAPIRequest(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https.get(url, (resp) => {
      let data = '';
      resp.on('data', (chunk) => {
        data += chunk;
      });
      resp.on('end', () => {
        resolve(JSON.parse(data));
      });
    }).on('error', (err) => {
      reject(err.message);
    });
  });
}
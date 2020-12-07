//
// Standalone script to embed version information into the dist/
//

import * as fs from 'fs';
import { promisify } from 'util';
import * as child from 'child_process';
const exec = promisify(child.exec);


const VERSION_FILE = "src/environments/version.ts";

async function createVersionsFile(filename: string) {
  const revision = (await exec('git rev-parse HEAD')).stdout.toString().trim();
  const branch = (await exec('git rev-parse --abbrev-ref HEAD')).stdout.toString().trim();
  const dirty = (await exec(`git diff --quiet|| echo '1'`)).stdout.toString().trim() === '1' ? true : false;
  const packageJSON = JSON.parse((await fs.promises.readFile('./package.json', { encoding: 'utf-8' })));
  const sliverScript = packageJSON['dependencies']['sliver-script'];
  const protobuf = packageJSON['dependencies']['google-protobuf'];
  const angular = packageJSON['devDependencies']['@angular/core'];
  const electron = packageJSON['devDependencies']['electron'];
  const content = `
// Automatically generated: DO NOT EDIT
export const Version = {
  version: '${process.env.npm_package_version}',
  revision: '${revision}',
  branch: '${branch}',
  dirty: ${dirty},
  compiled: '${(new Date()).toUTCString()}',
  dependencies: {
    sliverScript: '${sliverScript}',
    protobuf: '${protobuf}',
    angular: '${angular}',
    electron: '${electron}',
  }
};`;
  fs.writeFileSync(filename, content, { encoding: 'utf8' });
}

createVersionsFile(VERSION_FILE);

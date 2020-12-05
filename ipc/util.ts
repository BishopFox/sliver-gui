// ES6 version using asynchronous iterators, compatible with node v10.0+

import * as fs from 'fs';
import * as path from 'path';


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
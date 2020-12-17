/*
  Sliver Implant Framework
  Copyright (C) 2020  Bishop Fox
  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.
  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.
  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import * as Ajv from 'ajv';

// jsonSchema - A JSON Schema decorator, somewhat redundant given we're using TypeScript
// but it provides a stricter method of validating incoming JSON messages than simply
// casting the result of JSON.parse() to an interface.
export function jsonSchema(schema: object) {
  const ajv = new Ajv({allErrors: true});
  const validate = ajv.compile(schema);
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {

    const originalMethod = descriptor.value;
    descriptor.value = (self: any, arg: string) => {
      const parsed = JSON.parse(arg);
      const valid = validate(parsed);
      if (valid) {
        return originalMethod(self, parsed);
      } else {
        console.error(validate.errors);
        return Promise.reject(`Invalid schema: ${ajv.errorsText(validate.errors)}`);
      }
    };

    return descriptor;
  };
}

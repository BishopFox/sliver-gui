import { IPCHandlers } from './ipc';

export function isConnected() {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
  
      const originalMethod = descriptor.value;
      descriptor.value = (self: IPCHandlers, arg: string) => {
        if (self?.client.isConnected) {
          return originalMethod(self, arg);
        } else {
          console.error(`RPC call but client is not connected`);
          return Promise.reject(`RPC client is not connected`);
        }
      };
  
      return descriptor;
    };
  }
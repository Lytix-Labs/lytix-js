import { AsyncLocalStorage } from "node:async_hooks";
import type { LoggerAsyncContext } from "../LLogger/LLogger.types";

export class LAsyncStoreClass {
  asyncLocalStorage: AsyncLocalStorage<LoggerAsyncContext> | undefined =
    undefined;

  constructor() {}

  /**
   * When an async store is defined init it
   */
  initAsyncStore() {
    /**
     * Never init more then once or we lost context
     */
    if (this.asyncLocalStorage === undefined) {
      this.asyncLocalStorage = new AsyncLocalStorage<LoggerAsyncContext>();
    }
  }
}

const LAsyncStore = new LAsyncStoreClass();
export default LAsyncStore;

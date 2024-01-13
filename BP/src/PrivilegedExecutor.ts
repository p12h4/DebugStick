import { system } from "@minecraft/server";


export class PrivilegedExecutor {
   /**
    * Executes a function with elevated privileges using system.run.
    * @param func The function to be executed.
    * @param args Arguments to pass to the function.
    * @returns The result of the function execution.
    */
   public static runWithPrivileges<T extends (...args: any[]) => any>(func: T, ...args: Parameters<T>): ReturnType<T> {
      let result: ReturnType<T>;
      system.run(() => {
         result = func(...args);
      });
      return result;
   }
}
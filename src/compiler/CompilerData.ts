import { isNil } from "../utils";

export class NameScope {
   public parentScope?: NameScope = undefined;
   public knownNames: Record<string, string> = {};
   public childs: NameScope[] = [];
   public isLoopScope: boolean = false;

   public getNewChild(): NameScope {
      const tmp = new NameScope();

      tmp.parentScope = this;
      this.childs.push(tmp);

      // Make sure nested if else statements still have the possibility to break or continue
      // in a loop.
      tmp.isLoopScope = this.isLoopScope;

      return tmp;
   }

   public containsName(name: string): boolean {
      return !isNil(this.knownNames[name]);
   }

   public containsNameRecursive(name: string): boolean {
      let tmp: NameScope = this;
      while (true) {
         if (tmp.containsName(name)) {
            return true;
         } else {
            if (isNil(tmp.parentScope)) {
               return false;
            } else {
               tmp = tmp.parentScope;
            }
         }
      }
   }
}

export class CompilerData {
   public structNames: Record<string, boolean> = {};
   public functionNames: string[] = [];
   public topLevelScope: NameScope = new NameScope();
   public currentScope: NameScope = this.topLevelScope;

   public pushScope(): NameScope {
      this.currentScope = this.currentScope.getNewChild();
      return this.currentScope;
   }

   public popScope(): NameScope {
      if (isNil(this.currentScope.parentScope)) {
         throw new Error("Reached top of Scope stack already!");
      }

      this.currentScope = this.currentScope.parentScope;
      return this.currentScope;
   }

   public registerInternals() {
      this.structNames["double"] = true;
      this.structNames["string"] = true;
      this.structNames["char"] = true;
      this.structNames["int"] = true;
      this.structNames["boolean"] = true;
      this.structNames["void"] = true;
   }
}

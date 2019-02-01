import {
   Alias, Enum, FunctionDecl, Interface, InterfaceFunction, Struct, StructField, TexelFile,
} from "../tree";

export enum SymbolType {
   UNKNOWN, VIRTUAL, FILE, STRUCT, STRUCT_FIELD, INTERFACE, INTERFACE_FUNC, ALIAS, ENUM, FUNCTION,
}

export type VirtualValue = SymbolType;

export type SymbolValue =
   VirtualValue
   | TexelFile
   | Struct
   | StructField
   | Interface
   | InterfaceFunction
   | Alias
   | Enum
   | FunctionDecl
   | undefined;

export class SymbolTree {
   public type: SymbolType;
   public path: string;
   public children: SymbolTree[] = [];
   public value: SymbolValue;

   constructor(type: SymbolType, path: string, children: SymbolTree[], value: SymbolValue) {
      this.type = type;
      this.path = path;
      this.children = children;
      this.value = value;
   }

   public addValueToPath(path: string[], type: SymbolType, value: SymbolValue): SymbolTree {
      const child = this.findChildAtPath(path);
      child.type = type;
      child.value = value;

      return child;
   }

   public findChildAtPath(path: string[]): SymbolTree {
      let child = this.children.find(child => child.path === path[0]);

      if (child === undefined) {
         const newChild = new SymbolTree(SymbolType.UNKNOWN, path[0], [], undefined);
         this.children.push(newChild);
         child = newChild;
      }

      if (path.length === 1) {
         return child;
      } else {
         const newPath = [...path];
         newPath.shift();
         return child.findChildAtPath(newPath);
      }
   }

   public debugSymbolNameStructure(indent = " ") {
      console.log(indent, this.path);
      this.children.forEach(it => it.debugSymbolNameStructure(indent + "-"));
   }
}

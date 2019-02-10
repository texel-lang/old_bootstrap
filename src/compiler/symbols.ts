import {
   Alias, Assignment, Break, Continue,
   DeclarationVisitor,
   Enum, ExpressionStmt,
   FunctionDecl,
   GenericDeclaration,
   GenericName, IfElse,
   Interface, Loop, Return, StatementVisitor,
   Struct,
   TexelFile, Variable, When,
} from "../tree";
import { SymbolTree, SymbolType } from "../utils/SymbolTree";
import { registerInternals } from "./utils";

export function processSymbolsForSource(fileSymbol: SymbolTree) {
   const addToTree: DeclarationVisitor = {
      visitStruct(struct: Struct): void {
         addStruct(fileSymbol, struct);
      },
      visitFunction(func: FunctionDecl): void {
         addFunction(fileSymbol, func);
      },
      visitInterface(interFace: Interface): void {
         addInterface(fileSymbol, interFace);
      },
      visitAlias(aliased: Alias): void {
         addAlias(fileSymbol, aliased);
      },
      visitEnum(enumeration: Enum): void {
         addEnum(fileSymbol, enumeration);
      },
   };

   const resolveSymbols: DeclarationVisitor = {
      visitStruct(struct: Struct): void {
         resolveStruct(fileSymbol, struct);
      },
      visitFunction(func: FunctionDecl): void {
         resolveFunction(fileSymbol, func);
      },
      visitInterface(interFace: Interface): void {
         resolveInterface(fileSymbol, interFace);
      },
      visitAlias(aliased: Alias): void {
         resolveAlias(fileSymbol, aliased);
      },
      visitEnum(enumeration: Enum): void {
         resolveEnum(fileSymbol, enumeration);
      },
   };

   (fileSymbol.value as TexelFile).declarations.forEach(value => {
      value.visit(addToTree);
   });

   registerInternals(fileSymbol);

   (fileSymbol.value as TexelFile).declarations.forEach(value => {
      value.visit(resolveSymbols);
   });

}

function addStruct(fileSymbol: SymbolTree, struct: Struct) {
   const structSymbol = fileSymbol.addValueToPath([struct.name.value],
      SymbolType.STRUCT,
      struct,
   );

   struct.fields.forEach(it => {
      structSymbol.addValueToPath([it.name.value], SymbolType.STRUCT_FIELD, it);
   });
}

function addFunction(fileSymbol: SymbolTree, func: FunctionDecl) {
   fileSymbol.addValueToPath(func.name.toPathString(), SymbolType.FUNCTION, func);
}

function addInterface(fileSymbol: SymbolTree, interfaceDecl: Interface) {
   const interfaceSymbol = fileSymbol.addValueToPath([interfaceDecl.name.value],
      SymbolType.INTERFACE,
      interfaceDecl,
   );

   interfaceDecl.functionDeclarations.forEach(it => {
      interfaceSymbol.addValueToPath([it.name.value], SymbolType.INTERFACE_FUNC, it);
   });
}

function addAlias(fileSymbol: SymbolTree, alias: Alias) {
   fileSymbol.addValueToPath([alias.name.value], SymbolType.ALIAS, alias);
}

function addEnum(fileSymbol: SymbolTree, enumaration: Enum) {
   fileSymbol.addValueToPath([enumaration.name.value], SymbolType.ENUM, enumaration);
}

function resolveGenericDeclaration(fileSymbol: SymbolTree, decls: GenericDeclaration[]) {
   decls.filter(it => it.extending !== undefined)
        .map(it => addSymbolsToGenericName(fileSymbol, it.extending!));
}

function resolveStruct(fileSymbol: SymbolTree, struct: Struct) {
   resolveGenericDeclaration(fileSymbol, struct.generics);

   struct.fields.forEach(it => addSymbolsToGenericName(fileSymbol, it.type));
}

function resolveFunction(fileSymbol: SymbolTree, func: FunctionDecl) {
   resolveGenericDeclaration(fileSymbol, func.generics);

   func.parameters.forEach(it => addSymbolsToGenericName(fileSymbol, it.type));

   addSymbolsToGenericName(fileSymbol, func.returnType.name);

   const variableResolver = new SymbolResolver(fileSymbol);
   func.body.forEach(it => it.visit(variableResolver));
}

function resolveInterface(fileSymbol: SymbolTree, interfaceDecl: Interface) {
   resolveGenericDeclaration(fileSymbol, interfaceDecl.generics);

   interfaceDecl.functionDeclarations.forEach(it => {
      it.parameters.forEach(it => addSymbolsToGenericName(fileSymbol, it.type));
      addSymbolsToGenericName(fileSymbol, it.returnType.name);
   });
}

function resolveAlias(fileSymbol: SymbolTree, alias: Alias) {
   addSymbolsToGenericName(fileSymbol, alias.aliased);
}

function resolveEnum(fileSymbol: SymbolTree, enumaration: Enum) {
   // Not needed for now?
}

function addSymbolsToGenericName(rootSymbol: SymbolTree, name: GenericName) {
   name.parts.forEach(it => {
      it.referencing = rootSymbol.findChildAtPath([it.name.value]);
      if (it.referencing.type === SymbolType.UNKNOWN) {
         throw new Error(`Undefined Symbol used: ${ it.name.value }.`);
      }

      it.generics.forEach(generic => addSymbolsToGenericName(it.referencing!, generic));
   });
}

class SymbolResolver implements StatementVisitor {
   constructor(public symbol: SymbolTree) {
   }

   public visitAssignment(assignment: Assignment): void {

   }

   public visitBreak(breakStmt: Break): void {
   }

   public visitContinue(continueStmt: Continue): void {
   }

   public visitExpression(expr: ExpressionStmt): void {
   }

   public visitIfElse(ifElse: IfElse): void {
      ifElse.ifArm.block.forEach(it => it.visit(this));
      ifElse.elseIfs.forEach(it => it.block.forEach(stmt => stmt.visit(this)));
      ifElse.elseArm.forEach(it => it.visit(this));
   }

   public visitLoop(loop: Loop): void {
      loop.block.forEach(it => it.visit(this));
   }

   public visitReturn(returnStmt: Return): void {
   }

   public visitVariable(variable: Variable): void {
      addSymbolsToGenericName(this.symbol, variable.type);
   }

   public visitWhen(when: When): void {
      when.arms.forEach(it => {
         if (Array.isArray(it.block)) {
            it.block.forEach(stmt => stmt.visit(this));
         }
      });
   }

}

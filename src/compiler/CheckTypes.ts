import {
   Assignment,
   BinaryExpression,
   BinaryNegate,
   BooleanLiteral,
   Call,
   CharLiteral,
   DoubleLiteral,
   Expression,
   ExpressionStatement,
   FunctionDeclaration,
   Identifier,
   IfElseStatement,
   IntLiteral,
   isAssignment,
   isBinaryExpression,
   isBinaryNegate,
   isBooleanLiteral,
   isCall,
   isCharLiteral,
   isDoubleLiteral,
   isExpressionStatement,
   isIdentifier,
   isIfElseStatement,
   isIntLiteral,
   isLoopControlStatement,
   isLoopStatement,
   isMemberAccess,
   isReturnStatement,
   isStringLiteral,
   isStructLiteral,
   isVariableDeclaration,
   LoopStatement,
   MemberAccess,
   ReturnStatement,
   Statement,
   StringLiteral,
   StructDeclaration,
   StructLiteral,
   TexelFile,
   VariableDeclaration,
}                       from "../Tree";
import { isNil, Stack } from "../utils";
import { CompilerData } from "./CompilerData";

// At this point every name that is used exists before usage
// Now for every name the type needs to be added
// Something like
// interface NameType { name: string, type: string }
// For structs we need to check if all names that do not have a default initializer are
// declared.

export interface NameTypePair {
   name: string;
   type: string;
}

export interface FieldNameTypePair extends NameTypePair {
   hasInitializer: boolean;
}

export interface FunctionTypes {
   returnType: string;
   parameters: string[];
}

export interface TypeCheckData {
   // Just all variables used around the file
   stack: Stack<NameTypePair>;
   // All Structs with fields and if they have a initializer
   structs: Record<string, FieldNameTypePair[]>
   // All functions and a list of types that are needed as parameters
   functions: Record<string, FunctionTypes>

   currentFunction?: FunctionTypes;
}

export function checkTypes(
   data: CompilerData,
   file: TexelFile,
) {
   const typeCheckData: TypeCheckData = {
      stack: new Stack<NameTypePair>(),
      structs: {},
      functions: {},
   };

   registerInternalStructs(typeCheckData);
   file.structs.forEach(
      it => collectStructInfo(typeCheckData, it));
   file.structs.forEach(
      it => checkStructDefaultInitializers(typeCheckData, it));

   file.functions.forEach(
      it => collectFunctionInfo(typeCheckData, it));

   file.functions.forEach(
      it => walkFunctionBody(typeCheckData, it));
}

function registerInternalStructs(data: TypeCheckData) {
   data.structs["double"] = [];
   data.structs["string"] = [];
   data.structs["char"] = [];
   data.structs["int"] = [];
   data.structs["boolean"] = [];
   data.structs["void"] = [];
}

function collectStructInfo(
   data: TypeCheckData,
   struct: StructDeclaration,
) {
   data.structs[struct.name] = struct.fields.map(
      it => {
         return {
            name: it.name,
            type: it.type,
            hasInitializer: !isNil(it.initializer),
         } as FieldNameTypePair;
      });
}

function checkStructDefaultInitializers(
   data: TypeCheckData,
   struct: StructDeclaration,
) {
   // TODO: Check if field type is same as initializer expressions
   struct.fields.filter(
      it => !isNil(it.initializer))
   .forEach(
      it => {
         checkExpressionType(data, [it.type], it.initializer!!);
      });
}

function collectFunctionInfo(
   data: TypeCheckData,
   fn: FunctionDeclaration,
) {
   data.functions[fn.name] = {
      returnType: fn.returnType,
      parameters: fn.parameters.map(
         it => it.type),
   };
}

function walkFunctionBody(
   data: TypeCheckData,
   fn: FunctionDeclaration,
) {
   fn.parameters.forEach(
      it => data.stack.push({
         name: it.name,
         type: it.type,
      }));
   fn.statements.forEach(
      it => {
         data.currentFunction = data.functions[fn.name];
         walkStatement(data, it);
      });
}

function walkStatement(
   data: TypeCheckData,
   stmt: Statement,
) {
   if (isVariableDeclaration(stmt)) {
      walkVariableDeclaration(data, stmt);
   } else if (isExpressionStatement(stmt)) {
      walkExpressionStatement(data, stmt);
   } else if (isLoopStatement(stmt)) {
      walkLoopStatement(data, stmt);
   } else if (isLoopControlStatement(stmt)) {
      // Already checked in previous pass
      // walkLoopControlStatement(data, stmt);
   } else if (isIfElseStatement(stmt)) {
      walkIfElseStatement(data, stmt);
   } else if (isReturnStatement(stmt)) {
      walkReturnStatement(data, stmt);
   }
}

function walkVariableDeclaration(
   data: TypeCheckData,
   stmt: VariableDeclaration,
) {
   data.stack.push({
      name: stmt.name,
      type: stmt.type,
   });

   if (!isNil(stmt.expression)) {
      checkExpressionType(data, [stmt.type], stmt.expression);
   }
}

function walkExpressionStatement(
   data: TypeCheckData,
   stmt: ExpressionStatement,
) {
   checkExpressionType(data, Object.keys(data.structs), stmt.expression);
}

function walkLoopStatement(
   data: TypeCheckData,
   stmt: LoopStatement,
) {
   checkExpressionType(data, ["boolean", "int"], stmt.expression);
   stmt.statements.forEach(
      it => walkStatement(data, it));
}

function walkIfElseStatement(
   data: TypeCheckData,
   stmt: IfElseStatement,
) {
   checkExpressionType(data, ["boolean", "int"], stmt.expression);
   stmt.statements.forEach(
      it => walkStatement(data, it));
   stmt.elseIfs.forEach(
      elseIf => {
         checkExpressionType(data, ["boolean", "int"], elseIf.expression);
         elseIf.statements.forEach(
            it => walkStatement(data, it));
      });

   stmt.elseStatements.forEach(
      it => walkStatement(data, it));
}

function walkReturnStatement(
   data: TypeCheckData,
   stmt: ReturnStatement,
) {
   if (isNil(data.currentFunction)) {
      throw new Error("Can only use 'return' in functions.");
   }
   const returnType = data.currentFunction.returnType;
   if (returnType === "void" && isNil(stmt.expression)) {
      return;
   } else if (returnType === "void") {
      throwTypeError(["void"], "any");
   } else {
      checkExpressionType(data, [returnType], stmt.expression!!);
   }

}

function throwTypeError(
   expectedTypes: string[],
   foundType: string,
) {
   throw new Error(`Expected: ${ expectedTypes.join(", ") }. Found ${ foundType }`);
}

function checkExpressionType(
   data: TypeCheckData,
   expectedTypes: string[],
   expr: Expression,
) {
   if (isAssignment(expr)) {
      walkAssignment(data, expectedTypes, expr);
   } else if (isBinaryExpression(expr)) {
      walkBinary(data, expectedTypes, expr);
   } else if (isBinaryNegate(expr)) {
      walkBinaryNegate(data, expectedTypes, expr);
   } else if (isCall(expr)) {
      walkCall(data, expectedTypes, expr);
   } else if (isMemberAccess(expr)) {
      walkMemberAccess(data, expectedTypes, expr);
   } else if (isBooleanLiteral(expr)) {
      walkBoolean(expectedTypes, expr);
   } else if (isStringLiteral(expr)) {
      walkString(expectedTypes, expr);
   } else if (isCharLiteral(expr)) {
      walkChar(expectedTypes, expr);
   } else if (isIntLiteral(expr)) {
      walkInt(expectedTypes, expr);
   } else if (isDoubleLiteral(expr)) {
      walkDouble(expectedTypes, expr);
   } else if (isStructLiteral(expr)) {
      walkStruct(data, expectedTypes, expr);
   } else if (isIdentifier(expr)) {
      walkIdentifier(data, expectedTypes, expr);
   } else {
      throw new Error(`Unknown expression: ${ JSON.stringify(expr) }, expecting: ${ JSON.stringify(
         expectedTypes) }`);
   }
}

function walkAssignment(
   data: TypeCheckData,
   expectedTypes: string[],
   expr: Assignment,
) {
   const variable = data.stack.find(
      it => it.name === expr.name);
   if (variable === undefined) {
      throwTypeError(["UNKNOWN"], "NOTHING");
   } else {
      checkExpressionType(data, [variable.type], expr.expression);
   }
}

function walkBinary(
   data: TypeCheckData,
   expectedTypes: string[],
   expr: BinaryExpression,
) {
   const intIdx = expectedTypes.indexOf("int");
   const doubleIdx = expectedTypes.indexOf("double");
   const stringIdx = expectedTypes.indexOf("string");
   const charIdx = expectedTypes.indexOf("char");

   if (intIdx > -1) {
      if (doubleIdx > -1 && expectedTypes.length > 2) {
         throw new Error("Can't do a binary operation on types: " + expectedTypes.join(", "));
      } else if (expectedTypes.length > 1) {
         throw new Error("Can't do a binary operation on types: " + expectedTypes.join(", "));
      }
   }

   if (doubleIdx > -1) {
      if (intIdx > -1 && expectedTypes.length > 2) {
         throw new Error("Can't do a binary operation on types: " + expectedTypes.join(", "));
      } else if (expectedTypes.length > 1) {
         throw new Error("Can't do a binary operation on types: " + expectedTypes.join(", "));
      }
   }

   if (charIdx > -1) {
      if (stringIdx > -1 && expectedTypes.length > 2) {
         throw new Error("Can't do a binary operation on types: " + expectedTypes.join(", "));
      } else if (expectedTypes.length > 1) {
         throw new Error("Can't do a binary operation on types: " + expectedTypes.join(", "));
      }
   }

   if (stringIdx > -1) {
      if (charIdx > -1 && expectedTypes.length > 2) {
         throw new Error("Can't do a binary operation on types: " + expectedTypes.join(", "));
      } else if (expectedTypes.length > 1) {
         throw new Error("Can't do a binary operation on types: " + expectedTypes.join(", "));
      }
   }

   checkExpressionType(data, expectedTypes, expr.left);
   checkExpressionType(data, expectedTypes, expr.right);
}

function walkBinaryNegate(
   data: TypeCheckData,
   expectedTypes: string[],
   expr: BinaryNegate,
) {
   if (expectedTypes.length !== 1 || expectedTypes[0] !== "boolean") {
      throw new Error("Can only Binary negate booleans.");
   }
   checkExpressionType(data, ["boolean"], expr.expression);
}

function walkCall(
   data: TypeCheckData,
   expectedTypes: string[],
   expr: Call,
) {
   const calledFn = data.functions[expr.name]!!;
   if (!expectedTypes.includes(calledFn.returnType)) {
      throw new Error(`Expected: ${ expectedTypes.join(", ") }. Found: ${ calledFn.returnType }`);
   }
   if (expr.arguments.length !== calledFn.parameters.length) {
      throw new Error(`Can't call ${ expr.name }. Too ${ expr.arguments.length >
                                                         calledFn.parameters.length ? "many"
                                                                                    : "few" } arguments.`);
   }
   for (let i = 0; i < expr.arguments.length; ++i) {
      try {
         checkExpressionType(data, [calledFn.parameters[i]], expr.arguments[i]);
      } catch (e) {
         console.error("At function call:", expr.name);
         throw e;
      }
   }
}

function walkMemberAccess(
   data: TypeCheckData,
   expectedTypes: string[],
   expr: MemberAccess,
) {
   let exprType = "unknown";
   if (isCall(expr.expression)) {
      exprType = data.functions[expr.expression.name].returnType;
   } else if (isIdentifier(expr.expression)) {
      exprType = data.stack.find(
         it => it.name === (expr.expression as Identifier).identifier)!!.type;
   } else {
      throw new Error("Unknown expression typ!");
   }
   const structFields = data.structs[exprType];
   const structField = structFields.find(
      it => it.name === expr.member);

   if (structField === undefined) {
      throw new Error(`Member ${ expr.member } not found on type: ${ exprType }`);
   }
   if (!expectedTypes.includes(structField.type)) {
      throwTypeError(expectedTypes, structField.type);
   }
}

function walkBoolean(
   expectedTypes: string[],
   expr: BooleanLiteral,
) {
   if (!expectedTypes.includes("boolean")) {
      throwTypeError(expectedTypes, "boolean");
   }
}

function walkString(
   expectedTypes: string[],
   expr: StringLiteral,
) {
   if (!expectedTypes.includes("string")) {
      throwTypeError(expectedTypes, "string");
   }
}

function walkChar(
   expectedTypes: string[],
   expr: CharLiteral,
) {
   if (!expectedTypes.includes("char")) {
      throwTypeError(expectedTypes, "char");
   }
}

function walkInt(
   expectedTypes: string[],
   expr: IntLiteral,
) {
   // Checks for doubles and ints for now.
   if (!expectedTypes.includes("int") && !expectedTypes.includes("double")) {
      throwTypeError(expectedTypes, "int");
   }
}

function walkDouble(
   expectedTypes: string[],
   expr: DoubleLiteral,
) {
   if (!expectedTypes.includes("double")) {
      throwTypeError(expectedTypes, "double");
   }
}

function walkStruct(
   data: TypeCheckData,
   expectedTypes: string[],
   expr: StructLiteral,
) {
   if (expectedTypes.length > 1) {
      throwTypeError(expectedTypes, "UNKNOWN");
   }
   const expectedType = expectedTypes[0];
   const expectedTypeInfo: FieldNameTypePair[] = data.structs[expectedType];

   const expressions: (Expression | undefined)[] = [];
   expectedTypeInfo.forEach(
      value => {
         const tmpExpr = expr.assignments.find(
            it => it.name === value.name);
         if (isNil(tmpExpr) && !value.hasInitializer) {
            throw new Error(`Invalid struct literal ${ expectedType } missing property: ${ value.name }`);
         } else {
            expressions.push((tmpExpr || {} as any).value);
         }
      });

   for (let i = 0; i < expressions.length; ++i) {
      if (!isNil(expressions[i])) {
         checkExpressionType(data, [expectedTypeInfo[i].type], expressions[i]!!);
      }
   }
}

function walkIdentifier(
   data: TypeCheckData,
   expectedTypes: string[],
   expr: Identifier,
) {
   const typeInfo = data.stack.find(
      it => it.name === expr.identifier);
   if (typeInfo === undefined) {
      throw new Error(`Could not find ${ expr.identifier }`);
   }
   if (!expectedTypes.includes(typeInfo.type)) {
      throwTypeError(expectedTypes, typeInfo.type);
   }

}

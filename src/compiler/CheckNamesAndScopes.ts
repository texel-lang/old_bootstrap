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
   LoopControlStatement,
   LoopStatement,
   MemberAccess,
   ReturnStatement,
   Statement,
   StringLiteral,
   StructLiteral,
   TexelFile,
   VariableDeclaration,
}                       from "../Tree";
import { isNil }        from "../utils";
import { CompilerData } from "./CompilerData";

export function checkNamesAndScopes(
   data: CompilerData,
   file: TexelFile,
) {
   file.structs.forEach(
      it => {
         it.fields.forEach(
            field => {
               if (it.fields.filter(
                  otherField => otherField.name === field.name).length > 1) {
                  throw new Error(`Struct field with name ${ field.name } already declared in struct ${ it.name }`);
               }
               if (!isNil(field.initializer)) {
                  walkExpression(data, field.initializer);
               }
            });
      });
   file.functions.forEach(
      value => walkFunction(data, value));
}

function walkFunction(
   data: CompilerData,
   value: FunctionDeclaration,
) {
   if (isNil(data.structNames[value.returnType])) {
      throw new Error(`Unknown return type: ${ value.returnType }`);
   }
   data.pushScope(); // Parameters
   value.parameters.forEach(
      param => {
         if (data.currentScope.containsNameRecursive(param.name)) {
            throw new Error(`Name already declared: ${ param.name }`);
         }
         data.currentScope.knownNames[param.name] = param.type;
      });
   data.pushScope(); // Function body

   value.statements.forEach(
      it => walkStatement(data, it));

   data.popScope(); // Function body
   data.popScope(); // Parameters
}

function walkStatement(
   data: CompilerData,
   stmt: Statement,
) {
   if (isVariableDeclaration(stmt)) {
      walkVariableDeclaration(data, stmt);
   } else if (isExpressionStatement(stmt)) {
      walkExpressionStatement(data, stmt);
   } else if (isLoopStatement(stmt)) {
      walkLoopStatement(data, stmt);
   } else if (isLoopControlStatement(stmt)) {
      walkLoopControlStatement(data, stmt);
   } else if (isIfElseStatement(stmt)) {
      walkIfElseStatement(data, stmt);
   } else if (isReturnStatement(stmt)) {
      walkReturnStatement(data, stmt);
   }
}

function walkVariableDeclaration(
   data: CompilerData,
   stmt: VariableDeclaration,
) {
   if (data.currentScope.containsNameRecursive(stmt.name)) {
      throw new Error(`Variable ${ stmt.name } already exists in current scope.`);
   }
   data.currentScope.knownNames[stmt.name] = stmt.type;
}

function walkExpressionStatement(
   data: CompilerData,
   stmt: ExpressionStatement,
) {
   walkExpression(data, stmt.expression);
}

function walkLoopStatement(
   data: CompilerData,
   stmt: LoopStatement,
) {
   walkExpression(data, stmt.expression);

   const scope = data.pushScope(); // Loop scope
   scope.isLoopScope = true;

   stmt.statements.forEach(
      it => walkStatement(data, it));

   data.popScope(); // Loop scope
}

function walkLoopControlStatement(
   data: CompilerData,
   stmt: LoopControlStatement,
) {
   if (!data.currentScope.isLoopScope) {
      const controlName = stmt.isContinue ? "CONTINUE" : "BREAK";
      throw new Error(`${ controlName } can only be used in a loop statement.`);
   }
}

function walkIfElseStatement(
   data: CompilerData,
   stmt: IfElseStatement,
) {
   walkExpression(data, stmt.expression);

   data.pushScope();
   stmt.statements.forEach(
      it => walkStatement(data, it));
   data.popScope();

   stmt.elseIfs.forEach(
      elseIf => {
         walkExpression(data, elseIf.expression);
         data.pushScope();
         elseIf.statements.forEach(
            it => walkStatement(data, it));
         data.popScope();
      });

   data.pushScope();
   stmt.elseStatements.forEach(
      it => walkStatement(data, it));
   data.popScope();
}

function walkReturnStatement(
   data: CompilerData,
   stmt: ReturnStatement,
) {
   if (!isNil(stmt.expression)) {
      walkExpression(data, stmt.expression);
   }
}

function walkExpression(
   data: CompilerData,
   expr: Expression,
) {
   if (isAssignment(expr)) {
      walkAssignment(data, expr);
   } else if (isBinaryExpression(expr)) {
      walkBinary(data, expr);
   } else if (isBinaryNegate(expr)) {
      walkBinaryNegate(data, expr);
   } else if (isCall(expr)) {
      walkCall(data, expr);
   } else if (isMemberAccess(expr)) {
      walkMemberAccess(data, expr);
   } else if (isBooleanLiteral(expr)) {
      walkBoolean(data, expr);
   } else if (isStringLiteral(expr)) {
      walkString(data, expr);
   } else if (isCharLiteral(expr)) {
      walkChar(data, expr);
   } else if (isIntLiteral(expr)) {
      walkInt(data, expr);
   } else if (isDoubleLiteral(expr)) {
      walkDouble(data, expr);
   } else if (isStructLiteral(expr)) {
      walkStruct(data, expr);
   } else if (isIdentifier(expr)) {
      walkIdentifier(data, expr);
   }
}

function walkAssignment(
   data: CompilerData,
   expr: Assignment,
) {
   if (!data.currentScope.containsNameRecursive(expr.name)) {
      throw new Error(`${ expr.name } is used before declaration`);
   }
   walkExpression(data, expr.expression);
}

function walkBinary(
   data: CompilerData,
   expr: BinaryExpression,
) {
   walkExpression(data, expr.left);
   walkExpression(data, expr.right);
}

function walkBinaryNegate(
   data: CompilerData,
   expr: BinaryNegate,
) {
   walkExpression(data, expr.expression);
}

function walkCall(
   data: CompilerData,
   expr: Call,
) {
   if (!data.functionNames.includes(expr.name)) {
      throw new Error(`Function ${ expr.name } is not declared.`);
   }
   expr.arguments.forEach(
      it => walkExpression(data, it));
}

function walkMemberAccess(
   data: CompilerData,
   expr: MemberAccess,
) {
   walkExpression(data, expr.expression);
   // TODO: Check member name, but can only do if type of expression is known
}

function walkBoolean(
   data: CompilerData,
   expr: BooleanLiteral,
) {

}

function walkString(
   data: CompilerData,
   expr: StringLiteral,
) {

}

function walkChar(
   data: CompilerData,
   expr: CharLiteral,
) {

}

function walkInt(
   data: CompilerData,
   expr: IntLiteral,
) {

}

function walkDouble(
   data: CompilerData,
   expr: DoubleLiteral,
) {

}

function walkStruct(
   data: CompilerData,
   expr: StructLiteral,
) {

}

function walkIdentifier(
   data: CompilerData,
   expr: Identifier,
) {
   if (!data.currentScope.containsNameRecursive(expr.identifier)) {
      throw new Error(`${ expr.identifier } used before declaration.`);
   }
}


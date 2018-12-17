import {
   Assignment,
   BinaryExpression,
   BinaryNegate,
   BinaryOp,
   BooleanLiteral,
   Call,
   CharLiteral,
   DoubleLiteral,
   Expression,
   ExpressionStatement,
   ExpressionType,
   FunctionDeclaration,
   FunctionParameter,
   Identifier,
   IfElseStatement,
   IntLiteral,
   isIdentifier,
   isMemberAccess,
   LoopControlStatement,
   LoopStatement,
   MemberAccess,
   ReturnStatement,
   Statement,
   StatementType,
   StringLiteral,
   StructDeclaration,
   StructField,
   StructLiteral,
   StructLiteralAssignment,
   TexelFile,
   VariableDeclaration,
}                                      from "../Tree";
import { readFile }                    from "../utils";
import { getTokens, Token, TokenType } from "./Token";

export interface Parser {
   tokens: Token[];
   tokenLength: number;
   currentIdx: number;
}

export function parseFile(fileName: string): TexelFile {
   let tokens = getTokens(fileName, readFile(fileName));

   // Filter out comments for now.
   tokens = tokens.filter(
      it => {
         return it.type !== TokenType.COMMENT;
      });

   const info: Parser = {
      tokens,
      tokenLength: tokens.length,
      currentIdx: 0,
   };

   return parseTexelFile(info);
}

function isAtEnd(parser: Parser): boolean {
   return parser.currentIdx + 1 >= parser.tokenLength;
}

function peek(parser: Parser): Token {
   return parser.tokens[parser.currentIdx];
}

function peekType(parser: Parser): TokenType {
   return peek(parser).type;
}

function getNext(parser: Parser): Token | undefined {
   if (isAtEnd(parser)) {
      return;
   } else {
      const nextToken = peek(parser);
      parser.currentIdx++;

      return nextToken;
   }
}

function consume(
   parser: Parser,
   type: TokenType,
): boolean {
   if (peekType(parser) !== type) {
      return false;
   } else {
      getNext(parser);
      return true;
   }
}

/**
 * Throws if next token is not of the expected type.
 * Will replace '{0}' in the error message with the expected TokenType.
 * Will replace '{1}' in the error message with the current TokenType.
 * Will replace '{2}' in the error message with source file and line.
 */
function consumeOrThrow(
   parser: Parser,
   type: TokenType,
   errorMessage: string = "Expected TokenType: '{0}'. Found '{1}'. At line: {2}",
) {
   if (!consume(parser, type)) {
      const peeked = peek(parser);
      throw new Error(errorMessage
      .replace("{0}", type)
      .replace("{1}", peeked.type)
      .replace("{2}",
         `${ peeked.sourcePosition.fileName }::${ peeked.sourcePosition.lineIdx }`,
      ));
   }
}

function throwError(
   parser: Parser,
   ...expectedTypes: TokenType[]
): void {
   const token = peek(parser);
   throw new Error(`
   Unexpected token with type: ${ token.type } and value: ${ token.value }.
   In file: ${ token.sourcePosition.fileName }:${ token.sourcePosition.lineIdx }.
   Expected: ${ expectedTypes.join(" | ") }`);
}

function expectOrThrow(
   parser: Parser,
   type: TokenType,
) {
   if (peekType(parser) != type) {
      throwError(parser, type);
   }
}

function parseTexelFile(parser: Parser): TexelFile {
   const result: TexelFile = {
      structs: [],
      functions: [],
   };

   while (!isAtEnd(parser)) {
      switch (peekType(parser)) {
         case TokenType.ERROR:
            throw new Error(getNext(parser)!!.value);
         case TokenType.EOF:
            break;
         case TokenType.STRUCT:
            consume(parser, TokenType.STRUCT);
            result.structs.push(parseStructDeclaration(parser));
            break;
         case TokenType.FN:
            consume(parser, TokenType.FN);
            result.functions.push(parseFunctionDeclaration(parser));
            break;
         default:
            throwError(parser, TokenType.STRUCT);
      }
   }

   return result;
}

function parseStructDeclaration(parser: Parser): StructDeclaration {
   if (peekType(parser) !== TokenType.IDENTIFIER) {
      throw new Error("Expecting struct name.");
   }
   const name = getNext(parser)!!.value;

   consumeOrThrow(parser, TokenType.LEFT_CURLY_BRACKET);

   const fields: StructField[] = [];
   while (!isAtEnd(parser) && peekType(parser) !== TokenType.RIGHT_CURLY_BRACKET) {
      expectOrThrow(parser, TokenType.IDENTIFIER);
      const type = getNext(parser)!!.value;

      expectOrThrow(parser, TokenType.IDENTIFIER);
      const name = getNext(parser)!!.value;
      if (peekType(parser) === TokenType.EQUAL) {
         consumeOrThrow(parser, TokenType.EQUAL);
         const expression = parseExpression(parser);
         fields.push({
            type,
            name,
            initializer: expression,
         });
      } else {
         fields.push({
            type,
            name,
         });
      }
      consumeOrThrow(parser, TokenType.SEMICOLON);
   }
   consumeOrThrow(parser, TokenType.RIGHT_CURLY_BRACKET);

   return {
      name,
      fields,
   };
}

function parseFunctionDeclaration(parser: Parser): FunctionDeclaration {
   expectOrThrow(parser, TokenType.IDENTIFIER);
   // TODO: Extension functions maybe in form of member access?
   const name = getNext(parser)!!.value;
   const parameters: FunctionParameter[] = parseFunctionParameters(parser);

   consumeOrThrow(parser, TokenType.COLON);
   expectOrThrow(parser, TokenType.IDENTIFIER);
   const returnType = getNext(parser)!!.value;

   consumeOrThrow(parser, TokenType.LEFT_CURLY_BRACKET);
   const statements: Statement[] = parseStatementBlock(parser);

   consumeOrThrow(parser, TokenType.RIGHT_CURLY_BRACKET);
   return {
      name,
      parameters,
      returnType,
      statements,
   };
}

function parseFunctionParameters(parser: Parser): FunctionParameter[] {
   const result: FunctionParameter[] = [];

   consumeOrThrow(parser, TokenType.LEFT_PARENTHESIS);
   while (!isAtEnd(parser) && peekType(parser) !== TokenType.RIGHT_PARENTHESIS) {
      expectOrThrow(parser, TokenType.IDENTIFIER);
      const type = getNext(parser)!!.value;
      expectOrThrow(parser, TokenType.IDENTIFIER);
      const name = getNext(parser)!!.value;
      result.push({
         type,
         name,
      });
      if ((peekType(parser) !== TokenType.COMMA) &&
          (peekType(parser) !== TokenType.RIGHT_PARENTHESIS)) {
         throwError(parser, TokenType.COMMA, TokenType.RIGHT_PARENTHESIS);
      }
      consume(parser, TokenType.COMMA);
   }
   consumeOrThrow(parser, TokenType.RIGHT_PARENTHESIS);

   return result;
}

function parseStatementBlock(
   parser: Parser,
   supportControlStatements: boolean = false,
): Statement[] {
   const result: Statement[] = [];

   while (!isAtEnd(parser) && peekType(parser) !== TokenType.RIGHT_CURLY_BRACKET) {
      switch (peekType(parser)) {
         case TokenType.LOOP:
            result.push(parseLoop(parser));
            break;
         case TokenType.IF:
            result.push(parseIf(parser));
            break;
         case TokenType.RETURN:
            consumeOrThrow(parser, TokenType.RETURN);
            const expr = parseExpression(parser);
            consumeOrThrow(parser, TokenType.SEMICOLON);
            result.push({
               statementType: StatementType.ReturnStatement,
               expression: expr,
            } as ReturnStatement);
            break;
         case TokenType.CONTINUE:
            if (!supportControlStatements) {
               throwError(parser, TokenType.ERROR);
            }
            getNext(parser);
            consumeOrThrow(parser, TokenType.SEMICOLON);
            result.push({
               statementType: StatementType.LoopControlStatement,
               isBreak: false,
               isContinue: true,
            } as LoopControlStatement);
            break;
         case TokenType.BREAK:
            if (!supportControlStatements) {
               throwError(parser, TokenType.ERROR);
            }
            getNext(parser);
            consumeOrThrow(parser, TokenType.SEMICOLON);
            result.push({
               statementType: StatementType.LoopControlStatement,
               isBreak: true,
               isContinue: false,
            } as LoopControlStatement);
            break;
         default:
            const intermediateExpression = parseExpression(parser);
            if (isIdentifier(intermediateExpression)) {
               result.push(parseVariableDeclaration(parser,
                  intermediateExpression.identifier,
               ));
            } else {
               consumeOrThrow(parser, TokenType.SEMICOLON);
               result.push({
                  statementType: StatementType.ExpressionStatement,
                  expression: intermediateExpression,
               } as ExpressionStatement);
            }
      }
   }

   return result;
}

function parseLoop(parser: Parser): LoopStatement {
   consumeOrThrow(parser, TokenType.LOOP);
   consumeOrThrow(parser, TokenType.LEFT_PARENTHESIS);

   const expression = parseExpression(parser);

   consumeOrThrow(parser, TokenType.RIGHT_PARENTHESIS);

   consumeOrThrow(parser, TokenType.LEFT_CURLY_BRACKET);
   const statements: Statement[] = parseStatementBlock(parser, true);
   consumeOrThrow(parser, TokenType.RIGHT_CURLY_BRACKET);

   return {
      statementType: StatementType.LoopStatement,
      expression,
      statements,
   };
}

function parseIf(parser: Parser): IfElseStatement {
   consumeOrThrow(parser, TokenType.IF);
   consumeOrThrow(parser, TokenType.LEFT_PARENTHESIS);
   const expression = parseExpression(parser);
   consumeOrThrow(parser, TokenType.RIGHT_PARENTHESIS);

   consumeOrThrow(parser, TokenType.LEFT_CURLY_BRACKET);
   const statements: Statement[] = parseStatementBlock(parser);
   consumeOrThrow(parser, TokenType.RIGHT_CURLY_BRACKET);

   const elseIfs: IfElseStatement[] = [];
   const elseStatements: Statement[] = [];

   while (!isAtEnd(parser) && peekType(parser) === TokenType.ELSE) {
      consumeOrThrow(parser, TokenType.ELSE);

      if (peekType(parser) === TokenType.IF) {
         consumeOrThrow(parser, TokenType.IF);

         consumeOrThrow(parser, TokenType.LEFT_PARENTHESIS);
         const ifElseExpr = parseExpression(parser);
         consumeOrThrow(parser, TokenType.RIGHT_PARENTHESIS);

         consumeOrThrow(parser, TokenType.LEFT_CURLY_BRACKET);
         const ifElseStmts: Statement[] = parseStatementBlock(parser);
         consumeOrThrow(parser, TokenType.RIGHT_CURLY_BRACKET);

         elseIfs.push({
            statementType: StatementType.IfElseStatement,
            expression: ifElseExpr,
            statements: ifElseStmts,
            elseIfs: [],
            elseStatements: [],
         });
      } else {
         consumeOrThrow(parser, TokenType.LEFT_CURLY_BRACKET);
         elseStatements.push(...parseStatementBlock(parser));
         consumeOrThrow(parser, TokenType.RIGHT_CURLY_BRACKET);
         break;
      }
   }

   return {
      statementType: StatementType.IfElseStatement,
      expression,
      statements,
      elseIfs,
      elseStatements,
   };
}

function parseVariableDeclaration(
   parser: Parser,
   typeName: string,
): VariableDeclaration {
   expectOrThrow(parser, TokenType.IDENTIFIER);
   const name = getNext(parser)!!.value;

   let expression;
   if (consume(parser, TokenType.EQUAL)) {
      expression = parseLogicOr(parser);
   } else {
      expression = undefined;
   }

   consumeOrThrow(parser, TokenType.SEMICOLON);

   return {
      statementType: StatementType.VariableDeclaration,
      type: typeName,
      name,
      expression,
   };
}

function parseExpression(parser: Parser): Expression {
   return parseAssignment(parser);
}

function parseAssignment(parser: Parser): Expression {
   const expr: Expression = parseLogicOr(parser);

   if (!isIdentifier(expr) && !isMemberAccess(expr)) {
      return expr;
   }
   const name = isIdentifier(expr) ? expr.identifier : (expr as MemberAccess).member;

   switch (peekType(parser)) {
      case TokenType.EQUAL:
         consumeOrThrow(parser, TokenType.EQUAL);
         return {
            expressionType: ExpressionType.Assignment,
            name,
            expression: parseLogicOr(parser),
         } as Assignment;
      case TokenType.PLUS_EQUAL:
         consumeOrThrow(parser, TokenType.PLUS_EQUAL);
         return {
            expressionType: ExpressionType.Assignment,
            name,
            expression: {
               expressionType: ExpressionType.Binary,
               left: expr,
               op: BinaryOp.ADD,
               right: parseLogicOr(parser),
            } as BinaryExpression,
         } as Assignment;
      case TokenType.DASH_EQUAL:
         consumeOrThrow(parser, TokenType.DASH_EQUAL);
         return {
            expressionType: ExpressionType.Assignment,
            name,
            expression: {
               expressionType: ExpressionType.Binary,
               left: expr,
               op: BinaryOp.SUBTRACT,
               right: parseLogicOr(parser),
            } as BinaryExpression,
         } as Assignment;
      case TokenType.STAR_EQUAL:
         consumeOrThrow(parser, TokenType.STAR_EQUAL);
         return {
            expressionType: ExpressionType.Assignment,
            name,
            expression: {
               expressionType: ExpressionType.Binary,
               left: expr,
               op: BinaryOp.MULTIPLY,
               right: parseLogicOr(parser),
            } as BinaryExpression,
         } as Assignment;
      case TokenType.SLASH_EQUAL:
         consumeOrThrow(parser, TokenType.SLASH_EQUAL);
         return {
            expressionType: ExpressionType.Assignment,
            name,
            expression: {
               expressionType: ExpressionType.Binary,
               left: expr,
               op: BinaryOp.DIVIDE,
               right: parseLogicOr(parser),
            } as BinaryExpression,
         } as Assignment;
      default:
         return expr;
   }
}

function parseLogicOr(parser: Parser): Expression {
   let expr: Expression = parseLogicAnd(parser);

   while (!isAtEnd(parser)) {
      if (peekType(parser) === TokenType.PIPE_PIPE) {
         consumeOrThrow(parser, TokenType.PIPE_PIPE);
         expr = {
            expressionType: ExpressionType.Binary,
            left: expr,
            op: BinaryOp.LOGIC_OR,
            right: parseLogicAnd(parser),
         } as BinaryExpression;
      } else {
         break;
      }
   }

   return expr;
}

function parseLogicAnd(parser: Parser): Expression {
   let expr: Expression = parseEquality(parser);

   while (!isAtEnd(parser)) {
      if (peekType(parser) === TokenType.AND_AND) {
         consumeOrThrow(parser, TokenType.AND_AND);
         expr = {
            expressionType: ExpressionType.Binary,
            left: expr,
            op: BinaryOp.LOGIC_AND,
            right: parseEquality(parser),
         } as BinaryExpression;
      } else {
         break;
      }
   }

   return expr;
}

function parseEquality(parser: Parser): Expression {
   let expr: Expression = parseComparison(parser);

   while (!isAtEnd(parser)) {
      if (peekType(parser) === TokenType.EQUAL_EQUAL) {
         consumeOrThrow(parser, TokenType.EQUAL_EQUAL);
         expr = {
            expressionType: ExpressionType.Binary,
            left: expr,
            op: BinaryOp.LOGIC_EQUAL,
            right: parseComparison(parser),
         } as BinaryExpression;
      } else if (peekType(parser) === TokenType.BANG_EQUAL) {
         consumeOrThrow(parser, TokenType.BANG_EQUAL);
         expr = {
            expressionType: ExpressionType.Binary,
            left: expr,
            op: BinaryOp.LOGIC_NOT_EQUAL,
            right: parseComparison(parser),
         } as BinaryExpression;
      } else {
         break;
      }
   }

   return expr;
}

function parseComparison(parser: Parser): Expression {
   let expr: Expression = parseAddition(parser);

   while (!isAtEnd(parser)) {
      if (peekType(parser) === TokenType.GREATER) {
         consumeOrThrow(parser, TokenType.GREATER);
         expr = {
            expressionType: ExpressionType.Binary,
            left: expr,
            op: BinaryOp.GREATER,
            right: parseAddition(parser),
         } as BinaryExpression;
      } else if (peekType(parser) === TokenType.GREATER_EQUAL) {
         consumeOrThrow(parser, TokenType.GREATER_EQUAL);
         expr = {
            expressionType: ExpressionType.Binary,
            left: expr,
            op: BinaryOp.GREATER_EQUAL,
            right: parseAddition(parser),
         } as BinaryExpression;
      } else if (peekType(parser) === TokenType.SMALLER) {
         consumeOrThrow(parser, TokenType.SMALLER);
         expr = {
            expressionType: ExpressionType.Binary,
            left: expr,
            op: BinaryOp.SMALLER,
            right: parseAddition(parser),
         } as BinaryExpression;
      } else if (peekType(parser) === TokenType.SMALLER_EQUAL) {
         consumeOrThrow(parser, TokenType.SMALLER_EQUAL);
         expr = {
            expressionType: ExpressionType.Binary,
            left: expr,
            op: BinaryOp.SMALLER_EQUAL,
            right: parseAddition(parser),
         } as BinaryExpression;
      } else {
         break;
      }
   }

   return expr;
}

function parseAddition(parser: Parser): Expression {
   let expr: Expression = parseMultiplication(parser);

   while (!isAtEnd(parser)) {
      if (peekType(parser) === TokenType.PLUS) {
         consumeOrThrow(parser, TokenType.PLUS);
         expr = {
            expressionType: ExpressionType.Binary,
            left: expr,
            op: BinaryOp.ADD,
            right: parseMultiplication(parser),
         } as BinaryExpression;
      } else if (peekType(parser) === TokenType.DASH) {
         consumeOrThrow(parser, TokenType.DASH);
         expr = {
            expressionType: ExpressionType.Binary,
            left: expr,
            op: BinaryOp.SUBTRACT,
            right: parseMultiplication(parser),
         } as BinaryExpression;
      } else {
         break;
      }
   }

   return expr;
}

function parseMultiplication(parser: Parser): Expression {
   let expr: Expression = parsePrefix(parser);

   while (!isAtEnd(parser)) {
      if (peekType(parser) === TokenType.STAR) {
         consumeOrThrow(parser, TokenType.STAR);
         expr = {
            expressionType: ExpressionType.Binary,
            left: expr,
            op: BinaryOp.MULTIPLY,
            right: parsePrefix(parser),
         } as BinaryExpression;
      } else if (peekType(parser) === TokenType.SLASH) {
         consumeOrThrow(parser, TokenType.SLASH);
         expr = {
            expressionType: ExpressionType.Binary,
            left: expr,
            op: BinaryOp.DIVIDE,
            right: parsePrefix(parser),
         } as BinaryExpression;
      } else {
         break;
      }
   }

   return expr;
}

function parsePrefix(parser: Parser): Expression {
   switch (peekType(parser)) {
      case TokenType.DASH_DASH:
         consumeOrThrow(parser, TokenType.DASH_DASH);
         return {
            expressionType: ExpressionType.Binary,
            left: parsePostfix(parser),
            op: BinaryOp.SUBTRACT,
            right: {
               expressionType: ExpressionType.IntLiteral,
               value: 1,
            } as IntLiteral,
         } as BinaryExpression;
      case TokenType.DASH:
         consumeOrThrow(parser, TokenType.DASH);
         return {
            expressionType: ExpressionType.Binary,
            left: {
               expressionType: ExpressionType.IntLiteral,
               value: -1,
            } as IntLiteral,
            op: BinaryOp.MULTIPLY,
            right: parsePostfix(parser),
         } as BinaryExpression;
      case TokenType.PLUS_PLUS:
         consumeOrThrow(parser, TokenType.PLUS_PLUS);
         return {
            expressionType: ExpressionType.Binary,
            left: parsePostfix(parser),
            op: BinaryOp.ADD,
            right: {
               expressionType: ExpressionType.IntLiteral,
               value: 1,
            } as IntLiteral,
         } as BinaryExpression;
      case TokenType.BANG:
         consumeOrThrow(parser, TokenType.BANG);
         return {
            expressionType: ExpressionType.Negate,
            expression: parsePostfix(parser),
         } as BinaryNegate;
   }
   return parsePostfix(parser);
}

function parsePostfix(parser: Parser): Expression {
   let intermediate = parsePrimary(parser);

   while (!isAtEnd(parser)) {
      const peekTokenType = peekType(parser);
      if (peekTokenType === TokenType.DOT) {
         consumeOrThrow(parser, TokenType.DOT);
         expectOrThrow(parser, TokenType.IDENTIFIER);

         intermediate = {
            expressionType: ExpressionType.MemberAccess,
            expression: intermediate,
            member: getNext(parser)!!.value,
         } as MemberAccess;
      } else if (peekTokenType === TokenType.LEFT_PARENTHESIS) {
         if (!isIdentifier(intermediate)) {
            throwError(parser, TokenType.IDENTIFIER);
         }
         const name = (intermediate as Identifier).identifier;

         const args: Expression[] = [];

         consumeOrThrow(parser, TokenType.LEFT_PARENTHESIS);
         while (!isAtEnd(parser) && peekType(parser) !== TokenType.RIGHT_PARENTHESIS) {
            args.push(parseExpression(parser));

            if (!consume(parser, TokenType.COMMA) && peekType(parser) !==
                TokenType.RIGHT_PARENTHESIS) {
               throwError(parser, TokenType.COMMA, TokenType.RIGHT_PARENTHESIS);
            }
         }
         consumeOrThrow(parser, TokenType.RIGHT_PARENTHESIS);

         intermediate = {
            expressionType: ExpressionType.Call,
            name,
            arguments: args,
         } as Call;
      } else {
         break;
      }
   }
   return intermediate;
}

function parsePrimary(parser: Parser): Expression {
   switch (peekType(parser)) {
      case TokenType.LEFT_PARENTHESIS:
         consumeOrThrow(parser, TokenType.LEFT_PARENTHESIS);
         const expr = parseExpression(parser);
         consumeOrThrow(parser, TokenType.RIGHT_PARENTHESIS);
         return expr;
      case TokenType.TRUE:
         consumeOrThrow(parser, TokenType.TRUE);
         return {
            expressionType: ExpressionType.BooleanLiteral,
            value: true,
         } as BooleanLiteral;
      case TokenType.FALSE:
         consumeOrThrow(parser, TokenType.FALSE);
         return {
            expressionType: ExpressionType.BooleanLiteral,
            value: false,
         } as BooleanLiteral;
      case TokenType.STRING:
         return {
            expressionType: ExpressionType.StringLiteral,
            value: getNext(parser)!!.value,
         } as StringLiteral;
      case TokenType.CHAR:
         return {
            expressionType: ExpressionType.CharLiteral,
            value: getNext(parser)!!.value,
         } as CharLiteral;
      case TokenType.INT:
         return {
            expressionType: ExpressionType.IntLiteral,
            value: parseInt(getNext(parser)!!.value, 10),
         } as IntLiteral;
      case TokenType.DOUBLE:
         return {
            expressionType: ExpressionType.DoubleLiteral,
            value: parseFloat(getNext(parser)!!.value),
         } as DoubleLiteral;
      case TokenType.THIS:
         consumeOrThrow(parser, TokenType.THIS);
         return {
            expressionType: ExpressionType.Identifier,
            identifier: "this",
         } as Identifier;
      case TokenType.IDENTIFIER:
         return {
            expressionType: ExpressionType.Identifier,
            identifier: getNext(parser)!!.value,
         } as Identifier;
      case TokenType.LEFT_CURLY_BRACKET:
         return parseStructLiteral(parser);
      default:
         throwError(parser,
            TokenType.IDENTIFIER,
            TokenType.TRUE,
            TokenType.FALSE,
            TokenType.INT,
            TokenType.DOUBLE,
         );
   }
   return {
      expressionType: ExpressionType.Identifier,
      identifier: "",
   } as Identifier;
}

function parseStructLiteral(parser: Parser): Expression {
   consumeOrThrow(parser, TokenType.LEFT_CURLY_BRACKET);

   const assignments: StructLiteralAssignment[] = [];
   while (!isAtEnd(parser) && peekType(parser) != TokenType.RIGHT_CURLY_BRACKET) {
      consumeOrThrow(parser, TokenType.DOT);

      expectOrThrow(parser, TokenType.IDENTIFIER);
      const name = getNext(parser)!!.value;

      consumeOrThrow(parser, TokenType.EQUAL);

      const value = parseExpression(parser);

      if (!consume(parser, TokenType.COMMA) && peekType(parser) !=
          TokenType.RIGHT_CURLY_BRACKET) {
         throwError(parser, TokenType.COMMA, TokenType.RIGHT_CURLY_BRACKET);
      }

      assignments.push({
         name,
         value,
      });
   }

   consumeOrThrow(parser, TokenType.RIGHT_CURLY_BRACKET);

   return {
      expressionType: ExpressionType.StructLiteral,
      assignments,
   } as StructLiteral;
}

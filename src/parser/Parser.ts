import {
   Alias,
   ArithmeticOp,
   ArrayLiteral,
   Assignment,
   Binary,
   BooleanNegate,
   BooleanOp,
   BoolLiteral,
   Call,
   CharLiteral,
   Declaration,
   DoubleLiteral,
   Enum,
   ExportDeclaration,
   Expression,
   ExpressionStmt,
   FunctionDecl,
   FunctionParameter,
   FunctionReturnType,
   GenericDeclaration,
   GenericName,
   GenericNamePart,
   IfElse,
   IfElseArm,
   ImportDeclaration,
   Index,
   Interface,
   InterfaceFunction,
   IntLiteral,
   Loop,
   Postfix,
   Return,
   SimpleName,
   Statement,
   StringLiteral,
   Struct,
   StructField,
   StructLiteral,
   StructLiteralField,
   TexelFile,
   Variable,
   When,
   WhenArm,
} from "../tree";
import { readFile } from "../utils";
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
   return isAtEnd(parser) ? { type: TokenType.EOF } as Token
                          : parser.tokens[parser.currentIdx];
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

function throwError(
   parser: Parser,
   expectedType: TokenType,
): never {
   const peeked = peek(parser);

   let next = "";

   let idx = 0;
   while (!isAtEnd(parser) && idx !== 5) {
      next += getNext(parser)!.value;
      idx += 1;
   }

   throw new Error(`Expected ${ expectedType } but found ${ next } at ${ peeked.sourcePosition.fileName }::${ peeked.sourcePosition.lineIdx }.`);
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

function consumeOrThrow(
   parser: Parser,
   expectedType: TokenType,
) {
   if (!consume(parser, expectedType)) {
      throwError(parser, expectedType);
   }
}

function expectOrThrow(
   parser: Parser,
   type: TokenType,
) {
   if (peekType(parser) != type) {
      throwError(parser, type);
   }
}

/**
 * Check if peek type is in or not in the tokens array.
 */
interface LoopSetting {
   condition: "in" | "not-in";
   tokens: TokenType[];
}

/**
 * Loop till condition is false, or parser#isAtEnd, or workAndDone returns true;
 */
function loopTill(
   parser: Parser,
   settings: LoopSetting,
   workAndDone: (type: TokenType) => boolean,
) {
   let peekedType = peekType(parser);
   while (!isAtEnd(parser)) {
      const includes = settings.tokens.includes(peekedType);

      // If peek should be in array but isn't
      if (settings.condition === "in" && !includes) {
         break;
      }

      // If peek should not be in array but is
      if (settings.condition === "not-in" && includes) {
         break;
      }

      if (workAndDone(peekedType)) {
         break;
      }

      peekedType = peekType(parser);
   }
}

function checkComma(
   parser: Parser,
   ...tokens: TokenType[]
): void {
   if ([TokenType.COMMA, ...tokens].includes(peekType(parser))) {
      consume(parser, TokenType.COMMA);
   } else {
      throwError(parser, TokenType.COMMA);
   }
}

function parseTexelFile(parser: Parser): TexelFile {
   const imports: ImportDeclaration[] = [];
   const declarations: Declaration[] = [];
   let exports: ExportDeclaration[] = [];

   loopTill(parser, {
         condition: "not-in",
         tokens: [TokenType.EOF],
      },
      type => {
         switch (type) {
            case TokenType.IMPORT:
               imports.push(parseImport(parser));
               break;
            case TokenType.EXPORT:
               exports = parseExport(parser);
               return true;
            default:
               declarations.push(parseDeclaration(parser));
               break;
         }
         return false;
      },
   );

   return new TexelFile(imports, declarations, exports);
}

function parseImport(parser: Parser): ImportDeclaration {
   consumeOrThrow(parser, TokenType.IMPORT);

   const names: SimpleName[] = [];

   loopTill(parser, {
         condition: "not-in",
         tokens: [TokenType.SEMICOLON],
      },
      type => {
         if (type === TokenType.IDENTIFIER) {
            names.push(new SimpleName(getNext(parser)!.value));
         } else if (type === TokenType.STAR) {
            names.push(new SimpleName("*"));
            getNext(parser);
            return true;
         } else {
            expectOrThrow(parser, TokenType.IDENTIFIER);
         }

         // Return from `loopTill` if we can't get another nested identifier.
         return !consume(parser, TokenType.DOT);
      },
   );
   consumeOrThrow(parser, TokenType.SEMICOLON);

   return new ImportDeclaration(names);
}

function parseExport(parser: Parser): ExportDeclaration[] {
   consumeOrThrow(parser, TokenType.EXPORT);
   consumeOrThrow(parser, TokenType.LEFT_CURLY_BRACKET);

   const exports: ExportDeclaration[] = [];

   loopTill(parser, {
      condition: "not-in",
      tokens: [TokenType.RIGHT_CURLY_BRACKET],
   }, () => {

      const names: SimpleName[] = [];

      loopTill(parser, {
            condition: "not-in",
            tokens: [TokenType.DOT],
         },
         type => {
            if (type === TokenType.IDENTIFIER) {
               names.push(new SimpleName(getNext(parser)!.value));
            } else if (type === TokenType.STAR) {
               names.push(new SimpleName("*"));
               getNext(parser);
               return true;
            } else {
               expectOrThrow(parser, TokenType.IDENTIFIER);
            }

            // Return from `loopTill` if we can't get another nested identifier.
            return !consume(parser, TokenType.DOT);
         },
      );

      exports.push(new ExportDeclaration(names));

      checkComma(parser, TokenType.RIGHT_CURLY_BRACKET);

      return false;
   });

   consumeOrThrow(parser, TokenType.RIGHT_CURLY_BRACKET);

   return exports;
}

function parseDeclaration(parser: Parser): Declaration {
   const peekedType = peekType(parser);

   switch (peekedType) {
      case TokenType.CLOSED:
      case TokenType.STRUCT:
         return parseStruct(parser);
      case TokenType.MUT:
      case TokenType.FN:
         return parseFunction(parser);
      case TokenType.INTERFACE:
         return parseInterface(parser);
      case TokenType.ALIAS:
         return parseAlias(parser);
      case TokenType.ENUM:
         return parseEnum(parser);
      default:
         return throwError(parser, TokenType.FN);
   }
}

function parseGenericDeclaration(parser: Parser): GenericDeclaration[] {
   const result: GenericDeclaration[] = [];

   if (!consume(parser, TokenType.SMALLER)) {
      return result;
   }

   loopTill(parser, {
      condition: "not-in",
      tokens: [TokenType.GREATER],
   }, () => {
      expectOrThrow(parser, TokenType.IDENTIFIER);
      const name = new SimpleName(getNext(parser)!.value);
      let extending: GenericName | undefined = undefined;

      if (consume(parser, TokenType.COLON)) {
         extending = parseFullGenericName(parser);
      }

      checkComma(parser, TokenType.GREATER);

      result.push({
         name,
         extending,
      });

      return false;
   });

   consumeOrThrow(parser, TokenType.GREATER);
   return result;
}

function parseFunctionParameters(parser: Parser): FunctionParameter[] {
   const result: FunctionParameter[] = [];

   consumeOrThrow(parser, TokenType.LEFT_PARENTHESIS);

   loopTill(parser, {
      condition: "not-in",
      tokens: [TokenType.RIGHT_PARENTHESIS],
   }, () => {
      const type = parseFullGenericName(parser);
      const isArray = consume(parser, TokenType.LEFT_BRACKET);
      if (isArray) {
         consumeOrThrow(parser, TokenType.RIGHT_BRACKET);
      }

      expectOrThrow(parser, TokenType.IDENTIFIER);
      const name = new SimpleName(getNext(parser)!.value);

      checkComma(parser, TokenType.RIGHT_PARENTHESIS);

      result.push({
         type,
         name,
         isArray,
      });

      return false;
   });

   consumeOrThrow(parser, TokenType.RIGHT_PARENTHESIS);
   return result;
}

function parseFunctionReturnType(parser: Parser): FunctionReturnType {
   consumeOrThrow(parser, TokenType.COLON);

   const name = parseFullGenericName(parser);

   const isArray = consume(parser, TokenType.LEFT_BRACKET);
   if (isArray) {
      consumeOrThrow(parser, TokenType.RIGHT_BRACKET);
   }

   return {
      name,
      isArray,
   };
}

function parseStruct(parser: Parser): Declaration {
   const isClosed = consume(parser, TokenType.CLOSED);
   consumeOrThrow(parser, TokenType.STRUCT);

   expectOrThrow(parser, TokenType.IDENTIFIER);
   const name = new SimpleName(getNext(parser)!.value);

   const genericDeclaration = parseGenericDeclaration(parser);

   const extending: GenericName[] = [];

   if (consume(parser, TokenType.COLON)) {
      loopTill(parser, {
         condition: "not-in",
         tokens: [TokenType.LEFT_CURLY_BRACKET],
      }, () => {

         extending.push(parseFullGenericName(parser));

         checkComma(parser, TokenType.LEFT_CURLY_BRACKET);

         return false;
      });
   }

   const fields: StructField[] = [];
   const innerStructs: Struct[] = [];

   consumeOrThrow(parser, TokenType.LEFT_CURLY_BRACKET);

   loopTill(parser, {
         condition: "not-in",
         tokens: [TokenType.RIGHT_CURLY_BRACKET],
      },
      type => {
         if ([TokenType.STRUCT, TokenType.CLOSED].includes(type)) {
            innerStructs.push(parseStruct(parser) as Struct);
         } else {
            const isMutable = consume(parser, TokenType.MUT);
            const type = parseFullGenericName(parser);

            const isArray = consume(parser, TokenType.LEFT_BRACKET);
            if (isArray) {
               consumeOrThrow(parser, TokenType.RIGHT_BRACKET);
            }

            expectOrThrow(parser, TokenType.IDENTIFIER);
            const name = new SimpleName(getNext(parser)!.value);

            const expr = consume(parser, TokenType.EQUAL) ? parseExpression(parser)
                                                          : undefined;

            consumeOrThrow(parser, TokenType.SEMICOLON);

            fields.push({
               isMutable,
               type,
               isArray,
               name,
               initializer: expr,
            });
         }

         return false;
      },
   );

   consumeOrThrow(parser, TokenType.RIGHT_CURLY_BRACKET);

   return new Struct(isClosed, name, genericDeclaration, extending, fields, innerStructs);
}

function parseFunction(parser: Parser): Declaration {
   const isMutable = consume(parser, TokenType.MUT);
   consumeOrThrow(parser, TokenType.FN);

   const genericDeclaration = parseGenericDeclaration(parser);

   const name = parseFullGenericName(parser);
   const parameters = parseFunctionParameters(parser);
   const returnType = parseFunctionReturnType(parser);

   return new FunctionDecl(isMutable, genericDeclaration,
      name, parameters, returnType, parseBlock(parser, false),
   );
}

function parseInterface(parser: Parser): Declaration {
   consumeOrThrow(parser, TokenType.INTERFACE);

   expectOrThrow(parser, TokenType.IDENTIFIER);
   const name = new SimpleName(getNext(parser)!.value);

   const genericDeclaration = parseGenericDeclaration(parser);
   const functionDeclarations: InterfaceFunction[] = [];

   consumeOrThrow(parser, TokenType.LEFT_CURLY_BRACKET);
   loopTill(parser, {
      condition: "not-in",
      tokens: [TokenType.RIGHT_CURLY_BRACKET],
   }, () => {
      const isMutable = consume(parser, TokenType.MUT);
      consumeOrThrow(parser, TokenType.FN);

      expectOrThrow(parser, TokenType.IDENTIFIER);
      const name = new SimpleName(getNext(parser)!.value);
      const parameters = parseFunctionParameters(parser);
      const returnType = parseFunctionReturnType(parser);

      consumeOrThrow(parser, TokenType.SEMICOLON);

      functionDeclarations.push({
         isMutable,
         name,
         parameters,
         returnType,
      });

      return false;
   });
   consumeOrThrow(parser, TokenType.RIGHT_CURLY_BRACKET);

   return new Interface(name, genericDeclaration, functionDeclarations);
}

function parseAlias(parser: Parser): Declaration {
   consumeOrThrow(parser, TokenType.ALIAS);

   expectOrThrow(parser, TokenType.IDENTIFIER);
   const name = new SimpleName(getNext(parser)!.value);

   consumeOrThrow(parser, TokenType.EQUAL);
   const value = parseFullGenericName(parser);

   consumeOrThrow(parser, TokenType.SEMICOLON);

   return new Alias(name, value);
}

function parseEnum(parser: Parser): Declaration {
   consumeOrThrow(parser, TokenType.ENUM);

   expectOrThrow(parser, TokenType.IDENTIFIER);
   const name = new SimpleName(getNext(parser)!.value);
   const values: SimpleName[] = [];

   consumeOrThrow(parser, TokenType.LEFT_CURLY_BRACKET);

   loopTill(parser, {
         condition: "not-in",
         tokens: [TokenType.RIGHT_CURLY_BRACKET],
      },
      type => {
         if (type !== TokenType.IDENTIFIER) {
            throwError(parser, TokenType.IDENTIFIER);
         }

         values.push(new SimpleName(getNext(parser)!.value));

         checkComma(parser, TokenType.RIGHT_CURLY_BRACKET);

         return false;
      },
   );

   consumeOrThrow(parser, TokenType.RIGHT_CURLY_BRACKET);

   return new Enum(name, values);
}

function parseBlock(
   parser: Parser,
   isInLoop: boolean,
): Statement[] {
   const result: Statement[] = [];

   consumeOrThrow(parser, TokenType.LEFT_CURLY_BRACKET);

   loopTill(parser, {
      condition: "not-in",
      tokens: [TokenType.RIGHT_CURLY_BRACKET],
   }, () => {
      result.push(parseStatement(parser, isInLoop));

      return false;
   });

   consumeOrThrow(parser, TokenType.RIGHT_CURLY_BRACKET);

   return result;
}

function parseStatement(
   parser: Parser,
   isInLoop: boolean,
): Statement {
   const peekedType = peekType(parser);

   switch (peekedType) {
      case TokenType.LOOP: {
         return parseLoop(parser);
      }
      case TokenType.IF: {
         return parseIfElse(parser, isInLoop);
      }
      case TokenType.RETURN: {
         return parseReturn(parser);
      }
      case TokenType.WHEN: {
         return parseWhen(parser, isInLoop);
      }
      case TokenType.MUT:
         return startParseVariableDeclaration(parser);
      default:
         const expr = parseExpression(parser);
         let idx = parser.currentIdx;
         const localPeekType = () => (parser.tokens[idx] || { type: TokenType.EOF }).type;

         if (expr instanceof GenericName || expr instanceof SimpleName) {
            if (localPeekType() === TokenType.LEFT_BRACKET && parser.tokens[idx + 1].type ===
                TokenType.RIGHT_BRACKET) {
               const next = (parser.tokens[idx + 2] || { type: TokenType.EOF }).type;
               if (next === TokenType.IDENTIFIER) {
                  return finishParseVariableDeclaration(parser, false, expr);
               } else {
                  return finishParseExpressionOrAssignment(parser, expr);
               }
            } else {
               if (localPeekType() === TokenType.IDENTIFIER) {
                  return finishParseVariableDeclaration(parser, false, expr);
               } else {
                  return finishParseExpressionOrAssignment(parser, expr);
               }
            }
         } else {
            return finishParseExpressionOrAssignment(parser, expr);
         }
   }
}

function startParseVariableDeclaration(parser: Parser): Statement {
   const mutable = consume(parser, TokenType.MUT);
   const identifier = parseIdentifier(parser);

   return finishParseVariableDeclaration(parser,
      mutable,
      identifier instanceof SimpleName ? identifier : new GenericName([identifier]),
   );
}

function finishParseVariableDeclaration(
   parser: Parser,
   isMutable: boolean,
   identifier: SimpleName | GenericName,
): Statement {
   let isArray = false;
   if (peekType(parser) === TokenType.LEFT_BRACKET) {
      consumeOrThrow(parser, TokenType.LEFT_BRACKET);
      consumeOrThrow(parser, TokenType.RIGHT_BRACKET);
      isArray = true;
   }

   const name = parseIdentifier(parser);
   if (!(name instanceof SimpleName)) {
      throwError(parser, TokenType.IDENTIFIER);
   }

   consumeOrThrow(parser, TokenType.EQUAL);
   const expr = parseExpression(parser);

   consumeOrThrow(parser, TokenType.SEMICOLON);

   return new Variable(isMutable, identifier instanceof SimpleName ? new GenericName([
      {
         name: identifier,
         generics: [],
      },
   ]) : identifier, isArray, name as SimpleName, expr);
}

function finishParseExpressionOrAssignment(
   parser: Parser,
   leftHandExpr: Expression,
): Statement {
   if (leftHandExpr instanceof SimpleName || leftHandExpr instanceof Index) {

      if (consume(parser, TokenType.EQUAL)) {
         const expr = parseExpression(parser);
         consumeOrThrow(parser, TokenType.SEMICOLON);
         return new Assignment(leftHandExpr, expr);

      } else if (consume(parser, TokenType.PLUS_EQUAL)) {
         const expr = parseExpression(parser);
         consumeOrThrow(parser, TokenType.SEMICOLON);
         return new Assignment(leftHandExpr, new Binary(leftHandExpr, expr, ArithmeticOp.ADD));

      } else if (consume(parser, TokenType.DASH_EQUAL)) {
         const expr = parseExpression(parser);
         consumeOrThrow(parser, TokenType.SEMICOLON);
         return new Assignment(leftHandExpr,
            new Binary(leftHandExpr, expr, ArithmeticOp.SUBTRACT),
         );

      } else if (consume(parser, TokenType.STAR_EQUAL)) {
         const expr = parseExpression(parser);
         consumeOrThrow(parser, TokenType.SEMICOLON);
         return new Assignment(leftHandExpr,
            new Binary(leftHandExpr, expr, ArithmeticOp.MULTIPLY),
         );

      } else if (consume(parser, TokenType.SLASH_EQUAL)) {
         const expr = parseExpression(parser);
         consumeOrThrow(parser, TokenType.SEMICOLON);
         return new Assignment(leftHandExpr,
            new Binary(leftHandExpr, expr, ArithmeticOp.DIVIDE),
         );

      } else {
         return throwError(parser, TokenType.EQUAL);
      }
   } else {
      consumeOrThrow(parser, TokenType.SEMICOLON);
      return new ExpressionStmt(leftHandExpr);
   }
}

function parseLoop(parser: Parser): Statement {
   consumeOrThrow(parser, TokenType.LOOP);
   consumeOrThrow(parser, TokenType.LEFT_PARENTHESIS);

   const condition = parseExpression(parser);

   consumeOrThrow(parser, TokenType.RIGHT_PARENTHESIS);

   const block = parseBlock(parser, true);

   return new Loop(condition, block);
}

function parseIfElse(
   parser: Parser,
   isInLoop: boolean,
): Statement {
   consumeOrThrow(parser, TokenType.IF);
   consumeOrThrow(parser, TokenType.LEFT_PARENTHESIS);

   const condition = parseExpression(parser);

   consumeOrThrow(parser, TokenType.RIGHT_PARENTHESIS);

   const block = parseBlock(parser, isInLoop);

   const elseIfs: IfElseArm[] = [];
   let elseArm: Statement[] = [];

   loopTill(parser, {
      condition: "in",
      tokens: [TokenType.ELSE],
   }, () => {
      consumeOrThrow(parser, TokenType.ELSE);

      if (consume(parser, TokenType.IF)) {
         consumeOrThrow(parser, TokenType.LEFT_PARENTHESIS);

         const innerCondition = parseExpression(parser);

         consumeOrThrow(parser, TokenType.RIGHT_PARENTHESIS);

         const innerBlock = parseBlock(parser, isInLoop);
         elseIfs.push({
            condition: innerCondition,
            block: innerBlock,
         });
         return false;
      } else {
         elseArm = parseBlock(parser, isInLoop);
         return true;
      }
   });

   return new IfElse({
      condition,
      block,
   }, elseIfs, elseArm);
}

function parseReturn(parser: Parser): Statement {
   consumeOrThrow(parser, TokenType.RETURN);

   if (!consume(parser, TokenType.SEMICOLON)) {
      const expr = parseExpression(parser);
      consumeOrThrow(parser, TokenType.SEMICOLON);
      return new Return(expr);
   } else {
      return new Return(undefined);
   }
}

function parseWhen(
   parser: Parser,
   isInLoop: boolean,
): Statement {
   consumeOrThrow(parser, TokenType.WHEN);
   consumeOrThrow(parser, TokenType.LEFT_PARENTHESIS);

   const expr = parseExpression(parser);

   consumeOrThrow(parser, TokenType.RIGHT_PARENTHESIS);
   consumeOrThrow(parser, TokenType.LEFT_CURLY_BRACKET);

   const arms: WhenArm[] = [];
   let elseArm: Statement[] | Expression | undefined = undefined;

   loopTill(parser, {
      condition: "not-in",
      tokens: [TokenType.RIGHT_CURLY_BRACKET],
   }, () => {
      const expr = parseExpression(parser);
      consumeOrThrow(parser, TokenType.COLON_COLON);

      let block: Statement[] | Expression | undefined = undefined;

      const peekedType = peekType(parser);
      if (peekedType === TokenType.LEFT_CURLY_BRACKET) {
         block = parseBlock(parser, isInLoop);
      } else {
         block = parseExpression(parser);
      }

      checkComma(parser, TokenType.RIGHT_CURLY_BRACKET);

      if (expr instanceof SimpleName && expr.value === "else") {
         elseArm = block;
         return true;
      } else {
         arms.push({
            condition: expr,
            block,
         });
         return false;
      }
   });

   consumeOrThrow(parser, TokenType.RIGHT_CURLY_BRACKET);

   return new When(expr, arms, elseArm);
}

function parseExpression(parser: Parser): Expression {
   switch (peekType(parser)) {
      case TokenType.MUT:
      case TokenType.LEFT_CURLY_BRACKET:
         return parseStructLiteral(parser);
      case TokenType.LEFT_BRACKET:
         return parseArrayLiteral(parser);
      default:
         return parseBinary(parser, 11);
   }
}

function parseStructLiteral(parser: Parser): Expression {
   const isMutable = consume(parser, TokenType.MUT);
   const fields: StructLiteralField[] = [];

   consumeOrThrow(parser, TokenType.LEFT_CURLY_BRACKET);

   loopTill(parser, {
      condition: "not-in",
      tokens: [TokenType.RIGHT_CURLY_BRACKET],
   }, () => {
      consumeOrThrow(parser, TokenType.DOT);

      expectOrThrow(parser, TokenType.IDENTIFIER);
      const name = getNext(parser)!.value;

      if (consume(parser, TokenType.COMMA)) {
         fields.push({
            name: new SimpleName(name),
            value: new SimpleName(name),
         });
         return false;
      }
      consumeOrThrow(parser, TokenType.EQUAL);
      const value = parseExpression(parser);

      checkComma(parser, TokenType.RIGHT_CURLY_BRACKET);

      fields.push({
         name: new SimpleName(name),
         value,
      });

      return false;
   });

   consumeOrThrow(parser, TokenType.RIGHT_CURLY_BRACKET);

   return new StructLiteral(isMutable, fields);
}

function parseArrayLiteral(parser: Parser): Expression {
   const values: Expression[] = [];

   consumeOrThrow(parser, TokenType.LEFT_BRACKET);

   loopTill(parser, {
      condition: "not-in",
      tokens: [TokenType.RIGHT_BRACKET],
   }, () => {
      values.push(parseExpression(parser));

      checkComma(parser, TokenType.RIGHT_BRACKET);

      return false;
   });

   consumeOrThrow(parser, TokenType.RIGHT_BRACKET);

   return new ArrayLiteral(values);
}

function parseBinary(
   parser: Parser,
   fromIndex: number,
): Expression {
   const sortedOperators = [
      TokenType.STAR,
      TokenType.SLASH,
      TokenType.PLUS,
      TokenType.DASH,
      TokenType.GREATER,
      TokenType.GREATER_EQUAL,
      TokenType.SMALLER,
      TokenType.SMALLER_EQUAL,
      TokenType.EQUAL_EQUAL,
      TokenType.BANG_EQUAL,
      TokenType.AND_AND,
      TokenType.PIPE_PIPE,
   ];

   const sortedBinaryAndArithmeticOp = [
      ArithmeticOp.MULTIPLY,
      ArithmeticOp.DIVIDE,
      ArithmeticOp.ADD,
      ArithmeticOp.SUBTRACT,
      BooleanOp.GREATER,
      BooleanOp.GREATER_EQUAL,
      BooleanOp.SMALLER,
      BooleanOp.SMALLER_EQUAL,
      BooleanOp.EQUAL,
      BooleanOp.NOT_EQUAL,
      BooleanOp.AND,
      BooleanOp.OR,
   ];

   if (fromIndex === -1) {
      return parsePrefix(parser);
   }

   let left: Expression = parseBinary(parser, fromIndex - 1);
   loopTill(parser, {
      condition: "in",
      tokens: [sortedOperators[fromIndex]],
   }, () => {
      consumeOrThrow(parser, sortedOperators[fromIndex]);
      left = new Binary(left,
         parseBinary(parser, fromIndex - 1),
         sortedBinaryAndArithmeticOp[fromIndex],
      );
      return false;
   });

   return left;
}

function parsePrefix(parser: Parser): Expression {
   switch (peekType(parser)) {
      // TODO: Add --, ++, -
      case TokenType.BANG:
         consume(parser, TokenType.BANG);
         return new BooleanNegate(parsePostfix(parser));
      default:
         return parsePostfix(parser);
   }
}

function parsePostfix(parser: Parser): Expression {
   let primary: Expression = parsePrimary(parser);
   if (primary instanceof GenericName) {
      return primary;
   }

   loopTill(parser, {
         condition: "in",
         tokens: [TokenType.LEFT_PARENTHESIS, TokenType.LEFT_BRACKET, TokenType.DOT],
      },
      type => {
         switch (type) {
            case TokenType.LEFT_PARENTHESIS:
               consumeOrThrow(parser, TokenType.LEFT_PARENTHESIS);
               primary = new Postfix(primary, finishParseCall(parser));
               return false;
            case TokenType.LEFT_BRACKET:
               consumeOrThrow(parser, TokenType.LEFT_BRACKET);
               primary = new Postfix(primary, finishParseIndex(parser));
               return false;
            case TokenType.DOT:
               consumeOrThrow(parser, TokenType.DOT);
               const part = finishParseMember(parser);
               if (primary instanceof GenericName) {
                  primary.parts.push(part);
               } else {
                  primary = new GenericName([
                     {
                        name: primary,
                        generics: [],
                     }, part,
                  ]);
               }
               return false;
            default:
               return true;
         }
      },
   );

   return primary;
}

function finishParseCall(parser: Parser): Call {
   const values: Expression[] = [];

   loopTill(parser, {
      condition: "not-in",
      tokens: [TokenType.RIGHT_PARENTHESIS],
   }, () => {
      values.push(parseExpression(parser));

      checkComma(parser, TokenType.RIGHT_PARENTHESIS);

      return true;
   });

   consumeOrThrow(parser, TokenType.RIGHT_PARENTHESIS);

   return new Call(values);
}

function finishParseMember(parser: Parser): GenericNamePart {
   const value = parseIdentifier(parser);

   if (value instanceof SimpleName) {
      return {
         name: value,
         generics: [],
      };
   }

   return value;
}

function finishParseIndex(parser: Parser): Index {
   const value = parseExpression(parser);
   consumeOrThrow(parser, TokenType.RIGHT_BRACKET);
   return new Index(value);
}

function parsePrimary(parser: Parser): Expression {
   switch (peekType(parser)) {
      case TokenType.LEFT_PARENTHESIS:
         consume(parser, TokenType.LEFT_PARENTHESIS);
         const expr = parseExpression(parser);
         consumeOrThrow(parser, TokenType.LEFT_PARENTHESIS);
         return expr;
      case TokenType.TRUE:
      case TokenType.FALSE:
         const boolValue = Boolean(getNext(parser)!.value);
         return new BoolLiteral(boolValue);
      case TokenType.STRING:
         const stringValue = getNext(parser)!.value;
         return new StringLiteral(stringValue);
      case TokenType.CHAR:
         const charValue = getNext(parser)!.value;
         return new CharLiteral(charValue);
      case TokenType.INT:
         const intValue = parseInt(getNext(parser)!.value, 10);
         return new IntLiteral(intValue);
      case TokenType.DOUBLE:
         const doubleValue = parseFloat(getNext(parser)!.value);
         return new DoubleLiteral(doubleValue);
      case TokenType.IDENTIFIER:
         const id = parseIdentifier(parser);
         if (id instanceof SimpleName) {
            return id;
         } else {
            return new GenericName([id]);
         }
      default:
         const peeked = peek(parser);
         throw new Error(`Expecting expression at ${ peeked.sourcePosition.fileName }::${ peeked.sourcePosition.lineIdx }. Found: ${ peeked.type } -> '${ peeked.value }'`);
   }
}

function parseIdentifier(parser: Parser): SimpleName | GenericNamePart {
   expectOrThrow(parser, TokenType.IDENTIFIER);

   const identifier = getNext(parser)!.value;

   if (canParseGenericPart(parser, parser.currentIdx) === -1) {
      return new SimpleName(identifier);
   } else {
      return parseGenericPart(parser, new SimpleName(identifier));
   }
}

function parseGenericPart(
   parser: Parser,
   identifier: SimpleName,
): GenericNamePart {
   const generics: GenericName[] = [];

   consumeOrThrow(parser, TokenType.SMALLER);

   loopTill(parser, {
      tokens: [TokenType.GREATER],
      condition: "not-in",
   }, () => {
      const genericParam = parseIdentifier(parser);
      if (genericParam instanceof SimpleName) {
         generics.push(new GenericName([
            {
               name: genericParam,
               generics: [],
            },
         ]));
      } else {
         generics.push(new GenericName([genericParam]));
      }

      while (peekType(parser) === TokenType.DOT) {
         consumeOrThrow(parser, TokenType.DOT);

         const genericParam = parseIdentifier(parser);
         if (genericParam instanceof SimpleName) {
            generics.push(new GenericName([
               {
                  name: genericParam,
                  generics: [],
               },
            ]));
         } else {
            generics.push(new GenericName([genericParam]));
         }
      }

      checkComma(parser, TokenType.GREATER);

      return false;
   });

   consumeOrThrow(parser, TokenType.GREATER);

   return {
      name: identifier,
      generics,
   };
}

/**
 * Returns -1 when not possible to parse a full generic name
 * Else returns index of next token to check
 * @param parser
 * @param startIdx
 */
function canParseGenericPart(
   parser: Parser,
   startIdx: number,
): number {
   const localPeek = () => parser.tokens[startIdx];
   const localPeekType = () => localPeek().type;
   const localGetNext = () => parser.tokens[startIdx++];

   if (localPeekType() === TokenType.SMALLER) {
      localGetNext(); // SMALLER
      while (true) {
         let gotIdentifier: boolean = false;
         while ([TokenType.IDENTIFIER, TokenType.DOT].includes(localPeekType())) {
            const next = localGetNext();
            gotIdentifier = next.type === TokenType.IDENTIFIER;
         }
         if (!gotIdentifier) {
            return -1;
         }

         if (localPeekType() === TokenType.SMALLER) {
            startIdx = canParseGenericPart(parser, startIdx);
            if (startIdx === -1) {
               break;
            }
         }

         if (![TokenType.COMMA, TokenType.GREATER].includes(localPeekType())) {
            return -1;
         }

         if (localPeekType() === TokenType.COMMA) {
            localGetNext(); // COMMA
         }

         if (localPeekType() === TokenType.GREATER) {
            localGetNext();
            return startIdx;
         }
      }
   }

   return -1;
}

function parseFullGenericName(parser: Parser): GenericName {
   expectOrThrow(parser, TokenType.IDENTIFIER);

   const nameParts: GenericNamePart[] = [];

   while (true) {
      let intermediateName = parseIdentifier(parser);
      if (intermediateName instanceof SimpleName) {
         nameParts.push({
            name: intermediateName,
            generics: [],
         });
      } else {
         nameParts.push(intermediateName);
      }

      if (!consume(parser, TokenType.DOT)) {
         break;
      }
   }

   return new GenericName(nameParts);
}

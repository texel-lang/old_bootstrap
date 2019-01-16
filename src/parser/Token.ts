// @formatter:off
export const enum TokenType {
   // KEYWORDS

   ALIAS = "ALIAS",
   BREAK = "BREAK",
   CLOSED = "CLOSED",
   CONTINUE = "CONTINUE",
   ELSE = "ELSE",
   ENUM = "ENUM",
   EXPORT = "EXPORT",
   FALSE = "FALSE",
   FN = "FN",
   IF = "IF",
   IMPORT = "IMPORT",
   INTERFACE = "INTERFACE",
   LOOP = "LOOP",
   MUT = "MUT",
   RETURN = "RETURN",
   STRUCT = "STRUCT",
   TRUE = "TRUE",
   WHEN = "WHEN",

   // Single symbols

   LEFT_CURLY_BRACKET = "LEFT_CURLY_BRACKET",
   RIGHT_CURLY_BRACKET = "RIGHT_CURLY_BRACKET",
   LEFT_BRACKET = "LEFT_BRACKET",
   RIGHT_BRACKET = "RIGHT_BRACKET",
   LEFT_PARENTHESIS = "LEFT_PARENTHESIS",
   RIGHT_PARENTHESIS = "RIGHT_PARENTHESIS",
   SEMICOLON = "SEMICOLON",
   DOT = "DOT",
   COMMA = "COMMA",

   // Double symbols

   COLON = "COLON",
   COLON_COLON = "COLON",


   PIPE_PIPE = "PIPE_PIPE",
   AND_AND = "AND_AND",

   // Step-wise symbols
   EQUAL = "EQUAL",
   EQUAL_EQUAL = "EQUAL_EQUAL",

   PLUS = "PLUS",
   PLUS_EQUAL = "PLUS_EQUAL",
   PLUS_PLUS = "PLUS_PLUS",

   DASH = "DASH",
   DASH_EQUAL = "DASH_EQUAL",
   DASH_DASH = "DASH_DASH",

   STAR = "STAR",
   STAR_EQUAL = "STAR_EQUAL",

   SLASH = "SLASH",
   SLASH_EQUAL = "SLASH_EQUAL",
   // COMMENT

   BANG = "BANG",
   BANG_EQUAL = "BANG_EQUAL",

   GREATER = "GREATER",
   GREATER_EQUAL = "GREATER_EQUAL",

   SMALLER = "SMALLER",
   SMALLER_EQUAL = "SMALLER_EQUAL",

   // Others

   COMMENT = "COMMENT",
   STRING = "STRING",
   CHAR = "CHAR",
   INT = "INT",
   DOUBLE = "DOUBLE",
   IDENTIFIER = "IDENTIFIER",
   EOF = "EOF",
   ERROR = "ERROR",
}
// @formatter:on

export interface SourcePosition {
   fileName: string;
   lineIdx: number;
}

export interface Token {
   type: TokenType;
   value: string;
   sourcePosition: SourcePosition;
}

interface Tokenizer {
   fileName: string,
   lineIdx: number,
   startIdx: number;
   currentIdx: number;
   sourceString: string;

   // utils
   sourceLength: number;
   endOfFileToken: Token;
}

/**
 * Builds a list of tokens.
 * Includes comment tokens ( one token per comment line.
 * If an error occured the last or second-last token should be an error token
 */
export function getTokens(
   fileName: string,
   sourceString: string,
): Token[] {
   const tokenizer: Tokenizer = {
      fileName,
      sourceString,
      lineIdx: 0,
      startIdx: 0,
      currentIdx: 0,
      sourceLength: sourceString.length,
      endOfFileToken: {
         type: TokenType.EOF,
         value: "",
         sourcePosition: {
            fileName,
            lineIdx: -1,
         },
      },
   };

   const result: Token[] = [];

   while (!isAtEnd(tokenizer)) {
      if (result.length > 0 && result[result.length - 1].type === TokenType.ERROR) {
         break;
      }

      skipWhitespace(tokenizer);
      resetStartAndCurrentIdx(tokenizer);

      const nextChar = getNext(tokenizer);
      if (nextChar === undefined) {
         break;
      }

      switch (nextChar) {
         case "{":
            result.push(buildToken(tokenizer, TokenType.LEFT_CURLY_BRACKET));
            break;
         case "}":
            result.push(buildToken(tokenizer, TokenType.RIGHT_CURLY_BRACKET));
            break;
         case "[":
            result.push(buildToken(tokenizer, TokenType.LEFT_BRACKET));
            break;
         case "]":
            result.push(buildToken(tokenizer, TokenType.RIGHT_BRACKET));
            break;
         case "(":
            result.push(buildToken(tokenizer, TokenType.LEFT_PARENTHESIS));
            break;
         case ")":
            result.push(buildToken(tokenizer, TokenType.RIGHT_PARENTHESIS));
            break;
         case ";":
            result.push(buildToken(tokenizer, TokenType.SEMICOLON));
            break;
         case ".":
            result.push(buildToken(tokenizer, TokenType.DOT));
            break;
         case ",":
            result.push(buildToken(tokenizer, TokenType.COMMA));
            break;
         case "\"":
            result.push(buildStringToken(tokenizer));
            break;
         case "'":
            result.push(buildCharToken(tokenizer));
            break;
         case "|":
            result.push(consumeAndBuildToken(tokenizer, "|", TokenType.PIPE_PIPE));
            break;
         case "&":
            result.push(consumeAndBuildToken(tokenizer, "&", TokenType.AND_AND));
            break;
         case ":":
            if (peek(tokenizer) === ":") {
               result.push(consumeAndBuildToken(tokenizer, ":", TokenType.COLON_COLON));
            } else {
               result.push(buildToken(tokenizer, TokenType.COLON));
            }
            break;
         case "=":
            if (peek(tokenizer) === "=") {
               result.push(consumeAndBuildToken(tokenizer, "=", TokenType.EQUAL_EQUAL));
            } else {
               result.push(buildToken(tokenizer, TokenType.EQUAL));
            }
            break;
         case "+":
            if (peek(tokenizer) === "+") {
               result.push(consumeAndBuildToken(tokenizer, "+", TokenType.PLUS_PLUS));
            } else if (peek(tokenizer) === "=") {
               result.push(consumeAndBuildToken(tokenizer, "=", TokenType.PLUS_EQUAL));
            } else {
               result.push(buildToken(tokenizer, TokenType.PLUS));
            }
            break;
         case "-":
            if (peek(tokenizer) === "-") {
               result.push(consumeAndBuildToken(tokenizer, "-", TokenType.DASH_DASH));
            } else if (peek(tokenizer) === "=") {
               result.push(consumeAndBuildToken(tokenizer, "=", TokenType.DASH_EQUAL));
            } else {
               result.push(buildToken(tokenizer, TokenType.DASH));
            }
            break;
         case "*":
            if (peek(tokenizer) === "=") {
               result.push(consumeAndBuildToken(tokenizer, "=", TokenType.STAR_EQUAL));
            } else {
               result.push(buildToken(tokenizer, TokenType.STAR));
            }
            break;
         case "/":
            if (peek(tokenizer) === "/") {
               getNext(tokenizer);
               result.push(buildCommentToken(tokenizer));
            } else if (peek(tokenizer) === "=") {
               result.push(consumeAndBuildToken(tokenizer, "=", TokenType.SLASH_EQUAL));
            } else {
               result.push(buildToken(tokenizer, TokenType.SLASH));
            }
            break;
         case "!":
            if (peek(tokenizer) === "=") {
               result.push(consumeAndBuildToken(tokenizer, "=", TokenType.BANG_EQUAL));
            } else {
               result.push(buildToken(tokenizer, TokenType.BANG));
            }
            break;
         case ">":
            if (peek(tokenizer) === "=") {
               result.push(consumeAndBuildToken(tokenizer, "=", TokenType.GREATER_EQUAL));
            } else {
               result.push(buildToken(tokenizer, TokenType.GREATER));
            }
            break;
         case "<":
            if (peek(tokenizer) === "=") {
               result.push(consumeAndBuildToken(tokenizer, "=", TokenType.SMALLER_EQUAL));
            } else {
               result.push(buildToken(tokenizer, TokenType.SMALLER));
            }
            break;
         default:
            if (isValidIdentifier(nextChar)) {
               const token = buildIdentifierToken(tokenizer);
               if (token.type === TokenType.IDENTIFIER) {
                  buildKeywordTokenOrDefault(token);
               }
               result.push(token);
            } else if (isValidNumber(nextChar)) {
               result.push(buildNumberToken(tokenizer));
            } else {
               result.push(buildUnknownToken(tokenizer, "Something else."));
               break;
            }
      }
   }
   result.push(tokenizer.endOfFileToken);

   return result;
}

function isAtEnd(tokenizer: Tokenizer): boolean {
   return tokenizer.currentIdx + 1 >= tokenizer.sourceLength;
}

function peek(tokenizer: Tokenizer): string {
   return tokenizer.sourceString[tokenizer.currentIdx];
}

function getNext(tokenizer: Tokenizer): string | undefined {
   if (isAtEnd(tokenizer)) {
      return;
   } else {
      const nextChar = tokenizer.sourceString[tokenizer.currentIdx];
      tokenizer.currentIdx++;

      if (nextChar === "\n") {
         tokenizer.lineIdx++;
      }
      return nextChar;
   }
}

function consume(
   tokenizer: Tokenizer,
   character: string,
): boolean {
   if (peek(tokenizer) != character) {
      return false;
   } else {
      getNext(tokenizer);
      return true;
   }
}

function isValidIdentifier(character: string): boolean {
   const codePoint = character.codePointAt(0);
   if (codePoint === undefined) {
      return false;
   }
   return (codePoint >= "a".codePointAt(0)!! && codePoint <= "z".codePointAt(0)!!) ||
          (codePoint >= "A".codePointAt(0)!! && codePoint <= "Z".codePointAt(0)!!) ||
          (codePoint == "_".codePointAt(0));
}

function isValidNumber(character: string): boolean {
   const codePoint = character.codePointAt(0);
   if (codePoint === undefined) {
      return false;
   }
   return (codePoint >= "0".codePointAt(0)!! && codePoint <= "9".codePointAt(0)!!) ||
          (codePoint == ".".codePointAt(0));
}

function skipWhitespace(tokenizer: Tokenizer): void {
   while (!isAtEnd(tokenizer)) {
      const nextChar = peek(tokenizer);
      if (nextChar === " " || nextChar === "\t" || nextChar === "\r" || nextChar === "\n") {
         getNext(tokenizer);
      } else {
         break;
      }
   }
}

function resetStartAndCurrentIdx(tokenizer: Tokenizer): void {
   tokenizer.startIdx = tokenizer.currentIdx;
}

function buildToken(
   tokenizer: Tokenizer,
   type: TokenType,
): Token {
   return {
      type,
      sourcePosition: {
         lineIdx: tokenizer.lineIdx,
         fileName: tokenizer.fileName,
      },
      value: tokenizer.sourceString.substring(tokenizer.startIdx, tokenizer.currentIdx),
   };
}

function buildUnknownToken(
   tokenizer: Tokenizer,
   expected: string,
): Token {
   return {
      type: TokenType.ERROR,
      value: `Found '${ peek(tokenizer) }'. Expected '${ expected }'.`,
      sourcePosition: {
         lineIdx: tokenizer.lineIdx,
         fileName: tokenizer.fileName,
      },
   };
}

function consumeAndBuildToken(
   tokenizer: Tokenizer,
   expected: string,
   expectedTokenType: TokenType,
): Token {
   if (!consume(tokenizer, expected)) {
      return buildUnknownToken(tokenizer, expected);
   } else {
      return buildToken(tokenizer, expectedTokenType);
   }
}

function buildStringToken(tokenizer: Tokenizer): Token {
   resetStartAndCurrentIdx(tokenizer); // Reset starting quote

   while (!isAtEnd(tokenizer) && peek(tokenizer) != "\"") {
      getNext(tokenizer);
   }

   if (isAtEnd(tokenizer)) {
      return tokenizer.endOfFileToken;
   }

   const result = buildToken(tokenizer, TokenType.STRING);

   if (peek(tokenizer) != "\"") {
      return tokenizer.endOfFileToken;
   } else {
      getNext(tokenizer);
   }

   return result;
}

function buildCharToken(tokenizer: Tokenizer): Token {
   resetStartAndCurrentIdx(tokenizer); // Reset starting quote

   if (peek(tokenizer) === "\\") {
      getNext(tokenizer);
   }
   getNext(tokenizer);

   const result = buildToken(tokenizer, TokenType.CHAR);

   if (peek(tokenizer) != "'") {
      return tokenizer.endOfFileToken;
   } else {
      getNext(tokenizer);
   }

   return result;
}

function buildCommentToken(tokenizer: Tokenizer): Token {
   while (!isAtEnd(tokenizer) && peek(tokenizer) != "\n") {
      getNext(tokenizer);
   }
   return buildToken(tokenizer, TokenType.COMMENT);
}

function buildIdentifierToken(tokenizer: Tokenizer): Token {
   while (!isAtEnd(tokenizer) && isValidIdentifier(peek(tokenizer))) {
      getNext(tokenizer);
   }
   return buildToken(tokenizer, TokenType.IDENTIFIER);
}

function buildNumberToken(tokenizer: Tokenizer): Token {
   let isDouble = false;
   while (!isAtEnd(tokenizer) && isValidNumber(peek(tokenizer))) {
      const nextChar = getNext(tokenizer);
      if (!isDouble && nextChar === ".") {
         isDouble = true;
      } else if (isDouble && nextChar === ".") {
         return buildUnknownToken(tokenizer, "Can't have 2 dots ('.') in a double.");
      }
   }
   return buildToken(tokenizer, isDouble ? TokenType.DOUBLE : TokenType.INT);
}

function buildKeywordTokenOrDefault(defaultToken: Token): Token {
   switch (defaultToken.value) {
      case "alias":
         defaultToken.type = TokenType.ALIAS;
         break;
      case "break":
         defaultToken.type = TokenType.BREAK;
         break;
      case "closed":
         defaultToken.type = TokenType.CLOSED;
         break;
      case "continue":
         defaultToken.type = TokenType.CONTINUE;
         break;
      case "else":
         defaultToken.type = TokenType.ELSE;
         break;
      case "enum":
         defaultToken.type = TokenType.ENUM;
         break;
      case "export":
         defaultToken.type = TokenType.EXPORT;
         break;
      case "false":
         defaultToken.type = TokenType.FALSE;
         break;
      case "fn":
         defaultToken.type = TokenType.FN;
         break;
      case "if":
         defaultToken.type = TokenType.IF;
         break;
      case "import":
         defaultToken.type = TokenType.IMPORT;
         break;
      case "interface":
         defaultToken.type = TokenType.INTERFACE;
         break;
      case "loop":
         defaultToken.type = TokenType.LOOP;
         break;
      case "mut":
         defaultToken.type = TokenType.MUT;
         break;
      case "return":
         defaultToken.type = TokenType.RETURN;
         break;
      case "struct":
         defaultToken.type = TokenType.STRUCT;
         break;
      case "true":
         defaultToken.type = TokenType.TRUE;
         break;
      case "when":
         defaultToken.type = TokenType.WHEN;
         break;
   }
   return defaultToken;
}

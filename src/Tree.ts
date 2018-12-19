import { isNil } from "./utils";

export interface TexelFile {
   structs: StructDeclaration[];
   functions: FunctionDeclaration[];
}

export interface StructDeclaration {
   name: string;
   fields: StructField[];
}

export interface StructField {
   type: string;
   name: string;
   initializer?: Expression;
}

export interface FunctionDeclaration {
   name: string;
   parameters: FunctionParameter[];
   returnType: string;
   statements: Statement[];
}

export interface FunctionParameter {
   type: string;
   name: string;
}

export const enum StatementType {
   VariableDeclaration, ExpressionStatement, LoopStatement, LoopControlStatement, IfElseStatement, ReturnStatement
}

export interface Statement {
   statementType: StatementType;
}

export interface VariableDeclaration extends Statement {
   statementType: StatementType.VariableDeclaration;
   type: string;
   name: string;
   expression?: Expression;
}

export function isVariableDeclaration(stmt: Statement): stmt is VariableDeclaration {
   return stmt.statementType === StatementType.VariableDeclaration;
}

export interface ExpressionStatement extends Statement {
   statementType: StatementType.ExpressionStatement;
   expression: Expression;
}

export function isExpressionStatement(stmt: Statement): stmt is ExpressionStatement {
   return stmt.statementType === StatementType.ExpressionStatement;
}

export interface LoopStatement extends Statement {
   statementType: StatementType.LoopStatement;
   expression: Expression;
   statements: Statement[];
}

export function isLoopStatement(stmt: Statement): stmt is LoopStatement {
   return stmt.statementType === StatementType.LoopStatement;
}

export interface LoopControlStatement extends Statement {
   statementType: StatementType.LoopControlStatement;
   isContinue: boolean;
   isBreak: boolean;
}

export function isLoopControlStatement(stmt: Statement): stmt is LoopControlStatement {
   return stmt.statementType === StatementType.LoopControlStatement;
}

export interface IfElseStatement extends Statement {
   statementType: StatementType.IfElseStatement;
   expression: Expression;
   statements: Statement[];
   elseIfs: IfElseStatement[];
   elseStatements: Statement[];
}

export function isIfElseStatement(stmt: Statement): stmt is IfElseStatement {
   return stmt.statementType === StatementType.IfElseStatement;
}

export interface ReturnStatement extends Statement {
   statementType: StatementType.ReturnStatement;
   expression?: Expression;
}

export function isReturnStatement(stmt: Statement): stmt is ReturnStatement {
   return stmt.statementType === StatementType.ReturnStatement;
}

export const enum ExpressionType {
   Assignment, Binary, Negate, Call, MemberAccess, IndexAccess, BooleanLiteral, StringLiteral, CharLiteral, IntLiteral, DoubleLiteral, StructLiteral, Identifier,
}

export interface Expression {
   expressionType: ExpressionType;
   producedType?: string;
}

export interface Assignment extends Expression {
   name: MemberAccess | Identifier;
   expression: Expression;
}

export function isAssignment(obj: any): obj is Assignment {
   return !isNil(obj.expressionType) && obj.expressionType === ExpressionType.Assignment;
}

// @formatter:off
export enum BinaryOp {
   ADD = "ADD",
   SUBTRACT = "SUBTRACT",
   MULTIPLY = "MULTIPLY",
   DIVIDE = "DIVIDE",
   LOGIC_OR = "LOGIC_OR",
   LOGIC_AND = "LOGIC_AND",
   LOGIC_EQUAL = "LOGIC_EQUAL",
   LOGIC_NOT_EQUAL = "LOGIC_NOT_EQUAL",
   GREATER = "GREATER",
   GREATER_EQUAL = "GREATER_EQUAL",
   SMALLER = "SMALLER",
   SMALLER_EQUAL = "SMALLER_EUQAL",
}
// @formatter:on

export interface BinaryExpression extends Expression {
   left: Expression;
   op: BinaryOp;
   right: Expression;
}

export function isBinaryExpression(obj: any): obj is BinaryExpression {
   return obj.expressionType && obj.expressionType === ExpressionType.Binary;
}

export interface BinaryNegate extends Expression {
   expression: Expression;
}

export function isBinaryNegate(obj: any): obj is BinaryNegate {
   return obj.expressionType && obj.expressionType === ExpressionType.Negate;
}

export interface Call extends Expression {
   name: string;
   arguments: Expression[];
}

export function isCall(obj: any): obj is Call {
   return obj.expressionType && obj.expressionType === ExpressionType.Call;
}

export interface MemberAccess extends Expression {
   expression: Identifier | MemberAccess | Call,
   member: string;
}

export function isMemberAccess(obj: any): obj is MemberAccess {
   return obj.expressionType && obj.expressionType === ExpressionType.MemberAccess;
}

export interface BooleanLiteral extends Expression {
   value: boolean;
}

export function isBooleanLiteral(obj: any): obj is BooleanLiteral {
   return obj.expressionType && obj.expressionType === ExpressionType.BooleanLiteral;
}

export interface StringLiteral extends Expression {
   value: string;
}

export function isStringLiteral(obj: any): obj is StringLiteral {
   return obj.expressionType && obj.expressionType === ExpressionType.StringLiteral;
}

export interface CharLiteral extends Expression {
   value: string;
}

export function isCharLiteral(obj: any): obj is CharLiteral {
   return obj.expressionType && obj.expressionType === ExpressionType.CharLiteral;
}

export interface IntLiteral extends Expression {
   value: number;
}

export function isIntLiteral(obj: any): obj is IntLiteral {
   return obj.expressionType && obj.expressionType === ExpressionType.IntLiteral;
}

export interface DoubleLiteral extends Expression {
   value: number;
}

export function isDoubleLiteral(obj: any): obj is DoubleLiteral {
   return obj.expressionType && obj.expressionType === ExpressionType.DoubleLiteral;
}

export interface StructLiteral extends Expression {
   assignments: StructLiteralAssignment[];
}

export function isStructLiteral(obj: any): obj is StructLiteral {
   return obj.expressionType && obj.expressionType === ExpressionType.StructLiteral;
}

export interface Identifier extends Expression {
   identifier: string;
}

export function isIdentifier(obj: any): obj is Identifier {
   return obj.expressionType && obj.expressionType === ExpressionType.Identifier;
}

export interface StructLiteralAssignment {
   name: string;
   value: Expression;
}

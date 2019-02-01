import { SymbolTree } from "../utils/SymbolTree";

export class TexelFile {
   imports: ImportDeclaration[];
   declarations: Declaration[];
   exports: ExportDeclaration[];

   constructor(
      imports: ImportDeclaration[],
      declarations: Declaration[],
      exports: ExportDeclaration[],
   ) {
      this.imports = imports;
      this.declarations = declarations;
      this.exports = exports;
   }
}

export class ImportDeclaration {
   public name: SimpleName[];

   constructor(name: SimpleName[]) {
      this.name = name;
   }
}

export class ExportDeclaration {
   public name: SimpleName[];

   constructor(name: SimpleName[]) {
      this.name = name;
   }
}

export interface DeclarationVisitor {
   visitStruct(struct: Struct): void;

   visitFunction(func: FunctionDecl): void;

   visitInterface(interFace: Interface): void;

   visitAlias(aliased: Alias): void;

   visitEnum(enumeration: Enum): void;
}

export interface Declaration {
   visit<T extends DeclarationVisitor>(visitor: T): void;
}

export interface GenericDeclaration {
   name: SimpleName;
   extending: GenericName | undefined;
}

export interface FunctionParameter {
   type: GenericName;
   isArray: boolean;
   name: SimpleName;
}

export interface FunctionReturnType {
   name: GenericName;
   isArray: boolean;
}

export interface StructField {
   isMutable: boolean;
   type: GenericName;
   isArray: boolean;
   name: SimpleName;
   initializer: Expression | undefined;
}

export class Struct implements Declaration {
   public isClosed: boolean;
   public name: SimpleName;
   public generics: GenericDeclaration[];
   public extending: GenericName[];
   public fields: StructField[];
   public innerStructs: Struct[];

   constructor(
      isClosed: boolean,
      name: SimpleName,
      generics: GenericDeclaration[],
      extending: GenericName[],
      fields: StructField[],
      innerStructs: Struct[],
   ) {
      this.isClosed = isClosed;
      this.name = name;
      this.generics = generics;
      this.extending = extending;
      this.fields = fields;
      this.innerStructs = innerStructs;
   }

   public visit<T extends DeclarationVisitor>(visitor: T): void {
      visitor.visitStruct(this);
   }

}

export class FunctionDecl implements Declaration {
   public isMutable: boolean;
   public generics: GenericDeclaration[];
   public name: GenericName;
   public parameters: FunctionParameter[];
   public returnType: FunctionReturnType;
   public body: Statement[];

   constructor(
      isMutable: boolean,
      generics: GenericDeclaration[],
      name: GenericName,
      parameters: FunctionParameter[],
      returnType: FunctionReturnType,
      body: Statement[],
   ) {
      this.isMutable = isMutable;
      this.generics = generics;
      this.name = name;
      this.parameters = parameters;
      this.returnType = returnType;
      this.body = body;
   }

   public visit<T extends DeclarationVisitor>(visitor: T): void {
      visitor.visitFunction(this);
   }

}

export interface InterfaceFunction {
   isMutable: boolean;
   name: SimpleName;
   parameters: FunctionParameter[];
   returnType: FunctionReturnType;
}

export class Interface implements Declaration {
   public name: SimpleName;
   public generics: GenericDeclaration[];
   public functionDeclarations: InterfaceFunction[];

   constructor(
      name: SimpleName,
      generics: GenericDeclaration[],
      functionDeclarations: InterfaceFunction[],
   ) {
      this.name = name;
      this.generics = generics;
      this.functionDeclarations = functionDeclarations;
   }

   public visit<T extends DeclarationVisitor>(visitor: T): void {
      visitor.visitInterface(this);
   }

}

export class Alias implements Declaration {
   public name: SimpleName;
   public aliased: GenericName;

   constructor(name: SimpleName, aliased: GenericName) {
      this.name = name;
      this.aliased = aliased;
   }

   public visit<T extends DeclarationVisitor>(visitor: T): void {
      visitor.visitAlias(this);
   }

}

export class Enum implements Declaration {
   public name: SimpleName;
   public values: SimpleName[];

   constructor(name: SimpleName, values: SimpleName[]) {
      this.name = name;
      this.values = values;
   }

   public visit<T extends DeclarationVisitor>(visitor: T): void {
      visitor.visitEnum(this);
   }
}

export interface StatementVisitor {
   visitAssignment(assignment: Assignment): void;

   visitBreak(breakStmt: Break): void;

   visitContinue(continueStmt: Continue): void;

   visitExpression(expr: ExpressionStmt): void;

   visitIfElse(ifElse: IfElse): void;

   visitLoop(loop: Loop): void;

   visitReturn(returnStmt: Return): void;

   visitVariable(variable: Variable): void;

   visitWhen(when: When): void;
}

export interface Statement {
   visit<T extends StatementVisitor>(visitor: T): void;
}

export class Variable implements Statement {
   public isMutable: boolean;
   public type: GenericName;
   public isArray: boolean;
   public name: SimpleName;
   public value: Expression;

   constructor(
      isMutable: boolean,
      type: GenericName,
      isArray: boolean,
      name: SimpleName,
      value: Expression,
   ) {
      this.isMutable = isMutable;
      this.type = type;
      this.isArray = isArray;
      this.name = name;
      this.value = value;
   }

   public visit<T extends StatementVisitor>(visitor: T): void {
      visitor.visitVariable(this);
   }

}

export class Assignment implements Statement {
   public name: SimpleName | Index;
   public value: Expression;

   constructor(name: SimpleName | Index, value: Expression) {
      this.name = name;
      this.value = value;
   }

   public visit<T extends StatementVisitor>(visitor: T): void {
      visitor.visitAssignment(this);
   }

}

export class ExpressionStmt implements Statement {
   public expression: Expression;

   constructor(expression: Expression) {
      this.expression = expression;
   }

   public visit<T extends StatementVisitor>(visitor: T): void {
      visitor.visitExpression(this);
   }

}

export class Break implements Statement {
   public visit<T extends StatementVisitor>(visitor: T): void {
      visitor.visitBreak(this);
   }

}

export class Continue implements Statement {

   public visit<T extends StatementVisitor>(visitor: T): void {
      visitor.visitContinue(this);
   }

}

export class Loop implements Statement {
   public condition: Expression;
   public block: Statement[];

   constructor(condition: Expression, block: Statement[]) {
      this.condition = condition;
      this.block = block;
   }

   public visit<T extends StatementVisitor>(visitor: T): void {
      visitor.visitLoop(this);
   }

}

export interface IfElseArm {
   condition: Expression;
   block: Statement[];
}

export class IfElse implements Statement {
   public ifArm: IfElseArm;
   public elseIfs: IfElseArm[];
   public elseArm: Statement[];

   constructor(ifArm: IfElseArm, elseIfs: IfElseArm[], elseArm: Statement[]) {
      this.ifArm = ifArm;
      this.elseIfs = elseIfs;
      this.elseArm = elseArm;
   }

   public visit<T extends StatementVisitor>(visitor: T): void {
      visitor.visitIfElse(this);
   }

}

export class Return implements Statement {
   public value: Expression | undefined;

   constructor(value: Expression | undefined) {
      this.value = value;
   }

   public visit<T extends StatementVisitor>(visitor: T): void {
      visitor.visitReturn(this);
   }

}

export interface WhenArm {
   condition: Expression;
   block: Statement[] | Expression;
}

export class When implements Statement {
   public condition: Expression;
   public arms: WhenArm[];
   public elseArm: Statement[] | Expression | undefined;

   constructor(
      condition: Expression,
      arms: WhenArm[],
      elseArm: Statement[] | Expression | undefined,
   ) {
      this.condition = condition;
      this.arms = arms;
      this.elseArm = elseArm;
   }

   public visit<T extends StatementVisitor>(visitor: T): void {
      visitor.visitWhen(this);
   }

}

export interface ExpressionVisitor {
   visitArrayLiteral(array: ArrayLiteral): void;

   visitBinary(binary: Binary): void;

   visitBooleanNegate(booleanNegate: BooleanNegate): void;

   visitBool(bool: BoolLiteral): void;

   visitCall(call: Call): void;

   visitChar(char: CharLiteral): void;

   visitDouble(double: DoubleLiteral): void;

   visitGenericName(name: GenericName): void;

   visitIndex(index: Index): void;

   visitInt(int: IntLiteral): void;

   visitMember(member: Member): void;

   visitPostfix(postfix: Postfix): void;

   visitSimpleName(name: SimpleName): void;

   visitString(string: StringLiteral): void;

   visitStruct(struct: StructLiteral): void;
}

export interface Expression {
   visit<T extends ExpressionVisitor>(visitor: T): void;
}

export interface StructLiteralField {
   name: SimpleName;
   // Shorthand fields are automatically expanded with value = name
   value: Expression;
}

export class StructLiteral implements Expression {
   public isMutable: boolean;
   public fields: StructLiteralField[];

   constructor(isMutable: boolean, fields: StructLiteralField[]) {
      this.isMutable = isMutable;
      this.fields = fields;
   }

   public visit<T extends ExpressionVisitor>(visitor: T): void {
      visitor.visitStruct(this);
   }
}

export class ArrayLiteral implements Expression {
   public values: Expression[];

   constructor(values: Expression[]) {
      this.values = values;
   }

   public visit<T extends ExpressionVisitor>(visitor: T): void {
      visitor.visitArrayLiteral(this);
   }
}

export enum ArithmeticOp {
   MULTIPLY, DIVIDE, ADD, SUBTRACT,
}

export enum BooleanOp {
   GREATER = ArithmeticOp.SUBTRACT +
      1, GREATER_EQUAL, SMALLER, SMALLER_EQUAL, EQUAL, NOT_EQUAL, AND, OR,
}

export class Binary implements Expression {
   public left: Expression;
   public right: Expression;
   public operator: ArithmeticOp | BooleanOp;

   constructor(left: Expression, right: Expression, operator: ArithmeticOp | BooleanOp) {
      this.left = left;
      this.right = right;
      this.operator = operator;
   }

   public visit<T extends ExpressionVisitor>(visitor: T): void {
      visitor.visitBinary(this);
   }
}

export class BooleanNegate implements Expression {
   public value: Expression;

   constructor(value: Expression) {
      this.value = value;
   }

   public visit<T extends ExpressionVisitor>(visitor: T): void {
      visitor.visitBooleanNegate(this);
   }
}

export class Postfix implements Expression {
   public left: Expression;
   public operation: Call | Index | Member;

   constructor(left: Expression, operation: Call | Index | Member) {
      this.left = left;
      this.operation = operation;
   }

   public visit<T extends ExpressionVisitor>(visitor: T): void {
      visitor.visitPostfix(this);
   }
}

export class Call implements Expression {
   public values: Expression[];

   constructor(values: Expression[]) {
      this.values = values;
   }

   public visit<T extends ExpressionVisitor>(visitor: T): void {
      visitor.visitCall(this);
   }
}

export class Index implements Expression {
   public value: Expression;

   constructor(value: Expression) {
      this.value = value;
   }

   public visit<T extends ExpressionVisitor>(visitor: T): void {
      visitor.visitIndex(this);
   }
}

export class Member implements Expression {
   public right: SimpleName | GenericNamePart;

   constructor(right: SimpleName | GenericNamePart) {
      this.right = right;
   }

   public visit<T extends ExpressionVisitor>(visitor: T): void {
      visitor.visitMember(this);
   }
}

export class BoolLiteral implements Expression {
   public value: boolean;

   constructor(value: boolean) {
      this.value = value;
   }

   public visit<T extends ExpressionVisitor>(visitor: T): void {
      visitor.visitBool(this);
   }
}

export class StringLiteral implements Expression {
   public value: string;

   constructor(value: string) {
      this.value = value;
   }

   public visit<T extends ExpressionVisitor>(visitor: T): void {
      visitor.visitString(this);
   }
}

export class CharLiteral implements Expression {
   public value: string;

   constructor(value: string) {
      this.value = value;
   }

   public visit<T extends ExpressionVisitor>(visitor: T): void {
      visitor.visitChar(this);
   }
}

export class IntLiteral implements Expression {
   public value: number;

   constructor(value: number) {
      this.value = value;
   }

   public visit<T extends ExpressionVisitor>(visitor: T): void {
      visitor.visitInt(this);
   }
}

export class DoubleLiteral implements Expression {
   public value: number;

   constructor(value: number) {
      this.value = value;
   }

   public visit<T extends ExpressionVisitor>(visitor: T): void {
      visitor.visitDouble(this);
   }
}

export class SimpleName implements Expression {
   public value: string;

   constructor(value: string) {
      this.value = value;
   }

   public visit<T extends ExpressionVisitor>(visitor: T): void {
      visitor.visitSimpleName(this);
   }
}

export interface GenericNamePart {
   referencing?: SymbolTree | undefined;
   name: SimpleName;
   generics: GenericName[];
}

export class GenericName implements Expression {
   public parts: GenericNamePart[];

   constructor(parts: GenericNamePart[]) {
      this.parts = parts;
   }

   public visit<T extends ExpressionVisitor>(visitor: T): void {
      visitor.visitGenericName(this);
   }

   /**
    * Generate a string array that can be used in the SymbolTree
    */
   public toPathString(): string[] {
      return this.parts.map(it => it.name.value);
   }
}

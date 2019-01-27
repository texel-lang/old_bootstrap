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

export interface Declaration {
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
}

export class Alias implements Declaration {
   public name: SimpleName;
   public aliased: GenericName;

   constructor(
      name: SimpleName,
      aliased: GenericName,
   ) {
      this.name = name;
      this.aliased = aliased;
   }
}

export class Enum implements Declaration {
   public name: SimpleName;
   public values: SimpleName[];

   constructor(
      name: SimpleName,
      values: SimpleName[],
   ) {
      this.name = name;
      this.values = values;
   }
}

export interface Statement {
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
}

export class Assignment implements Statement {
   public name: SimpleName | Index;
   public value: Expression;

   constructor(
      name: SimpleName | Index,
      value: Expression,
   ) {
      this.name = name;
      this.value = value;
   }
}

export class ExpressionStmt implements Statement {
   public expression: Expression;

   constructor(expression: Expression) {
      this.expression = expression;
   }
}

export class Break implements Statement {

}

export class Continue implements Statement {
}

export class Loop implements Statement {
   public condition: Expression;
   public block: Statement[];

   constructor(
      condition: Expression,
      block: Statement[],
   ) {
      this.condition = condition;
      this.block = block;
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

   constructor(
      ifArm: IfElseArm,
      elseIfs: IfElseArm[],
      elseArm: Statement[],
   ) {
      this.ifArm = ifArm;
      this.elseIfs = elseIfs;
      this.elseArm = elseArm;
   }
}

export class Return implements Statement {
   public value: Expression | undefined;

   constructor(value: Expression | undefined) {
      this.value = value;
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
}

export interface Expression {
}

export interface StructLiteralField {
   name: SimpleName;
   // Shorthand fields are automatically expanded with value = name
   value: Expression;
}

export class StructLiteral implements Expression {
   public isMutable: boolean;
   public fields: StructLiteralField[];

   constructor(
      isMutable: boolean,
      fields: StructLiteralField[],
   ) {
      this.isMutable = isMutable;
      this.fields = fields;
   }
}

export class ArrayLiteral implements Expression {
   public values: Expression[];

   constructor(values: Expression[]) {
      this.values = values;
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

   constructor(
      left: Expression,
      right: Expression,
      operator: ArithmeticOp | BooleanOp,
   ) {
      this.left = left;
      this.right = right;
      this.operator = operator;
   }
}

export class BooleanNegate implements Expression {
   public value: Expression;

   constructor(value: Expression) {
      this.value = value;
   }
}

export class Postfix implements Expression {
   public left: Expression;
   public operation: Call | Index;

   constructor(
      left: Expression,
      operation: Call | Index,
   ) {
      this.left = left;
      this.operation = operation;
   }
}

export class Call implements Expression {
   public values: Expression[];

   constructor(values: Expression[]) {
      this.values = values;
   }
}

export class Index implements Expression {
   public value: Expression;

   constructor(value: Expression) {
      this.value = value;
   }
}

export class BoolLiteral implements Expression {
   public value: boolean;

   constructor(value: boolean) {
      this.value = value;
   }
}

export class StringLiteral implements Expression {
   public value: string;

   constructor(value: string) {
      this.value = value;
   }
}

export class CharLiteral implements Expression {
   public value: string;

   constructor(value: string) {
      this.value = value;
   }
}

export class IntLiteral implements Expression {
   public value: number;

   constructor(value: number) {
      this.value = value;
   }
}

export class DoubleLiteral implements Expression {
   public value: number;

   constructor(value: number) {
      this.value = value;
   }
}

export class SimpleName implements Expression {
   public value: string;

   constructor(value: string) {
      this.value = value;
   }
}

export interface GenericNamePart {
   name: SimpleName | Expression;
   generics: GenericName[];
}

export class GenericName implements Expression {
   public parts: GenericNamePart[];

   constructor(parts: GenericNamePart[]) {
      this.parts = parts;
   }
}

class TexelFile {
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

class ImportDeclaration {
   public name: SimpleName[];

   constructor(name: SimpleName[]) {
      this.name = name;
   }
}

class ExportDeclaration {
   public name: SimpleName[];

   constructor(name: SimpleName[]) {
      this.name = name;
   }
}

interface Declaration {
}

interface GenericDeclaration {
   name: SimpleName;
   extends: GenericName;
}

interface FunctionParameter {
   type: GenericName;
   isArray: boolean;
   name: SimpleName;
}

interface FunctionReturnType {
   name: GenericName;
   isArray: boolean;
}

interface StructField {
   isMutable: boolean;
   type: GenericName;
   isArray: boolean;
   name: SimpleName;
   initializer: Expression | undefined;
}

class Struct implements Declaration {
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

class FunctionDecl implements Declaration {
   public isMutable: boolean;
   public generics: GenericDeclaration[];
   public name: GenericName;
   public parameters: FunctionParameter[];
   public returnType: FunctionReturnType[];
   public body: Statement[];

   constructor(
      isMutable: boolean,
      generics: GenericDeclaration[],
      name: GenericName,
      parameters: FunctionParameter[],
      returnType: FunctionReturnType[],
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

interface InterfaceFunction {
   isMutable: boolean;
   name: SimpleName;
   parameters: FunctionParameter[];
   returnType: FunctionReturnType;
}

class Interface implements Declaration {
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

class Alias implements Declaration {
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

class Enum implements Declaration {
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

interface Statement {
}

class Variable implements Statement {
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

class Assignment implements Statement {
   public name: SimpleName;
   public value: Expression;

   constructor(
      name: SimpleName,
      value: Expression,
   ) {
      this.name = name;
      this.value = value;
   }
}

class ExpressionStmt implements Statement {
   public expression: Expression;

   constructor(expression: Expression) {
      this.expression = expression;
   }
}

type Break = {};
type Continue = {};

class Loop implements Statement {
   public condition: Expression;
   public block: (Statement | Break | Continue)[];

   constructor(
      condition: Expression,
      block: (Statement | Break | Continue)[],
   ) {
      this.condition = condition;
      this.block = block;
   }
}

interface IfElseArm {
   condition: Expression;
   block: Statement[];
}

class IfElse implements Statement {
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

class Return implements Statement {
   public value: Expression | undefined;

   constructor(value: Expression | undefined) {
      this.value = value;
   }
}

interface WhenArm {
   condition: Expression;
   block: Statement[] | Expression;
}

class When implements Statement {
   public condition: Expression;
   public arms: WhenArm[];
   public elseArm: Statement[] | Expression;

   constructor(
      condition: Expression,
      arms: WhenArm[],
      elseArm: Statement[] | Expression,
   ) {
      this.condition = condition;
      this.arms = arms;
      this.elseArm = elseArm;
   }
}

interface Expression {
}

interface StructLiteralField {
   name: SimpleName;
   value: Expression | undefined;
}

class StructLiteral implements Expression {
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

class ArrayLiteral implements Expression {
   public values: Expression[];

   constructor(values: Expression[]) {
      this.values = values;
   }
}

enum ArithmeticOp {
   MULTIPLY, DIVIDE, ADD, SUBTRACT,
}

enum BooleanOp {
   GREATER, GREATER_EQUAL, SMALLER, SMALLER_EQUAL, EQUAL, NOT_EQUAL, AND, OR,
}

class Binary implements Expression {
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

class BooleanNegate implements Expression {
   public value: Expression;

   constructor(value: Expression) {
      this.value = value;
   }
}

class Postfix implements Expression {
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

class Call implements Expression {
   public values: Expression[];

   constructor(values: Expression[]) {
      this.values = values;
   }
}

class Index implements Expression {
   public value: Expression;

   constructor(value: Expression) {
      this.value = value;
   }
}

class Literal<T> implements Expression {
   public value: T;

   constructor(value: T) {
      this.value = value;
   }
}

class SimpleName implements Expression {
   public value: string;

   constructor(value: string) {
      this.value = value;
   }
}

interface GenericNamePart {
   name: SimpleName;
   generics: GenericName[];
}

class GenericName {
   public parts: GenericNamePart[];

   constructor(parts: GenericNamePart[]) {
      this.parts = parts;
   }
}

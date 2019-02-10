import {
   ArrayLiteral,
   Assignment,
   Binary,
   BooleanNegate,
   BoolLiteral,
   Break,
   Call,
   CharLiteral,
   Continue,
   DoubleLiteral,
   Enum,
   ExpressionStmt,
   ExpressionVisitor,
   FunctionDecl,
   GenericName,
   IfElse,
   Index,
   IntLiteral,
   Loop,
   Member,
   Postfix,
   Return,
   SimpleName,
   Statement,
   StatementVisitor,
   StringLiteral,
   StructLiteral,
   Variable,
   When,
} from "../tree";
import { consoleObject, Stack } from "../utils";
import { SymbolTree, SymbolType } from "../utils/SymbolTree";

interface Scope {
   names: string[];
}

export class VariableNameCheck implements StatementVisitor, ExpressionVisitor {
   public stack: Stack<Scope> = new Stack();

   constructor(public symbol: SymbolTree, public func: FunctionDecl) {
      const enums: Enum[] = this.symbol.queryForSymbolType(SymbolType.ENUM);

      const funcNames = func.parameters
                            .map(it => it.name.value)
                            .concat(this.symbol.queryVirtualNameForSymbolType(SymbolType.FUNCTION));
      const enumNames = enums.map(it => it.name.value)
                             .concat(this.symbol.queryVirtualNameForSymbolType(SymbolType.ENUM));
      this.stack.push({
         names: [
            ...funcNames, ...enumNames,
         ],
      });

      if (func.name.parts.length > 1) {
         this.stack
             .peek()
             .names
             .push("this");
      }
   }

   public check() {
      this.func.body.forEach(it => it.visit(this));
   }

   public visitArrayLiteral(array: ArrayLiteral): void {
      array.values.forEach(it => it.visit(this));
   }

   public visitAssignment(assignment: Assignment): void {
      assignment.name.visit(this);
      assignment.value.visit(this);
   }

   public visitBinary(binary: Binary): void {
      binary.left.visit(this);
      binary.right.visit(this);
   }

   public visitBool(bool: BoolLiteral): void {
   }

   public visitBooleanNegate(booleanNegate: BooleanNegate): void {
      booleanNegate.value.visit(this);
   }

   public visitBreak(breakStmt: Break): void {
   }

   public visitCall(call: Call): void {
      call.values.forEach(it => it.visit(this));
   }

   public visitChar(char: CharLiteral): void {

   }

   public visitContinue(continueStmt: Continue): void {

   }

   public visitDouble(double: DoubleLiteral): void {
   }

   public visitExpression(expr: ExpressionStmt): void {
      expr.expression.visit(this);
   }

   public visitGenericName(name: GenericName): void {
      consoleObject(name, 5);
      throw new Error("Should not happen here...");
   }

   public visitIfElse(ifElse: IfElse): void {
      ifElse.ifArm.condition.visit(this);
      this.visitScope(ifElse.ifArm.block);

      ifElse.elseIfs.forEach(elseIf => {
         elseIf.condition.visit(this);
         this.visitScope(elseIf.block);
      });

      this.visitScope(ifElse.elseArm);
   }

   public visitIndex(index: Index): void {
      index.value.visit(this);
   }

   public visitInt(int: IntLiteral): void {
   }

   public visitLoop(loop: Loop): void {
      loop.condition.visit(this);
      this.visitScope(loop.block);
   }

   public visitMember(member: Member): void {
      // Needs left to check right...
   }

   public visitPostfix(postfix: Postfix): void {
      postfix.left.visit(this);
      postfix.operation.visit(this);
   }

   public visitReturn(returnStmt: Return): void {
      if (returnStmt.value) {
         returnStmt.value.visit(this);
      }
   }

   public visitSimpleName(name: SimpleName): void {
      const value = name.value;

      const scope = this.stack.find(scope => {
         return scope.names.includes(value);
      });

      if (!scope) {
         throw new Error(`Name ${ name.value } not declared before use.`);
      }
   }

   public visitString(string: StringLiteral): void {
   }

   public visitStruct(struct: StructLiteral): void {
      struct.fields.forEach(it => it.value.visit(this));
   }

   public visitVariable(variable: Variable): void {
      variable.value.visit(this);

      this.stack
          .peek()
          .names
          .push(variable.name.value);
   }

   public visitWhen(when: When): void {
      when.condition.visit(this);
      when.arms.forEach(it => {
         it.condition.visit(this);
         if (Array.isArray(it.block)) {
            this.visitScope(it.block);
         } else {
            it.block.visit(this);
         }
      });
   }

   private visitScope(stmts: Statement[]) {
      this.stack.push({
         names: [],
      });
      stmts.forEach(it => it.visit(this));
      this.stack.pop();
   }

}

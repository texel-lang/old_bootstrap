## Grammer

This doc only shows supported grammar

```
texelFile
    :: topLevelDeclaration*
    
topLevelDeclaration
    :: structDeclaration
     | functionDeclaration
     
structDeclaration
    :: "struct" SimpleName structBody

structBody
    :: "{" structFieldDeclaration* "}"
    
structFieldDeclaration
    :: typeSpecifier SimpleName ( "=" expression)? ";"

typeSpecifier
    :: SimpleName
    
functionDeclaration
    :: "fn" (typeUsage ".")? SimpleName functionParameters functionReturnType functionBody
    
functionParameters
    :: "(" (typeUsage SimpleName)[","] ")"
    
functionReturnType
    :: ":" typeUsage
    
functionBody
    :: block
    
block
    :: "{" statement* "}"
    
statement
    :: variableDeclaration
    |  expressionStatement
    |  loopStatement
    |  ifElseStatement
    |  returnStatement


variableDeclaration
    :: typeSpecifier SimpleName "=" expression ";"

expressionStatement
    :: expression ";"

loopStatement
    :: "loop" "(" expression ")" loopBlock
    
loopBlock
    :: "{" (statement | continueStatement | breakStatement)* "}"
    
continueStatement
    :: "continue" ";"

breakStatement
    :: "break" ";"

ifElseStatement
    :: "if" "(" expression ")" block ( "else if" "(" expression ")" block )* ( "else" block )?

returnStatement
    :: "return" expression? ";"


expression
    :: assignment

assignment
    :: logic_or ( ("=" | "+=" | "-=" | "*=" | "/=" ) logic_or)?

logic_or
    :: logic_and ("||" logic_and)?

logic_and
    :: equality ("&&" equality)?

equality
    :: comparison ( ("==" | "!=" ) comparison)?

comparison
    :: addition ( (">" | ">=" | "<" | "<=" ) addition)?

addition
    :: multiplication ( ("+" | "-" multiplication)?

multiplication
    :: prefix ( ("*" | "/" prefix)?

prefix
    :: ("--" | "-" | "++" | "!" )* postfix

postfix
    :: primary postfixOperation*

postfixOperation
    :: (call | member | index)?

call
    :: "(" expression[","] ")"

member
    :: "." SimpleName

index
    :: "[" expression "]"

primary
    :: "(" expression ")
    |  BoolLiteral
    |  StringLiteral
    |  CharLiteral
    |  IntLiteral
    |  DoubleLiteral
    |  structLiteral
    |  "this"
    |  SimpleName

objectLiteral
    :: "{" ("." SimpleName "=" expression)[","] "}"

BoolLiteral
    :: "true" | "false"

StringLiteral
    :: "\"" (<anything>) "\""

CharLiteral
    ::  "'" "\"? <any char> "'"

IntLiteral
    :: (0-9)*

DoubleLiteral
    :: (0-9)+ "." (0-9)+

SimpleName
    :: (a-z | A-Z | _)+
     

```


Keywords:

```
break
continue
else
false
fn
if
loop
return
struct
this
true
```

Tokens:
```
{
}
[
]
(
)

;
:
.
,

"
'

||
&&

=
==

+
++
+=

-
--
-=

*
*=

/
/=
// 

!
!=

>
>=

<
<=
```

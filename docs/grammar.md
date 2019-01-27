## Grammar

TODO:
```
- Generic default values i.e. < E : Error = Error>
```

GrammarSyntax:
```
[name] ::   -> a new rule with name
a | b       -> a 'or' b
a*          -> zero or more of a
a+          -> oner or more of a
a?          -> zero or one of a
(a)         -> grouping of a
(a)[b]      -> List of a divided by b, supports trailing b
(a)![b]     -> List of a divided by b, does not support trailing b 
```

```
texelFile ::
    importDeclaration*
    topLevelDeclaration*
    exportDeclaration?
    
importDeclaration ::
    "import" ( SimpleName )!["."] ";"
    
exportDeclaration ::
    "export" "{" ( ( SimpleName )!["."] )[","] "}" ";"
    
genericDeclaration ::
    "<" (SimpleName (":" genericName)? )[","] ">"

genericName ::
    ( SimpleName ("<" ( genericName )![","] ">" )? )!["."]
    
ArraySpecifier ::
    "[]"
    
topLevelDeclaration ::
    structDeclaration |
    functionDeclaration |
    interfaceDeclaration |
    aliasDeclaration |
    enumDeclaration |
     
structDeclaration ::
    "closed"? "struct" SimpleName genericDeclaration? extendDeclaration? structBody

extendDeclaration ::
    ":" (genericName)![","]

structBody ::
    "{" structFieldDeclaration* structDeclaration* "}"
    
structFieldDeclaration ::
    "mut"? genericName ArraySpecifier? SimpleName ( "=" expression)? ";"
    
functionDeclaration ::
    "mut"? "fn" genericDeclaration? genericName functionParameters functionReturnType functionBody
    
functionParameters ::
    "(" (genericName ArraySpecifier? SimpleName)[","] ")"
    
functionReturnType ::
    ":" genericName ArraySpecifier?
    
functionBody ::
    block
    
interfaceDeclaration ::
    "interface" SimpleName genericDeclaration? interfaceBody

interfaceBody ::
    "{" ( "mut"? "fn" SimpleName functionParameters functionReturnType ";" )* "}"
    
aliasDeclaration ::
    "alias" SimpleName "=" genericName ";"
    
enumDeclaration ::
    "enum" SimpleName "{" ( SimpleName )[","] "}"
    
block ::
    "{" statement* "}"
    
statement ::
    variableDeclaration |
    expressionOrAssignmentStatement |
    assignmentStatement |
    loopStatement |
    ifElseStatement |
    returnStatement |
    whenStatement |

variableDeclaration ::
    "mut"? genericName ArraySpecifier? SimpleName "=" expression ";"

expressionOrAssignmentStatement ::
    expression ( ("=" | "+=" | "-=" | "*=" | "/=" ) expression)? ";"

loopStatement ::
    "loop" "(" expression ")" loopBlock
    
loopBlock ::
    "{" (statement | ( ( "continue" | "break" ) ";" )* "}"

ifElseStatement ::
    "if" "(" expression ")" block ( "else if" "(" expression ")" block )* ( "else" block )?

returnStatement ::
    "return" expression? ";"
    
whenStatement ::
    "when" "(" expression ")" "{"
    ( expression "::" ( block | expression ))[", "]
    ( else "::" ( block | expression ) )? ","? "}"

expression ::
    structLiteral |
    arrayLiteral |
    logic_or |
    
structLiteral ::
    "mut"? "{" ( "." SimpleName ( "=" expression )? )[","] "}"

arrayLiteral ::
    "[" ( expression )[","] "]"

logic_or ::
    logic_and ("||" logic_and)*

logic_and ::
    equality ("&&" equality)*

equality ::
    comparison ( ("==" | "!=" ) comparison)*

comparison ::
    addition ( (">" | ">=" | "<" | "<=" ) addition)*

addition ::
    multiplication ( ("+" | "-" multiplication)*

multiplication ::
    prefix ( ("*" | "/" prefix)*

prefix ::
    ("--" | "-" | "++" | "!" )? postfix

postfix ::
    primary (call | index | member)*

call ::
    "(" expression[","] ")"

index ::
    "[" expression "]"
    
member ::
    "." genericName

primary ::
    "(" expression ") |
    BoolLiteral |
    StringLiteral |
    CharLiteral |
    IntLiteral |
    DoubleLiteral |
    SimpleName |

BoolLiteral ::
    "true" | "false"

StringLiteral ::
    "\"" (<anything>) "\""

CharLiteral ::
    "'" "\"? <any char> "'"

IntLiteral ::
    (0-9)*

DoubleLiteral ::
    (0-9)+ "." (0-9)+

SimpleName ::
    (a-z | A-Z | _)+
```


Keywords:

```
alias
break
closed
continue
else
enum
export
false
fn
if
import
interface
loop
mut
return
struct
true
when
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
.
,

:
::

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

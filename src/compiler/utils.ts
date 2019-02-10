import { GenericName } from "../tree";
import { SymbolTree, SymbolType } from "../utils/SymbolTree";

// Foo<number, hi<bar<hi>>>.Foo<number, hi<bar<hi>>>
// const x = new GenericName([
//    {
//       name: new SimpleName("Foo"), // 1
//       generics: [
//          new GenericName([
//             {
//                name: new SimpleName("number"), // 2
//                generics: [],
//             },
//          ]), new GenericName([
//             {
//                name: new SimpleName("hi"), // 2
//                generics: [
//                   new GenericName([
//                      {
//                         name: new SimpleName("bar"), // 3
//                         generics: [
//                            new GenericName([
//                               {
//                                  name: new SimpleName("hi"),
//                                  generics: [],
//                               },
//                            ]),
//                         ],
//                      },
//                   ]),
//                ],
//             },
//          ]),
//       ],
//    }, {
//       name: new SimpleName("Foo"), // 1
//       generics: [
//          new GenericName([
//             {
//                name: new SimpleName("number"), // 2
//                generics: [],
//             },
//          ]), new GenericName([
//             {
//                name: new SimpleName("hi"), // 2
//                generics: [
//                   new GenericName([
//                      {
//                         name: new SimpleName("bar"), // 3
//                         generics: [
//                            new GenericName([
//                               {
//                                  name: new SimpleName("hi"),
//                                  generics: [],
//                               },
//                            ]),
//                         ],
//                      },
//                   ]),
//                ],
//             },
//          ]),
//       ],
//    },
// ]);

function calculateGenericNestingDepth(name: GenericName): number {
   return name.parts.reduce((previousValue, currentValue) => {
      if (currentValue.generics.length === 0) {
         return previousValue;
      } else {
         return previousValue +
            (currentValue.generics.map(it => calculateGenericNestingDepth(it))).reduce((max,
               newOne,
            ) => Math.max(max, newOne), 0);
      }
   }, 1);
}

function createPlainFromGeneric(name: GenericName): string[] {
   return name.parts.map(part => {
      return `${ part.name.value }_${ part.generics.map(
         generic => createPlainFromGeneric(generic)
         .join("___"))
                                          .join("__") }`;
   });
}

export function registerInternals(rootSymbol: SymbolTree) {
   // TODO: Call this on root level instead of file level
   rootSymbol.addValueToPath(["void"], SymbolType.VIRTUAL, SymbolType.STRUCT);
   rootSymbol.addValueToPath(["boolean"], SymbolType.VIRTUAL, SymbolType.STRUCT);
   rootSymbol.addValueToPath(["char"], SymbolType.VIRTUAL, SymbolType.STRUCT);
   rootSymbol.addValueToPath(["string"], SymbolType.VIRTUAL, SymbolType.STRUCT);
   rootSymbol.addValueToPath(["int"], SymbolType.VIRTUAL, SymbolType.STRUCT);
   rootSymbol.addValueToPath(["double"], SymbolType.VIRTUAL, SymbolType.STRUCT);
   rootSymbol.addValueToPath(["println"], SymbolType.VIRTUAL, SymbolType.FUNCTION);
}

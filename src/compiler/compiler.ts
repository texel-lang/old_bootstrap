import { parseFile } from "../parser";
import { TexelFile } from "../tree";
import { consoleObject, readFileOrDirectory, TexelFileInfo } from "../utils";
import { SymbolTree, SymbolType } from "../utils/SymbolTree";
import { processSymbolsForSource } from "./symbols";

export interface CompileInfo {
   source: TexelFileInfo,
   tree: TexelFile,
}

export function compile(compilePath: string) {
   const files = readFileOrDirectory(compilePath);
   consoleObject(files);

   const sources: CompileInfo[] = files.map(it => ({
      source: it,
      tree: parseFile(it.filePath, it.contents),
   }));

   const rootSymbol = new SymbolTree(SymbolType.UNKNOWN, "", [], undefined);
   sources.forEach(it => {
      const symbol = mapFile(compilePath, rootSymbol, it);
      processSymbolsForSource(symbol);
   });

   rootSymbol.debugSymbolNameStructure();
   // consoleObject(rootSymbol.children.map(it => it.value), 7);
}

function mapFile(compilePath: string, rootSymbol: SymbolTree, file: CompileInfo): SymbolTree {
   let path = file.source.filePath.substr(compilePath.length); // Remove common path parts
   path = path.substring(0, path.length - 4); // Remove .txl extension

   const pathParts = path.split("/")
                         .filter(it => it.trim().length > 0)
                         .map(it => it.trim());

   return rootSymbol.addValueToPath(pathParts, SymbolType.FILE, file.tree);
}

import { parseFile } from "./parser";

function getArgs() {
   return [...process.argv].slice(2);
}

function main() {
   const args = getArgs();
   if (args.length === 0) {
      console.log("Texel Compiler -- Version 0.0.1");
      console.log("REPL is not supported yet.");
   } else if (args.length === 1) {
      compileFile(args[0]);
   }
}

function compileFile(fileName: string) {
   try {
      parseFile(fileName);
   } catch (e) {
      // FIXME: Need to exit gracefully for nodemon...
      console.error(e);
      process.exit(0);
   }
}

main();

import { TexelFile }           from "../Tree";
import { isNil }               from "../utils";
import { buildEcmaScript }     from "./BuildEcmaScript";
import { checkNamesAndScopes } from "./CheckNamesAndScopes";
import { checkTypes }          from "./CheckTypes";
import { CompilerData }        from "./CompilerData";

export function compile(file: TexelFile): string {
   const data = new CompilerData();
   data.registerInternals();

   collectStructNames(data, file);
   collectFunctionNames(data, file);
   checkNamesAndScopes(data, file);
   checkTypes(data, file);

   // consoleObject(data);
   return buildEcmaScript(data, file);
}

function collectStructNames(
   data: CompilerData,
   file: TexelFile,
) {
   file.structs.forEach(
      value => {
         if (!isNil(data.structNames[value.name])) {
            throw new Error(`Can't redeclare struct with name ${ value.name }`);
         }
         data.structNames[value.name] = false;
      });
}

function collectFunctionNames(
   data: CompilerData,
   file: TexelFile,
) {
   file.functions.forEach(
      value => {
         if (data.functionNames.includes(value.name)) {
            throw new Error(`Can't redeclare function with name ${ value.name }`);
         }
      });
}

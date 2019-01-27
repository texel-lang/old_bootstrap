import { accessSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "fs";

export type TexelFileInfo = {
   contents: string, filePath: string,
}

const fileExists = (fileName: string) => {
   try {
      accessSync(fileName);
      return true;
   } catch (e) {
      return false;
   }
};

const isDirectory = (fileName: string) => {
   return statSync(fileName).isDirectory();
};

export const readFileOrDirectory: (fileName: string) => TexelFileInfo[] = (fileName: string) => {
   if (!fileExists(fileName)) {
      return [];
   }

   if (isDirectory(fileName)) {
      const files = readdirSync(fileName, { withFileTypes: true });
      return files.filter(
         it => it.isFile() && it.name.endsWith(".txl"))
      .map(
         it => readFile(`${ fileName }/${ it.name }`));
   } else {
      return [readFile(fileName)];
   }
};

export const readFile: (fileName: string) => TexelFileInfo = (fileName: string) => {
   if (fileExists(fileName)) {
      return {
         filePath: fileName,
         contents: readFileSync(fileName, { encoding: "utf8" }),
      };
   } else {
      return {
         filePath: fileName,
         contents: "",
      };
   }
};

export const printFile = (
   dirName: string,
   fileName: string,
   sourceCode: string,
) => {
   mkdirSync(dirName, { recursive: true });
   writeFileSync(dirName + fileName, sourceCode, { flag: "w+" });
};

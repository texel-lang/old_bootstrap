import { accessSync, readFileSync } from "fs";

const fileExists = (fileName: string) => {
   try {
      accessSync(fileName);
      return true;
   } catch (e) {
      return false;
   }
};

export const readFile = (fileName: string) => {
   if (fileExists(fileName)) {
      return readFileSync(fileName, { encoding: "utf8" });
   } else {
      return "";
   }
};

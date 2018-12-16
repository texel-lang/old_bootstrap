export * from "./File";

export const consoleObject = (
   data: any,
   depth: number = 20,
) => {
   console.dir(data, {
      colors: true,
      depth,
   });
};

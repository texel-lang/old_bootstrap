export const consoleObject = (data: any, depth: number = 20) => {
   console.dir(data, {
      colors: true,
      depth,
   });
};

export function isNil<T>(value: T | null | undefined): value is null | undefined {
   return value === null || value === undefined;
}

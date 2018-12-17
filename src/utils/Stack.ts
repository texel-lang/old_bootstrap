// Simple stack backed by an array
export class Stack<T> {
   private items: T[] = [];

   public push(item: T) {
      this.items.push(item);
   }

   public pop(): T {
      if (this.items.length < 1) {
         throw new Error("Stack underflow.");
      }
      return this.items.pop()!!;
   }

   public find(predicate: (value: T) => boolean): T | undefined {
      for (let i = this.items.length - 1; i >= 0; --i) {
         if (predicate(this.items[i])) {
            return this.items[i];
         }
      }
      return undefined;
   }

   public peek(): T {
      if (this.items.length < 1) {
         throw new Error("Stack underflow.");
      }
      return this.items[this.items.length - 1];
   }
}

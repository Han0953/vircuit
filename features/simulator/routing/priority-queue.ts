export class PriorityQueue<T extends { priority: number; order: number }> {
  private items: T[] = [];
  private before(a: T, b: T) { return a.priority < b.priority || (a.priority === b.priority && a.order < b.order); }
  push(item: T) {
    this.items.push(item);
    let index = this.items.length - 1;
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (!this.before(item, this.items[parent])) break;
      this.items[index] = this.items[parent]; index = parent;
    }
    this.items[index] = item;
  }
  pop(): T | undefined {
    const first = this.items[0], last = this.items.pop();
    if (!this.items.length || !last) return first;
    let index = 0;
    while (index * 2 + 1 < this.items.length) {
      let child = index * 2 + 1;
      if (child + 1 < this.items.length && this.before(this.items[child + 1], this.items[child])) child++;
      if (!this.before(this.items[child], last)) break;
      this.items[index] = this.items[child]; index = child;
    }
    this.items[index] = last;
    return first;
  }
}

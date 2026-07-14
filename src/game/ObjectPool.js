export class ObjectPool {
  constructor(factory, reset, initialSize = 0) {
    this.factory = factory;
    this.reset = reset;
    this.available = [];
    for (let index = 0; index < initialSize; index += 1) this.available.push(factory());
  }

  acquire(data) {
    const object = this.available.pop() || this.factory();
    this.reset(object, data);
    return object;
  }

  release(object) {
    object.active = false;
    this.available.push(object);
  }
}

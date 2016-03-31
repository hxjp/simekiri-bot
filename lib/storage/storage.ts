import {Model} from "../models/model";
import {MemoryStorage} from "./memory";

export function getStorage(): Promise<Storage> {
  return Promise.resolve(MemoryStorage);
}

export interface Storage {
  insert(type: Function, model: Model): Promise<Model>;
  remove(type: Function, id: any): Promise<void>;
  update(type: Function, model: Model): Promise<Model>;
  findById(type: Function, id: any): Promise<Model>;
  findAll(type: Function):Promise<IterableIterator<Model>>;
}



import {Storage} from './storage';
import {Schedule, User} from "../models";
import {Model} from "../models/model";

const idSeq = 1;
const schedulesStore = new Map<number, Schedule>();
const usersStore = new Map<string, User>();

function detectStore(type: Function): Map<any, Model> {
  if (type instanceof Schedule) {
    return schedulesStore;
  } else if (type instanceof User) {
    return usersStore;
  } else {
    throw new Error('Unknown models');
  }
}

export class MemoryStorage implements Storage {
  insert(type: Function, model: Model):Promise<Model> {
    model.id = idSeq++;
    const store = detectStore(type);
    store.set(model.id, model);
    return Promise.resolve(model);
  }

  remove(type: Function, id: any):Promise<void> {
    const store = detectStore(type);
    store.delete(id);
    return Promise.resolve();
  }

  update(type:Function, model:Model):Promise<Model> {
    if (!model.id) {
      throw new Error('Missing id:' + JSON.stringify(model));
    }
    const store = detectStore(type);
    store.set(model.id, model);
    return model;
  }

  findById(type:Function, id:any):Promise<Model> {
    const store = detectStore(type);
    return store.get(id);
  }

  findAll(type:Function):Promise<IterableIterator<Model>> {
    const store = detectStore(type);
    return Promise.resolve(store.values());
  }

}

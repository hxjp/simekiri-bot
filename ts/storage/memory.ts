import {IStorage} from './storage';
import {Schedule, User} from '../models';
import {Model} from '../models/model';

let idSeq = 1;
const schedulesStore = new Map<number, Schedule>();
const usersStore = new Map<string, User>();

function detectStore<T extends Model>(type: Function): Map<any, Model> {
  if (type === Schedule) {
    return schedulesStore;
  } else if (type === User) {
    return usersStore;
  } else {
    throw new Error('Unknown models');
  }
}

export class MemoryStorage implements IStorage {
  insert<T extends Model>(type: {new(): T}, model: T): Promise<T> {
    model.id = idSeq++;
    const store = detectStore<T>(type);
    store.set(model.id, model);
    return Promise.resolve(model);
  }
  remove<T extends Model>(type: {new(): T}, id: any): Promise<void> {
    const store = detectStore(type);
    store.delete(id);
    return Promise.resolve();
  }
  update<T extends Model>(type: {new(): T}, model: T): Promise<T> {
    if (!model.id) {
      throw new Error('Missing id:' + JSON.stringify(model));
    }
    const store = detectStore(type);
    store.set(model.id, model);
    return Promise.resolve(model);
  }
  findById<T extends Model>(type: {new(): T}, id: any): Promise<T> {
    const store = detectStore(type);
    return Promise.resolve(store.get(id));
  }
  find<T extends Model>(type: {new(): T}, query: any): Promise<T[]> {
    const store = detectStore(type);
    const results: Model[] = [];
    for (let val of Array.from(store.values())) {
      for (let key in query) {
        if (val[key] === query[key]) {
          results.push(val);
        }
      }
    }
    return Promise.resolve(results);
  }
  findAll<T extends Model>(type: {new(): T}): Promise<T[]> {
    const store = detectStore(type);
    return Promise.resolve(Array.from(store.values()));
  }
  findOne<T extends Model>(type: {new(): T}, query: any): Promise<T> {
    return this.find(type, query)
      .then(models => {
        if (models.length === 0) {
          return null;
        } else {
          return models[0];
        }
      });
  }
}

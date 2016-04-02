import {Model} from "../models/model";
import {MemoryStorage} from "./memory";

export interface IStorage {
  insert<T extends Model>(type: {new(): T}, model: T): Promise<T>;
  remove<T extends Model>(type: {new(): T}, id: any): Promise<void>;
  update<T extends Model>(type: {new(): T}, model: T): Promise<T>;
  findById<T extends Model>(type: {new(): T}, id: any): Promise<T>;
  find<T extends Model>(type: {new(): T}, query: any): Promise<T[]>;
  findAll<T extends Model>(type: {new(): T}): Promise<T[]>;
  findOne<T extends Model>(type: {new(): T}, query: any): Promise<T>;
}

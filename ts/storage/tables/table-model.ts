import {Model} from '../../models/model';

export interface TableModel<T extends Model> {
  insert(model: T): Promise<T>;
  remove(id: any): Promise<void>;
  update(model: T): Promise<T>;
  findById(id: any): Promise<T>;
  findAll(): Promise<T[]>;
  find(query: any): Promise<T[]>;
}

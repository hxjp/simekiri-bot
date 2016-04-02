import {Model, ModelRepository} from "./model";
import {User} from './user';
import {IStorage} from '../storage/storage';

export class ScheduleRepository implements ModelRepository<Schedule> {
  constructor(
    private storage: IStorage
  ) {
  }
  findById(id: any): Promise<Schedule> {
    return this.storage.findById(Schedule, id);
  }
  find(query: any): Promise<Schedule[]> {
    return this.storage.find(Schedule, query);
  }
  findOne(query: any): Promise<Schedule> {
    return this.storage.findOne(Schedule, query);
  }
  findAll(): Promise<Schedule[]> {
    return this.storage.findAll(Schedule);
  }
}
export class Schedule implements Model {
  id: any;
  title: string;
  deadline: Date;
  writer: User;
  editor: User;
  createdAt: Date;
  updatedAt: Date;

  save(storage: IStorage): Promise<void> {
    const now = new Date();
    this.updatedAt = now;
    if (this.id) {
      return storage.update(Schedule, this)
        .then(() => undefined);
    } else {
      this.createdAt = now;
      return storage.insert(Schedule, this)
        .then(() => undefined);
    }
  }
  remove(storage: IStorage): Promise<void> {
    return storage.remove(Schedule, this.id);
  }
}

import {getStorage} from '../storage';
import {Model} from "./model";
import {User} from "./user";

export class Schedule implements Model {
  id: number;
  title: string;
  deadline: Date;
  writer: User;
  editor: User;
  createdAt: Date;
  updatedAt: Date;

  save(): Promise<void> {
    return getStorage()
      .then(storage => {
        if (this.id) {
          return storage.update(Schedule, this);
        } else {
          return storage.insert(Schedule, this);
        }
      })
      .then(() => undefined);
  }
  remove(): Promise<void> {
    return getStorage()
      .then(storage => {
        storage.remove(Schedule, this.id);
      });
  }
}

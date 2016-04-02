import {Model, ModelRepository} from './model';
import {IStorage} from '../storage/storage';

export enum UserType {
  EDITOR = 0,
  WRITER = 1
}

export class UserRepository implements ModelRepository<User> {
  constructor(
    private storage: IStorage
  ) {
  }
  findById(id: any): Promise<User> {
    return this.storage.findById(User, id);
  }
  find(query: any): Promise<User[]> {
    return this.storage.find(User, query);
  }
  findOne(query: any): Promise<User> {
    return this.storage.findOne(User, query);
  }
  findAll(): Promise<User[]> {
    return this.storage.findAll(User);
  }
  findOrCreateBySlackId(slackId: string, type: UserType = UserType.WRITER): Promise<User> {
    return this.findOne({slackId})
      .then(user => {
        if (!user) {
          user = new User();
          user.slackId = slackId;
          return user.save(this.storage).then(() => user);
        } else {
          return user;
        }
      });
  }
}
export class User implements Model {
  id: number;
  slackId: string;
  type: UserType;

  save(storage: IStorage): Promise<void> {
    if (this.id) {
      return storage.update(User, this)
        .then(() => undefined);
    } else {
      return storage.insert(User, this)
        .then(() => undefined);
    }
  }
  remove(storage: IStorage): Promise<void> {
    return storage.remove(User, this.id);
  }

}

import {Model} from "./model";
import {getStorage} from "../storage/storage";

export class User implements Model {
  slackId: string;
  save(): Promise<void> {
    return getStorage()
      .then(storage => {
        if (this.id) {
          return storage.update(User, this);
        } else {
          return storage.insert(User, this);
        }
      });
  }
  remove(): Promise<void> {
    return getStorage()
      .then(storage => {
        storage.remove(User, this.id);
      });
  }

}

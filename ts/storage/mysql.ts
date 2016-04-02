import * as Sequelize from 'sequelize';
import {IStorage} from "./storage";
import {Model} from '../models/model';

const sequelize = new Sequelize('hx', 'shumpei', 'password', {
  host: 'localhost',
  dialect: 'mysql'
});
const UserTable = require('./tables/user').getTable(sequelize);

UserTable.sync({force: true})
  .then(() => {
    return UserTable.create({
      slackId: 'test'
    })
  });

export class MySqlStorage implements IStorage {
  remove<T extends Model>(type: {new(): T}, id: any): Promise<void> {
    return null;
  }

  update<T extends Model>(type: {new(): T}, model: T): Promise<T> {
    return null;
  }

  findById<T extends Model>(type: {new(): T}, id: any): Promise<T> {
    return null;
  }

  find<T extends Model>(type: {new(): T}, query: any): Promise<T[]> {
    return null;
  }

  findAll<T extends Model>(type: {new(): T}): Promise<T[]> {
    return null;
  }

  findOne<T extends Model>(type: {new(): T}, query: any): Promise<T> {
    return null;
  }

  insert<T extends Model>(type: {new(): T}, model: T): Promise<T> {
    return null;
  }
}

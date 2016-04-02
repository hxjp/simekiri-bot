import * as Sequelize from 'sequelize';
import {IStorage} from '../storage';

let ScheduleTable: Sequelize.Model;

export function getTable(sequelize: Sequelize): Sequelize.Model {
  if (!ScheduleTable) {
    ScheduleTable = sequelize.define('Schedule', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: Sequelize.STRING,
        field: 'title',
        allowNull: false
      }
    },
    {
      timestamps: true
    });
  }
  return ScheduleTable;
};
export class ScheduleStorage implements IStorage {

  insert<Schedule>(type: {new(): Schedule}, model: Schedule): Promise<Schedule> {
    return null;
  }

  remove<Schedule>(type: {new(): Schedule}, id: any): Promise<void> {
    return null;
  }

  update<Schedule>(type: {new(): Schedule}, model: Schedule): Promise<Schedule> {
    return null;
  }

  findById<Schedule>(type: {new(): Schedule}, id: any): Promise<Schedule> {
    return null;
  }

  find<Schedule>(type: {new(): Schedule}, query: any): Promise<Schedule[]> {
    return null;
  }

  findAll<Schedule>(type: {new(): Schedule}): Promise<Schedule[]> {
    return null;
  }

  findOne<Schedule>(type: {new(): Schedule}, query: any): Promise<Schedule> {
    return null;
  }
}

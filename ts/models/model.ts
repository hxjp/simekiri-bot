import * as Sequelize from 'sequelize';

export interface ModelFactory<T extends Model> {
  create(sequelize: Sequelize): T;
}

export interface ModelConstructor<T extends Model> {
  new(sequelize: Sequelize): T;
  getTableModel(): Sequelize.Model;
}

export interface Model {
  tableModel: Sequelize.Model;
  id: any;
  save(): Promise<void>;
  remove(): Promise<void>;
}

export class UserModelFactory<User> {
  create(sequelize: Sequelize): User {
    return UserModel(sequelize);
  }
}

export class UserModel implements Model {
  id: any;
  slackId: string;
  type: UserType;

  constructor(
    private tableModel: Sequelize.Model
  ) {
  }
  save(): Promise<void> {
    return null;
  }
  remove(): Promise<void> {
    return null;
  }
}

export class User implements ModelConstructor<UserModel> {
  private tableModel: Sequelize.Model;
  constructor(
    private sequelize: Sequelize
  ): UserModel {
    return new UserModel();
  }
  getTableMode(): Sequelize.Model {
    if (!this.tableModel) {
      this.tableModel = this.sequelize.define('User', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        slackId: {
          type: Sequelize.STRING,
          field: 'slack_id',
          unique: true,
          allowNull: false
        }
      },
      {
        timestamps: true
      });
    }
    return this.tableModel;
  }
}

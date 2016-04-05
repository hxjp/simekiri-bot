import * as Sequelize from 'sequelize';
import {ScheduleStatus} from '../constants';

export type ModelDef = Sequelize.Model<any, any>;
export function defineModels(sequelize: Sequelize.Sequelize): {
  User: ModelDef;
  Schedule: ModelDef;
  Notification: ModelDef;
} {
  const User = sequelize.define('User', {
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

  const Schedule = sequelize.define('Schedule', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      deadline: {
        type: Sequelize.DATE,
        allowNull: false
      },
      writer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: User,
          key: 'id'
        }
      },
      editor_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: User,
          key: 'id'
        }
      },
      status: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: ScheduleStatus.ACTIVE
      }
    },
    {
      timestamps: true
    });

  const Notification = sequelize.define('Notification', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      schedule_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: Schedule,
          key: 'id'
        }
      },
      kind: {
        type: Sequelize.STRING,
        allowNull: false
      }
    },
    {
      timestamps: true
    });

  User.hasMany(Schedule, {as: 'writer', foreignKey: 'writer_id'});
  User.hasMany(Schedule, {as: 'editor', foreignKey: 'editor_id'});
  Schedule.belongsTo(User, {as: 'writer', foreignKey: 'writer_id'});
  Schedule.belongsTo(User, {as: 'editor', foreignKey: 'editor_id'});
  Schedule.hasMany(Notification, {as: 'notifications', foreignKey: 'schedule_id'});
  Notification.belongsTo(Schedule, {as: 'notifications', foreignKey: 'schedule_id'});

  return {
    User,
    Schedule,
    Notification,
  };
}

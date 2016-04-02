import * as Sequelize from 'sequelize';

let UserTable: Sequelize.Model;

export function getTable(sequelize: Sequelize): Sequelize.Model {
  if (!UserTable) {
    UserTable = sequelize.define('User', {
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
  return UserTable;
};

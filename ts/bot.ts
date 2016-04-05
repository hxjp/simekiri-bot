import {createConversation, ALL_CONVERSATIONS}  from './conversations';
import * as Sequelize from 'sequelize';
import {ScheduleStatus} from './constants';

// Sequelizeのトランザクションを、全てのクエリで自動的に利用する設定
// http://docs.sequelizejs.com/en/latest/docs/transactions/#automatically-pass-transactions-to-all-queries
const cls = require('continuation-local-storage');
Sequelize.cls = cls.createNamespace('hx');

const botkit = require('botkit');

const token = process.env.token;
if (!token) {
  console.log('Error: Specify token in environment');
  process.exit(1);
}

const controller = botkit.slackbot({
  debug: false
});

const bot = controller.spawn({
  token,
  incoming_webhook: {
    url: 'https://hooks.slack.com/services/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'
  }
})
  .startRTM(function(err: any): void {
    if (err) {
      throw new Error(err);
    }
  });

const sequelize = new Sequelize('hx', 'shumpei', 'password', {
  host: 'localhost',
  dialect: 'mysql'
});
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
Schedule.hasMany(Notification, {as: 'notification', foreignKey: 'schedule_id'});
Notification.belongsTo(Schedule, {as: 'schedule', foreignKey: 'schedule_id'});

sequelize.sync({force: true});

for (const conversationClass of ALL_CONVERSATIONS) {
  const conversation = createConversation(conversationClass, sequelize, bot);
  conversation.start();
}



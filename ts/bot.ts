import {createConversation, ConversationConstructor, OnAddMessage}  from './conversations';
import * as Sequelize from 'sequelize';

const botkit = require('botkit');

const token = process.env.token;
if (!token) {
  console.log('Error: Specify token in environment');
  process.exit(1);
}

const controller = botkit.slackbot({
  debug: false
});

controller.spawn({token})
  .startRTM(function(err: Error): void {
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
  }
},
  {
    timestamps: true
  });
User.hasMany(Schedule, {as: 'writer', foreignKey: 'writer_id'});
User.hasMany(Schedule, {as: 'editor', foreignKey: 'editor_id'});
Schedule.belongsTo(User, {as: 'writer', foreignKey: 'writer_id'});
Schedule.belongsTo(User, {as: 'editor', foreignKey: 'editor_id'});
sequelize.sync({force: true});

const conversations: ConversationConstructor[] = [
  OnAddMessage
];

for (const conversationClass of conversations) {
  const conversation = createConversation(conversationClass, sequelize, controller);
  conversation.start();
}



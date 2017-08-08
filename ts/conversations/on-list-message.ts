import {OnMessage} from './on-message';
import {Sequelize, Model} from 'sequelize';
import {ScheduleStatus} from '../constants';
import {formatSchedule} from './util';
import {messages} from '../messages-ja';

// const usage = `
// usage:
//        list
// `;

export class OnListMessage extends OnMessage {
  private User: Model<any, any>;
  private Schedule: Model<any, any>;

  constructor(
    protected sequelize: Sequelize,
    protected bot: any
  ) {
    super(sequelize, bot);
    this.User = <any> sequelize.model('User');
    this.Schedule = <any> sequelize.model('Schedule');
  }
  getPatterns(): string[] {
    return ['^list', '^ls'];
  }
  getTypes(): string[] {
    return ['direct_mention'];
  }

  protected onMessage(bot: any, message: any): void {
    this.sequelize.transaction(() => {
      return this.Schedule.findAll({
        where: {
          status: ScheduleStatus.ACTIVE
        },
        include: [
          {model: this.User, as: 'writer'},
          {model: this.User, as: 'editor'}
        ],
        order: [['deadline', 'DESC']]
      })
        .then((schedules: any[]) => {
          const list = schedules.map(schedule => formatSchedule(schedule));
          const deadlines = list.join('-----------------');
          const numDeadlines = list.length;
          let reply;
          if (numDeadlines === 0) {
            reply = `${messages.deadlineListEmpty}`;
          } else if (numDeadlines < 3) {
            reply = `${messages.deadlineListFew}\n${deadlines}`;
          } else if (numDeadlines < 5) {
            reply = `${messages.deadlineListNormal}\n${deadlines}`;
          } else {
            reply = `${messages.deadlineListMany}\n${deadlines}`;
          }
          bot.reply(message, reply);
        });
    });
  }
}

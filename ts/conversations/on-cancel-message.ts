import {OnMessage} from './on-message';
import {Sequelize, Model} from 'sequelize';
import {ScheduleStatus} from '../constants';
import {formatSchedule} from './util';
import {messages} from '../messages-ja';

const usage = `
usage:
       cancel <id>
`;

export class OnCancelMessage extends OnMessage {
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
    return ['^cancel (\\d+)'];
  }
  getTypes(): string[] {
    return ['direct_mention'];
  }

  protected onMessage(bot: any, message: any): void {
    const id = parseInt(message.match[1], 10);
    if (!id) {
      return bot.reply(message, `${messages.wrongCommand}\n${usage}`);
    }
    this.sequelize.transaction(() => {
      return this.Schedule.findById(id, {
        include: [
          {model: this.User, as: 'writer'},
          {model: this.User, as: 'editor'}
        ]})
        .then(schedule => {
          // console.log(JSON.stringify(schedule));
          if (!schedule) {
            return bot.reply(message, `${messages.wrongDeadlineId}[${id}]`);
          }
          schedule.status = ScheduleStatus.CANCELED;
          return schedule.save();
        })
        .then(schedule => {
          bot.reply(message, `${messages.deadlineCanceled}: ${formatSchedule(schedule)}`);
        });
    });
  }
}

import {OnMessage} from './on-message';
import {Sequelize, Model} from 'sequelize';
import {ScheduleStatus} from '../constants';
import {formatSchedule} from './util';

const usage = `
usage:
       done <id>
`;

export class OnDoneMessage extends OnMessage {
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
    return ['^done (\\d+)'];
  }
  getTypes(): string[] {
    return ['direct_mention'];
  }
  protected onMessage(bot: any, message: any): void {
    const id = parseInt(message.match[1], 10);
    if (!id) {
      return bot.reply(message, 'コマンド間違ってますよ\n' + usage);
    }
    const self = this;
    this.sequelize.transaction(async function(): Promise<any> {
      let schedule = await self.Schedule.findById(id, {
        include: [
          {model: self.User, as: 'writer'},
          {model: self.User, as: 'editor'}
        ]});
      if (!schedule) {
        return bot.reply(message, 'IDが不正です[' + id + ']');
      }
      schedule.status = ScheduleStatus.DONE;
      schedule.status = ScheduleStatus.CANCELED;
      schedule =  await schedule.save();
      bot.reply(message, `執筆が「完了」にマークされました。お疲れさまでした！: ${formatSchedule(schedule)}`);
    });
  }
}

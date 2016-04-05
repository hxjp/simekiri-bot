import {OnMessage} from './on-message';
import {Sequelize, Model} from 'sequelize';
import {ScheduleStatus} from '../constants';
import {formatSchedule} from './util';

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
          const reply =
            list.length > 0 ?
              `シメキリリスト\n${list.join('-----------------')}` :
              '現在アクティブなシメキリはありません。';
          bot.reply(message, reply);
        });
    });
  }
}

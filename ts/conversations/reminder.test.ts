import {expect} from 'chai';
import 'mocha';
import {Reminder, ReminderTask, BasicReminderTask} from './reminder';
import * as Sequelize from 'sequelize';
import {defineModels} from '../models';
import {USER_DATA, SCHEDULE_DATA} from './fixtures';

type BotWebHookParam = {text: string; channel: string};
class DummyBot {
  webhookParam: BotWebHookParam;
  sendWebhook(param: BotWebHookParam, callback: Function): void {
    this.webhookParam = param;
    setImmediate(callback);
  }
}

class DummyReminderTask implements ReminderTask {
  getKind(): string {
    return 'dummy';
  }
  shouldSendReminder(schedule: any): Promise<boolean> {
    return Promise.resolve(true);
  }
  getNotificationMessage(schedule: any): string {
    return 'dummy';
  }
}
class DummyCronJob {
  started: boolean;
  onTick: Function;
  addCallback(onTick: Function): void {
    this.onTick = onTick;
  }
  start(): void {
    this.started = true;
  }
}
describe('Reminder', () => {
  const sequelize = new Sequelize('hx_test', 'shumpei', 'password', {
    host: 'localhost',
    dialect: 'mysql'
  });
  const models = defineModels(sequelize);
  const User = models.User;
  const Schedule = models.Schedule;
  const Notification = models.Notification;

  let reminder: Reminder;
  let dummyBot: DummyBot;
  let dummyReminderTask: DummyReminderTask;
  let dummyJob: DummyCronJob;

  beforeEach(async function(): Promise<any> {
    await sequelize.sync({force: true});
    await Promise.all(USER_DATA.map(user => User.create(user)));
    await Promise.all(SCHEDULE_DATA.map(schedule => Schedule.create(schedule)));
  });
  beforeEach(() => {
    dummyBot = new DummyBot();
    dummyReminderTask = new DummyReminderTask();
    dummyJob = new DummyCronJob();
  });

  it('リマインダーが正常に動作すること', async function(): Promise<any> {
    reminder = new Reminder(
      sequelize,
      dummyBot,
      // テストデータはシメキリが二日後なので、2日前のリマインダーをセット
      [new BasicReminderTask(-2)],
      dummyJob
    );
    reminder.start();
    // ダミーのcronジョブがスタートされている
    expect(dummyJob.started).to.be.true;
    expect(dummyJob.onTick).to.be.not.undefined;
    // 処理を自前で起動
    await dummyJob.onTick();
    // 通知データが保存されていることの確認。
    const notification = await Notification.findOne({where: {schedule_id: 1}});
    expect(notification).to.be.not.null;
    expect(notification).to.have.property('schedule_id', 1);
    expect(notification).to.have.property('kind', '-2d');
    // Slackへの通知が行われていることも確認
    const webhookParam = dummyBot.webhookParam;
    expect(webhookParam).to.have.property('text');
    console.log(webhookParam.text);
    expect(webhookParam).to.have.property('channel', '#bot-test');
  });
});

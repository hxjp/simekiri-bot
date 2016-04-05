import * as moment from 'moment';

export const SCHEDULE_DATA = [
  {
    id: 1,
    title: 'タイトル1',
    deadline: moment().add(2, 'd').toDate(),
    editor_id: 1,
    writer_id: 2
  }
];

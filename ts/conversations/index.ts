import {OnAddMessage} from './on-add-message';
import {OnCancelMessage} from './on-cancel-message';
import {OnListMessage} from './on-list-message';
import {OnUpdateMessage} from './on-update-message';
import {Reminder} from './reminder';
import {OnDoneMessage} from './on-done-message';
import {OnHelpMessage} from './on-help-message';
export * from './conversation';

export const ALL_CONVERSATIONS = [
  OnAddMessage,
  OnCancelMessage,
  OnListMessage,
  OnUpdateMessage,
  OnDoneMessage,
  OnHelpMessage,
  Reminder
];

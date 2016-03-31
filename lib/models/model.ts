export interface Model {
  id: any;
  save(): Promise<void>;
  remove(): Promise<void>;
}

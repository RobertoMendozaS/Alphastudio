import { Roadmap } from './roadmap';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Roadmap: { roadmap: Roadmap };
};

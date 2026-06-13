import { Roadmap } from './roadmap';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  History: undefined;
  Profile: undefined;
  Roadmap: { roadmap: Roadmap };
};

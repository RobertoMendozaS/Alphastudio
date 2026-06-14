import { Roadmap } from './roadmap';

export type RootStackParamList = {
  Login: undefined;
  AppTabs: undefined;
  Roadmap: { roadmap: Roadmap };
};

export type MainTabParamList = {
  Home: undefined;
  History: undefined;
  Profile: undefined;
};

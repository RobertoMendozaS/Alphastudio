export interface SurveyResponse {
  topic: string;
  knowledgeLevel: 'principiante' | 'intermedio' | 'avanzado';
  timeCommitment: 'menos_1_semana' | '1_2_semanas' | '1_mes' | 'mas_1_mes';
  mainGoal: 'aprender_cero' | 'profundizar' | 'certificacion' | 'proyecto';
  experience: 1 | 2 | 3 | 4 | 5;
  timestamp: string;
}

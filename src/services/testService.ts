import { supabase } from './supabaseClient';
import type { TestResult } from '../types/test';

export const syncTestResult = async (result: TestResult, userId: string): Promise<void> => {
  const { error } = await supabase.from('test_results').insert({
    user_id: userId,
    topic: result.topic,
    type: result.type,
    score: result.score,
    total: result.total,
    answers: result.answers,
    questions: result.questions,
    timestamp: result.timestamp,
  });
  if (error) throw new Error(`Error al sincronizar test: ${error.message}`);
};

export const getTestStats = async (): Promise<{
  total: number;
  preAvg: number;
  postAvg: number;
  improvement: number;
  byTopic: { topic: string; pre: number; post: number; count: number }[];
}> => {
  const { data, error } = await supabase
    .from('test_results')
    .select('*')
    .order('timestamp', { ascending: false });

  if (error) throw new Error(`Error al obtener estadísticas: ${error.message}`);

  const results = data ?? [];
  const preTests = results.filter((r) => r.type === 'pre');
  const postTests = results.filter((r) => r.type === 'post');

  const preAvg = preTests.length > 0
    ? preTests.reduce((s, r) => s + (r.score / r.total) * 100, 0) / preTests.length
    : 0;
  const postAvg = postTests.length > 0
    ? postTests.reduce((s, r) => s + (r.score / r.total) * 100, 0) / postTests.length
    : 0;

  const topicsMap = new Map<string, { pre: number[]; post: number[] }>();
  results.forEach((r) => {
    if (!topicsMap.has(r.topic)) topicsMap.set(r.topic, { pre: [], post: [] });
    const entry = topicsMap.get(r.topic)!;
    if (r.type === 'pre') entry.pre.push((r.score / r.total) * 100);
    else entry.post.push((r.score / r.total) * 100);
  });

  const byTopic = Array.from(topicsMap.entries()).map(([topic, vals]) => ({
    topic,
    pre: vals.pre.length > 0 ? vals.pre.reduce((a, b) => a + b, 0) / vals.pre.length : 0,
    post: vals.post.length > 0 ? vals.post.reduce((a, b) => a + b, 0) / vals.post.length : 0,
    count: vals.pre.length + vals.post.length,
  }));

  return {
    total: results.length,
    preAvg: Math.round(preAvg),
    postAvg: Math.round(postAvg),
    improvement: Math.round(postAvg - preAvg),
    byTopic,
  };
};

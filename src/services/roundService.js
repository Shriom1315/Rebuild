import { supabase } from '../config/supabase';

export const roundService = {
  // Get all rounds
  async getAllRounds() {
    const { data, error } = await supabase
      .from('rounds')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get active rounds
  async getActiveRounds() {
    const { data, error } = await supabase
      .from('rounds')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get round by ID
  async getRoundById(roundId) {
    const { data, error } = await supabase
      .from('rounds')
      .select(`
        *,
        questions (*),
        team_scores (
          *,
          teams (
            name,
            code
          )
        )
      `)
      .eq('id', roundId)
      .single();

    if (error) throw error;
    return data;
  },

  // Create new round
  async createRound(roundData) {
    const { data, error } = await supabase
      .from('rounds')
      .insert([roundData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update round
  async updateRound(roundId, updates) {
    const { data, error } = await supabase
      .from('rounds')
      .update(updates)
      .eq('id', roundId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Start round
  async startRound(roundId) {
    const { data, error } = await supabase
      .from('rounds')
      .update({
        is_active: true,
        start_time: new Date().toISOString(),
      })
      .eq('id', roundId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // End round
  async endRound(roundId) {
    const { data, error } = await supabase
      .from('rounds')
      .update({
        is_active: false,
        end_time: new Date().toISOString(),
      })
      .eq('id', roundId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get questions for a round
  async getRoundQuestions(roundId) {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('round_id', roundId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Submit answer
  async submitAnswer(userId, questionId, roundId, answer) {
    // First, get the correct answer
    const { data: question } = await supabase
      .from('questions')
      .select('correct_answer')
      .eq('id', questionId)
      .single();

    const isCorrect = question?.correct_answer === answer;

    const { data, error } = await supabase
      .from('user_answers')
      .upsert([{
        user_id: userId,
        question_id: questionId,
        round_id: roundId,
        answer,
        is_correct: isCorrect,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get user's answers for a round
  async getUserAnswers(userId, roundId) {
    const { data, error } = await supabase
      .from('user_answers')
      .select(`
        *,
        questions (
          question_text,
          points
        )
      `)
      .eq('user_id', userId)
      .eq('round_id', roundId);

    if (error) throw error;
    return data;
  },

  // Calculate and save team score for a round
  async calculateTeamScore(teamId, roundId) {
    // Get all team members
    const { data: members } = await supabase
      .from('team_members')
      .select('user_id')
      .eq('team_id', teamId);

    if (!members || members.length === 0) return 0;

    // Get all correct answers from team members
    const { data: answers } = await supabase
      .from('user_answers')
      .select(`
        is_correct,
        questions (points)
      `)
      .in('user_id', members.map(m => m.user_id))
      .eq('round_id', roundId)
      .eq('is_correct', true);

    const totalScore = answers?.reduce((sum, ans) => sum + (ans.questions?.points || 0), 0) || 0;

    // Save team score
    const { data, error } = await supabase
      .from('team_scores')
      .upsert([{
        team_id: teamId,
        round_id: roundId,
        score: totalScore,
        completed_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;

    // Update team's total score
    await supabase.rpc('update_team_total_score', { team_id: teamId });

    return data;
  },
};

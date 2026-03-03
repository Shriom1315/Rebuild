import { supabase } from '../config/supabase';

export const qualificationService = {
  // Set qualification criteria for a round
  async setRoundQualification(roundId, criteria) {
    const { data, error } = await supabase
      .from('round_qualifications')
      .upsert([{
        round_id: roundId,
        min_score: criteria.minScore,
        max_teams: criteria.maxTeams || null,
        qualification_type: criteria.type || 'score',
        criteria: criteria.additional || {},
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get qualification criteria for a round
  async getRoundQualification(roundId) {
    const { data, error } = await supabase
      .from('round_qualifications')
      .select('*')
      .eq('round_id', roundId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" error
    return data;
  },

  // Qualify teams for next round based on current round performance
  async qualifyTeamsForNextRound(currentRoundId, nextRoundId) {
    const { data, error } = await supabase
      .rpc('qualify_teams_for_next_round', {
        p_current_round_id: currentRoundId,
        p_next_round_id: nextRoundId,
      });

    if (error) throw error;
    return data;
  },

  // Check if a team is eligible for a round
  async checkTeamEligibility(teamId, roundId) {
    const { data, error } = await supabase
      .from('team_round_eligibility')
      .select('is_eligible, qualification_reason')
      .eq('team_id', teamId)
      .eq('round_id', roundId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.is_eligible || false;
  },

  // Get all eligible teams for a round
  async getEligibleTeams(roundId) {
    const { data, error } = await supabase
      .from('team_round_eligibility')
      .select(`
        *,
        teams (
          id,
          code,
          name,
          status,
          total_score
        )
      `)
      .eq('round_id', roundId)
      .eq('is_eligible', true);

    if (error) throw error;
    return data;
  },

  // Get team eligibility status for all rounds
  async getTeamEligibilityStatus(teamId) {
    const { data, error } = await supabase
      .from('team_round_eligibility')
      .select(`
        *,
        rounds (
          id,
          name,
          type,
          is_active
        )
      `)
      .eq('team_id', teamId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Calculate and store individual performance
  async calculateIndividualPerformance(userId, roundId) {
    const { error } = await supabase
      .rpc('calculate_individual_performance', {
        p_user_id: userId,
        p_round_id: roundId,
      });

    if (error) throw error;
  },

  // Get individual performance for a user
  async getIndividualPerformance(userId, roundId = null) {
    let query = supabase
      .from('individual_performance')
      .select(`
        *,
        rounds (
          name,
          type,
          max_score
        )
      `)
      .eq('user_id', userId);

    if (roundId) {
      query = query.eq('round_id', roundId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get team performance (all members)
  async getTeamPerformance(teamId, roundId = null) {
    let query = supabase
      .from('individual_performance')
      .select(`
        *,
        profiles (
          full_name,
          email
        ),
        rounds (
          name,
          type,
          max_score
        )
      `)
      .eq('team_id', teamId);

    if (roundId) {
      query = query.eq('round_id', roundId);
    }

    const { data, error } = await query.order('score', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get performance leaderboard for a round
  async getRoundLeaderboard(roundId) {
    const { data, error } = await supabase
      .from('individual_performance')
      .select(`
        *,
        profiles (
          full_name,
          email
        ),
        teams (
          name,
          code
        )
      `)
      .eq('round_id', roundId)
      .order('score', { ascending: false })
      .limit(100);

    if (error) throw error;
    return data;
  },

  // Manually set team eligibility (admin override)
  async setTeamEligibility(teamId, roundId, isEligible, reason = '') {
    const { data, error } = await supabase
      .from('team_round_eligibility')
      .upsert([{
        team_id: teamId,
        round_id: roundId,
        is_eligible: isEligible,
        qualified_at: isEligible ? new Date().toISOString() : null,
        qualification_reason: reason || (isEligible ? 'Manually qualified by admin' : 'Manually disqualified by admin'),
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get qualification summary for admin dashboard
  async getQualificationSummary(roundId) {
    const { data, error } = await supabase
      .from('team_round_eligibility')
      .select('is_eligible')
      .eq('round_id', roundId);

    if (error) throw error;

    const summary = {
      total: data.length,
      qualified: data.filter(t => t.is_eligible).length,
      disqualified: data.filter(t => !t.is_eligible).length,
    };

    return summary;
  },
};

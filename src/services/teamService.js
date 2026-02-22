import { supabase } from '../config/supabase';

export const teamService = {
  // Get all teams
  async getAllTeams() {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        team_members (
          id,
          user_id,
          role,
          is_captain,
          readiness,
          profiles (
            full_name,
            email
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get team by ID
  async getTeamById(teamId) {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        team_members (
          id,
          user_id,
          role,
          is_captain,
          readiness,
          profiles (
            full_name,
            email,
            avatar_url
          )
        ),
        team_scores (
          score,
          round_id,
          rounds (
            name,
            type
          )
        )
      `)
      .eq('id', teamId)
      .single();

    if (error) throw error;
    return data;
  },

  // Get user's team
  async getUserTeam(userId) {
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        *,
        teams (
          *,
          team_members (
            id,
            user_id,
            role,
            is_captain,
            readiness,
            profiles (
              full_name,
              email,
              avatar_url
            )
          )
        )
      `)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data?.teams;
  },

  // Create new team
  async createTeam(teamData) {
    const { data, error } = await supabase
      .from('teams')
      .insert([teamData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update team
  async updateTeam(teamId, updates) {
    const { data, error } = await supabase
      .from('teams')
      .update(updates)
      .eq('id', teamId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete team
  async deleteTeam(teamId) {
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId);

    if (error) throw error;
  },

  // Add member to team
  async addTeamMember(teamId, userId, role, isCaptain = false) {
    const { data, error } = await supabase
      .from('team_members')
      .insert([{
        team_id: teamId,
        user_id: userId,
        role,
        is_captain: isCaptain,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Remove member from team
  async removeTeamMember(teamMemberId) {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', teamMemberId);

    if (error) throw error;
  },

  // Update team member readiness
  async updateMemberReadiness(teamMemberId, readiness) {
    const { data, error } = await supabase
      .from('team_members')
      .update({ readiness })
      .eq('id', teamMemberId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get team statistics
  async getTeamStats() {
    const { data, error } = await supabase
      .from('teams')
      .select('status');

    if (error) throw error;

    const stats = {
      total: data.length,
      ready: data.filter(t => t.status === 'ready').length,
      inProgress: data.filter(t => t.status === 'in-progress').length,
      eliminated: data.filter(t => t.status === 'eliminated').length,
      qualified: data.filter(t => t.status === 'qualified').length,
    };

    return stats;
  },
};

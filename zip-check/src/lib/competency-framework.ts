// NiyamAI 67-Trait Behavioral Framework
// 6 Neural Clusters × ~11 traits each

export interface TraitDefinition {
  id: string;
  name: string;
  cluster: string;
  description: string;
  mcqKey?: string; // maps to MCQ question key
}

export const CLUSTERS = [
  { id: 'decision', name: 'Decision Architecture', icon: '🧠', color: '#F59E0B' },
  { id: 'people', name: 'People Philosophy', icon: '🤝', color: '#3B82F6' },
  { id: 'risk', name: 'Risk & Innovation', icon: '⚡', color: '#10B981' },
  { id: 'execution', name: 'Execution DNA', icon: '🎯', color: '#EF4444' },
  { id: 'culture', name: 'Culture Code', icon: '🏛️', color: '#8B5CF6' },
  { id: 'growth', name: 'Growth Orientation', icon: '📈', color: '#06B6D4' },
];

export const TRAITS: TraitDefinition[] = [
  // Decision Architecture (11)
  { id: 'd1', name: 'Decision Velocity', cluster: 'decision', description: 'Speed of making critical decisions', mcqKey: 'decision_speed' },
  { id: 'd2', name: 'Data vs Intuition Balance', cluster: 'decision', description: 'Reliance on data versus gut feeling', mcqKey: 'decision_data' },
  { id: 'd3', name: 'Reversibility Comfort', cluster: 'decision', description: 'Willingness to reverse decisions when wrong', mcqKey: 'decision_reversibility' },
  { id: 'd4', name: 'Stakeholder Inclusion', cluster: 'decision', description: 'Involves others in decision-making' },
  { id: 'd5', name: 'First Principles Thinking', cluster: 'decision', description: 'Reasons from fundamentals vs analogies' },
  { id: 'd6', name: 'Ambiguity Tolerance', cluster: 'decision', description: 'Comfort with incomplete information' },
  { id: 'd7', name: 'Contrarian Confidence', cluster: 'decision', description: 'Willingness to go against consensus' },
  { id: 'd8', name: 'Long-term vs Short-term', cluster: 'decision', description: 'Temporal bias in decision-making' },
  { id: 'd9', name: 'Decision Documentation', cluster: 'decision', description: 'Records reasoning behind decisions' },
  { id: 'd10', name: 'Crisis Decision Mode', cluster: 'decision', description: 'Behavior under extreme pressure' },
  { id: 'd11', name: 'Opportunity Cost Awareness', cluster: 'decision', description: 'Considers what is given up' },

  // People Philosophy (11)
  { id: 'p1', name: 'Hiring DNA', cluster: 'people', description: 'Pattern for selecting team members', mcqKey: 'people_hiring' },
  { id: 'p2', name: 'Conflict Resolution Style', cluster: 'people', description: 'Approach to interpersonal conflict', mcqKey: 'people_conflict' },
  { id: 'p3', name: 'Accountability Model', cluster: 'people', description: 'How accountability is enforced', mcqKey: 'people_accountability' },
  { id: 'p4', name: 'Trust Extension', cluster: 'people', description: 'Default trust level for new people' },
  { id: 'p5', name: 'Feedback Frequency', cluster: 'people', description: 'How often feedback is given' },
  { id: 'p6', name: 'Empathy Index', cluster: 'people', description: 'Understanding of others emotions' },
  { id: 'p7', name: 'Mentorship Orientation', cluster: 'people', description: 'Investment in others growth' },
  { id: 'p8', name: 'Diversity Value', cluster: 'people', description: 'Appreciation for different perspectives' },
  { id: 'p9', name: 'Loyalty Expectation', cluster: 'people', description: 'Value placed on long-term commitment' },
  { id: 'p10', name: 'Performance Tolerance', cluster: 'people', description: 'Patience with underperformers' },
  { id: 'p11', name: 'Recognition Style', cluster: 'people', description: 'How achievements are celebrated' },

  // Risk & Innovation (11)
  { id: 'r1', name: 'Risk Appetite', cluster: 'risk', description: 'Willingness to take calculated risks', mcqKey: 'risk_appetite' },
  { id: 'r2', name: 'Innovation Source', cluster: 'risk', description: 'Where new ideas come from', mcqKey: 'risk_innovation' },
  { id: 'r3', name: 'Failure Tolerance', cluster: 'risk', description: 'Response to failures and mistakes', mcqKey: 'risk_failure' },
  { id: 'r4', name: 'Experimentation Rate', cluster: 'risk', description: 'Frequency of trying new approaches' },
  { id: 'r5', name: 'Disruption Comfort', cluster: 'risk', description: 'Ease with industry disruption' },
  { id: 'r6', name: 'Resource Betting', cluster: 'risk', description: 'Willingness to bet resources on unknowns' },
  { id: 'r7', name: 'Market Timing', cluster: 'risk', description: 'Sense for right timing of moves' },
  { id: 'r8', name: 'IP Protection', cluster: 'risk', description: 'Attention to protecting innovations' },
  { id: 'r9', name: 'Pivot Readiness', cluster: 'risk', description: 'Speed of strategic direction changes' },
  { id: 'r10', name: 'Technology Adoption', cluster: 'risk', description: 'Early vs late adopter of tech' },
  { id: 'r11', name: 'Competitive Paranoia', cluster: 'risk', description: 'Alertness to competitive threats' },

  // Execution DNA (11)
  { id: 'e1', name: 'Planning Horizon', cluster: 'execution', description: 'Typical planning timeframe', mcqKey: 'execution_planning' },
  { id: 'e2', name: 'Delegation Style', cluster: 'execution', description: 'How tasks are distributed', mcqKey: 'execution_delegation' },
  { id: 'e3', name: 'Quality Standard', cluster: 'execution', description: 'Acceptable quality threshold', mcqKey: 'execution_quality' },
  { id: 'e4', name: 'Process Orientation', cluster: 'execution', description: 'Preference for documented processes' },
  { id: 'e5', name: 'Speed vs Perfection', cluster: 'execution', description: 'Trade-off between speed and quality' },
  { id: 'e6', name: 'Micro vs Macro', cluster: 'execution', description: 'Level of detail involvement' },
  { id: 'e7', name: 'Follow-through', cluster: 'execution', description: 'Completion rate of initiated projects' },
  { id: 'e8', name: 'Meeting Culture', cluster: 'execution', description: 'Approach to meetings and reviews' },
  { id: 'e9', name: 'Deadline Sensitivity', cluster: 'execution', description: 'Rigidity around deadlines' },
  { id: 'e10', name: 'Resource Efficiency', cluster: 'execution', description: 'Optimization of available resources' },
  { id: 'e11', name: 'Bottleneck Awareness', cluster: 'execution', description: 'Ability to identify constraints' },

  // Culture Code (12)
  { id: 'c1', name: 'Communication Philosophy', cluster: 'culture', description: 'Transparent vs need-to-know', mcqKey: 'culture_communication' },
  { id: 'c2', name: 'Work Ethic Expectation', cluster: 'culture', description: 'Expected work intensity', mcqKey: 'culture_workethic' },
  { id: 'c3', name: 'Authority vs Autonomy', cluster: 'culture', description: 'Hierarchy vs flat structure', mcqKey: 'culture_authority' },
  { id: 'c4', name: 'Work-Life Philosophy', cluster: 'culture', description: 'Integration vs separation' },
  { id: 'c5', name: 'Remote Comfort', cluster: 'culture', description: 'Openness to distributed work' },
  { id: 'c6', name: 'Office Culture', cluster: 'culture', description: 'Physical workspace importance' },
  { id: 'c7', name: 'Ritual Importance', cluster: 'culture', description: 'Value of team traditions' },
  { id: 'c8', name: 'Dress Code', cluster: 'culture', description: 'Formality expectations' },
  { id: 'c9', name: 'Humor Quotient', cluster: 'culture', description: 'Role of humor in workplace' },
  { id: 'c10', name: 'Political Tolerance', cluster: 'culture', description: 'Comfort with office politics' },
  { id: 'c11', name: 'Ethics Priority', cluster: 'culture', description: 'Non-negotiability of ethical conduct' },
  { id: 'c12', name: 'Transparency Index', cluster: 'culture', description: 'Information sharing default' },

  // Growth Orientation (11)
  { id: 'g1', name: 'Scaling Philosophy', cluster: 'growth', description: 'Approach to growing the business', mcqKey: 'growth_scaling' },
  { id: 'g2', name: 'Learning Culture', cluster: 'growth', description: 'Investment in continuous learning', mcqKey: 'growth_learning' },
  { id: 'g3', name: 'Customer Centricity', cluster: 'growth', description: 'Weight given to customer needs', mcqKey: 'growth_customer' },
  { id: 'g4', name: 'Revenue Focus', cluster: 'growth', description: 'Priority of revenue generation' },
  { id: 'g5', name: 'Market Expansion', cluster: 'growth', description: 'Appetite for new markets' },
  { id: 'g6', name: 'Partnership Orientation', cluster: 'growth', description: 'Value placed on partnerships' },
  { id: 'g7', name: 'Brand Investment', cluster: 'growth', description: 'Priority of brand building' },
  { id: 'g8', name: 'Talent Investment', cluster: 'growth', description: 'Spending on team development' },
  { id: 'g9', name: 'Sustainability Thinking', cluster: 'growth', description: 'Long-term environmental awareness' },
  { id: 'g10', name: 'Data-Driven Growth', cluster: 'growth', description: 'Use of analytics for growth' },
  { id: 'g11', name: 'Founder Mode vs Manager Mode', cluster: 'growth', description: 'Hands-on vs delegated leadership' },
];

export function getClusterTraits(clusterId: string) {
  return TRAITS.filter(t => t.cluster === clusterId);
}

export function getTraitById(id: string) {
  return TRAITS.find(t => t.id === id);
}

export function getTraitByMcqKey(key: string) {
  return TRAITS.find(t => t.mcqKey === key);
}

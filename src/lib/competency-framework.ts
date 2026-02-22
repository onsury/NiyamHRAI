/**
 * @fileoverview Defines the 67-trait behavioral framework for NiyamAI.
 * This file serves as a shared constant, providing a single source of truth for all behavioral traits
 * and their cluster categorizations across the application, from client-side components to
 * server-side Cloud Functions and AI models.
 */

export const BEHAVIORAL_FRAMEWORK = {
  "Strategic Thinking": [
    "Strategic Vision", "Business Acumen", "Analytical Thinking", "Innovation Orientation", "Market Awareness", "Risk Assessment", "Long-term Orientation", "Systems Thinking", "Opportunity Recognition"
  ],
  "Execution & Results": [
    "Results Orientation", "Planning & Organisation", "Decision Quality", "Action Orientation", "Follow-through", "Process Discipline", "Resource Optimization", "Problem Solving", "Accountability"
  ],
  "People Leadership": [
    "Team Building", "Talent Development", "Delegation", "Motivation", "Performance Management", "Empowerment", "Conflict Management", "Coaching", "Inclusive Leadership", "Succession Thinking"
  ],
  "Interpersonal Effectiveness": [
    "Communication Clarity", "Active Listening", "Relationship Building", "Collaboration", "Influence", "Negotiation", "Political Savvy", "Stakeholder Management", "Customer Orientation", "Network Building"
  ],
  "Personal Effectiveness": [
    "Self-Awareness", "Emotional Intelligence", "Integrity", "Resilience", "Learning Agility", "Composure", "Humility", "Confidence", "Energy & Drive", "Work-Life Integration"
  ],
  "Change & Adaptability": [
    "Change Leadership", "Adaptability", "Ambiguity Tolerance", "Continuous Improvement", "Future Orientation", "Transformation Mindset", "Experimentation", "Letting Go"
  ],
  "Organisational Contribution": [
    "Organisational Commitment", "Culture Carrier", "Knowledge Sharing", "Cross-functional Thinking", "Institutional Memory", "Mentorship", "Ambassadorship"
  ],
  "Specialised Capabilities": [
    "Technical/Functional Expertise", "Industry Knowledge", "Digital Fluency", "Global/Regional Perspective"
  ]
};

export const ALL_TRAITS = Object.values(BEHAVIORAL_FRAMEWORK).flat();

export const FRAMEWORK_CLUSTERS = Object.keys(BEHAVIORAL_FRAMEWORK);

export type Trait = typeof ALL_TRAITS[number];
export type Cluster = keyof typeof BEHAVIORAL_FRAMEWORK;

/**
 * Gets the cluster for a given trait.
 * @param trait The trait to find the cluster for.
 * @returns The cluster name or undefined if not found.
 */
export function getClusterForTrait(trait: Trait): Cluster | undefined {
  for (const cluster in BEHAVIORAL_FRAMEWORK) {
    if ((BEHAVIORAL_FRAMEWORK[cluster as Cluster]).includes(trait)) {
      return cluster as Cluster;
    }
  }
  return undefined;
}

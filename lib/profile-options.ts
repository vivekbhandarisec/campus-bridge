export const roles = [
  { value: 'STUDENT', label: 'Student', description: 'Find mentors and opportunities' },
  { value: 'ALUMNI', label: 'Alumni', description: 'Offer mentorship and career advice' },
  { value: 'COLLEGE_ADMIN', label: 'College Admin', description: 'Manage events and registrations' },
] as const;

export const domains = ['backend', 'ml', 'frontend', 'mobile', 'devops', 'data'] as const;

export const skillsOptions = ['Node.js', 'PostgreSQL', 'Docker', 'React', 'Python', 'AWS', 'Kubernetes', 'SQL'] as const;

export const colleges = [
  'GBPIET Pauri',
  'IIT Delhi',
  'IIT Bombay',
  'IIT Madras',
  'IIT Kanpur',
  'BITS Pilani',
  'VIT Vellore',
  'Delhi Technological University',
  'NSUT Delhi',
  'Manipal Institute of Technology',
  'Other',
] as const;

export type CampusRole = (typeof roles)[number]['value'];

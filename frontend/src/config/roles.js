export const ROLE_CONFIG = {
  ADMIN: {
    label: 'System Administration',
    shortLabel: 'Admin',
    route: '/admin',
    eyebrow: 'SYSTEM ADMINISTRATION',
    description: 'Manage users, permissions, and overall AAIR system operations.',
    accent: '#2563eb',
    stats: [['07', 'Accounts'], ['06', 'Active'], ['00', 'Alerts']],
    actions: [
      ['User Management', 'Create, lock, and update account information.', 'manage_accounts'],
      ['Permissions', 'Configure roles and system access controls.', 'admin_panel_settings'],
      ['System Logs', 'Monitor login activity and system changes.', 'history'],
    ],
  },
  MANAGER: {
    label: 'Manager',
    shortLabel: 'Manager',
    route: '/manager',
    eyebrow: 'WORKSPACE MANAGEMENT',
    description: 'Coordinate documents, sessions, and progress of annotation teams.',
    accent: '#0891b2',
    stats: [['06', 'Members'], ['14', 'Open Tasks'], ['91%', 'Progress']],
    actions: [
      ['Document Management', 'Track documents and allocate work.', 'folder_managed'],
      ['Session Management', 'Create and monitor work sessions.', 'event_available'],
      ['Statistics', 'View execution progress and quality.', 'query_stats'],
    ],
  },
  TERMINOLOGY: {
    label: 'Terminology Management',
    shortLabel: 'Terminology',
    route: '/user/terminology',
    eyebrow: 'TERMINOLOGY',
    description: 'Build and maintain a shared terminology base for the entire workflow.',
    accent: '#0f8b8d',
    stats: [
      ['248', 'Terms'],
      ['12', 'Pending Updates'],
      ['05', 'Categories'],
    ],
    actions: [
      ['Terminology Base', 'Look up and update project taxonomy.', 'account_tree'],
      ['Add Term', 'Add new definitions and usage rules.', 'library_add'],
      ['Import Data', 'Import terminology lists from CSV files.', 'upload_file'],
    ],
  },
  RESULT_ANALYST: {
    label: 'Result Analysis',
    shortLabel: 'Result Analyst',
    route: '/user/result-analysis',
    eyebrow: 'RESULT ANALYSIS',
    description: 'Analyze data distribution, label quality, and model performance.',
    accent: '#5b5ce2',
    stats: [
      ['18', 'New Reports'],
      ['94%', 'Confidence'],
      ['06', 'Datasets'],
    ],
    actions: [
      ['Analysis Dashboard', 'Observe overall quality indicators.', 'query_stats'],
      ['Detailed Results', 'Analyze labels by document and data group.', 'analytics'],
      ['Export Reports', 'Generate reports for model evaluation.', 'download'],
    ],
  },
  AI_LABELER: {
    label: 'AI Annotation',
    shortLabel: 'AI Labeler',
    route: '/user/ai-labeling',
    eyebrow: 'AI ANNOTATION',
    description: 'Use AI models to generate pre-labels and refine results.',
    accent: '#7c3aed',
    stats: [
      ['16', 'New Tasks'],
      ['128', 'Completed'],
      ['96%', 'Accuracy'],
    ],
    actions: [
      ['AI Tasks', 'Open queue of documents for automated labeling.', 'auto_awesome'],
      ['Prompts', 'Manage prompts used for each document type.', 'terminal'],
      ['Recent Results', 'Review and adjust AI-suggested labels.', 'fact_check'],
    ],
  },
  MANUAL_LABELER: {
    label: 'Manual Annotation',
    shortLabel: 'Manual Labeler',
    route: '/user/manual-labeling',
    eyebrow: 'MANUAL ANNOTATION',
    description: 'Handle annotation tasks requiring domain expertise.',
    accent: '#d97706',
    stats: [
      ['12', 'New Tasks'],
      ['84', 'Completed'],
      ['07', 'Streak Days'],
    ],
    actions: [
      ['Start Labeling', 'Continue the most recently processed document.', 'edit_note'],
      ['All Tasks', 'View task list and status.', 'view_list'],
      ['Guidelines', 'Look up annotation rules and terminology.', 'menu_book'],
    ],
  },
  REVIEWER: {
    label: 'Review',
    shortLabel: 'Reviewer',
    route: '/user/manual-review',
    eyebrow: 'QUALITY REVIEW',
    description: 'Review quality, provide feedback, and approve annotation results.',
    accent: '#dc4666',
    stats: [
      ['09', 'Pending Review'],
      ['102', 'Approved'],
      ['98%', 'Quality Rate'],
    ],
    actions: [
      ['Review Queue', 'Open results awaiting confirmation.', 'rate_review'],
      ['Review History', 'View past decisions and feedback.', 'history'],
      ['Error Reports', 'Aggregate discrepancies to improve workflows.', 'bug_report'],
    ],
  },
}

export function getRoleConfig(role) {
  return ROLE_CONFIG[role] ?? ROLE_CONFIG.MANUAL_LABELER
}

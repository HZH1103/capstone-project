const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_BASE_URL = (configuredApiUrl || 'http://localhost:5000/api').replace(/\/$/, '');

// Public profile link used in the footer, About section, and contact page.
export const GITHUB_PROFILE_URL = 'https://github.com/HZH1103';

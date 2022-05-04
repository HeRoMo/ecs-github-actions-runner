import { ConfigDefinition } from '../lib/Config';

const config: Partial<ConfigDefinition> = {
  repo: {
    owner: 'owner',
    name: 'your-repo-name',
  },
  secretName: 'your-secret-name',
};

export default config;

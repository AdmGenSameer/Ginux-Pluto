import { dokployApi, DOKPLOY_URL } from '../config/dokploy';
import { generateRandomSuffix } from '../utils/random';

export const generateGithubManifest = async () => {
  let userId = 'default_user';
  let organizationId = 'default_org';

  try {
    const res = await dokployApi.get('/user.get');
    if (res.data?.result?.data?.json) {
      const userData = res.data.result.data.json;
      if (userData.userId) userId = userData.userId;
      if (userData.organizationId) organizationId = userData.organizationId;
    }
  } catch (e: any) {
    console.warn('Failed to fetch user/org from Dokploy. Using default placeholders.', e.message);
  }

  const date = new Date().toISOString().split('T')[0];
  const randomSuffix = generateRandomSuffix();
  const appName = `CloudDeploy-${date}-${randomSuffix}`;
  
  const manifest = {
    redirect_url: `${DOKPLOY_URL}/api/providers/github/setup?organizationId=${organizationId}&userId=${userId}`,
    name: appName,
    url: DOKPLOY_URL,
    hook_attributes: {
      url: `${DOKPLOY_URL}/api/deploy/github`
    },
    callback_urls: [
      `${DOKPLOY_URL}/api/providers/github/setup`
    ],
    public: false,
    request_oauth_on_install: true,
    default_permissions: {
      contents: "read",
      metadata: "read",
      emails: "read",
      pull_requests: "write"
    },
    default_events: [
      "pull_request",
      "push"
    ]
  };

  return {
    action: `https://github.com/settings/apps/new?state=gh_init:${organizationId}:${userId}`,
    manifest
  };
};

export const getGithubProviders = async () => {
  try {
    const res = await dokployApi.get('/github.githubProviders');
    // Unwrap the TRPC JSON array so the frontend receives a pure array
    return res.data?.result?.data?.json || [];
  } catch (error: any) {
    // Suppress console.warn to avoid log spam every 3 seconds while polling if token is unconfigured or invalid.
    return []; 
  }
};

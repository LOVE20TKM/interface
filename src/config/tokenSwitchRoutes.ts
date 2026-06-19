export type TokenSwitchRule = { mode: 'stay' } | { mode: 'redirect'; to: string };

export const defaultTokenSwitchRoutes = {
  ended: '/acting',
  launching: '/launch',
} as const;

export const tokenSwitchDefaultRoutes = [
  '/launch/burn',
  '/launch/contribute',
  '/launch/deploy',
] as const;

export const tokenSwitchStayRoutes = [
  '/',
  '/acting',
  '/action/new',
  '/apps',
  '/apps/batch-transfer',
  '/chat',
  '/chat/activate',
  '/chat/activate/token-gov-manager',
  '/chat/activate/token-main-manager',
  '/dex',
  '/dex/deposit',
  '/dex/query',
  '/dex/swap',
  '/dex/withdraw',
  '/extension/deploy',
  '/extension/factories',
  '/extension/my_groups',
  '/gov',
  '/group/groupids',
  '/group/mint',
  '/launch',
  '/my',
  '/my/actionrewards',
  '/my/govrewards',
  '/my/liquid',
  '/my/queryaction',
  '/stake/liquid',
  '/stake/stakelp',
  '/stake/staketoken',
  '/stake/unstake',
  '/submit/actions',
  '/token',
  '/token/intro',
  '/token/transfer',
  '/tokens',
  '/tokens/children',
  '/verify',
  '/verify/actions',
  '/vote',
  '/vote/actions',
  '/vote/batch',
  '/vote/records',
] as const;

export const tokenSwitchRedirectRoutes = {
  '/action/info': '/acting',
  '/acting/join': '/acting',
  '/chat/activate/chain': '/chat',
  '/chat/activate/token-action-gov-manager': '/chat/activate',
  '/chat/activate/token-action-main-manager': '/chat/activate',
  '/chat/group': '/chat',
  '/chat/group/admins': '/chat',
  '/chat/group/ban-voters': '/chat',
  '/chat/group/banlist': '/chat',
  '/chat/group/members': '/chat',
  '/chat/group/mentions/all': '/chat',
  '/chat/group/mentions/me': '/chat',
  '/chat/group/message': '/chat',
  '/chat/group/sender': '/chat',
  '/chat/group/settings': '/chat',
  '/chat/preferences': '/chat',
  '/extension/group': '/extension/my_groups',
  '/extension/group_op': '/extension/my_groups',
  '/extension/group_trial': '/extension/my_groups',
  '/extension/group_trial_add': '/extension/my_groups',
  '/extension/groups_delegated_to_me': '/extension/my_groups',
  '/group/export_groups': '/extension/my_groups',
  '/group/transfer': '/group/groupids',
  '/my/myaction': '/my',
  '/my/rewardsofaction': '/my/actionrewards',
  '/submit/submit': '/submit/actions',
  '/verify/action': '/verify',
  '/verify/detail': '/verify',
  '/vote/single': '/vote/actions',
} as const;

export function getDefaultTokenSwitchPathname(hasEnded: boolean) {
  return hasEnded ? defaultTokenSwitchRoutes.ended : defaultTokenSwitchRoutes.launching;
}

export function getTokenSwitchRule(pathname: string): TokenSwitchRule | null {
  if ((tokenSwitchStayRoutes as readonly string[]).includes(pathname)) return { mode: 'stay' };

  const to = tokenSwitchRedirectRoutes[pathname as keyof typeof tokenSwitchRedirectRoutes];
  return to ? { mode: 'redirect', to } : null;
}

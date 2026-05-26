import type { NextPage } from 'next';

import { TokenManagerActivationPage } from '@/src/components/Chat/ManagerActivationPage';

const TokenGovManagerActivationRoute: NextPage = () => <TokenManagerActivationPage kind="gov" />;

export default TokenGovManagerActivationRoute;

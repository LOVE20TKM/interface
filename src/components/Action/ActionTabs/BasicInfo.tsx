import { useContext } from 'react';
import { TokenContext } from '@/src/contexts/TokenContext';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import { formatTokenAmount } from '@/src/lib/format';
import { ActionInfo } from '@/src/types/love20types';
import { LinkIfUrl } from '@/src/lib/stringUtils';
import SafeText from '@/src/components/Common/SafeText';

interface BasicInfoProps {
  actionInfo: ActionInfo;
}

export default function BasicInfo({ actionInfo }: BasicInfoProps) {
  const { token } = useContext(TokenContext) || {};

  if (!token) {
    return <div>Token信息加载中...</div>;
  }

  const formatStakeAmount = (amount: bigint) => {
    return formatTokenAmount(amount);
  };

  const formatTimestamp = (blockNumber: bigint) => {
    // 这里可以根据区块号计算大概时间，或者直接显示区块号
    return `区块 #${blockNumber.toString()}`;
  };

  return (
    <div>
      <div className="">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center justify-between md:max-w-xs">
            <span className="font-bold text-sm">最小参与代币数:</span>
            <span className="font-mono text-secondary">{formatStakeAmount(actionInfo.body.minStake)}</span>
          </div>

          <div className="flex items-center justify-between md:max-w-xs">
            <span className="font-bold text-sm">最大激励地址数:</span>
            <span className="font-mono text-secondary">{actionInfo.body.maxRandomAccounts.toString()}</span>
          </div>
        </div>
      </div>

      {/* 验证规则 */}
      {actionInfo.body.verificationRule && (
        <div className="mt-4">
          <div className="font-bold text-sm mb-2">验证规则:</div>
          <div className="leading-loose bg-gray-50 p-2 rounded-md">
            <LinkIfUrl text={actionInfo.body.verificationRule} preserveLineBreaks={true} />
          </div>
        </div>
      )}

      {/* 报名参加行动时，行动者要提供的信息 */}
      {actionInfo.body.verificationKeys && actionInfo.body.verificationKeys.length > 0 && (
        <div className="mt-6">
          <div className="font-bold text-sm mb-2">报名参加行动时，行动者要提供的信息:</div>
          <ul className="list-disc pl-5">
            {actionInfo.body.verificationKeys.map((key, index) => (
              <li key={index} className="text-gray-700">
                <div className="text-sm font-bold text-greyscale-900">
                  <SafeText text={key} showWarning={true} /> :
                </div>
                <div>
                  <SafeText
                    text={actionInfo.body.verificationInfoGuides?.[index]}
                    showWarning={true}
                    preserveLineBreaks={true}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex items-center justify-between mt-4 md:max-w-md">
        <span className="font-bold text-sm">白名单:</span>
        <div>
          {actionInfo.body.whiteListAddress === '0x0000000000000000000000000000000000000000' ? (
            <span className="text-gray-400 text-sm">无限制</span>
          ) : (
            <AddressWithCopyButton
              address={actionInfo.body.whiteListAddress}
              showCopyButton={true}
              colorClassName="text-sm"
            />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 md:max-w-md">
        <span className="font-bold text-sm">创建人:</span>
        <AddressWithCopyButton address={actionInfo.head.author} showCopyButton={true} colorClassName="text-sm" />
      </div>
    </div>
  );
}

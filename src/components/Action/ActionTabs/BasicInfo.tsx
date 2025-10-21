import { useContext } from 'react';
import { TokenContext } from '@/src/contexts/TokenContext';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import { formatTokenAmount } from '@/src/lib/format';
import { ActionInfo } from '@/src/types/love20types';
import { LinkIfUrl } from '@/src/lib/stringUtils';
import SafeText from '@/src/components/Common/SafeText';
import { useSubmitInfo } from '@/src/hooks/contracts/useLOVE20Submit';
import { Lightbulb } from 'lucide-react';

interface BasicInfoProps {
  actionInfo: ActionInfo;
  currentRound?: bigint;
}

export default function BasicInfo({ actionInfo, currentRound }: BasicInfoProps) {
  const { token } = useContext(TokenContext) || {};

  // 获取推举人信息
  const { submitInfo, isPending: isSubmitPending } = useSubmitInfo(
    token?.address || '0x0000000000000000000000000000000000000000',
    currentRound || BigInt(0),
    actionInfo.head.id,
  );

  if (!token) {
    return <div>Token信息加载中...</div>;
  }

  const formatStakeAmount = (amount: bigint) => {
    return formatTokenAmount(amount);
  };

  return (
    <div>
      <div className="">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center justify-between md:max-w-xs">
            <span className="font-bold">最小参与代币数:</span>
            <span className="font-mono text-secondary">{formatStakeAmount(actionInfo.body.minStake)}</span>
          </div>

          <div className="flex items-center justify-between md:max-w-xs">
            <span className="font-bold">最大激励地址数:</span>
            <span className="font-mono text-secondary">{actionInfo.body.maxRandomAccounts.toString()}</span>
          </div>
        </div>

        {/* 小贴士提示框 - 在PC端占据更宽的区域 */}
        <div className="mt-3 text-sm md:text-base text-gray-700 bg-gray-50 p-3 md:p-4 rounded-md md:rounded-lg w-full">
          <div className="flex items-start gap-2 md:gap-3">
            <Lightbulb className="w-4 h-4 md:w-5 md:h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-medium text-amber-700">小贴士：</span>
              每轮验证阶段，会从所有参与行动的代币中，随机抽取{' '}
              <span className="font-mono font-semibold">{actionInfo.body.maxRandomAccounts.toString()}</span>{' '}
              份代币，返回对应地址。若多份代币对应相同地址，则会合并为一个地址。
            </div>
          </div>
        </div>
      </div>

      {/* 验证规则 */}
      {actionInfo.body.verificationRule && (
        <div className="mt-4">
          <div className="font-bold mb-2">验证规则:</div>
          <div className="leading-loose bg-gray-50 p-2 rounded-md">
            <LinkIfUrl text={actionInfo.body.verificationRule} preserveLineBreaks={true} />
          </div>
        </div>
      )}

      {/* 报名参加行动时，行动者要提供的信息 */}
      {actionInfo.body.verificationKeys && actionInfo.body.verificationKeys.length > 0 && (
        <div className="mt-6">
          <div className="font-bold mb-2">报名参加行动时，行动者要提供的信息:</div>
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
        <span className="font-bold">白名单:</span>
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
        <span className="font-bold">创建人:</span>
        <AddressWithCopyButton address={actionInfo.head.author} showCopyButton={true} colorClassName="text-sm" />
      </div>

      <div className="flex items-center justify-between mt-4 md:max-w-md">
        <span className="font-bold">推举人:</span>
        <div>
          {isSubmitPending ? (
            <span className="text-gray-400 text-sm">加载中...</span>
          ) : submitInfo?.submitter && submitInfo.submitter !== '0x0000000000000000000000000000000000000000' ? (
            <AddressWithCopyButton address={submitInfo.submitter} showCopyButton={true} colorClassName="text-sm" />
          ) : (
            <span className="text-gray-400 text-sm">当前行动轮未被推举</span>
          )}
        </div>
      </div>
    </div>
  );
}

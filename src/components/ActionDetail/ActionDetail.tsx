'use client';
import React, { useContext, useEffect } from 'react';

// my hooks
import { useActionInfo, useSubmitInfo } from '@/src/hooks/contracts/useLOVE20Submit';
import { useHandleContractError } from '@/src/lib/errorUtils';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my types & funcs
import { ActionInfo } from '@/src/types/love20types';
import { formatTokenAmount } from '@/src/lib/format';
import { LinkIfUrl } from '@/src/lib/stringUtils';
import SafeText from '@/src/components/Common/SafeText';
import InfoTooltip from '@/src/components/Common/InfoTooltip';
import { FactoryInfo } from '@/src/hooks/extension/base/composite/useExtensionsByActionInfosWithCache';

// my components
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LeftTitle from '@/src/components/Common/LeftTitle';
import ExtensionBasicInfo from '@/src/components/Extension/Base/Action/ExtensionBasicInfo';

interface ActivityDetailProps {
  actionId: bigint;
  round: bigint;
  showSubmitter: boolean;
  showVerifyHistory?: boolean;
  onActionInfo?: (actionInfo: ActionInfo) => void;
  // 扩展行动相关参数
  isExtensionAction?: boolean;
  extensionAddress?: `0x${string}`;
  factory?: FactoryInfo;
}

const ActionDetail: React.FC<ActivityDetailProps> = ({
  actionId,
  round,
  showSubmitter,
  showVerifyHistory = true,
  onActionInfo,
  isExtensionAction,
  extensionAddress,
  factory,
}) => {
  const { token } = useContext(TokenContext) || {};

  // 行动详情
  const {
    actionInfo,
    isPending: isPendingActionInfo,
    error: errorActionInfo,
  } = useActionInfo(token?.address as `0x${string}`, actionId);
  useEffect(() => {
    if (onActionInfo && actionInfo) {
      onActionInfo(actionInfo);
    }
  }, [actionInfo]);

  // 推举行动者
  const {
    submitInfo,
    isPending: isPendingSubmitInfo,
    error: errorSubmitInfo,
  } = useSubmitInfo(token?.address as `0x${string}`, showSubmitter ? round : BigInt(0), actionId);

  // 找到当前动作的提交者
  const submitter = submitInfo?.submitter || 'N/A';

  // 错误提示
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorActionInfo) {
      handleContractError(errorActionInfo, 'submit');
    }
    if (errorSubmitInfo) {
      handleContractError(errorSubmitInfo, 'submit');
    }
  }, [errorActionInfo, errorSubmitInfo]);

  if (isPendingActionInfo) {
    return <LoadingIcon />;
  }

  return (
    <>
      <div className="mx-auto p-4 pb-2 ">
        <div className="flex flex-col">
          <span className="text-sm text-greyscale-500">No.{actionInfo?.head.id.toString()}</span>
          <span className="text-xl font-bold text-black">{actionInfo?.body.title}</span>
        </div>
        <div className="mt-0 text-xs text-greyscale-500 flex justify-between">
          <div className="flex items-center">
            创建人 <AddressWithCopyButton address={actionInfo?.head.author as `0x${string}`} />
          </div>
          {showSubmitter && (
            <div className="flex items-center">
              推举人{' '}
              {isPendingSubmitInfo ? <LoadingIcon /> : <AddressWithCopyButton address={submitter as `0x${string}`} />}
            </div>
          )}
        </div>
      </div>
      <div className="mx-auto p-4 pb-2">
        <div className="mb-6">
          <div className="mb-4">
            <h3 className="text-sm font-bold">最小参与代币数</h3>
            <p className="text-greyscale-500">{formatTokenAmount(actionInfo?.body.minStake || BigInt(0))}</p>
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-1 mb-1">
              <h3 className="text-sm font-bold">最大激励地址数</h3>
              <InfoTooltip
                title="最大激励地址数说明"
                content={
                  <p className="leading-relaxed text-base">
                    每轮从所有参与行动的代币中，随机抽取
                    <span className="font-mono font-bold text-blue-600 mx-1 text-base">
                      {actionInfo?.body.maxRandomAccounts.toString()}
                    </span>
                    份代币，返回对应地址。若多份代币对应相同地址，则会合并为一个地址。
                  </p>
                }
              />
            </div>
            <p className="text-greyscale-500">{actionInfo?.body.maxRandomAccounts.toString() || '-'}</p>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-bold mb-2">验证规则</h3>
            <div className="text-greyscale-500">
              <LinkIfUrl text={actionInfo?.body.verificationRule} preserveLineBreaks={true} />
            </div>
          </div>
          <div className="mb-4">
            <h3 className="text-sm font-bold mb-2">报名参加行动时，行动者要提供的信息</h3>
            {actionInfo?.body.verificationKeys && actionInfo?.body.verificationKeys.length > 0 ? (
              <ul className="list-disc pl-5">
                {actionInfo.body.verificationKeys.map((key: string, index: number) => (
                  <li key={index} className="text-greyscale-500">
                    <div className="text-sm font-bold text-greyscale-900 mb-1">
                      <SafeText text={key} showWarning={true} /> :
                    </div>
                    <div>
                      <SafeText
                        text={actionInfo.body.verificationInfoGuides[index]}
                        showWarning={true}
                        preserveLineBreaks={true}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-greyscale-500">无</span>
            )}
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-bold">白名单</h3>
            <p className="text-greyscale-500 flex flex-wrap items-center">
              {actionInfo?.body.whiteListAddress &&
              actionInfo.body.whiteListAddress !== '0x0000000000000000000000000000000000000000' ? (
                <span className="flex items-center mr-2">
                  <AddressWithCopyButton address={actionInfo.body.whiteListAddress as `0x${string}`} />
                </span>
              ) : (
                '无限制'
              )}
            </p>
          </div>

          {isExtensionAction && extensionAddress && factory && (
            <ExtensionBasicInfo
              extensionAddress={extensionAddress}
              factoryAddress={factory.address}
              actionId={actionId}
              actionInfo={actionInfo}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default ActionDetail;

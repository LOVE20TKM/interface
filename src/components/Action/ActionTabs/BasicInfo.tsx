import { useContext, useState } from 'react';
import { TokenContext } from '@/src/contexts/TokenContext';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import { formatTokenAmount } from '@/src/lib/format';
import { ActionInfo } from '@/src/types/love20types';
import { LinkIfUrl } from '@/src/lib/stringUtils';
import SafeText from '@/src/components/Common/SafeText';
import { useSubmitInfo } from '@/src/hooks/contracts/useLOVE20Submit';
import { useJoinedAmountByActionId } from '@/src/hooks/contracts/useLOVE20Join';
import { Lightbulb } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface BasicInfoProps {
  actionInfo: ActionInfo;
  currentRound?: bigint;
  isExtensionAction: boolean;
}

export default function BasicInfo({ actionInfo, currentRound, isExtensionAction }: BasicInfoProps) {
  const { token } = useContext(TokenContext) || {};
  const [isAlgorithmDialogOpen, setIsAlgorithmDialogOpen] = useState(false);

  // 获取推举人信息
  const { submitInfo, isPending: isSubmitPending } = useSubmitInfo(
    token?.address || '0x0000000000000000000000000000000000000000',
    currentRound || BigInt(0),
    actionInfo.head.id,
  );

  // 获取总参与代币数
  const { joinedAmountByActionId, isPending: isJoinedAmountPending } = useJoinedAmountByActionId(
    token?.address || '0x0000000000000000000000000000000000000000',
    actionInfo.head.id,
  );

  if (!token) {
    return <div>Token信息加载中...</div>;
  }

  // 计算100%概率被抽中的代币数
  const totalJoinedAmount = joinedAmountByActionId || BigInt(0);
  const maxRandomAccounts = actionInfo.body.maxRandomAccounts;
  const guaranteedAmount = maxRandomAccounts > BigInt(0) ? totalJoinedAmount / maxRandomAccounts : BigInt(0);

  return (
    <div>
      <div className="">
        {!isExtensionAction && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center justify-between md:max-w-xs">
              <span className="font-bold">最小参与代币数:</span>
              <span className="font-mono text-secondary">{formatTokenAmount(actionInfo.body.minStake)}</span>
            </div>

            <div className="flex items-center justify-between md:max-w-xs">
              <span className="font-bold">最大激励地址数:</span>
              <span className="font-mono text-secondary">{actionInfo.body.maxRandomAccounts.toString()}</span>
            </div>
          </div>
        )}

        {/* 小贴士提示框 - 在PC端占据更宽的区域 */}
        {!isExtensionAction && actionInfo.body.whiteListAddress === '0x0000000000000000000000000000000000000000' && (
          <div className="mt-1 text-sm md:text-base text-gray-700 bg-gray-50 p-1 md:p-4 rounded-md md:rounded-lg w-full">
            <div className="flex items-start gap-1 md:gap-3">
              <Lightbulb className="w-4 h-4 md:w-5 md:h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                “实际”激励地址数可能小于最大激励地址数。
                <Dialog open={isAlgorithmDialogOpen} onOpenChange={setIsAlgorithmDialogOpen}>
                  <DialogTrigger asChild>
                    <button className="text-blue-600 hover:text-blue-800 underline ml-1">详情算法&gt;&gt;</button>
                  </DialogTrigger>
                  <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[80vh] overflow-y-auto sm:w-full">
                    <DialogHeader className="text-center">
                      <DialogTitle className="text-center">激励地址说明</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 text-base">
                      {/* 第一部分：随机抽取算法 */}
                      <div className="space-y-2">
                        <h3 className="font-bold text-gray-900">随机抽取地址算法：</h3>
                        <p className="text-gray-700">
                          每轮验证阶段，会从所有参与行动的代币（例如当前行动为{' '}
                          {isJoinedAmountPending ? (
                            <span className="text-gray-400">加载中...</span>
                          ) : (
                            <span className="font-mono font-semibold text-blue-600">
                              {formatTokenAmount(totalJoinedAmount)}
                            </span>
                          )}{' '}
                          个）中，随机选中"最大激励地址数"个（例如当前行动目前为{' '}
                          <span className="font-mono font-semibold text-blue-600">{maxRandomAccounts.toString()}</span>{' '}
                          个）代币，返回对应地址。若多份代币对应相同地址，则会合并为一个地址。
                        </p>
                      </div>

                      {/* 第二部分：100%概率被抽中 */}
                      <div className="space-y-2">
                        <h3 className="font-bold text-gray-900">想要100%被抽中的代币数：</h3>
                        <p className="text-gray-700">
                          计算公式：总参与代币数 / 最大激励地址数。比如，当前行动目前想要 100%概率被抽中的代币数为{' '}
                          {isJoinedAmountPending ? (
                            <span className="text-gray-400">加载中...</span>
                          ) : (
                            <>
                              <span className="font-mono font-semibold text-blue-600">
                                {formatTokenAmount(totalJoinedAmount)}
                              </span>
                              {' / '}
                              <span className="font-mono font-semibold text-blue-600">
                                {maxRandomAccounts.toString()}
                              </span>
                              {' = '}
                              <span className="font-mono font-semibold text-green-600">
                                {formatTokenAmount(guaranteedAmount, 4, 'ceil')}
                              </span>
                            </>
                          )}
                        </p>
                      </div>

                      {/* 第三部分 */}
                      <div className="space-y-2 mb-4">
                        <h3 className="font-bold text-gray-900">如何铸造激励：</h3>
                        <p className="text-gray-700">
                          被抽中的地址，经社群验证后，会获得行动铸币激励资格。可以点击“我的”=&gt; “我参与的行动”=&gt;
                          “铸造行动激励”进行铸造。
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        )}
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
        <span className="font-bold">{!isExtensionAction ? '白名单' : '扩展合约'}:</span>
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

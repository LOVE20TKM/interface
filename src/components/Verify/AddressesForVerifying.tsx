import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import React, { useState, useEffect, useContext } from 'react';
import InfoTooltip from '@/src/components/Common/InfoTooltip';
import ManualPasteDialog from '@/src/components/Common/ManualPasteDialog';
import ManualCopyDialog from '@/src/components/Common/ManualCopyDialog';
import { copyWithToast } from '@/src/lib/clipboardUtils';
import { Clipboard, Copy } from 'lucide-react';

// my types & funcs
import { ActionInfo } from '@/src/types/love20types';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my hooks
import { useVerificationInfosByAction, useVerifiedAddressesByAction } from '@/src/hooks/contracts/useLOVE20RoundViewer';
import { useVerify, useScoreByActionIdByAccount } from '@/src/hooks/contracts/useLOVE20Verify';
import { useHandleContractError } from '@/src/lib/errorUtils';

// my components
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';

// my utils
import { LinkIfUrl } from '@/src/lib/stringUtils';
import { NavigationUtils } from '@/src/lib/navigationUtils';
import { formatPercentage } from '@/src/lib/format';

interface VerifyAddressesProps {
  currentRound: bigint;
  actionId: bigint;
  actionInfo: ActionInfo | undefined;
  remainingVotes: bigint;
}

const AddressesForVerifying: React.FC<VerifyAddressesProps> = ({
  currentRound,
  actionId,
  actionInfo,
  remainingVotes,
}) => {
  const { token } = useContext(TokenContext) || {};

  // 获取参与验证的地址
  const {
    verificationInfos,
    isPending: isPendingVerificationInfosByAction,
    error: errorVerificationInfosByAction,
  } = useVerificationInfosByAction(token?.address as `0x${string}`, currentRound, actionId);

  // 获取已验证地址的投票结果
  const {
    verifiedAddresses,
    isPending: isPendingVerifiedAddresses,
    error: errorVerifiedAddresses,
  } = useVerifiedAddressesByAction(token?.address as `0x${string}`, currentRound, actionId);

  // 获取已有弃权票数
  const {
    scoreByActionIdByAccount: existingAbstainVotes,
    isPending: isPendingAbstainVotes,
    error: errorAbstainVotes,
  } = useScoreByActionIdByAccount(
    token?.address as `0x${string}`,
    currentRound,
    actionId,
    '0x0000000000000000000000000000000000000000',
  );

  // 表单状态
  const [scores, setScores] = useState<{ [address: string]: string }>({});
  const [abstainScore, setAbstainScore] = useState<string>('0');
  const [showManualPasteDialog, setShowManualPasteDialog] = useState(false);
  const [showManualCopyDialog, setShowManualCopyDialog] = useState(false);
  const [copyText, setCopyText] = useState('');

  // 初始化打分值
  useEffect(() => {
    if (verificationInfos && verificationInfos.length > 0) {
      const initialScores: { [address: string]: string } = {};
      verificationInfos.forEach((info) => {
        initialScores[info.account] = '';
      });
      setScores(initialScores);
      setAbstainScore('');
    }
  }, [verificationInfos]);

  // 计算百分比
  const calculatePercentages = () => {
    const addressScores = Object.values(scores).map((val) => parseInt(val) || 0);
    const abstainScoreValue = parseInt(abstainScore) || 0;
    const totalScore = addressScores.reduce((sum, val) => sum + val, 0) + abstainScoreValue;

    if (totalScore === 0) return { addressPercentages: {}, abstainPercentage: 0 };

    const addressPercentages: { [address: string]: number } = {};
    Object.keys(scores).forEach((address) => {
      const score = parseInt(scores[address]) || 0;
      addressPercentages[address] = (score / totalScore) * 100;
    });
    const abstainPercentage = (abstainScoreValue / totalScore) * 100;

    return { addressPercentages, abstainPercentage };
  };

  const { addressPercentages, abstainPercentage } = calculatePercentages();

  // 计算已获得的验证票比例
  const calculateVerificationPercentages = () => {
    const verificationPercentages: { [address: string]: number } = {};
    const addressVerifiedVotes = verifiedAddresses?.reduce((acc, addr) => acc + addr.score, BigInt(0)) || BigInt(0);
    const totalVerifiedVotes = addressVerifiedVotes + (existingAbstainVotes || BigInt(0));

    if (totalVerifiedVotes > BigInt(0)) {
      verificationInfos?.forEach((info) => {
        const verifiedAddress = verifiedAddresses?.find((addr) => addr.account === info.account);
        const votes = verifiedAddress?.score || BigInt(0);
        verificationPercentages[info.account] = (Number(votes) / Number(totalVerifiedVotes)) * 100;
      });
    }

    return { verificationPercentages, totalVerifiedVotes };
  };

  const { verificationPercentages, totalVerifiedVotes } = calculateVerificationPercentages();

  // 处理分数变化
  const handleScoreChange = (address: string, value: string) => {
    // 只允许整数或0
    if (value === '' || /^[0-9]+$/.test(value)) {
      setScores({ ...scores, [address]: value });
    }
  };

  // 处理弃权分数变化
  const handleAbstainScoreChange = (value: string) => {
    // 只允许整数或0
    if (value === '' || /^[0-9]+$/.test(value)) {
      setAbstainScore(value);
    }
  };

  // 处理剪贴板粘贴（兼容手机钱包浏览器）
  const handlePasteScores = async () => {
    try {
      let clipboardText = '';
      let useManualPaste = false;

      // 检测是否为移动设备或特殊浏览器环境
      const isTrustWallet = /Trust/i.test(navigator.userAgent);

      // 尝试现代剪贴板API
      if (navigator.clipboard && navigator.clipboard.readText && !isTrustWallet) {
        try {
          // 检查权限
          const permission = await navigator.permissions.query({ name: 'clipboard-read' as PermissionName });
          if (permission.state === 'denied') {
            useManualPaste = true;
          } else {
            clipboardText = await navigator.clipboard.readText();
          }
        } catch (clipboardError) {
          console.warn('Clipboard API 读取失败:', clipboardError);
          useManualPaste = true;
        }
      } else {
        // 对于不支持现代API的浏览器或TrustWallet，直接使用手动粘贴
        useManualPaste = true;
      }

      // 如果需要手动粘贴，显示对话框
      if (useManualPaste || !clipboardText) {
        setShowManualPasteDialog(true);
        return;
      }

      // 处理剪贴板文本
      processClipboardText(clipboardText);
    } catch (error) {
      console.error('粘贴功能出错:', error);
      // 出错时也使用手动粘贴对话框
      setShowManualPasteDialog(true);
    }
  };

  // 处理剪贴板文本的通用函数
  const processClipboardText = (clipboardText: string) => {
    // 按行分割并清理空行
    const lines = clipboardText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '');

    // 验证每行是否为有效数字
    const numbers: string[] = [];
    for (const line of lines) {
      if (/^[0-9]+$/.test(line)) {
        numbers.push(line);
      } else if (line !== '') {
        toast.error(`无效的数字格式: "${line}"`);
        return;
      }
    }

    if (numbers.length === 0) {
      toast.error('没有找到有效的数字');
      return;
    }

    // 检查数字数量是否匹配地址数量
    const totalInputs = (verificationInfos?.length || 0) + 1; // +1 for abstain vote
    if (numbers.length > totalInputs) {
      toast.error(`数字过多，最多支持 ${totalInputs} 个数字`);
      return;
    }

    // 分配数字到各个输入框
    const newScores: { [address: string]: string } = { ...scores };
    let numberIndex = 0;

    // 为地址分配分数
    if (verificationInfos) {
      for (let i = 0; i < verificationInfos.length && numberIndex < numbers.length; i++) {
        const address = verificationInfos[i].account;
        newScores[address] = numbers[numberIndex];
        numberIndex++;
      }
    }

    // 如果还有剩余数字，分配给弃权票
    let newAbstainScore = abstainScore;
    if (numberIndex < numbers.length) {
      newAbstainScore = numbers[numberIndex];
    }

    // 更新状态
    setScores(newScores);
    setAbstainScore(newAbstainScore);

    toast.success(`成功粘贴 ${numbers.length} 个分数`);
  };

  // 复制当前所有分数到剪贴板（使用封装的工具函数）
  const handleCopyScores = async () => {
    try {
      const scoresList: string[] = [];

      // 收集所有地址的分数
      if (verificationInfos) {
        verificationInfos.forEach((info) => {
          const score = scores[info.account] || '0';
          scoresList.push(score);
        });
      }

      // 添加弃权票分数
      scoresList.push(abstainScore || '0');

      // 生成复制内容（每行一个分数）
      const textToCopy = scoresList.join('\n');

      // 使用封装的复制工具函数
      await copyWithToast(textToCopy, `已复制 ${scoresList.length} 个分数到剪贴板`, (text) => {
        // 当需要手动复制时，显示手动复制对话框
        setCopyText(text);
        setShowManualCopyDialog(true);
      });
    } catch (error) {
      console.error('复制功能出错:', error);
      toast.error('复制功能暂时不可用，请手动记录分数');
    }
  };

  // 处理键盘导航和快捷键
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentIndex: number) => {
    // Ctrl+V 或 Cmd+V 粘贴快捷键
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      e.preventDefault();
      handlePasteScores();
      return;
    }

    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const inputs = document.querySelectorAll('input[type="number"]:not([disabled])');
      const nextIndex = (currentIndex + 1) % inputs.length;
      const nextInput = inputs[nextIndex] as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    }
  };

  // 提交验证
  const { verify, isPending, isConfirming, isConfirmed, writeError: submitError } = useVerify();
  const checkInput = () => {
    if (remainingVotes <= BigInt(2)) {
      toast.error('剩余票数不足，无法验证');
      return false;
    }
    const allScoresZero =
      Object.values(scores).every((score) => parseInt(score) === 0 || score === '') &&
      (parseInt(abstainScore) === 0 || abstainScore === '');

    if (allScoresZero) {
      toast.error('请至少给一个地址或弃权投票打分');
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!checkInput()) {
      return;
    }

    // 获取打分总和
    const scoreSum =
      Object.values(scores).reduce((sum, score) => sum + (parseInt(score) || 0), 0) + (parseInt(abstainScore) || 0);

    console.log('-------handleSubmit()-------');
    console.log('scoreSum', scoreSum);

    // 使用BigInt进行精确计算，避免浮点数精度问题
    const scoresArrayForSubmit: bigint[] = [];
    let allocatedVotes = BigInt(0);
    const scoreSumBigInt = BigInt(scoreSum);

    // 计算每个地址的票数（使用BigInt避免精度丢失）
    for (let index = 0; index < verificationInfos.length; index++) {
      const info = verificationInfos[index];
      const score = parseInt(scores[info.account]) || 0;
      const scoreBigInt = BigInt(score);

      // 使用BigInt进行精确计算：votes = (remainingVotes * score) / scoreSum
      const votes = (remainingVotes * scoreBigInt) / scoreSumBigInt;

      // 确保不会超过剩余票数
      const safeVotes = allocatedVotes + votes > remainingVotes ? remainingVotes - allocatedVotes : votes;

      scoresArrayForSubmit.push(safeVotes);
      allocatedVotes += safeVotes;

      // 如果已经分配完所有票数，后续地址都分配0票
      if (allocatedVotes >= remainingVotes) {
        // 将剩余地址的票数设为0
        for (let i = index + 1; i < verificationInfos.length; i++) {
          scoresArrayForSubmit.push(BigInt(0));
        }
        break;
      }
    }

    // 计算地址总分配票数
    const scoresArrayTotal = scoresArrayForSubmit.reduce((sum, votes) => sum + votes, BigInt(0));

    // 确保总票数不超过剩余票数
    if (scoresArrayTotal > remainingVotes) {
      console.error('计算错误：分配票数超过剩余票数', {
        scoresArrayTotal: scoresArrayTotal.toString(),
        remainingVotes: remainingVotes.toString(),
      });
      toast.error('票数分配计算错误，请重试');
      return;
    }

    console.log('remainingVotes', remainingVotes);
    console.log('scoresArrayTotal', scoresArrayTotal);
    console.log('scoresArrayForSubmit', scoresArrayForSubmit);

    // 计算弃权票数 - 如果用户给弃权票打分，或者有剩余票数，都分配给弃权票
    // 这样确保所有剩余票数都会被分配，不会因为舍入丢失
    const currentAbstainVotes = remainingVotes - scoresArrayTotal;

    // 最终安全检查：确保弃权票数不为负数
    if (currentAbstainVotes < BigInt(0)) {
      console.error('计算错误：弃权票数为负数', {
        remainingVotes: remainingVotes.toString(),
        scoresArrayTotal: scoresArrayTotal.toString(),
        currentAbstainVotes: currentAbstainVotes.toString(),
      });
      toast.error('票数分配计算错误，请重试');
      return;
    }

    // 最终验证：确保总票数等于剩余票数
    const finalTotalVotes = scoresArrayTotal + currentAbstainVotes;
    if (finalTotalVotes !== remainingVotes) {
      console.error('最终检查失败：总票数不等于剩余票数', {
        finalTotalVotes: finalTotalVotes.toString(),
        remainingVotes: remainingVotes.toString(),
        scoresArrayTotal: scoresArrayTotal.toString(),
        currentAbstainVotes: currentAbstainVotes.toString(),
      });
      toast.error('票数分配不完整，请重试');
      return;
    }

    console.log('currentAbstainVotes', currentAbstainVotes);
    verify(token?.address as `0x${string}`, actionId, currentAbstainVotes, scoresArrayForSubmit);
  };

  // 提交成功
  useEffect(() => {
    if (isConfirmed && !submitError) {
      toast.success('提交成功', {
        duration: 2000, // 2秒
      });
      setTimeout(() => {
        NavigationUtils.reloadWithOverlay();
      }, 2000);
    }
  }, [isConfirmed, submitError]);

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (submitError) {
      handleContractError(submitError, 'verify');
    }
    if (errorVerificationInfosByAction) {
      handleContractError(errorVerificationInfosByAction, 'dataViewer');
    }
    if (errorVerifiedAddresses) {
      handleContractError(errorVerifiedAddresses, 'dataViewer');
    }
    if (errorAbstainVotes) {
      handleContractError(errorAbstainVotes, 'verify');
    }
  }, [submitError, errorVerificationInfosByAction, errorVerifiedAddresses, errorAbstainVotes]);

  // 渲染
  return (
    <>
      <div className="w-full max-w-2xl">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="pb-3 text-left text-sm text-greyscale-500">
                <div className="flex items-center gap-1">
                  被抽中的行动参与者
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
              </th>
              <th className="pb-3 text-left whitespace-nowrap w-16 text-sm text-greyscale-500">
                <div className="flex items-center gap-1">
                  打分
                  <button
                    onClick={handlePasteScores}
                    disabled={isPending || isConfirmed}
                    className="ml-1 p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                    title="粘贴分数数据（自动检测剪贴板或手动输入，每行一个数字）"
                  >
                    <Clipboard size={14} />
                  </button>
                  {/* InfoTooltip 保留代码但隐藏入口 */}
                  {false && (
                    <InfoTooltip
                      title="批量粘贴分数"
                      content={
                        <div className="leading-relaxed text-sm space-y-2">
                          <p>支持从剪贴板粘贴一列数字，自动分配到各个打分输入框。</p>
                          <p>
                            <strong>使用方法：</strong>
                          </p>
                          <ol className="list-decimal list-inside space-y-1 text-sm">
                            <li>复制一列数字到剪贴板（每行一个数字）</li>
                            <li>点击"粘贴"按钮或在输入框中按 Ctrl+V（Mac: Cmd+V）</li>
                            <li>数字将按顺序自动分配到各个地址的打分框中</li>
                            <li>如果有多余的数字，最后一个会分配给弃权票</li>
                          </ol>
                          <p className="text-gray-600">
                            <strong>示例格式：</strong>
                            <br />
                            10
                            <br />2<br />
                            23
                            <br />1
                          </p>
                        </div>
                      }
                    />
                  )}
                </div>
              </th>
              <th className="pb-3 text-center whitespace-nowrap w-14 text-sm text-greyscale-500">分配</th>
            </tr>
          </thead>
          <tbody>
            {isPendingVerificationInfosByAction && (
              <tr>
                <td colSpan={3} className="text-center py-4">
                  <LoadingIcon />
                </td>
              </tr>
            )}
            {verificationInfos && verificationInfos.length > 0 ? (
              verificationInfos.map((info, index) => (
                <tr key={info.account} className="border-b border-gray-100">
                  <td className="py-1">
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500 min-w-[4px]">{index + 1}</span>
                        <div className="font-mono">
                          <AddressWithCopyButton address={info.account} showCopyLast4Button={true} />
                        </div>
                      </div>
                      {actionInfo && (
                        <div className="text-sm text-greyscale-800 ml-3">
                          {actionInfo.body.verificationKeys.map((key, i) => (
                            <div key={i} className="mb-2">
                              <div className="text-xs font-semibold text-gray-600 mb-1">{key}:</div>
                              <div>
                                <LinkIfUrl text={info.infos[i]} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="py-1 w-16 px-1">
                    <div className="flex items-center text-left">
                      <input
                        type="number"
                        min="0"
                        value={scores[info.account] || ''}
                        placeholder="0"
                        onChange={(e) => handleScoreChange(info.account, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        tabIndex={index + 1}
                        className="w-10 px-1 py-1 border rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isPending || isConfirmed}
                      />
                      <span className="text-greyscale-500 text-xs">分</span>
                    </div>
                  </td>
                  <td className="py-1 text-center w-14 whitespace-nowrap px-1">
                    <div className="leading-tight">
                      <div className="text-sm text-greyscale-600 ">
                        {formatPercentage(addressPercentages[info.account] || 0)}
                      </div>
                      <div className="text-xs text-greyscale-500 ">
                        (当前{formatPercentage(verificationPercentages[info.account] || 0)})
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="text-center py-4">
                  暂无数据
                </td>
              </tr>
            )}
            {verificationInfos && (
              <tr>
                <td className="py-2">
                  <div className="text-left">
                    <div className="text-sm text-greyscale-800">
                      <span>弃权票数：</span>
                    </div>
                  </div>
                </td>
                <td className="py-2 w-16 px-1">
                  <div className="flex items-center text-left">
                    <input
                      type="number"
                      min="0"
                      value={abstainScore}
                      placeholder="0"
                      onChange={(e) => handleAbstainScoreChange(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, verificationInfos?.length || 0)}
                      tabIndex={(verificationInfos?.length || 0) + 1}
                      className="w-10 px-1 py-1 border rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isPending || isConfirmed}
                    />
                    <span className="text-greyscale-500 text-xs">分</span>
                  </div>
                </td>
                <td className="py-2 text-center w-14 whitespace-nowrap px-1">
                  <div className="text-greyscale-500 text-xs leading-tight">
                    <div>{formatPercentage(abstainPercentage)}</div>
                    <div>
                      (当前
                      {formatPercentage(
                        totalVerifiedVotes > BigInt(0)
                          ? (Number(existingAbstainVotes || BigInt(0)) / Number(totalVerifiedVotes)) * 100
                          : 0,
                      )}
                      )
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 复制分数按钮 */}
      <div className="mt-4 flex justify-center">
        <button
          onClick={handleCopyScores}
          disabled={isPending || isConfirmed}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          title="复制当前所有分数到剪贴板（每行一个分数）"
        >
          <Copy size={16} />
          复制当前分数
        </button>
      </div>

      <Button onClick={handleSubmit} disabled={isPending || isConfirming || isConfirmed} className="mt-6 w-1/2">
        {!isPending && !isConfirming && !isConfirmed && '提交验证'}
        {isPending && '提交中...'}
        {isConfirming && '确认中...'}
        {isConfirmed && '已验证'}
      </Button>

      <LoadingOverlay isLoading={isPending || isConfirming} text={isPending ? '提交交易...' : '确认交易...'} />

      {/* 手动粘贴对话框 */}
      <ManualPasteDialog
        isOpen={showManualPasteDialog}
        onClose={() => setShowManualPasteDialog(false)}
        onConfirm={processClipboardText}
        title="粘贴分数数据"
        description="请将复制的分数数据粘贴到下方文本框中（每行一个数字）"
        placeholder="请粘贴分数数据...&#10;例如：&#10;10&#10;20&#10;5&#10;0"
      />

      {/* 手动复制对话框 */}
      <ManualCopyDialog
        isOpen={showManualCopyDialog}
        onClose={() => setShowManualCopyDialog(false)}
        text={copyText}
        title="请手动复制分数"
        description="自动复制功能不可用，请选择以下文本并手动复制（每行一个分数）："
      />
    </>
  );
};

export default AddressesForVerifying;

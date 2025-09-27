'use client';

import React, { useContext, useState } from 'react';
import toast from 'react-hot-toast';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/router';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my components
import Header from '@/src/components/Header';
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const ExitedActionRewardsPage: React.FC = () => {
  const router = useRouter();
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();

  // 行动ID输入状态
  const [actionIdInput, setActionIdInput] = useState<string>('');

  // 处理行动ID输入跳转
  const handleActionIdNavigation = () => {
    if (!actionIdInput.trim()) {
      toast.error('请输入行动ID');
      return;
    }

    // 验证输入是否为有效数字
    const actionId = actionIdInput.trim();
    if (!/^\d+$/.test(actionId)) {
      toast.error('请输入有效的行动编号');
      return;
    }

    router.push(`/my/rewardsofaction?id=${actionId}`);
  };

  return (
    <>
      <Header title="查看行动激励" showBackButton={true} />
      <main className="flex-grow">
        {!token ? (
          <LoadingIcon />
        ) : (
          <div className="flex flex-col space-y-6 p-4">
            {/* <LeftTitle title="根据编号查看行动激励" /> */}

            {/* 行动ID输入框 */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex flex-col space-y-3">
                <label className="text-sm font-medium text-greyscale-700">查看某个行动的激励：</label>
                <div className="flex space-x-3">
                  <Input
                    type="text"
                    placeholder="请输入行动编号"
                    value={actionIdInput}
                    onChange={(e) => setActionIdInput(e.target.value)}
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleActionIdNavigation();
                      }
                    }}
                  />
                  <Button onClick={handleActionIdNavigation} className="text-white px-6">
                    确认
                  </Button>
                </div>
              </div>
            </div>

            {/* 说明文本 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-800">
                <p className="mb-2">
                  <strong>小贴士：</strong>
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>行动编号，是行动名称前面的No.号</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default ExitedActionRewardsPage;

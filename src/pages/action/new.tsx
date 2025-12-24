'use client';

import { useAccount, useChainId } from 'wagmi';
import { useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { validateVerificationRule, validateVerificationKey } from '@/src/lib/securityUtils';

// shadcn/ui
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// my hooks
import { useSubmitNewAction } from '@/src/hooks/contracts/useLOVE20Submit';
import { useHandleContractError } from '@/src/lib/errorUtils';
import { useCanSubmit } from '@/src/hooks/composite/useCanSubmit';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my components
import Header from '@/src/components/Header';
import AlertBox from '@/src/components/Common/AlertBox';
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';

// others
import { formatTokenAmount, parseUnits } from '@/src/lib/format';

// 获取环境变量
const MAX_VERIFICATION_KEY_BYTES = Number(process.env.NEXT_PUBLIC_MAX_VERIFICATION_KEY_LENGTH || '0');
const MAX_VERIFICATION_KEY_CHARS = Math.floor(MAX_VERIFICATION_KEY_BYTES / 3);

// 工具方法：按字符数与字节数进行统计
const getCharLength = (str: string) => Array.from(str).length;
const getUtf8ByteLength = (str: string) => new TextEncoder().encode(str).length;

/**
【创建行动 - 文字长度限制】
- 行动标题：最长20个汉字；
- 验证规则：最长1万字；
- 验证关键词/key：不能超过 process.env.NEXT_PUBLIC_MAX_VERIFICATION_KEY_LENGTH 个 bytes
- 验证提示：最长1000字；
 */

const FormSchema = z.object({
  actionName: z
    .string()
    .min(1, { message: '行动名称不能为空' })
    .refine((val) => getCharLength(val) <= 20, { message: '行动名称不能超过20个字' }),
  verificationRule: z
    .string()
    .min(1, { message: '验证规则不能为空' })
    .refine((val) => getCharLength(val) <= 10000, { message: '验证规则不能超过10000字' })
    .refine(
      (val) => {
        const validation = validateVerificationRule(val);
        return validation.isValid;
      },
      { message: '验证规则包含不安全的内容，请检查是否包含HTML标签、脚本代码或不安全的链接' },
    ),

  // 使用数组存储多组 key-value
  verificationPairs: z.array(
    z.object({
      key: z
        .string()
        .min(1, { message: '验证名称不能为空' })
        .refine(
          (val) => {
            if (!MAX_VERIFICATION_KEY_BYTES || Number.isNaN(MAX_VERIFICATION_KEY_BYTES)) return true;
            return getUtf8ByteLength(val) <= MAX_VERIFICATION_KEY_BYTES;
          },
          {
            message: `关键词最多${MAX_VERIFICATION_KEY_CHARS}个汉字或${MAX_VERIFICATION_KEY_BYTES}个英文数字`,
          },
        )
        .refine(
          (val) => {
            const validation = validateVerificationKey(val);
            return validation.isValid;
          },
          { message: '验证名称包含不安全的内容' },
        ),
      value: z
        .string()
        .min(1, { message: '验证信息提示不能为空' })
        .refine((val) => getCharLength(val) <= 1000, { message: '验证信息内容（value）不能超过1000字' })
        .refine(
          (val) => {
            const validation = validateVerificationRule(val);
            return validation.isValid;
          },
          { message: '验证信息内容包含不安全的内容' },
        ),
    }),
  ),

  rewardAddressCount: z
    .string()
    .min(1, { message: '验证地址数不能为空' })
    .refine((val) => Number(val) > 0, { message: '验证地址数必须大于0' }),

  minStake: z
    .string()
    .min(1, { message: '最小参与代币数不能为空' })
    .refine((val) => Number(val) > 0, { message: '最小参与代币数必须大于0' }),

  whiteListAddress: z
    .string()
    .optional()
    .refine(
      (val) => {
        // 如果为空或未定义，则通过校验
        if (!val || val.trim() === '') {
          return true;
        }
        // 如果非空，则必须是有效的 0x 地址格式
        return /^0x[a-fA-F0-9]{40}$/.test(val.trim());
      },
      { message: '白名单地址必须是有效的 0x 地址格式' },
    ),
});

type FormValues = z.infer<typeof FormSchema>;

export default function NewAction() {
  const chainId = useChainId();
  const { token } = useContext(TokenContext) || {};
  const router = useRouter();

  // 获取并验证 extension URL 参数
  const extension = router.query.extension as string | undefined;
  const isValidExtension = Boolean(
    extension &&
      typeof extension === 'string' &&
      /^0x[a-fA-F0-9]{40}$/.test(extension) &&
      extension.toLowerCase() !== '0x0000000000000000000000000000000000000000',
  );

  // 初始化表单
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      actionName: '',
      verificationRule: '',
      verificationPairs: [{ key: '', value: '' }], // 初始仅1组
      rewardAddressCount: '',
      minStake: '',
      whiteListAddress: '',
    },
    mode: 'onChange',
  });

  // 动态数组
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'verificationPairs',
  });

  // 当 extension 有效时，自动设置表单值
  useEffect(() => {
    if (isValidExtension) {
      form.setValue('rewardAddressCount', '1');
      form.setValue('minStake', '1');
      form.setValue('whiteListAddress', extension);
    }
  }, [isValidExtension, extension, form]);

  // 检查是否可以提交
  const {
    hasEnoughVotes,
    percentage: accountPercentage,
    validGovVotes,
    govData: totalGovVotes,
    SUBMIT_MIN_PERCENTAGE: SUBMIT_PERCENTAGE,
    isPending: isPendingSubmitCheck,
    error: errorSubmitCheck,
  } = useCanSubmit();

  // 提交表单
  const {
    submitNewAction,
    isPending: isSubmitting,
    isConfirming,
    isConfirmed: isSubmitted,
    writeError: submitError,
  } = useSubmitNewAction();
  const onSubmit = async (values: FormValues) => {
    // 检查是否有足够的治理票权
    if (!hasEnoughVotes) {
      const percentage = (SUBMIT_PERCENTAGE * 100).toFixed(2);
      form.setError('actionName', {
        type: 'manual',
        message: `有效治理票，须达到总治理票的${percentage}%，才能新建、推举行动（您当前有效治理票为${validGovVotes}，占比${(
          accountPercentage * 100
        ).toFixed(2)}%）`,
      });
      return;
    }

    // 拆分多组 key / value
    const verificationKeys = values.verificationPairs.map((p) => p.key);
    const verificationInfoGuides = values.verificationPairs.map((p) => p.value);

    const actionBody = {
      minStake: values.minStake ? parseUnits(values.minStake) : BigInt(0),
      maxRandomAccounts: values.rewardAddressCount ? BigInt(values.rewardAddressCount) : BigInt(0),
      whiteListAddress:
        values.whiteListAddress && values.whiteListAddress.trim() !== ''
          ? (values.whiteListAddress.trim() as `0x${string}`)
          : ('0x0000000000000000000000000000000000000000' as `0x${string}`),
      title: values.actionName,
      verificationRule: values.verificationRule,
      verificationKeys,
      verificationInfoGuides,
    };

    await submitNewAction(token?.address as `0x${string}`, actionBody);
  };

  // 提交成功后跳转
  useEffect(() => {
    if (isSubmitted) {
      router.push(`/vote/batch?symbol=${token?.symbol}`);
    }
  }, [isSubmitted, router, token?.symbol]);

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorSubmitCheck) {
      handleContractError(errorSubmitCheck, 'submit');
    }
    if (submitError) {
      handleContractError(submitError, 'submit');
    }
  }, [errorSubmitCheck, submitError, handleContractError]);

  return (
    <>
      <Header title="创建新行动" showBackButton={true} />
      <div className="max-w-xl p-4">
        {!hasEnoughVotes && validGovVotes !== undefined && totalGovVotes && (
          <AlertBox
            type="error"
            message={`有效治理票，须达到总治理票的${(SUBMIT_PERCENTAGE * 100).toFixed(
              1,
            )}%，才能新建、推举行动（您当前有效治理票为${formatTokenAmount(validGovVotes)}，占比${(
              accountPercentage * 100
            ).toFixed(2)}%））`}
            className="mb-4"
          />
        )}
        <LeftTitle title="创建新行动" />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
            {/* 行动名称 */}
            <FormField
              control={form.control}
              name="actionName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>行动名称</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="一句话说明行动"
                      className="!ring-secondary-foreground"
                      maxLength={32}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 验证规则 */}
            <FormField
              control={form.control}
              name="verificationRule"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>验证规则</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="验证者，会根据这个规则来打分"
                      rows={6}
                      className="!ring-secondary-foreground"
                      maxLength={10010}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ----------------------------
                多组 Key/Value (Card 样式)
            -----------------------------*/}
            <div>
              <FormLabel>报名参加行动时，行动者要提供的信息：</FormLabel>
              <div className="space-y-4 mt-2">
                {fields.map((item, index) => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        {/* Key + 删除按钮 */}
                        <div className="flex items-center space-x-2">
                          <FormField
                            control={form.control}
                            name={`verificationPairs.${index}.key`}
                            render={({ field }) => (
                              <FormItem className="flex-grow">
                                <FormControl>
                                  <Input
                                    type="text"
                                    placeholder="名称，比如 '微信昵称'"
                                    className="!ring-secondary-foreground"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            className="flex-shrink-0"
                            type="button"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {/* Value */}
                        <FormField
                          control={form.control}
                          name={`verificationPairs.${index}.value`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="提示信息，比如 '张三-8b6c'"
                                  className="!ring-secondary-foreground"
                                  maxLength={1010}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append({ key: '', value: '' })}
                  className="w-1/2 mt-2 border-secondary text-secondary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  添加验证信息
                </Button>
              </div>
            </div>

            {/* 激励地址数 */}
            <FormField
              control={form.control}
              name="rewardAddressCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>最大激励地址数</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="地址数必须大于0"
                      className="!ring-secondary-foreground disabled:bg-gray-200 disabled:text-gray-500 disabled:opacity-70"
                      autoComplete="off"
                      disabled={isValidExtension}
                      {...field}
                    />
                  </FormControl>
                  {isValidExtension && <FormDescription>由扩展地址自动设置为 1</FormDescription>}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 最小参与资产 */}
            <FormField
              control={form.control}
              name="minStake"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>最小参与代币数</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="最小参与代币数必须大于0"
                      className="!ring-secondary-foreground disabled:bg-gray-200 disabled:text-gray-500 disabled:opacity-70"
                      autoComplete="off"
                      disabled={isValidExtension}
                      {...field}
                    />
                  </FormControl>
                  {isValidExtension && <FormDescription>由扩展地址自动设置为 1</FormDescription>}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 白名单 */}
            <FormField
              control={form.control}
              name="whiteListAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>白名单</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="不填为不限"
                      className="!ring-secondary-foreground disabled:bg-gray-200 disabled:text-gray-500 disabled:opacity-70"
                      disabled={isValidExtension}
                      {...field}
                    />
                  </FormControl>
                  {isValidExtension && <FormDescription>由扩展地址自动设置</FormDescription>}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 提交按钮 */}
            <Button
              type="submit"
              disabled={isSubmitting || isConfirming || isSubmitted || !hasEnoughVotes || isPendingSubmitCheck}
              className="mt-4 w-full"
            >
              {isSubmitting ? '提交中...' : isConfirming ? '确认中...' : isSubmitted ? '已提交' : '提交'}
            </Button>
          </form>
        </Form>

        {/* 说明 */}
        <div className="bg-gray-100 text-greyscale-500 rounded-lg p-4 text-sm mt-4">
          <p className="mb-1">说明：</p>
          <p>1. 每个轮次，1个地址最多可以 创建/推举 1 个行动；</p>
          <p>2. 创建后，会自动推举该行动；</p>
        </div>
      </div>

      <LoadingOverlay isLoading={isSubmitting || isConfirming} text={isSubmitting ? '提交交易...' : '确认交易...'} />
    </>
  );
}

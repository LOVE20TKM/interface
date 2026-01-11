/**
 * 复合 Hook: 批量查询群名称可用性和铸造成本
 */

import { useReadContracts } from 'wagmi';
import { LOVE20GroupAbi } from '@/src/abis/LOVE20Group';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { validateGroupName } from '@/src/lib/groupNameValidator';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP as `0x${string}`;

interface UseGroupNameValidationParams {
  groupName: string;
  maxGroupNameLength?: number;
  enabled?: boolean;
}

export function useGroupNameValidation({
  groupName,
  maxGroupNameLength = 100,
  enabled = true,
}: UseGroupNameValidationParams) {
  // 前端验证
  const frontendValidation = validateGroupName(groupName, maxGroupNameLength);

  // 批量查询: isGroupNameUsed 和 calculateMintCost
  // 只有在前端验证通过时才执行链上查询
  const shouldQuery = enabled && !!groupName && frontendValidation.isValid;
  const { data, isPending, error } = useReadContracts({
    contracts: [
      {
        address: CONTRACT_ADDRESS,
        abi: LOVE20GroupAbi,
        functionName: 'isGroupNameUsed',
        args: [groupName],
      },
      {
        address: CONTRACT_ADDRESS,
        abi: LOVE20GroupAbi,
        functionName: 'calculateMintCost',
        args: [groupName],
      },
    ],
    query: {
      enabled: shouldQuery,
    },
  });

  // 解析结果
  const isGroupNameUsed = data?.[0]?.result as boolean | undefined;
  const mintCost = data?.[1]?.result ? safeToBigInt(data[1].result) : undefined;

  // 综合验证结果
  const isValid = frontendValidation.isValid && !isGroupNameUsed;
  let validationError = frontendValidation.error;

  if (frontendValidation.isValid && isGroupNameUsed) {
    validationError = '该群名称已被使用';
  }

  // 如果前端验证失败，不需要等待链上查询，isPending 应该为 false
  const finalIsPending = shouldQuery ? isPending : false;

  return {
    isValid,
    validationError,
    isGroupNameUsed,
    mintCost,
    isPending: finalIsPending,
    error,
  };
}

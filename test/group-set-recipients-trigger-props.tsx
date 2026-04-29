import React from 'react';

import _GroupSetRecipientsTrigger from '../src/components/Extension/Plugins/Group/_GroupSetRecipientsTrigger';

const tokenAddress = '0x0000000000000000000000000000000000000001' as const;

const minimalUsage = (
  <_GroupSetRecipientsTrigger tokenAddress={tokenAddress} actionId={1n} groupId={2n} />
);

const retentionUsage = (
  <_GroupSetRecipientsTrigger tokenAddress={tokenAddress} actionId={1n} groupId={2n} variant="retention" />
);

// @ts-expect-error extensionAddress must not be part of the GroupRecipients trigger API.
const rejectsExtensionAddress = <_GroupSetRecipientsTrigger tokenAddress={tokenAddress} actionId={1n} groupId={2n} extensionAddress={tokenAddress} />;

// @ts-expect-error actionTitle must be resolved internally from tokenAddress + actionId.
const rejectsActionTitle = <_GroupSetRecipientsTrigger tokenAddress={tokenAddress} actionId={1n} groupId={2n} actionTitle="错位标题" />;

// @ts-expect-error groupName must be resolved internally from groupId.
const rejectsGroupName = <_GroupSetRecipientsTrigger tokenAddress={tokenAddress} actionId={1n} groupId={2n} groupName="错位链群" />;

void minimalUsage;
void retentionUsage;
void rejectsExtensionAddress;
void rejectsActionTitle;
void rejectsGroupName;

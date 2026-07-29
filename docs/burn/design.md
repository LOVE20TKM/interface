# BSC公平发射前端设计

状态：产品边界已确认，待实现。

本页面接入一个有效 Burn 合约部署，让用户查看整个活动和各参与社区的锁定、销毁、得分及份额，并完成当前开放轮次的资产操作。合约行为以 `burn/src/Burn.sol` 和 `burn/src/interface/IBurn.sol` 为准，前端展示语言以 [GLOSSARY.md](./GLOSSARY.md) 为准。

## 1. 范围

首版包含：

- 在应用中心提供“BSC公平发射”入口。
- 展示活动状态、参与地址数、预计或最终份额及空投状态。
- 按参与社区和销毁轮次查看当前社区总计与个人统计。
- 永久锁定当前全部 SL 或 ST 余额。
- 领取当轮治理或行动激励，并按实际铸造激励使用销毁额度。
- 销毁治理激励对应的社区代币。
- 输入行动激励销毁总量，由前端按各行动剩余额度拆分后批量提交。
- 活动结束后领取可选同链空投。

首版不包含：

- 事件级逐笔历史。
- SL/ST 部分锁定。
- 跨社区数量合计。
- 跨类别数量合计。
- 代销毁、受益人或独立领取地址。
- 未配置同链空投代币时的外部分配流程。

## 2. 入口与配置

- 路由：`/apps/burn`。
- 入口与页面标题：`BSC公平发射`。
- 配置：`NEXT_PUBLIC_CONTRACT_ADDRESS_BURN`。
- 配置为有效非零地址时，应用中心显示入口。
- 未配置时隐藏入口；直接访问路由时显示“当前环境未配置BSC公平发射活动”。
- 页面代表整个 Burn 活动，不绑定单一 TokenContext 代币。

## 3. 页面状态

页面通过 Burn 的 `startRound`、`endRound`，以及同一协议部署的 Verify `currentRound` 判断状态：

只有 Verify `currentRound > 0` 时才计算候选开放轮次 `currentRound - 1`。`currentRound == 0` 时不得构造或向 `uint256` 查询传入负轮次，页面按“未开始”处理并默认预览 `startRound`。

| 状态 | 条件 | 默认轮次 | 操作 |
| --- | --- | --- | --- |
| 未开始 | 尚无开放销毁轮次 | `startRound` | 只读，展示当前资产余额 |
| 进行中 | `currentRound > 0`，且 `currentRound - 1` 在活动范围内并满足 `isRoundOpen` | 当前开放轮次 | 可操作 |
| 已结束 | 份额已最终确定 | 全部轮次（累计） | 只读，可领取空投 |

轮次下拉包含：

- `全部轮次（累计）`。
- 已开放过的活动轮次。
- 当前开放轮次。
- 未开始时用于预览的 `startRound`。

未来尚未开放的其他轮次不展示。用户选择历史轮次后，页面保持与当前轮次相同的四类数据结构，但不加载授权或交易操作。

## 4. 社区选择

Burn 的 `communitySymbols()` 与 `communities()` 按相同顺序给出构造时冻结的 symbol 和 Launch 解析地址。前端直接展示冻结 symbol，并用现有 `LOVE20TokenViewer.tokenDetails` 按地址批量补齐名称、SL 地址和 ST 地址。

默认社区：

1. 当前 TokenContext 代币属于参与社区时，选中该社区。
2. 否则选中 `scopeTokenAddress`。

社区选择器突出显示代币符号，只将名称中的 `@xxx` 后缀弱化显示，不重复展示与符号相同的名称前缀；当前选中值和下拉列表右侧都显示社区活动权重占比。参与社区的信息说明使用 `scopeTokenAddress` 对应的实际代币符号，说明各社区份额以活动开始前的流动性质押数量计算。切换社区只改变社区统计、个人统计和本轮操作，不改变跨社区总份额与空投状态。活动概况、社区选择器和轮次选择器标题均提供信息说明按钮。

## 5. 页面结构

```text
Header：BSC公平发射
副标题：销毁/锁定资产，获取代币空投份额

活动概况
  活动状态 / 起止轮次 / 参与地址数 / 额度倍数
  我的活动预估份额 / 我的活动最终份额
  空投状态

社区选择器（活动权重）     轮次选择器（截止本轮累计 / 活动累计）
  社区内我的份额 / 本社区为我贡献的全活动份额

本轮得分加成（具体轮次）

SL 凭证永久锁定
  社区累计数量与得分、我的累计数量与得分（时间范围由轮次选择和信息说明表达）
  我在本社区本类别的累计占比（本社区本类别 = 100%）
  本轮操作数据：余额、本次操作预计新增得分、授权或永久锁定

ST 凭证永久锁定
  同上

治理激励代币真实销毁
  同一套单轮或累计统计
  本轮操作数据：可领取激励或实际铸造激励、本轮额度、已用、剩余、销毁操作

行动激励代币真实销毁
  同一套单轮或累计统计
  本轮操作数据：逐行动激励与额度来源、总量输入、自动拆分明细、批量销毁

```

当前社区数据与“我的数据”不拆成两个标签页。四类资产分别展示，SL/ST 明确使用“永久锁定”，治理和行动激励明确使用“真实销毁”。“当前社区”只表示该社区在本次 Burn 活动中通过 Burn 获得计分的统计，不包含社区代币合约持有的历史 SL/ST 余额。

活动概况不展示“总销毁得分”或“我的销毁得分”。原始得分只在同一参与社区、同一资产类别的竞争池内具有比较意义；不同社区和不同类别的得分不能直接相加。跨池结果统一使用预计或最终份额表达。

## 6. 合约读取

### 6.1 活动级

| 内容 | 读取来源 |
| --- | --- |
| 范围代币 | `scopeTokenAddress()` |
| 范围代币 symbol | `scopeTokenSymbol()` |
| 空投代币 | `airdropTokenAddress()` |
| 空投代币元数据 | `airdropTokenAddress` 对应 ERC20 的 `symbol()`、`decimals()` |
| 活动轮次 | `startRound()`、`endRound()`、`roundCount()` |
| 额度倍数 | `quotaMultiplier()` |
| 参与社区 | `communities()` |
| 参与社区 symbol | `communitySymbols()` |
| 社区活动总权重 | `totalCommunityWeight()` |
| 参与地址数 | `participantsCount()` |
| 我的跨社区份额 | `accountShare(account)` |
| 我的空投状态 | `accountAirdropState(account)` |

未连接钱包时仍可读取公共数据，个人数据和操作区提示连接钱包。

### 6.2 截至具体轮次累计

| 内容 | Burn 读取 |
| --- | --- |
| 是否开放 | `isRoundOpen(round)` |
| 本轮得分系数 | `scoreMultiplier(tokenAddress, round)` |
| 当前社区截止轮次四类累计 | `communityBurnStatsThroughRound(tokenAddress, round)` |
| 我的截止轮次四类累计 | `accountBurnStatsThroughRound(account, tokenAddress, round)` |
| 治理激励与额度 | `govRewardBurnState(account, tokenAddress, round)` |
| 各行动激励与额度 | `actionRewardBurnStates(account, tokenAddress, round)` |

所有具体轮次都根据 `actionRewardBurnStates` 返回的 `actionId`，沿用现有行动查询能力补齐行动标题等展示信息。

累计数量、累计得分和本社区本类别累计占比使用同一个截止轮次；本社区本类别累计占比等于“我的截止轮次累计得分 ÷ 社区本类别截止轮次累计得分”。截止轮次累计由 Burn 合约通过稀疏检查点和二分查找直接返回，前端不得逐轮读取后临时求和。得分加成、治理激励额度和行动激励额度仍只读取所选单轮，并放在“本轮操作数据”中。

未开始预览和当前开放轮次都读取：

- 社区代币、SL、ST 的 `balanceOf(account)`。

仅当前开放轮次读取：

- 三种代币对 Burn 的 `allowance(account, burnAddress)`。

行动状态和行动标题作为独立数据区加载。`actionRewardBurnStates` 或标题查询失败时，仅行动区域显示错误和重试入口，不得阻塞活动概况、SL、ST、治理或累计数据；`actionId` 仍是额度的唯一链上来源标识。

### 6.3 当前社区份额概况与全部轮次（累计）

| 内容 | Burn 读取 |
| --- | --- |
| 当前社区四类累计 | `communityBurnStats(tokenAddress)` |
| 我的四类累计 | `accountBurnStats(account, tokenAddress)` |
| 本社区为我的全活动份额贡献 | `accountTokenShare(account, tokenAddress)` |
| 我的跨社区总份额 | `accountShare(account)` |

个人份额按其归属展示：

- “我的活动预估份额 / 我的活动最终份额”读取 `accountShare(account)`，明确以全活动为 100%，固定放在活动概况中。
- “社区内我的份额”把当前社区内部视为 100%，只让有正社区得分的活跃类别等分，再按 `accountBurnStats` 与 `communityBurnStats` 的类别得分占比计算，放在参与社区下方。
- “本社区为我贡献的全活动份额”读取 `accountTokenShare(account, tokenAddress).total`，明确以全活动为 100%，放在参与社区下方。
- 社区活动权重占比读取 `communityWeight(tokenAddress) / totalCommunityWeight()`，只显示在社区选择器的当前选中值和下拉项中。

页面所有独立数据项都提供信息说明按钮，包括活动状态与概况、空投状态、社区份额、轮次得分加成、四类资产数量与得分，以及余额、激励和额度明细。说明分别解释数据来源、计算口径和使用限制。

历史具体轮次展示截止该轮的累计数量、累计得分和本社区本类别累计占比，不展示两项社区级份额；活动概况中的个人活动份额不随轮次选择隐藏。活动中标记为“预估份额”，最终确定后标记为“最终份额”。社区活动权重占比只表示部署时冻结的相对权重；零得分社区不活跃时，最终有效社区份额会在活跃社区间重新归一化。四类得分保持独立展示，不新增跨类别累计得分。页面不额外显示“口径”文字，分母和时间范围由各数据的信息说明解释。

## 7. 当前轮次操作

本节的激励领取、凭证锁定和激励代币销毁操作仅在所选轮次满足 `isRoundOpen(round)` 时出现。交易发送前再次读取或校验轮次状态；交易确认后刷新余额、allowance、额度、统计和份额。活动结束后的 `claimAirdrop()` 不受本轮次门控限制，只依据最终份额和空投状态开放。

### 7.1 SL/ST 整笔永久锁定

页面直接显示当前全部余额，不提供数量输入。

每种凭证独立执行：

1. 余额为零时显示“无可锁定余额”。
2. allowance 不足时显示授权按钮。
3. 授权确认后，显示“永久锁定全部 SL”或“永久锁定全部 ST”。
4. 用户再次确认不可撤销风险后，分别调用：
   - `lockSLToken(tokenAddress, round, balance)`
   - `lockSTToken(tokenAddress, round, balance)`

授权与锁定不会自动连续发送。授权复用现有全局授权偏好，默认按当前余额精确授权。

### 7.2 治理激励销毁

`govRewardBurnState` 的展示规则：

- `claimableRewardAmount > 0` 且 `isClaimed = false`：显示预计可领取激励和“领取治理激励”；此时没有销毁额度。
- 领取交易调用现有 Mint `mintGovReward(tokenAddress, round)`。
- 领取确认后重新读取状态，只使用 `claimedRewardAmount` 作为实际铸造激励。
- 显示总额度、已销毁量和剩余额度：
  `unusedQuotaAmount = claimedRewardAmount * quotaMultiplier - burnedAmount`。

销毁数量输入默认为空，允许分次销毁并提供“最大”按钮：

```text
maxGovBurn = min(unusedQuotaAmount, communityTokenBalance)
```

allowance 足够后调用 `burnGovRewardToken(tokenAddress, round, amount)`。

### 7.3 行动激励销毁

每个 `ActionRewardBurnState` 独立展示：

- 行动编号和标题。
- 基础行动或受支持扩展行动。
- 预计可领取激励，或实际铸造激励。
- 总额度、已用额度、剩余额度。

未领取时，本页提供对应领取操作：

- 基础行动调用 Mint `mintActionReward(tokenAddress, round, actionId)`。
- 扩展行动调用该扩展的 `claimReward(round)`。
- 领取确认后重新读取 Burn 状态，不用领取前的预计值推算额度。

用户只输入当前社区的行动激励销毁总量。输入默认为空，并提供“最大”按钮；最大值为：

```text
maxActionBurn = min(
  sum(claimed action unusedQuotaAmount),
  communityTokenBalance
)
```

前端按 `actionId` 升序使用各行动的剩余额度：

```text
remaining = requestedAmount
for each claimed action with unused quota:
  allocated = min(remaining, action.unusedQuotaAmount)
  if allocated > 0:
    requests.push({ tokenAddress, actionId, amount: allocated })
  remaining -= allocated
  stop when remaining == 0
```

提交前展示每个行动的实际铸造激励、总额度、已用额度和本次占用。`remaining` 必须为零，requests 不得为空，合计数量不得超过钱包余额。allowance 足够后调用 `burnActionRewardTokens(round, requests)`。

同一社区、同一轮次的行动 ID 不改变销毁得分，因此自动拆分不会改变用户结果。

## 8. 本轮得分加成与得分预览

当前操作的预计得分使用链上 `scoreMultiplier(tokenAddress, round)`：

```text
estimatedScore = floor(amount * scoreMultiplier / 1e18)
```

具体轮次在社区和轮次选择器旁显示：

```text
bonusBps = floor((scoreMultiplier - 1e18) * 10000 / 1e18)
本轮得分加成百分比 = bonusBps / 100
```

信息说明同时展示用户可理解的计算公式：`本轮得分 = 销毁或锁定数量 × 链上得分系数 ÷ 10¹⁸`，`额外加成 =（链上得分系数 - 10¹⁸）÷ 10¹⁸ × 100%`。

`bonusBps` 使用 BigInt 先乘后除，避免提前除法造成整数截断；展示时最多保留两位小数并去掉末尾零，例如 `1950` 显示为 `19.5%`。当 `scoreMultiplier = 1.195e18` 时显示“本轮得分加成 +19.5%”，并用辅助说明解释：“本轮每投入 100 枚资产，按 119.5 分计入”。最后一轮显示“本轮得分加成 +0%”。累计视图不显示轮次加成。

同一社区、同一轮次的四类资产使用相同加成。“投入”同时覆盖凭证永久锁定和激励代币真实销毁，页面不使用“销毁加成”。

预览只说明本次操作会记录的得分，不承诺最终份额。活动进行中，其他地址参与、新类别首次激活或新社区成为活跃社区都会改变预估份额。

## 9. 空投状态与领取

空投区固定在活动概况中，不随社区或轮次切换。

- `airdropTokenAddress == 0`：显示“本活动未配置链上领取”。
- 已配置但份额未确定：显示预估份额和“活动结束后可领取”，不启用按钮。
- 已确定且可领取：显示 `accountAirdropState.claimableAmount` 和领取按钮。
- 已领取：显示 `claimedAmount` 和“已领取”。
- 最终份额或当前计算数量为零：显示“无可领取空投”。

领取调用 `claimAirdrop()`。页面必须将金额标为“当前可领取”，因为它按交易执行时 Burn 的空投代币余额和剩余未领取份额计算，不是固定个人额度。`claimableAmount` 和 `claimedAmount` 必须使用空投 ERC20 自身的 `decimals()` 格式化并附带 `symbol()`，不得假定为 18 位精度。

## 10. 交易与安全

- 所有授权复用 `useTokenApproval` 和用户现有授权偏好。
- 所有写操作复用 `useUniversalTransaction`，保留网络检查、模拟、错误解析和 TUKE 钱包兼容。
- 授权、领取激励、锁定或销毁、领取空投分别由用户确认，不自动串行发送多笔交易。
- SL/ST 锁定及激励销毁提交前使用确认对话框明确“不可撤销”。
- 交易进行中锁定相关控件，避免重复提交。
- receipt 确认后再更新成功状态，并失效所有受影响查询。
- 轮次在提交前已关闭时停止发送，提示用户刷新到最新轮次。

## 11. 页面状态与错误

必须覆盖：

- Burn 地址未配置或不是有效地址。
- 公共数据加载中或读取失败。
- 未连接钱包。
- 钱包网络不匹配。
- 当前代币不属于活动，自动回退范围代币。
- 活动未开始、进行中、已结束。
- 当前轮次在用户确认期间关闭。
- 无余额、无可领取激励、激励尚未领取、无剩余额度。
- 行动状态或行动标题读取失败时仅行动区域降级，其余区域保持可用。
- allowance 不足或授权尚未确认。
- 用户拒绝交易、模拟失败、合约自定义错误、receipt 失败。
- 空投未配置、未最终确定、无份额、可领取、已领取。

## 12. 最小实现边界

沿用现有仓库结构：

- `src/pages/apps/index.tsx`：增加配置控制的入口。
- `src/pages/apps/burn.tsx`：页面和最小必要的展示组件。
- `src/abis/Burn.ts`：由现有 ABI 生成流程生成的 Burn ABI。
- `src/hooks/contracts/useBurn.ts`：Burn 读取和写入封装。
- `src/lib/burnActionAllocation.ts`：行动销毁总量按独立行动额度拆分的纯函数。
- `src/lib/burnShare.ts`：按活跃类别和个人得分计算社区内部份额的纯函数。
- `src/lib/burnStats.ts`：四类数量与得分的前端类型定义。
- `src/config/tokenSwitchRoutes.ts`：登记 `/apps/burn`。
- `scripts/generateAbiTs.ts`：增加可选的 Burn ABI 目录和 `Burn` 文件生成配置。
- `test/burn-action-allocation.ts`：行动额度拆分测试。
- `test/burn-share.ts`：社区内部份额计算测试。
- `package.json`：将两项 Burn 纯函数测试加入 `yarn test`。
- 环境文件：增加 `NEXT_PUBLIC_CONTRACT_ADDRESS_BURN` 和 `NEXT_PUBLIC_FOUNDRY_BURN_ABI_PATH`。
- 错误映射和 selector 文件：纳入 Burn 自定义错误。

行动额度拆分测试至少覆盖空输入、单行动、多行动、额度不足、零额度跳过和稳定排序，且必须由 `yarn test` 自动执行。除该纯函数外，除非页面实现已经难以阅读，否则不预先增加 composite hook 或额外组件目录。

## 13. 最小验收

1. 未配置 Burn 地址时应用入口隐藏，直接访问显示未配置状态。
2. 配置后可读取活动、社区和默认轮次；当前代币不在社区列表时回退范围代币；`yarn generate:abi` 可以从 Burn Foundry 产物重复生成 `src/abis/Burn.ts`。
3. 未开始、开放、历史、累计和已结束状态选择正确；Verify `currentRound == 0` 时不构造负轮次；未开始时展示当前社区代币、SL 和 ST 余额但不读取 allowance 或提供操作。
4. 具体轮次通过合约单次读取展示从活动开始截止该轮的累计数量、累计得分和本社区本类别累计占比，不按轮次循环查询；历史轮次不展示社区级份额，社区活动权重占比只放在社区选择器中。
5. SL/ST 不出现数量输入，授权和整笔锁定必须分别确认。
6. 未领取激励不产生额度；领取确认后按实际铸造量刷新额度。
7. 治理最大销毁量同时受剩余额度和钱包余额约束。
8. 行动总量能稳定拆分到多个独立额度，合计严格等于输入量；相关测试由 `yarn test` 自动执行。
9. 当前及历史具体轮次都能展示行动标题；行动状态或标题读取失败不阻塞其他区域。
10. 历史轮次和累计视图不出现授权、锁定或销毁按钮。
11. 活动结束前显示预估份额，结束后显示最终份额。
12. 空投未配置、未开放、可领取和已领取状态正确；非 18 位空投代币按其自身 symbol 和 decimals 显示。
13. 具体轮次使用先乘后除的基点计算正确显示本轮得分加成和等价得分示例，累计视图不显示加成。
14. 活动概况不跨社区或跨类别汇总原始得分。
15. 桌面与移动端无文本溢出、控件重叠或布局跳动。
16. 页面每个独立数据项都有可点击的信息说明按钮，桌面端使用弹窗、移动端使用抽屉展示说明。
17. 社区当前选中值和下拉项都使用突出符号、弱化 `@xxx` 后缀和右侧活动权重占比；活动概况、参与社区和轮次均有信息说明按钮。
18. 轮次选择器明确时间范围；页面不重复展示资产统计时间标题，四类数据项统一使用“累计数量”和“累计得分”。
19. 个人活动总份额位于活动概况中，两项社区级份额位于参与社区下方；活动结束前总份额标记为预估份额，结束后标记为最终份额，界面不额外显示“口径”文字。

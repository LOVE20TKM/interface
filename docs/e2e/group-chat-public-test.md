# Group Chat public_test E2E

This E2E test drives the real frontend against the public_test contracts on
Thinkium chain `70001`.

It intentionally does not automate a browser-extension wallet UI. Instead, it
injects an EIP-1193 provider into the browser and signs transactions with a
local Foundry keystore. The transaction is still sent to the real
`NEXT_PUBLIC_THINKIUM_RPC_URL` from `.env.public_test`.

## Run

```bash
yarn e2e:group-chat:public-test
```

The script opens a temporary local credential page on `127.0.0.1` and asks for:

- Shared keystore password for the default `dev1`, `dev2`, `dev3`, `dev4`
  Foundry wallets

The password is posted only to the current local Node process. It is kept in
process memory only, not written to a file, passed through argv, or printed.

Optional environment variables:

```bash
HEADLESS=0 yarn e2e:group-chat:public-test
```

The default four-wallet coverage can be overridden with comma-separated Foundry
keystore names. The script will require every wallet to have a default LOVE20
NFT and public_test native token balance. The primary wallet also needs enough
first-token balance to mint a fresh chain-group NFT.

```bash
PUBLIC_TEST_KEYSTORES=dev1,dev2,dev3,dev4 PUBLIC_TEST_KEYSTORE_PASSWORD='dev' yarn e2e:group-chat:public-test
```

`PUBLIC_TEST_KEYSTORES` must contain at least four different wallets so the
owner, mention target, admin, and delegate paths are verified with separate
addresses.

The script creates a fresh chain group each run, so it does not depend on
historical public_test chat state. By default, the minted chain-group NFT name
includes the script name, local-time timestamp with timezone offset, and a
random suffix, for example `groupChatPublicTest-20260604T203456+0800-a1b2c3`.

## What It Verifies

1. Loads `.env.public_test`.
2. Unlocks the selected Foundry keystores locally.
3. Uses the primary wallet to mint a fresh chain-group NFT.
4. Activates that chain group as a chat with member-list posting scope and
   admin-managed ban source.
5. Adds all selected default NFTs to the member list.
6. Adds a non-primary default NFT to the admin list.
7. Sets a non-primary default NFT as the group delegate, then asserts
   `delegateIdOf` and `ownerOrDelegateIdOf`.
8. Bans and unbans one member NFT as the owner, asserting `canPost` changes
   accordingly.
9. Bans and unbans one member NFT as the delegate, asserting delegate
   moderation authority.
10. Starts a Next dev server with public_test env and `/interface-test` basePath.
11. Opens `/interface-test/chat/group`.
12. Connects the injected wallet through wagmi's injected connector.
13. Sends `GroupChat.postAsDefaultSender(...)` from the UI for each non-primary
   wallet and verifies each wallet's chain `senderAddress` and default NFT
   `senderId`.
14. Uses the configured admin wallet to send `@全部` and asserts
    `mentionAll=true`.
15. Uses the configured delegate wallet to send `@全部` and asserts
    `mentionAll=true`.
16. Uses the primary owner wallet to send `@全部` and asserts
    `mentionAll=true`.
17. Uses the primary wallet to click another wallet's message menu and add a
    mention plus quote from the UI.
18. Sends one quoted reply from the primary wallet and asserts the real
    `GroupChat` contract recorded the expected other-wallet
    `mentionedSenderIds`, `mentionAll=false`, and `quotedMessageId`.

## Requirements

- Every selected account has public_test native token balance.
- Every selected account has a default LOVE20 NFT.
- The primary selected account has enough first-token balance to mint one
  chain-group NFT.
- `.env.public_test` configures GroupChat, GroupAdmin, GroupMember, GroupBanList,
  GroupMemberScope, AdminBanSource, GroupDefaults, Group, and first-token
  addresses. The GroupDelegate address is read from `GroupChat`.
- At least four different selected wallet addresses are required.
- Playwright browsers are installed for the local environment.

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

- Foundry keystore name, for example `dev1`
- Keystore password

The password is posted only to the current local Node process. It is kept in
process memory only, not written to a file, passed through argv, or printed.

Optional environment variables:

```bash
PUBLIC_TEST_GROUP_ID=123 yarn e2e:group-chat:public-test
HEADLESS=0 yarn e2e:group-chat:public-test
```

For local debugging only, the prompt can be bypassed:

```bash
PUBLIC_TEST_KEYSTORE=dev1 PUBLIC_TEST_KEYSTORE_PASSWORD='...' yarn e2e:group-chat:public-test
```

If `PUBLIC_TEST_GROUP_ID` is not set, the script reads the wallet's default
LOVE20 NFT and scans recent public_test chat groups for one where that identity
can post.

## What It Verifies

1. Loads `.env.public_test`.
2. Unlocks the selected Foundry keystore locally.
3. Starts a Next dev server with public_test env and `/interface-test` basePath.
4. Opens `/interface-test/chat/group`.
5. Connects the injected wallet through wagmi's injected connector.
6. Sends `GroupChat.postAsDefaultSender(...)` from the UI.
7. Waits for the frontend to show the message.
8. Reads the real `GroupChat` contract and asserts the message is on-chain.

## Requirements

- The selected account has public_test native token balance.
- The selected account has a default LOVE20 NFT.
- The selected account can post in either `PUBLIC_TEST_GROUP_ID` or one of the
  most recent public_test chat groups.
- Playwright browsers are installed for the local environment.

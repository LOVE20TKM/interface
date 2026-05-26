import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

import LoadingIcon from '@/src/components/Common/LoadingIcon';
import { useMyGroupsPage, type GroupNFT } from '@/src/hooks/extension/base/composite/useMyGroups';
import { useGroupChatActivationStatusMap } from '@/src/hooks/contracts/useGroupChat';
import { buildMintGroupHref } from '@/src/lib/myGroupsPage';

const NFT_PAGE_SIZE = 100;

export function ChainGroupNftPicker({
  account,
  onActivate,
  onOpen,
}: {
  account: `0x${string}` | undefined;
  onActivate: (group: GroupNFT) => void;
  onOpen: (groupId: bigint) => void;
}) {
  const router = useRouter();
  const [loadedNftLimit, setLoadedNftLimit] = useState(NFT_PAGE_SIZE);
  const listRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);
  const {
    myGroups,
    balance,
    hasMore,
    loadedCount,
    isPending,
    error,
  } = useMyGroupsPage(account, loadedNftLimit, 'recent');
  const loadedGroupIds = useMemo(() => myGroups.map((group) => group.tokenId), [myGroups]);
  const {
    activationStatusMap,
    isPending: isActivationStatusPending,
    error: activationStatusError,
  } = useGroupChatActivationStatusMap(loadedGroupIds, loadedGroupIds.length > 0);
  const mintGroupHref = useMemo(() => buildMintGroupHref(router.asPath || '/chat'), [router.asPath]);
  const isInitialLoading = isPending && myGroups.length === 0;
  const expectedLoadedCount = Math.min(loadedNftLimit, Number(balance));

  useEffect(() => {
    setLoadedNftLimit(NFT_PAGE_SIZE);
  }, [account]);

  useEffect(() => {
    if (!isPending && (loadedCount >= expectedLoadedCount || !hasMore)) {
      loadingMoreRef.current = false;
    }
  }, [expectedLoadedCount, hasMore, isPending, loadedCount]);

  const loadMore = () => {
    if (!hasMore || isPending || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadedNftLimit((prev) => prev + NFT_PAGE_SIZE);
  };

  useEffect(() => {
    const root = listRef.current;
    const target = loadMoreRef.current;
    if (!root || !target || typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMore();
        }
      },
      {
        root,
        rootMargin: '0px 0px 96px',
        threshold: 0.01,
      },
    );
    observer.observe(target);

    return () => observer.disconnect();
  }, [hasMore, isPending, myGroups.length]);

  return (
    <div className="chain-nft-picker">
      <div className="conversation-section-label chain-nft-picker-head">
        <strong>选择要激活群聊的 NFT</strong>
        {account && (
          <span className="chain-nft-count">
            {loadedCount.toString()} / {balance.toString()}
          </span>
        )}
      </div>

      {!account ? (
        <div className="empty-state">连接钱包后显示你持有的 LOVE20 NFT。</div>
      ) : error ? (
        <div className="notice-row permission-warn">
          NFT 列表加载失败：{error instanceof Error ? error.message : '请检查网络后重试'}
        </div>
      ) : isInitialLoading ? (
        <div className="empty-state">
          <span className="cannot-post-inline">
            <LoadingIcon />
            正在读取当前钱包的 NFT...
          </span>
        </div>
      ) : balance === BigInt(0) ? (
        <div className="empty-state">
          <strong>当前钱包还没有 LOVE20 NFT。</strong>
          <span>先铸造一个 NFT，再回来激活它对应的链群。</span>
          <div className="chain-nft-empty-actions">
            <Link className="sheet-button inline-flex" href={mintGroupHref}>
              去铸造 NFT
            </Link>
          </div>
        </div>
      ) : (
        <div className="chain-nft-list" ref={listRef} role="list" aria-label="当前钱包持有的 LOVE20 NFT">
          {activationStatusError && (
            <div className="notice-row permission-warn">
              激活状态加载失败：{activationStatusError instanceof Error ? activationStatusError.message : '请检查网络后重试'}
            </div>
          )}
          {myGroups.map((group) => {
            const activated = activationStatusMap.get(group.tokenId.toString());
            const isStatusPending = activated === undefined && isActivationStatusPending;
            return (
              <article
                key={group.tokenId.toString()}
                role="listitem"
                className="chain-nft-option chain-nft-row inline-flex"
              >
                <span className="chain-nft-main">
                  <span className="chain-nft-copy">
                    <span className="chain-nft-title">
                      <span className="chain-nft-id">#{group.tokenId.toString()}</span>
                      <span className="chain-nft-name">{group.groupName || '未命名链群'}</span>
                    </span>
                  </span>
                </span>
                <span className="chain-nft-status-area">
                  {activated === true ? (
                    <button className="sheet-button activation-enter-button inline-flex chain-nft-activate-button" type="button" onClick={() => onOpen(group.tokenId)}>
                      进入
                    </button>
                  ) : activated === false ? (
                    <button className="sheet-button primary inline-flex chain-nft-activate-button" type="button" onClick={() => onActivate(group)}>
                      激活
                    </button>
                  ) : (
                    <button className="sheet-button inline-flex chain-nft-activate-button" type="button" disabled>
                      {isStatusPending ? '读取中' : '状态未知'}
                    </button>
                  )}
                </span>
              </article>
            );
          })}
          <div className="chain-nft-load-more" ref={loadMoreRef}>
            {hasMore ? (
              <button className="sheet-button inline-flex chain-nft-load-button" type="button" onClick={loadMore} disabled={isPending}>
                {isPending ? '加载更多 NFT...' : '加载更多 NFT'}
              </button>
            ) : (
              <span>已获取全部 NFT</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

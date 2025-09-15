import { useEffect } from 'react';
import { NavigationUtils } from '../lib/navigationUtils';

/**
 * 页面恢复Hook - 用于检测和处理iOS WebView页面白屏问题
 * 应该在主要页面组件中使用
 */
export function usePageRecovery() {
  useEffect(() => {
    // 页面加载完成后检测白屏问题
    const checkBlankPage = () => {
      NavigationUtils.checkAndHandleBlankPage();
    };

    // 延迟执行，确保页面完全加载
    const timer = setTimeout(checkBlankPage, 2000);

    // 清理定时器
    return () => {
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    // 在路由变化时也进行检测
    const handleRouteChange = () => {
      setTimeout(() => {
        NavigationUtils.checkAndHandleBlankPage();
      }, 1000);
    };

    // 监听路由变化（通过popstate事件）
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);
}
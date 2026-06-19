const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pagesDir = path.join(root, 'src/pages');
const configPath = path.join(root, 'src/config/tokenSwitchRoutes.ts');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : fullPath;
  });
}

function pagePathToRoute(file) {
  const relative = path.relative(pagesDir, file).replace(/\\/g, '/').replace(/\.(tsx|ts)$/, '');
  if (relative.startsWith('_') || relative === '404') return null;
  const route = `/${relative.replace(/\/index$/, '')}`;
  return route === '/index' ? '/' : route;
}

function extractSection(source, start, end) {
  const startIndex = source.indexOf(start);
  if (startIndex === -1) return '';
  const endIndex = source.indexOf(end, startIndex);
  return endIndex === -1 ? source.slice(startIndex) : source.slice(startIndex, endIndex);
}

function extractQuotedRoutes(source) {
  const routes = new Set();
  const routePattern = /['"]((?:\/[A-Za-z0-9_-]+)+|\/)['"]/g;
  let match;
  while ((match = routePattern.exec(source))) routes.add(match[1]);
  return routes;
}

function extractRedirectSourceRoutes(source) {
  const routes = new Set();
  const routePattern = /['"]((?:\/[A-Za-z0-9_-]+)+|\/)['"]\s*:/g;
  let match;
  while ((match = routePattern.exec(source))) routes.add(match[1]);
  return routes;
}

function extractRedirectTargetRoutes(source) {
  const routes = new Set();
  const routePattern = /:\s*['"]((?:\/[A-Za-z0-9_-]+)+|\/)['"]/g;
  let match;
  while ((match = routePattern.exec(source))) routes.add(match[1]);
  return routes;
}

const pageRoutes = new Set(
  walk(pagesDir)
    .filter((file) => /\.(tsx|ts)$/.test(file))
    .map(pagePathToRoute)
    .filter(Boolean),
);

const configSource = fs.readFileSync(configPath, 'utf8');
const defaultSection = extractSection(configSource, 'export const defaultTokenSwitchRoutes', '} as const;');
const defaultSourceSection = extractSection(configSource, 'export const tokenSwitchDefaultRoutes', '] as const;');
const staySection = extractSection(configSource, 'export const tokenSwitchStayRoutes', '] as const;');
const redirectSection = extractSection(configSource, 'export const tokenSwitchRedirectRoutes', '} as const;');
const defaultSourceRoutes = extractQuotedRoutes(defaultSourceSection);
const stayRoutes = extractQuotedRoutes(staySection);
const redirectSourceRoutes = extractRedirectSourceRoutes(redirectSection);
const configRoutes = new Set([...defaultSourceRoutes, ...stayRoutes, ...redirectSourceRoutes]);
const targetRoutes = new Set([...extractQuotedRoutes(defaultSection), ...extractRedirectTargetRoutes(redirectSection)]);
const ignoredRoutes = new Set(['/404']);

const duplicateRoutes = [...pageRoutes]
  .filter((route) => {
    const matches = [
      defaultSourceRoutes.has(route),
      stayRoutes.has(route),
      redirectSourceRoutes.has(route),
    ].filter(Boolean).length;
    return matches > 1;
  })
  .sort();
const missing = [...pageRoutes].filter((route) => !configRoutes.has(route) && !ignoredRoutes.has(route)).sort();
const staleSources = [...configRoutes].filter((route) => !pageRoutes.has(route) && !ignoredRoutes.has(route)).sort();
const staleTargets = [...targetRoutes].filter((route) => !pageRoutes.has(route) && !ignoredRoutes.has(route)).sort();

if (duplicateRoutes.length || missing.length || staleSources.length || staleTargets.length) {
  if (duplicateRoutes.length) {
    console.error('代币切换路由配置重复:');
    duplicateRoutes.forEach((route) => console.error(`  ${route}`));
  }
  if (missing.length) {
    console.error('缺少代币切换路由配置:');
    missing.forEach((route) => console.error(`  ${route}`));
  }
  if (staleSources.length) {
    console.error('代币切换配置包含不存在页面:');
    staleSources.forEach((route) => console.error(`  ${route}`));
  }
  if (staleTargets.length) {
    console.error('代币切换跳转目标不存在:');
    staleTargets.forEach((route) => console.error(`  ${route}`));
  }
  process.exit(1);
}

console.log(`代币切换路由配置已覆盖 ${pageRoutes.size} 个页面。`);

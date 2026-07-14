import type { CleanupTargetDefinition } from '../../shared/cleanup-types'

/**
 * White-listed cleanup targets. Only entries here are ever scanned or cleaned —
 * v1 never accepts free-form paths. Keep paths read-only-safe (caches that apps
 * regenerate) and reserve `caution` for anything that could surprise the user.
 */
export const cleanupRegistry: CleanupTargetDefinition[] = [
  // ---- Developer caches (regenerated on demand) ----
  {
    id: 'npm-cache',
    category: 'developer',
    title: { zh: 'NPM 缓存', en: 'NPM Cache' },
    description: {
      zh: 'Node 包缓存目录，删除后会自动重建。',
      en: 'Node package cache directory; rebuilt automatically.'
    },
    paths: ['~/.npm'],
    riskLevel: 'safe',
    cleanupMode: 'trash'
  },
  {
    id: 'pip-cache',
    category: 'developer',
    title: { zh: 'pip 缓存', en: 'pip Cache' },
    description: {
      zh: 'Python pip 下载缓存，删除后会自动重建。',
      en: 'Python pip download cache; rebuilt automatically.'
    },
    paths: ['~/.cache/pip'],
    riskLevel: 'safe',
    cleanupMode: 'trash'
  },
  {
    id: 'homebrew-downloads',
    category: 'developer',
    title: { zh: 'Homebrew 下载缓存', en: 'Homebrew Downloads' },
    description: {
      zh: 'Homebrew 已下载的安装包缓存。',
      en: 'Cached Homebrew downloaded bottles/packages.'
    },
    paths: ['~/Library/Caches/Homebrew/downloads'],
    riskLevel: 'safe',
    cleanupMode: 'trash'
  },
  {
    id: 'playwright-browsers',
    category: 'developer',
    title: { zh: 'Playwright 浏览器', en: 'Playwright Browsers' },
    description: {
      zh: 'Playwright 下载的测试浏览器；清理后下次运行会重新下载。',
      en: 'Playwright-downloaded test browsers; re-downloaded on next run.'
    },
    paths: ['~/Library/Caches/ms-playwright'],
    riskLevel: 'safe',
    cleanupMode: 'trash'
  },
  {
    id: 'xcode-derived-data',
    category: 'developer',
    title: { zh: 'Xcode DerivedData', en: 'Xcode DerivedData' },
    description: {
      zh: 'Xcode 的可再生构建缓存，删除后下次构建会重新生成。',
      en: 'Regenerable Xcode build data; recreated by the next build.'
    },
    paths: ['~/Library/Developer/Xcode/DerivedData'],
    riskLevel: 'safe',
    cleanupMode: 'trash'
  },
  {
    id: 'coresimulator-caches',
    category: 'developer',
    title: { zh: 'iOS 模拟器缓存', en: 'iOS Simulator Caches' },
    description: {
      zh: 'CoreSimulator 的可再生缓存，不包含模拟器设备数据或运行时。',
      en: 'Regenerable CoreSimulator caches; excludes device data and runtimes.'
    },
    paths: ['~/Library/Developer/CoreSimulator/Caches'],
    riskLevel: 'safe',
    cleanupMode: 'trash'
  },

  // ---- Browser caches ----
  {
    id: 'chrome-cache',
    category: 'browsers',
    title: { zh: 'Chrome 缓存', en: 'Chrome Cache' },
    description: {
      zh: 'Chrome 浏览器缓存目录。',
      en: 'Chrome browser cache directory.'
    },
    paths: ['~/Library/Caches/Google/Chrome'],
    riskLevel: 'safe',
    cleanupMode: 'trash'
  },
  {
    id: 'edge-cache',
    category: 'browsers',
    title: { zh: 'Edge 缓存', en: 'Edge Cache' },
    description: {
      zh: 'Microsoft Edge 浏览器缓存目录。',
      en: 'Microsoft Edge browser cache directory.'
    },
    paths: ['~/Library/Caches/Microsoft Edge'],
    riskLevel: 'safe',
    cleanupMode: 'trash'
  },

  // ---- App updater residue ----
  {
    id: 'sparkle-installation',
    category: 'app_updates',
    title: { zh: 'Sparkle 更新残留', en: 'Sparkle Update Residue' },
    description: {
      zh: 'Sparkle 框架遗留的更新安装包（如微信等）。谨慎清理。',
      en: 'Sparkle updater leftover install packages (e.g. WeChat). Clean with care.'
    },
    paths: ['~/Library/Caches/com.tencent.xinWeChat/org.sparkle-project.Sparkle/Installation'],
    riskLevel: 'caution',
    cleanupMode: 'trash'
  },
  {
    id: 'shipit-residue',
    category: 'app_updates',
    title: { zh: 'ShipIt 更新残留', en: 'ShipIT Update Residue' },
    description: {
      zh: 'Squirrel/ShipIt 自动更新器的工作残留。',
      en: 'Squirrel/ShipIT auto-updater working residue.'
    },
    paths: ['~/Library/Caches/ShipIt'],
    riskLevel: 'safe',
    cleanupMode: 'trash'
  },

  // ---- Docker (command-driven; size discovered at clean time) ----
  {
    id: 'docker-builder-cache',
    category: 'docker',
    title: { zh: 'Docker 构建缓存', en: 'Docker Build Cache' },
    description: {
      zh: '运行 docker builder prune 清理构建缓存。需要 Docker 正在运行。',
      en: 'Runs docker builder prune to clear build cache. Requires Docker to be running.'
    },
    paths: [],
    command: ['docker', 'builder', 'prune', '-f'],
    riskLevel: 'safe',
    cleanupMode: 'command'
  }
]

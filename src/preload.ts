import { existsSync, readdirSync } from 'fs'
import { homedir } from 'os'
import path, { extname } from 'path'
import { execCommand, spawnCommand } from 'utools-utils/preload'
import AppInfo from '@/models/AppInfo'

const baseRecentsDir = `${homedir()}/Library/Application Support/com.apple.sharedfilelist/`
const appsRecentsDir =
  baseRecentsDir + 'com.apple.LSSharedFileList.ApplicationRecentDocuments/'

function getRecentsDir(isFinder: boolean) {
  return isFinder ? baseRecentsDir : appsRecentsDir
}

function existsSflFile(sflFileName: string, isFinder: boolean) {
  const p = getRecentsDir(isFinder) + sflFileName + '.sfl'
  return existsSync(p + 2) || existsSync(p + 3)
}

function getSflFile(sflFileName: string, isFinder: boolean) {
  const p = getRecentsDir(isFinder) + sflFileName + '.sfl'
  if (existsSync(p + 3)) return p + 3
  return p + 2
}

function getScript(sflFile: string) {
  return `
    ObjC.import('Foundation')
    const paths = []
    const data = $.NSData.dataWithContentsOfFile('${sflFile}')
    const document = $.NSKeyedUnarchiver.unarchiveObjectWithData(data)
    const items = document.objectForKey('items')
    const keys = ObjC.wrap([$.NSURLPathKey])
    for (let i = 0; i < items.count; i++) {
      try {
        const item = items.objectAtIndex(i)
        const bookmark = item.objectForKey('Bookmark')
        const dict = $.NSURL.resourceValuesForKeysFromBookmarkData(keys, bookmark)
        const path = dict.objectForKey('_NSURLPathKey')
        paths.push(ObjC.unwrap(path))
      } catch (e) {
        continue
      }
    }
    paths`.replace(/\$/g, '\\$')
}

async function recents(sflFile: string) {
  const { stdout } = await execCommand(
    `osascript -l JavaScript -e "${getScript(sflFile)}"`
  )
  const items = stdout.split(', ')
  const n = items.length
  if (n > 0) {
    const str = items[n - 1]
    items[n - 1] = str.substring(0, str.length - 1)
  }
  return items.filter((item) => item)
}

export function appRecentDocuments(appBundleId: string) {
  return recents(getSflFile(appBundleId, false))
}

export function finderRecents(sflFileName: string) {
  return recents(getSflFile(sflFileName, true))
}

export function openFile(file: string, app?: string) {
  return execCommand(`open ${app ? `-a "${app}"` : ''} "${file}"`)
}

function options(key: string, ...values: string[]) {
  const args: string[] = []
  for (const value of values) {
    args.push(key, value)
  }
  return args
}

async function getApps() {
  const attrs = ['kMDItemCFBundleIdentifier', 'kMDItemDisplayName']
  const dirs = [
    '/Applications',
    '/System/Applications',
    '/System/Library/CoreServices'
  ]
  const { stdout } = await spawnCommand('mdfind', [
    `kMDItemContentTypeTree = 'com.apple.application' && kMDItemSupportFileType != MDSystemFile`,
    ...options('-attr', ...attrs),
    ...options('-onlyin', ...dirs)
  ])
  return stdout.split('\n').map((item) => {
    const arr = item.split('   ')
    const values: (string | null)[] = [arr[0]]
    attrs.forEach((attr, i) => {
      const value = arr[i + 1]?.replace(`${attr} = `, '')
      values.push(value === undefined || value === '(null)' ? null : value)
    })
    return {
      path: values[0] as string,
      bundleId: values[1],
      displayName: values[2]
    }
  })
}

async function getIdToAppMap() {
  const map = new Map<string, AppInfo>()
  const apps = await getApps()
  for (const app of apps) {
    const bundleId = app.bundleId?.toLowerCase()
    if (bundleId) {
      const name = path.basename(app.path)
      const displayName = app.displayName || name
      const title = displayName.substring(0, displayName.lastIndexOf('.'))
      const appInfo = new AppInfo(bundleId, title, name, app.path)
      map.set(bundleId, appInfo)
    }
  }
  return map
}

function getFinderRecents() {
  const res: AppInfo[] = []
  const recentApps = 'com.apple.LSSharedFileList.RecentApplications'
  const recentDocs = 'com.apple.LSSharedFileList.RecentDocuments'
  const finder = '/System/Library/CoreServices/Finder.app'
  if (existsSflFile(recentApps, true)) {
    res.push(
      new AppInfo(recentApps, '访达最近的应用', 'Finder.app', finder, true)
    )
  }
  if (existsSflFile(recentDocs, true)) {
    res.push(
      new AppInfo(recentDocs, '访达最近的文稿', 'Finder.app', finder, true)
    )
  }
  return res
}

export async function getRecentsApps() {
  const res: AppInfo[] = []
  const map = await getIdToAppMap()
  const fileNames = readdirSync(appsRecentsDir)
  for (const fileName of fileNames) {
    const name = path.basename(fileName)
    const id = name.substring(0, name.lastIndexOf('.'))
    const app = map.get(id)
    if (app !== undefined) {
      res.push(app)
    }
  }
  return getFinderRecents().concat(res)
}

export function getFileName(filePath: string) {
  return path.basename(filePath)
}

export function existsPath(path: string) {
  return existsSync(path)
}

export function getFileIcon(filePath: string) {
  if (filePath.endsWith('.app')) return utools.getFileIcon(filePath)
  const ext = extname(filePath)
  return utools.getFileIcon(!ext ? filePath : ext)
}

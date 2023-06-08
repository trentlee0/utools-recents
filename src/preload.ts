import { existsSync, readdirSync } from 'fs'
import { homedir } from 'os'
import path from 'path'
import { execCommand, spawnCommand } from 'utools-utils/preload'
import AppInfo from '@/models/AppInfo'

const baseRecentsDir = `${homedir()}/Library/Application Support/com.apple.sharedfilelist/`
const appsRecentsDir =
  baseRecentsDir + 'com.apple.LSSharedFileList.ApplicationRecentDocuments/'

function getScript(sfl2File: string) {
  return `
    ObjC.import('Foundation')
    let paths = []
    try {
      let data = \\$.NSData.dataWithContentsOfFile('${sfl2File}')
      let document = \\$.NSKeyedUnarchiver.unarchiveObjectWithData(data)
      let items = document.objectForKey('items')
      let length = items.count
      let keys = \\$([\\$.NSURLPathKey])
      for (let i = 0; i < length; i++) {
        try {
          let item = items.objectAtIndex(i)
          let source = item.objectForKey('Bookmark')
          let dict = \\$.NSURL.resourceValuesForKeysFromBookmarkData(keys, source)
          let path = dict.objectForKey('_NSURLPathKey')
          paths.push(ObjC.unwrap(path))
        } catch (e) {
          continue
        }
      }
    } catch (e) {}
    paths`
}

async function recents(sfl2File: string) {
  const { stdout } = await execCommand(
    `osascript -l JavaScript -e "${getScript(sfl2File)}"`
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
  return recents(appsRecentsDir + appBundleId + '.sfl2')
}

export function finderRecents(sfl2FileName: string) {
  return recents(baseRecentsDir + sfl2FileName)
}

export function openFile(file: string, app?: string) {
  return execCommand(`open ${app ? `-a "${app}"` : ''} "${file}"`)
}

async function getApps() {
  const attr = 'kMDItemCFBundleIdentifier'
  const { stdout } = await spawnCommand('mdfind', [
    `kMDItemContentTypeTree = 'com.apple.application'`,
    '-attr',
    attr,
    '-onlyin',
    '/'
  ])
  return stdout.split('\n').map((item) => {
    const arr = item.split('   ')
    const attrValue = arr[1]?.replace(`${attr} = `, '')
    return {
      path: arr[0],
      bundleId:
        attrValue === undefined || attrValue === '(null)' ? null : attrValue
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
      const title = name.substring(0, name.lastIndexOf('.'))
      const appInfo = new AppInfo(bundleId, title, name, app.path)
      map.set(bundleId, appInfo)
    }
  }
  return map
}

function getFinderRecents() {
  const res: AppInfo[] = []
  const recentApps = 'com.apple.LSSharedFileList.RecentApplications.sfl2'
  const recentDocs = 'com.apple.LSSharedFileList.RecentDocuments.sfl2'
  const finder = '/System/Library/CoreServices/Finder.app'
  if (existsSync(baseRecentsDir + recentApps)) {
    res.push(
      new AppInfo(recentApps, '最近的应用', 'Finder.app', finder, true)
    )
  }
  if (existsSync(baseRecentsDir + recentDocs)) {
    res.push(
      new AppInfo(recentDocs, '最近的文稿', 'Finder.app', finder, true)
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

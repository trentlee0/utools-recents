import { StoreKey } from '@/constant'
import SettingModel from '@/models/SettingModel'
import { createPinia, defineStore } from 'pinia'
import { sync, local, toMap } from 'utools-utils'
import piniaPersistence from 'pinia-persistence'
import { getRecentsApps } from '@/preload'
import AppInfo from '@/models/AppInfo'
import { toRaw } from 'vue'
import { Action } from 'utools-api'
import * as featureApi from '@/api/featureApi'

function initSetting() {
  const setting = sync.get<SettingModel>(StoreKey.SETTING)
  if (setting === null) {
    sync.set(StoreKey.SETTING, new SettingModel())
  }
}

initSetting()

export const commonStore: { action?: Action } = {}

export const useAppsStore = defineStore(StoreKey.APPS, {
  state: () => ({ apps: <Array<AppInfo>>[] }),
  persist: {
    enable: true,
    map: toRaw,
    storage: local,
    persisted: (store) => {
      console.log('persisted: ', store.$state)
    }
  },
  actions: {
    async refreshApps() {
      const added = new Array<AppInfo>()

      const newApps = await getRecentsApps()
      const oldApps = toRaw(this.apps)

      const oldMap = toMap(oldApps, (app) => app.id)

      const newSet = new Set<string>()
      for (const newApp of newApps) {
        let oldApp: AppInfo | undefined
        if (newApp.isFinder) {
          oldApp = oldMap.get(newApp.id + '.sfl2') || oldMap.get(newApp.id + '.sfl')
        } else {
          oldApp = oldMap.get(newApp.id)
        }
        if (oldApp !== undefined) {
          // 已存在
          // newApp.title = oldApp.title
          // newApp.name = oldApp.name
          // newApp.path = oldApp.path
          newApp.enabled = oldApp.enabled
        } else {
          // 不存在
          if (!newApp.isFinder) {
            added.push(newApp)
          }
        }
        newSet.add(newApp.id)
      }
      this.apps = newApps

      const removed = oldApps.filter((app) => !newSet.has(app.id))

      // 刷新 features
      featureApi.removeFeatures(removed.map((app) => app.id))
      featureApi.setFeatures(newApps)

      return {
        removed,
        added
      }
    }
  }
})

const pinia = createPinia()
pinia.use(piniaPersistence)
export default pinia

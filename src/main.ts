import { App, createApp } from 'vue'
import './style.scss'
import Search from '@/views/Search.vue'
import Setting from '@/views/Setting.vue'
import store, { commonStore } from '@/store'
import { onPluginEnter, onPluginOut, Action, setExpendHeight } from 'utools-api'

let app: App
onPluginEnter((action: Action) => {
  commonStore.action = action
  if (action.code === 'recents-setting') {
    setExpendHeight(520)
    app = createApp(Setting).use(store)
    app.mount('#app')
  } else {
    app = createApp(Search).use(store)
    app.mount('#app')
  }
})

onPluginOut(() => {
  app.unmount()
})

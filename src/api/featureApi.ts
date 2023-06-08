import { FeatureCode } from '@/constant'
import AppInfo from '@/models/AppInfo'
import { getFileIcon, removeFeature, setFeature } from 'utools-api'

export function getId(featureCode: string) {
  return featureCode.replace(FeatureCode.PREFIX, '')
}

export function getFeatureCode(id: string) {
  return FeatureCode.PREFIX + id
}

export function setFeatures(apps: AppInfo[]) {
  for (const app of apps) {
    if (app.enabled === false) continue

    const isLetter = /^[a-zA-Z0-9 -_]+$/.test(app.title)
    const explain =
      '快速打开' +
      (app.isFinder
        ? app.title
        : (isLetter ? ` ${app.title} ` : app.title) + '最近文档')
    const stringCmds = app.isFinder
      ? [app.title]
      : [
          app.title + ' Recents',
          (isLetter ? `${app.title} ` : app.title) + '最近文档'
        ]

    setFeature({
      code: getFeatureCode(app.id),
      explain,
      icon: getFileIcon(app.path),
      cmds: [
        ...stringCmds,
        {
          type: 'window',
          label: explain,
          match: {
            app: [app.name]
          }
        }
      ]
    })
  }
}

export function removeFeatures(ids: string[]) {
  for (const id of ids) {
    removeFeature(getFeatureCode(id))
  }
}

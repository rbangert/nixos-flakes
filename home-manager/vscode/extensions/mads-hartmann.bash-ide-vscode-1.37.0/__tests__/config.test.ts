const packageJson = require('../package.json')
import { getDefaultConfiguration } from '../../server/src/config'
import { LOG_LEVELS } from '../../server/src/util/logger'

const defaultConfig = getDefaultConfiguration()

describe('config', () => {
  const configProperties = packageJson.contributes.configuration.properties

  it('prefixes all keys with "bashIde."', () => {
    for (const key of Object.keys(configProperties)) {
      expect(key).toMatch(/^bashIde\./)
    }
  })

  it('has the same keys as the default configuration', () => {
    const configKeys = Object.keys(configProperties)
      .map((key) => key.replace(/^bashIde\./, ''))
      .sort()

    const defaultConfigKeys = Object.keys(defaultConfig).sort()
    expect(configKeys).toEqual(defaultConfigKeys)
  })

  it('matches the server log levels', () => {
    const configLogLevels = configProperties['bashIde.logLevel'].enum?.sort()
    expect(configLogLevels).toEqual(LOG_LEVELS.slice().sort())
    expect(LOG_LEVELS).toContain(configProperties['bashIde.logLevel'].default)
  })
})

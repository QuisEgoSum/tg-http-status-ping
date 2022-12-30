import {config} from '@config'


export class NotificationMessageUtils {

  private static formatLogObject(s: string, o: object): string[] {
    if (s) {
      s += '.'
    }
    const result = []
    for (const [key, value] of Object.entries(o)) {
      if (typeof value === 'object' && value !== null) {
        result.push(...NotificationMessageUtils.formatLogObject(s + key, value))
      } else {
        result.push(s + key + ': ' + value)
      }
    }
    return result
  }

  public static parseLog(level: 'ERROR' | 'FATAL', log: string): string[] {
    return [`*${level} NOTIFICATION*\n`, '```', ...NotificationMessageUtils.formatLogObject('', JSON.parse(log)), '```']
  }

  public static getStartMessage(): string[] {
    return [
      '*APPLICATION STARTED*\n',
      `Version ${config.pkgJson.version}\n\n`,
      `timestamp: ${new Date().toUTCString()}`
    ]
  }

  static getShutdownMessage(event: string) {
    return [`*APPLICATION SHUTDOWN*\n\n`, `event: ${event}\n\n`, `timestamp: ${new Date().toUTCString()}`]
  }
}
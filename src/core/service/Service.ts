

export class Service {
  constructor(
    private readonly validator: Record<string, any> = {}
  ) {
    const properties = new Set(Object.getOwnPropertyNames(Object.getPrototypeOf(this)))
    const validatorProperties = new Set(Object.getOwnPropertyNames(Object.getPrototypeOf(this.validator)))
    properties.delete('constructor')
    const thisTypeHack = (this as Record<string, any>)
    const methods: Record<string, Function> = {}
    for (const method of properties) {
      if (typeof thisTypeHack[method] !== 'function') {
        continue
      }
      if (!validatorProperties.has(method) || typeof this.validator[method] !== 'function') {
        continue
      }
      methods[method] = thisTypeHack[method].bind(this)
      thisTypeHack[method] = (...args: unknown[]) => methods[method](this.validator[method](...args))
    }
  }
}


import { beforeEach } from 'vitest'

// Pre-import image-resize so it's cached before vi.stubGlobal('URL', ...) runs.
// This prevents Vite's module runner from calling new URL() during dynamic import inside tests.
import '@/lib/image-resize'

// Vitest 4 changed how vi.fn() handles constructor calls: it now uses
// Reflect.construct(implementation, args, new.target), which fails when the
// implementation is an arrow function (arrow functions are not constructors).
// This beforeEach hook replaces any arrow-function mock implementation on the
// global Image with an equivalent regular function so that `new Image()` works.
beforeEach(() => {
  if (
    typeof Image !== 'undefined' &&
    typeof (Image as unknown as { _isMockFunction?: boolean })._isMockFunction === 'boolean' &&
    (Image as unknown as { _isMockFunction?: boolean })._isMockFunction
  ) {
    const mock = Image as unknown as {
      getMockImplementation: () => ((...args: unknown[]) => unknown) | undefined
      mockImplementation: (fn: (...args: unknown[]) => unknown) => void
    }
    const impl = mock.getMockImplementation()
    if (impl) {
      // Wrap the arrow-function implementation in a regular function.
      // When called with `new`, Vitest will Reflect.construct the regular function,
      // which is legal, and the return value (the mock object) will be used.
      mock.mockImplementation(function (this: unknown, ...args: unknown[]) {
        return impl.apply(this, args)
      })
    }
  }
})

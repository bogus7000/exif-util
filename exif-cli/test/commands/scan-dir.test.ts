import {expect, test} from '@oclif/test'

describe('scan-dir', () => {
  test
  .stdout()
  .command(['scan-dir'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['scan-dir', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})

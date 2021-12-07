import {expect, test} from '@oclif/test'

describe('scan-file', () => {
  test
  .stdout()
  .command(['scan-file'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['scan-file', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})

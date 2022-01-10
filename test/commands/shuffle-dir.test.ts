import {expect, test} from '@oclif/test'

describe('shuffle-dir', () => {
  test
  .stdout()
  .command(['shuffle-dir'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['shuffle-dir', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})

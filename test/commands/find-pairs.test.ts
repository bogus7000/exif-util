import {expect, test} from '@oclif/test'

describe('find-pairs', () => {
  test
  .stdout()
  .command(['find-pairs'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['find-pairs', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})

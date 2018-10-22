// https://github.com/desktop/dugite/blob/b30c78cd41d53052357412993b857779ec8aaa5f/lib/git-process.ts#L87
export interface ErrorWithCode extends Error {
  code: string | number | undefined
}

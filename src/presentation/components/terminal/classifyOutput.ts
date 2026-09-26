export type OutputTone = 'plain' | 'error' | 'warning' | 'hint' | 'staged' | 'unstaged' | 'current';

const ERROR_PATTERN =
  /^(fatal|error):|: command not found$|^agitz: .*(not supported|syntax error|only supported)/;

/**
 * Colors output the way Git does in a real terminal: errors in red, staged
 * changes in green, unstaged and untracked ones in red, the current branch in green.
 */
export function classifyOutputLines(output: string): { text: string; tone: OutputTone }[] {
  let section: OutputTone = 'plain';
  return output.split('\n').map((text) => {
    if (text === 'Changes to be committed:') {
      section = 'staged';
    } else if (text === 'Changes not staged for commit:' || text === 'Untracked files:') {
      section = 'unstaged';
    } else if (text === '') {
      section = 'plain';
    }

    let tone: OutputTone = 'plain';
    if (ERROR_PATTERN.test(text)) {
      tone = 'error';
    } else if (/^warning:/i.test(text)) {
      tone = 'warning';
    } else if (/^hint:|^ {2}\(use /.test(text)) {
      tone = 'hint';
    } else if (text.startsWith('\t') && section !== 'plain') {
      tone = section;
    } else if (text.startsWith('* ')) {
      tone = 'current';
    }
    return { text, tone };
  });
}

import { Command } from 'commander';

export function completionCommand(program: Command): Command {
  const cmd = new Command('completion')
    .description('Output a shell completion script')
    .argument('[shell]', 'shell type (bash|zsh|powershell)', 'bash')
    .action((shell: string)=>{
      const script = generateScript(shell, program.name());
      if (!script) {
        console.error(`Unsupported shell: ${shell}`);
        process.exit(1);
      }
      console.log(script);
    });
  return cmd;
}

function generateScript(shell: string, binName: string): string | null {
  switch(shell) {
    case 'bash':
      return `### Labnex CLI Bash completion\n_complete_labnex() {\n  local IFS=$'\n'\n  COMPREPLY=( $( COMP_CWORD=$COMP_CWORD COMP_LINE=$COMP_LINE COMP_POINT=$COMP_POINT ${binName} completion-script bash 2>/dev/null ) )\n}\ncomplete -F _complete_labnex ${binName}`;
    case 'zsh':
      return `#compdef ${binName}\n_${binName}_completion() {\n  local -a completions\n  completions=(${binName} completion-script zsh -- $words)\n  _describe 'values' completions\n}\ncompdef _${binName}_completion ${binName}`;
    case 'powershell':
      return `Register-ArgumentCompleter -CommandName '${binName}' -ScriptBlock {\n  param($wordToComplete, $commandAst, $cursorPosition)\n  ${binName} completion-script powershell -- $wordToComplete | ForEach-Object { \"$_\" }\n}`;
    default:
      return null;
  }
} 
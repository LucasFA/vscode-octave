This is a fork of leafvmaple's Octave Language extension, [also available in GitHub](https://github.com/leafvmaple/vscode-octave).
This extension pretends to make some quality of life adjusments to it.

## Features

- Keeps the Octave terminal open so you can mess around after executing a script. 
- Add keybinds for easy execution.
- Adds a few snippets.

### Matlab compatibility

If you are using Matlab, you should install an extension that launches matlab terminals or do so yourself. I recommend this one: [Matlab Interactive Terminal](https://marketplace.visualstudio.com/items?itemName=apommel.matlab-interactive-terminal).

Then, launch the Matlab terminal and use the extension as usual.

### Keybinds
This are the defaults. You can modify them.
| Command           | Keybind                | Comment                          |
|-------------------|------------------------|----------------------------------|
| `octave.run`      | `Ctrl + Shift + Enter` | Run current document             |
| `octave.runLines` | `Ctrl + Enter`         | Run current line on the terminal |

Running the current document might run it on the terminal or on an output channel depending on the setting `octave.runInTerminal`

## Setup

### Windows

1. Install Octave. Take note of the installation directory. For example, in `C:\Octave\Octave-7.1.0\`
2. Add `C:\Octave\Octave-7.1.0\mingw64\bin` (that is, add to the Octave installation path you noted before `\mingw64\bin` to the end) to your system's PATH environment variable.
3. Install the extension.

## Known issues

- Currently plots are not presented when running a script in an output channel. As a workaround, run the script in the terminal: set `octave.runInTerminal` to `true`.
- If executing a file with non-ASCII characters in the file path, the output will include the code executed in addition to the output of the script.

## Release Notes
 See [CHANGELOG.md](https://github.com/LucasFA/vscode-octave/blob/master/CHANGELOG.md)

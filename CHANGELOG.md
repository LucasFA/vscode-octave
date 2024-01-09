# Changelog

## [0.7.4] 2024-01-09
* Update bundled dependencies and remove source maps from the final extension

## [0.7.2] 2022-11-29
* Potentially fixed a Heisenbug regarding the clearing of the terminal (commit 398235d915a046253f3adce8fcf0e32d43768458).

## [0.7.1] 2022-10-27
* Slightly change the logic on whether to use relative or absolute paths: it will use absolute paths as long as they are ASCII.

## [0.7.0] 2022-10-25
* NOTICE: This *IS* a breaking change for files that change the working directory. Consider using the new setting.
* Now we use relative paths for locating the file by default.
* Added a setting to always use absolute paths instead, `octave.alwaysUseAbsolutePaths`. Running whole files in the terminal will use the absolute path instead of the relative path. This is to avoid issues with changing the working directory inside the file. However, if the absolute path contains non-ASCII characters, it will result in a very verbose (but correct) output, including commands along with output.

## [0.6.2] 2022-10-18

* Fixed a bug when running files with non-ASCII character names.

## [0.6.0] 

* Matlab compatibility! The logic on whether to use an existing terminal or create a new one was based on the name of the terminal. That is a stupid idea, soon I intend to change it, but for now, calling the terminal `matlab` or `octave` (case insensitive) will make it work.

## [0.5.5] 2022-09-19

* Fixed a bug where some settings would not work.

## [0.5.4] 2022-08-14

* Fix running in outputChannel with no octaveLocation setting set

* Added highlighting and autoclosing for `#{ #}` comment blocks.

## [0.5.3] 2022-08-12

* Added a known issues section to the readme.

## [0.5.2] 2022-07-16

* Bugfix: execution of files with paths including non-ASCII characters are now dealt with appropiately. However, running in terminal will output the contents of the file besides the output of the command, which is bad UX due to all the cluttering.

## [0.5.1] 2022-07-16

* WIP Bugfix: execution of files with paths including tildes or other UTF-8 characters are now dealt with appropiately when executing a file in an output channel (`"octave.runInTerminal": false` in `settings.json` )

## [0.5.0] 2022-07-16

* Customization: you can now set the path to your octave executable, instead of relying on having it in the PATH variable.

* Improvement: now the octave terminal starts up significantly faster.

## [0.3.1] 2022-06-04

* Hotfix: createOutputChannel properly removed.

## [0.3.0] 2022-06-04

* Added indentation rules!

* Removed createOuputChannel as it had no useful effect. 

* Modified snippets

## [0.2.7] 2022-05-27

* Minor: apostrophes are now not automatically closed.

* Updated Readme with installation instructions.

## [0.2.6] 2022-05-14

* Bugfix/improvement: documents are now saved before being executed. Solves running outdated file when not manually saved.

## [0.2.5] 2022-05-13

* Improvement: dispose of terminal on close.

## [0.2.4] 2022-05-07

* Improvement: Configuration is now gotten live everytime it is needed.

## [0.2.3] 2022-05-01

* EOF: Now running the current line when on the last line of the document will generate a new line.

* Bugfix: Now running an empty line doesn't result in an unresolved promise by timeout (previously was left in an infinite loop)

## [0.2.2] 2022-04-27
* Snippets: added snippets for if statements and while and for loops

## [0.2.1] 2022-04-21

* Bugfix: now you can run filenames with spaces

## [0.2] 2022-04-17

* Changed workflow. Now the octave console is persistent.

* Adds keybind: press Ctrl + Shift + Enter to run file. Ctrl + Enter to run selection or current line

* Extra terminals will no longer be created if the active terminal is not the Octave one.

## [0.1.1] 2017-12-26

* Add Octave `snippets`.

* Fixed the bug of run code.

## [0.1.0] 2017-12-20

* Support `Run Octave Code` in the vscode.

## [0.0.1] 2017-12-19

* Create the `tmLanguage`.

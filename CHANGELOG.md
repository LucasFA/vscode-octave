# Change Log

## [0.3.0] 2022-06-04

* Added indentation rules!

* Removed createOuputTerminal as it had no effect. It will create it regardless if you set `octave.runInTerminal` to `false`

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
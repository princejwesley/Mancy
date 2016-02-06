## <img src="icons/mancy.png" width="25">&nbsp;[v2.2.1](http://mancy-re.pl)  (Feb 07, 2016)

- Upgrade typescript -> 1.7.5 & electron -> 0.36.7
- notebook mode(experimental)

and bug fixes.

## <img src="icons/mancy.png" width="25">&nbsp;[v2.2.0](http://mancy-re.pl)  (Jan 10, 2016)

- Grid view support [:paperclip:](https://raw.githubusercontent.com/princejwesley/Mancy/master/images/grid-dark.png)[:paperclip:](https://raw.githubusercontent.com/princejwesley/Mancy/master/images/grid-transpose.png)
- await + sync support [:paperclip:](https://raw.githubusercontent.com/princejwesley/Mancy/master/images/await-progress.png) [:paperclip:](https://raw.githubusercontent.com/princejwesley/Mancy/master/images/await-resolved.png)
- load scripts support
- Prompt before quit preference
- `load file..` & `save command as..` menu
- Add node REPL builtins in context
- Upgrade electron `0.36.2` and babel 6
- Shortcut for previous commands <kbd>ctrl</kbd> + <kbd>shift</kbd>+ <kbd>0</kbd>..<kbd>9</kbd>
- Global variable watcher [:paperclip:](https://raw.githubusercontent.com/princejwesley/Mancy/master/images/global-env-dark.png)[:paperclip:](https://raw.githubusercontent.com/princejwesley/Mancy/master/images/global-env-light.png)
- Store as global variable support  [:paperclip:](https://raw.githubusercontent.com/princejwesley/Mancy/master/images/store-as-global-before.png)[:paperclip:](https://raw.githubusercontent.com/princejwesley/Mancy/master/images/store-as-global-after.png)
- node REPL is used only for load files and auto completion
- Add polyfills to REPL context
- Add start up script preference.
- Add npm modules path preferences with navigation support [:paperclip:](https://raw.githubusercontent.com/princejwesley/Mancy/master/images/node-modules-preference.png)
- `npm install -g mancy`

and bug fixes.

Note:
- Some ES2015 features requires `strict` mode enabled.

## <img src="icons/mancy.png" width="25">&nbsp;[v2.1.0](http://mancy-re.pl)  (Nov 28, 2015)

-  Language Support
   - CoffeeScript
   - TypeScript
   - LiveScript
-  :gem: Preserve last window resize info to use for next launch
-  `check for update…` menu item
- Rebind clear all and collapse all shortcuts
- Auto fill brackets, back-ticks, parenthesis and braces
- :gem: Font & zoom preferences
- Date visualizer support
- :pencil2: Add FiraCode ligatures
- :bug: Can't type Chinese!
- :bug: chart support for single field
- :gem: Transpiled view support for Babel, CoffeeScript, TypeScript and LiveScript



## <img src="icons/mancy.png" width="25">&nbsp;[v2.0.1](http://mancy-re.pl)  (Nov 07, 2015)

- :bug: Download npm modules on demand using system's npm
- :lipstick: import/export renamed as load/save session
- :lipstick: rebind format to <kbd>ctrl</kbd> + <kbd>shift</kbd>+<kbd>F</kbd>.
- :gem: auto complete turn off support and trigger auto complete on <kbd>ctrl</kbd>+ <kbd>space</kbd> or <kbd>tab</kbd>.



## <img src="icons/mancy.png" width="25">&nbsp;[v2.0.0](http://mancy-re.pl)  (Nov 06, 2015)

- Download npm modules on demand
- Babel support
- await with auto async wrapper
- Data visualization support
- Integer representation (bin/oct/dec/hex and signed/unsigned)
- Regular expression live editor
- Buffer explorer
- HTML view
- CSS color view
- base64 detection
- Basic chart representation of data
- Image detection / display
- Download buffers support
- Support to break long lasting commands
- Preference window
- Promise output tracking
- Source file open support for node modules(.source name)
- No special meaning for _
- Syntax highlight as we type
- and bug fixes…



## <img src="icons/mancy.png" width="25">&nbsp;[v1.0.0](http://mancy-re.pl)  (Oct 12, 2015)
- Syntax Highlighting
- Dark and light themes
- Load and save session history
- Separate console window for async stdout/stderr logs
- Notification for async console logs
- console output filter support
- Traversable output with fold/unfold options
- Support for adding directory to node path
- Expand/Collapse/reload command options
- History traversal support
- Multiple window
- Multiline prompt support with <kbd>shift</kbd> + <kbd>enter</kbd>
- Auto suggestion
- Tab completion
- Code format support
- Support to toggle REPL mode
- Preferences for theme and REPL mode

## 0.4.5 (2016-01-10)
Features:

- Make Moves List and Parts List expanded by default
- Update Readme

Bugfixes:

- Update sharpness values

## 0.4.4 (2015-06-12)
Features:

- Added simple heatmap for visualizing individual damage values
- Added footer with version number and project/contact links
- Added display of motion values when hovering on top of a move's name

Bugfixes:

- Changed rounding of all calculating from nearest-integer to rounding down
- Reworked elemental attack damage calculation per discussion with Aetherflaer
  - Moved move-specific elemental attack modifiers to JSON

## 0.4.3 (2015-06-07)
Bugfixes:

- Fixed Elemental Crit calculation (calculator incorrectly assumed that all attacks were crits)

## 0.4.2 (2015-06-01)
Features:

- Cleaned up checkboxes in UI using awesome-bootstrap-checkbox
- Re-worked monster scraper
  - Gogmazios and Fatalis data added
  - Better resistance tracking of monster states and damaged part states
- Added ability to select monster state (Default, Enraged, Savaged, etc)
- Added ability to toggle Broken state for monster parts (only if Broken state weaknesses are different from the Default state weaknesses)
- Added ability to aggregate raw+elemental damages
- Added note for Survivor, Spirit, and Gloves Off skills to denote that the calculator assumes that conditions have been met and skills are active


## 0.4.1 (2015-05-30)
Features:

- Added link to Trello bugtracking/to-do list
- Re-worked URL generator to use keys for enabled skills, making it more future-proof (sorry if your bookmarks stopped working!)
- Made all-setup URL update consistently, display all the time to raise awareness/visibility, and removed its refresh option
- Added Elemental Crit skill
- Minor UI tweaks
- Minor changes to JSON files

Bugfixes:
- Fixed being able to stack Honed Blade and Attack Up/Down armor skills
- Remove Destroyer (Partbreaker) armor skill

## 0.4.0 (2015-05-12)
Features:

- Added support for Relic weapons
- Made modifiers easier to toggle on and off
- Update JSON data files

## 0.3.4 (2015-04-27)
Features:

- Added ability to save/share setups using URL parameters

Bugfixes:

- Fixed modifier group highlighting
- Fixed being unable to stack Honed Blade and Attack Up/Down armor skills

## 0.3.3 (2015-04-24)
Bugfixes:

- Fixed Sharpness + 1 modifier not applying
- Fixed elemental boosts modifiers not applying correctly
- Re-added modifier tooltips

## 0.3.2 (2015-04-22)
Features:

- Refactored and optimized JS and HTML code (Harkoni)

Bugfixes:

- Fixed incorrect damage calculation for un-awakened weapons (Harkoni)

## 0.3.1 (2015-04-21)
Features:

- Added Long Sword Spirit Charge support
- Added Charge Blade phial + phial damage support

Bugfixes:

- Fixed attack multiplier bug
- Fixed Great Sword charge attack multipliers
- Fixed Switch Axe sword mode attack multipliers

## 0.3.0 (2015-04-19)
Features:

- Reworked to not require the Python/Flask backend
- Added ability to minimize modifiers panel
- Minor UI tweaks

## 0.2.0 (2015-04-17)
Features:

- Added support for multiple weapon setups for damage output comparisons
- Minor updates to UI

## 0.1.2 (2015-04-12)
Features:

- Added support for overcoming frenzy virus
- Added support for Chaotic Gore Magala dual-affinity states

## 0.1.1 (2015-04-09)
Features:

- Added support for every skill but Elemental Crit
- Modified damage calculations to support Elemental Attack Modifiers (both additive and multiplicative), Critical Draw, and Destroyer
- Added tooltips describing modifiers
- Added hover-style to denote non-stacking/conflicting skills/modifiers
- Added Weakness Averages table to Target Monster panel

Bugfixes:

- Fixed incorrect calculation of additive damage multipliers
- Fixed incorrect rendering on mobile

## 0.1 (2015-04-08)
Initial Release

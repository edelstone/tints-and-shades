# [Tint & Shade Generator](http://edelstone.github.io/tints-and-shades/)

## What is the Tint & Shade Generator?
The purpose of this tool is to accurately produce tints (lighter variants) and shades (darker variants) of a given hex color in 10% increments.

Testing shows that it matches the way Chrome DevTools and the classic [W3Schools color picker](http://www.w3schools.com/colors/colors_picker.asp) calculate tints and shades. As far as I can tell, there are no other applications that get the calculation correct and produce the tints and shades so simply.

## When would I use this?
It's best used when you already have a base color palette but would like complimentary colors for gradients, borders, backgrounds, shadows or other elements.

## Why 10% increments?
That’s the standard I developed for [my design process at Texas State University](http://www.styleguide.txstate.edu/colors/template.html) and in other projects. I think choosing colors based on a flat percentage is a clean, reproducible way to augment brand palettes and produce designs with depth.

## Calculation Method
The given hex color is first converted to RGB. Then each component of the RGB color has the following calculation performed on it, respectively.

* **Tints:** New value = current value + ((255 - current value) x tint factor)
* **Shades:** New value = current value x shade factor

The new value is rounded if necessary, and then converted back to hex for display.

## Example Calculation
Let's say we want tints and shades of [Rebecca Purple](http://www.economist.com/blogs/babbage/2014/06/digital-remembrance), #663399.

#### 10% Tint
1. #663399 is converted to the RGB equivalent of 102, 51, 153
1. **R:** 102 + ((255 - 102) x .1) = 117.3, rounded to 117
1. **G:** 51 + ((255 - 51) x .1) = 71.4, rounded to 71
1. **B:** 153 + ((255 - 153) x .1) = 163.2, rounded to 163
1. RGB 117, 71, 163 is converted to the hex equivalent of #7547a3

#### 10% Shade
1. #663399 is converted to the RGB equivalent of 102, 51, 153
1. **R:** 102 x .9 = 91.8, rounded to 92
1. **G:** 51 x .9 = 45.9, rounded to 46
1. **B:** 153 x .9 = 137.7, rounded to 138
1. RGB 92, 46, 138 is converted to the hex equivalent of #5c2e8a

## Attribution
This application is inspired by a similar app once maintained by [North Krimsly](http://highintegritydesign.com/), with significant modifications made to the calculation method and design.

## Credits
[Michael Edelstone](http://michaeledelstone.com) designed it and put it together, with much-appreciated feedback from Nick Wing.

## License
Open source; please use. [CC BY-SA 3.0 US](http://creativecommons.org/licenses/by-sa/3.0/us/)

## Resources
* Convert hex – or just about any format – to RGB: [http://rgb.to](http://rgb.to)
* Further explanation of the calculation method: [Stack Overflow](http://stackoverflow.com/questions/6615002/given-an-rgb-value-how-do-i-create-a-tint-or-shade)
* Texas State University style guide: [http://styleguide.txstate.edu](http://styleguide.txstate.edu)
* W3Schools Color Picker: [http://w3schools.com/colors/colors_picker.asp](http://w3schools.com/colors/colors_picker.asp)
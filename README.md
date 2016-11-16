# [Tint & Shade Generator](http://edelstone.github.io/tints-and-shades/)

## Purpose
The purpose of this tool is to accurately produce tints (lighter variants) and shades (darker variants) in 10% increments based on a given hex color. 

## Why 10% Increments?
That's the standard I developed for my design process at Texas State University and in other projects. I think choosing colors based on a flat percentage is a clean, reproducible way to create brand palettes, gradients and more.

## Calculation Method
The given hex color is first converted to RGB. Then each component of the RGB color has the following calculation performed on it before rounding and converting back to hex for display.
* **Tints:** New value = current value + ((255 - current value) x tint factor)
* **Shades:** New value = current value x tint factor

## Example Calculation
Let's say we want tints and shades of [Rebecca Purple](http://www.economist.com/blogs/babbage/2014/06/digital-remembrance), #663399.

#### 10% Tint
1. #663399 is converted to the RGB equivalent of 102, 51, 153
1. **R:** 102 + ((255 - 102) x .1) = 117.3, rounded to 117
1. **G:** 51 + ((255 - 51) x .1) = 71.4, rounded to 71
1. **B:** 153 + ((255 - 153) x .1) = 163.2, rounded to 163
1. RGB 117, 71, 163 is converted to the hex equivalent of #7547A3

#### 10% Darker Shade
1. #663399 is converted to the RGB equivalent of 102, 51, 153
1. **R:** 102 x .9 = 91.8, rounded to 92
1. **G:** 51 x .9 = 45.9, rounded to 46
1. **B:** 153 x .9 = 137.7, rounded to 138
1. RGB 92, 46, 138 is converted to the hex equivalent of #5C2E8A

## Attribution
This application is remixed from an old app by [North Krimsly](http://highintegritydesign.com/), with key modifications made to the calculation method and design. The original version is no longer online.

## Credits
[Michael Edelstone](http://michaeledelstone.com) designed it and put it together, with much-appreciated feedback from Nick Wing.

## License
Open source; please use. [CC BY-SA 3.0 US](http://creativecommons.org/licenses/by-sa/3.0/us/)

## Resources
* Convert hex (or just about anything) to RGB: [http://rgb.to](http://rgb.to)
* Further explanation of the calculation method: [Stack Overflow](http://stackoverflow.com/questions/6615002/given-an-rgb-value-how-do-i-create-a-tint-or-shade)
# [<img src="https://maketintsandshades.com/favicon.ico" width="25px" />](https://maketintsandshades.com) &nbsp;[Tint & Shade Generator](https://maketintsandshades.com)

<img src="/images/screenshot.png" />
<img src="/images/screenshot-2.png" />

## What is the Tint & Shade Generator?
The purpose of this tool is to accurately produce tints (lighter variants) and shades (darker variants) of a given hex color in 10% increments.

## Why is this tool unique?
Testing shows that the color output matches that of the classic [W3Schools color picker](http://www.w3schools.com/colors/colors_picker.asp), the Sass [tint](https://sindresorhus.com/sass-extras/#color-function-tint) and [shade](https://sindresorhus.com/sass-extras/#color-function-shade) color functions, and the [PostCSS color-mod function](https://github.com/jonathantneal/postcss-color-mod-function#postcss-color-mod-function-) (currently [defunct](https://github.com/w3c/csswg-drafts/issues/813)).

The W3Schools color picker no longer shows tints and shades in exact 10% increments from all base colors, and most other tools out there get the calculation incorrect due to rounding errors or other inconsistencies.

## When would I use this?
It's best used when you already have some base colors but would like some complimentary colors for gradients, borders, backgrounds, shadows or other elements.

This is useful for designers who may be communicating color intent to developers that use Sass or PostCSS in their builds. It's also a solid way to quickly preview what tints and shades look like for a base color you may be considering for your design.

## Why 10% increments?
That’s the standard I developed for [my design process at Texas State University](http://www.styleguide.txstate.edu/colors.html) and in other projects. I think choosing tints and shades based on a flat percentage is a clean, reproducible way to augment brand palettes and produce designs with depth.

## Calculation Method
The given hex color is first converted to RGB. Then each component of the RGB color has the following calculation performed on it, respectively.

* **Tints:** `New value = current value + ((255 - current value) x tint factor)`
* **Shades:** `New value = current value x shade factor`

The new value is rounded if necessary, and then converted back to hex for display.

## Example Calculation
Let's say we want tints and shades of [Rebecca Purple](https://meyerweb.com/eric/thoughts/2014/06/19/rebeccapurple/), #663399.

#### 10% Tint
1. #663399 is converted to the RGB equivalent of 102, 51, 153
1. **R:** `102 + ((255 - 102) x .1) = 117.3`, rounded to 117
1. **G:** `51 + ((255 - 51) x .1) = 71.4`, rounded to 71
1. **B:** `153 + ((255 - 153) x .1) = 163.2`, rounded to 163
1. RGB 117, 71, 163 is converted to the hex equivalent of #7547a3

#### 10% Shade
1. #663399 is converted to the RGB equivalent of 102, 51, 153
1. **R:** `102 x .9 = 91.8`, rounded to 92
1. **G:** `51 x .9 = 45.9`, rounded to 46
1. **B:** `153 x .9 = 137.7`, rounded to 138
1. RGB 92, 46, 138 is converted to the hex equivalent of #5c2e8a

## Attribution
This application is inspired by a similar app once maintained by [North Krimsly](http://highintegritydesign.com/), with significant modifications made to the calculation method and interface design.

## Credits
[Michael Edelstone](http://michaeledelstone.com) designed and organized it. Nick Wing helped with the JavaScript.

## License
Open source; please use. [CC BY-SA 3.0 US](http://creativecommons.org/licenses/by-sa/3.0/us/)

## Contributing
If you'd like to help improve this tool, feel free to [create/review open issues](https://github.com/edelstone/tints-and-shades/issues) or [make a pull request](https://github.com/edelstone/tints-and-shades/pulls).

## Styles

- **Typography:** [Work Sans](http://weiweihuanghuang.github.io/Work-Sans/) by Wei Huang</li>
- **Colors:** [#000](https://colorme.io/?color=000), [#fff](https://colorme.io/?color=fff), [#e96443](https://colorme.io/?color=e96443), and [ca288e](https://colorme.io/?color=ca288e)

## Resources
* [Convert other color formats to hex](http://rgb.to)
* [Stack Overflow discussion about the calculation method](https://stackoverflow.com/questions/6615002)

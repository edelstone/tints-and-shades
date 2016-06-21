//*********************************************************************
// parse an input string, looking for any number of hexadecimal color
// values, possibly with whitespace or garbage in between.  Return an array of 
// color values.
function parseColorValues(colorValues) {
  var colorValuesArray = colorValues.match(/[0-9A-Fa-f]{6}\b/g);
  return colorValuesArray; // this could be null if there are no matches
}


//*********************************************************************
// pad a hexadecimal string with zeros if it needs it
function pad(number, length) {
  var str = '' + number;
  while (str.length < length) {
    str = '0' + str;
  }
  return str;
}

// convert a hex string into an object with red, green, blue numeric properties
// '501214' => { red: 80, green: 18, blue: 20 }
function hexToRGB(colorValue) {
  return {
    red: parseInt(colorValue.substr(0, 2), 16),
    green: parseInt(colorValue.substr(2, 2), 16),
    blue: parseInt(colorValue.substr(4, 2), 16)
  }
}

// convert an integer to a 2-char hex string
// for sanity, round it and ensure it is between 0 and 255
// 43 => '2b'
function intToHex(rgbint) {
	return pad(Math.min(Math.max(Math.round(rgbint), 0), 255).toString(16), 2);
}

// convert one of our rgb color objects to a full hex color string
// { red: 80, green: 18, blue: 20 } => '501214'
function rgbToHex(rgb) {
  return intToHex(rgb.red)+intToHex(rgb.green)+intToHex(rgb.blue);
}

// shade one of our rgb color objects to a distance of i*10%
// ({ red: 80, green: 18, blue: 20 }, 1) => { red: 72, green: 16, blue: 18 }
function rgbShade(rgb, i) {
  return {
    red: rgb.red * (1-0.1*i),
    green: rgb.green * (1-0.1*i),
    blue: rgb.blue * (1-0.1*i)
  }
}

// tint one of our rgb color objects to a distance of i*10%
// ({ red: 80, green: 18, blue: 20 }, 1) => { red: 98, green: 40, blue: 44 }
function rgbTint(rgb, i) {
  return {
    red: rgb.red + (255-rgb.red) * i * 0.1,
    green: rgb.green + (255-rgb.green) * i * 0.1,
    blue: rgb.blue + (255-rgb.blue) * i * 0.1
  }
}

// take a hex color string and produce a list of 10 shades
// or tints of that color
// shadeOrTint should be either `rgbShade` or `rgbTint`, as defined above
// this allows us to use `calculate` for both shade and tint
function calculate(colorValue, shadeOrTint) {
  var color = hexToRGB(colorValue);
  var shadeValues = [];

  for (var i = 0; i < 10; i++) {
    shadeValues[i] = rgbToHex(shadeOrTint(color, i));
  }
  return shadeValues;
}

//*********************************************************************
// given a hexadecimal string color value, return a string array of ten hex shades 
// from the color to black
function calculateShades(colorValue) {
  return calculate(colorValue, rgbShade).concat("000000");
}


//*********************************************************************
// given a color value, return an array of ten tints from the color to white
function calculateTints(colorValue) {
  return calculate(colorValue, rgbTint).concat("FFFFFF");
}


//*********************************************************************
// create an html table row holding either the color values as blocks of color
// or the hexadecimal color values in table cells, depending the
// parameter 'displayType'
function makeTableRowColors(colors, displayType) {
  var tableRow = "<tr>";
  for (var i = 0; i < colors.length; i++) {
    if (displayType == "colors") { // make a row of colors
      tableRow += "<td class=\"hex-color\" style=\"background-color:" + "#" + colors[i].toString(16) + "\";></td>";
    } else { // make a row of RGB values
      tableRow += "<td class=\"hex-value\">" + colors[i].toString(16).toUpperCase() + "</td>";
    }
  }
  tableRow += "</tr>";
  return tableRow;
}


//*********************************************************************
// main application code.  Parse the inputted color numbers, make an HTML
// with the colors in it, and render the table into the page.
$(document).ready(function() {

  // connect the form submit button to all of the guts
  $("#color-entry-form").submit(function() {
    var parsedColorsArray = parseColorValues($("#color-values").val());
    if (parsedColorsArray !== null) { // make sure we got value color values back from parsing
      var colorDisplayRows = []; // holds html table rows for the colors to display
      var tableRowCounter = 0;

      // calculate an array of shade values from the inputted color, then make a table row
      // from the shades, and a second table row for the RGB values of the shades
      for (var i = 0; i < parsedColorsArray.length; i++) { // iterate through each inputted color value
        var calculatedShades = calculateShades(parsedColorsArray[i]);
        colorDisplayRows[tableRowCounter] = makeTableRowColors(calculatedShades, "colors");
        tableRowCounter++;
        colorDisplayRows[tableRowCounter] = makeTableRowColors(calculatedShades, "RGBValues");
        tableRowCounter++;

        // calculate an array of tint values from the inputted color, then
        // make a table row from the tints, and a second table row for the RGB values of the tints
        var calculatedTints = calculateTints(parsedColorsArray[i]);
        colorDisplayRows[tableRowCounter] = makeTableRowColors(calculatedTints, "colors");
        tableRowCounter++;
        colorDisplayRows[tableRowCounter] = makeTableRowColors(calculatedTints, "RGBValues");
        tableRowCounter++;
      }

      // wrap the rows into an HTML table
      var colorDisplayTable = "<table>" + colorDisplayRows.join("") + "</table>";

      // replace the shades-tints div with the color display table wrapped by the same div
      $("#shades-tints").html(colorDisplayTable);
    }
    return false;
  });
});

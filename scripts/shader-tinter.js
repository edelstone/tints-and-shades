//*********************************************************************
// Tinter-Shader web application, (c) Copyright 2010 High Integrity Design, LLC
// http://www.highintegritydesign.com
//
// licensed under a Creative Commons Attribution-Share Alike 3.0 United States License. 
//	http://creativecommons.org/licenses/by-sa/3.0/us/
//*********************************************************************


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


//*********************************************************************
// given a hexadecimal string color value, return a string array of ten hex shades 
// from the color to black
function calculateShades(colorValue) {

// break the hexadecimal color value into R, G, B one-byte components
// and parse into decimal values.
// calculate a decrement value for R, G, and B based on 10% of their
// original values.
   var red = parseInt(colorValue.substr(0, 2), 16);
   var redDecrement = (red*0.1);

   var green = parseInt(colorValue.substr(2, 2), 16);
   var greenDecrement = (green*0.1);

   var blue = parseInt(colorValue.substr(4, 2), 16);
   var blueDecrement = (blue*0.1);

   var shadeValues = [];
   var redString = null;
   var greenString = null;
   var blueString = null;

   for (var i = 0; i < 10; i++) {
       redString = red.toString(16); // convert red to hexadecimal string
       redString = pad(redString, 2); // pad the string if needed
       greenString = green.toString(16); // convert green to hexadecimal string
       greenString = pad(greenString, 2); // pad the string if needed
       blueString = blue.toString(16); // convert blue to hexadecimal string
       blueString = pad(blueString, 2); // pad the string if needed
       shadeValues[i] = redString + greenString + blueString;

// reduce the shade towards black
       red = Math.round(red - redDecrement);
       if (red <= 0) {
                       red = 0;
               }
       green = Math.round(green - greenDecrement);
       if (green <= 0) {
                       green = 0;
               }
       blue = Math.round(blue - blueDecrement);
       if (blue <= 0) {
                       blue = 0;
               }
   }
   shadeValues[10] = "000000";
   return shadeValues;
}


//*********************************************************************
// given a color value, return an array of ten tints from the color to white
function calculateTints(colorValue) {
// break the hexadecimal color value into R, G, B one-byte components
// and parse into decimal values.
// calculate an increment value for R, G, and B based on 10% of the
// difference between their original values, and white.
   var red = parseInt(colorValue.substr(0, 2), 16);
   var redIncrement = ((255 - red)*0.1);

   var green = parseInt(colorValue.substr(2, 2), 16);
   var greenIncrement = ((255 - green)*0.1);

   var blue = parseInt(colorValue.substr(4, 2), 16);
   var blueIncrement = ((255 - blue)*0.1);

   var tintValues = [];
   var redString = null;
   var greenString = null;
   var blueString = null;

   for (var i = 0; i < 10; i++) {
       redString = red.toString(16); // convert red to hexadecimal string
       redString = pad(redString, 2); // pad the string if needed
       greenString = green.toString(16); // convert green to hexadecimal string
       greenString = pad(greenString, 2); // pad the string if needed
       blueString = blue.toString(16); // convert blue to hexadecimal string
       blueString = pad(blueString, 2); // pad the string if needed
       tintValues[i] = redString + greenString + blueString;

// increase the tint towards white
       red = Math.round(red + redIncrement);
       if (red >= 255) {
                       red = 255; // make sure we don't go above #FF
               }
       green = Math.round(green + greenIncrement);
       if (green >= 255) {
                       green = 255;
               }
       blue = Math.round(blue + blueIncrement);
       if (blue >= 255) {
                       blue = 255;
               }
   }
   tintValues[10] = "FFFFFF";
   return tintValues;
}


//*********************************************************************
// create an html table row holding either the color values as blocks of color
// or the hexadecimal color values in table cells, depending the
// parameter 'displayType'
function makeTableRowColors(colors, displayType) {
   var tableRow = "<tr>";
   for (var i = 0; i < colors.length; i++) {
       if (displayType == "colors") { // make a row of colors
           tableRow += "<td style=\"background-color:" + "#" + colors[i].toString(16) + "\";></td>";
       }
       else { // make a row of RGB values
           tableRow += "<td class=\"rgb-value\">#" + colors[i].toString(16).toUpperCase() + "</td>";
       }
   }
   tableRow += "</tr>";
   return tableRow;
}


//*********************************************************************
// main application code.  Parse the inputted color numbers, make an HTML
// with the colors in it, and render the table into the page.
$(document).ready(function(){

// connect the form submit button to all of the guts
      $("#color-entry-form").submit(function() {
      var parsedColorsArray = parseColorValues($("#color-values").val());
      if (parsedColorsArray !== null) { // make sure we got value color values back from parsing
           var colorDisplayRows = []; // holds html table rows for the colors to display
           var tableRowCounter = 0;

// calculate an array of shade values from the inputted color, then make a table row
// from the shades, and a second table row for the RGB values of the shades
           for (var i=0; i < parsedColorsArray.length; i++) { // iterate through each inputted color value
               var calculatedShades = calculateShades(parsedColorsArray[i]);
               colorDisplayRows[tableRowCounter] = makeTableRowColors(calculatedShades, "colors");
               tableRowCounter++;
               colorDisplayRows[tableRowCounter] = makeTableRowColors(calculatedShades, "RGBValues");
               tableRowCounter++;

// calculate an array of tint values from the inputted color, then
// make a table row from the tints, and a second table row for the RGB values of the tints
               var calculatedTints = calculateTints(parsedColorsArray[i]);
               colorDisplayRows[tableRowCounter] =makeTableRowColors(calculatedTints, "colors");
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